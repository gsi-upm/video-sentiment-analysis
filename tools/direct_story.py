import pysrt
import requests
import sys
import argparse
import youtube_dl
import logging
import json
from StringIO import StringIO
from pprint import pformat
from rdflib import ConjunctiveGraph, URIRef, Namespace, RDF

logging.basicConfig()

parser = argparse.ArgumentParser(description='Annotate youtube videos with sentiment and emotion in NIF format')
parser.add_argument('video',
                    metavar="video_url",
                    type=str,
                    help='URL of the video')
parser.add_argument('--endpoint',
                    '-e',
                    type=str,
                    default = "http://localhost:5000/",
                    help='Endpoint to perform the sentiment analysis.')
parser.add_argument('--algorithm',
                    '-a',
                    type=str,
                    default = "rand",
                    help='Algorithm to use.')
parser.add_argument("--language",
                    "-l",
                    type=str,
                    default = 'en',
                    help=('Language of the subtitles to be downloaded. '
                          'It will also be used in the sentiment analysis '
                          'service')
                    )
parser.add_argument("--dry_run",
                    "-d",
                    default=False,
                    action="store_true",
                    help=("Simulate but don\'t store in the server.")
                    )
parser.add_argument("--verbose",
                    "-v",
                    default=False,
                    action="store_true",
                    help=("Verbose logging.")
                    )
args = parser.parse_args()

logger = logging.getLogger(__name__)
if args.verbose:
    logger.setLevel(logging.DEBUG)
else:
    logger.setLevel(logging.INFO)

g = ConjunctiveGraph()
onyx = Namespace('http://www.gsi.dit.upm.es/ontologies/onyx/ns#')
nif = Namespace('http://persistence.uni-leipzig.org/nlp2rdf/ontologies/nif-core#')
nifmedia = Namespace('http://www.gsi.dit.upm.es/ontologies/nif/ns#')
mediaont = Namespace('http://www.w3.org/ns/ma-ont#')
video = Namespace('%s#' % args.video)
g.bind('video', video)

yd = youtube_dl.YoutubeDL({"subtitleslangs": [args.language,],
                           "writeautomaticsub": True,
                           "skip_download": True})
info = yd.extract_info(args.video, download=False)
yd.process_info(info)
filename = yd.prepare_filename(info)
req_sub = info['requested_subtitles']
req_lang = req_sub.keys()[0]
req_ext = req_sub[req_lang]['ext']
sub_filename = youtube_dl.utils.subtitles_filename(filename, req_lang, req_ext)

logger.info("Starting")
name = info["title"]
subtitle = pysrt.open(sub_filename)

if not args.dry_run:
    resp = requests.get(("http://demos.gsi.dit.upm.es/sentivid-controller/store"
                         "/{}[{}]").format(name, args.algorithm),
                params={"link": args.video})
    if resp.status_code != 200:
        raise Exception("Got error %s" % resp.text)

for line in subtitle:
    start = line.start.minutes*60.0+line.start.seconds+line.start.milliseconds/1000.0
    end = line.end.minutes*60.0+line.end.seconds+line.end.milliseconds/1000.0
    text = line.text.replace("\n", " ")
    fragment = video["t=%s,%s" % (start, end)]
    g.add((URIRef(fragment), RDF.type, nifmedia['MediaFragmentsString']))
    requestData = {
        'input': text,
        'informat': 'text',
        'intype': 'direct',
        'outformat': 'json-ld',
        'prefix': "%s&nifentity=" % fragment,
        'algo': args.algorithm,
    }
    if args.language:
        requestData["lang"] = args.language
    resp = requests.post(args.endpoint, data=requestData)
    # try:
    #     resp = resp.json()
    #     logger.debug("Response:\n%s", pformat(resp))
    # except ValueError as ex:
    #     logger.debug("Response:\n%s", resp.content)
    #     raise
    # with open("frame.jsonld", "r") as f:
    #     resp = jsonld.frame(resp, json.load(f))["@graph"][0]
    # logger.debug("Graph:\n%s", pformat(resp))

    print("%s: %s" % (fragment, text))
    respio = StringIO(resp.text)
    rgraph = g.parse(respio, format='json-ld')
    for t in rgraph.triples((None, nif['isString'], None)):
        g.add((t[0], nif['broaderContext'], URIRef(fragment)))
        g.add((URIRef(args.video), mediaont['hasFragment'], URIRef(fragment)))
        g.add((URIRef(fragment), RDF.type, mediaont['MediaFragment']))
    print(len(g))

    # analysis = resp["analysis"][0]
    # logger.debug("Analysis:\n%s", pformat(analysis))
    # entry = resp["entries"][0]
    # logger.debug("Entry:\n%s", pformat(entry))
    # opinion = entry["opinions"][0]
    # #logger.debug("Opinion:\n%s", pformat(opinion))
    # max_polarity = analysis["marl:maxPolarityValue"]
    # min_polarity = analysis["marl:minPolarityValue"]
    # sentiment = opinion["marl:hasPolarityValue"]
    # params = {
    #     "text": text,
    #     "start": start,
    #     "end": end,
    #     "sentiment": sentiment
    # }

    # g.add((URIRef("www.google.es", RDF.type, URIRef(

# if not args.dry_run:
#         requests.get(("http://demos.gsi.dit.upm.es/sentivid-controller/store/"
#                       "{}[{}]").format(name, args.algorithm),
#                     params=params)


g.serialize('graphresult', format='turtle')
