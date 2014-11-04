import pysrt
import requests
import sys

service = "http://demos.gsi.dit.upm.es/tomcat/RestrictedToNIF/RestrictedService"
algo = "enFinancial"
max_polarity = 1
neutral_polarity = 0
#service = "http://127.0.0.1:5000"
#algo = "sentiment140"
#max_polarity = 100
#neutral_polarity = 50

name = sys.argv[1].rsplit(".", 3)[0]
sub = pysrt.open(sys.argv[1])

if len(sys.argv) < 3:
    link = "https://www.youtube.com/watch?v={}".format(name[-11:])
else:
    link = sys.argv[2]

if link:
    resp = requests.get("http://demos.gsi.dit.upm.es/sentivid-controller/store/{}[{}]".format(name, algo),
                params={"link": link})
    if resp.status_code != 200:
        raise Exception("Got error %s" % resp.text)

for line in sub:
    start = line.start.minutes*60.0+line.start.seconds+line.start.milliseconds/1000.0
    end = line.end.minutes*60.0+line.end.seconds+line.end.milliseconds/1000.0
    text = line.text.replace("\n", " ")
    requestData = {
        'input': text,
        'informat': 'text',
        'intype': 'direct',
        'outformat': 'json-ld',
        'algo': algo
    }
    resp = requests.post(service, data=requestData)
    resp = resp.json()
    #print(resp)
    sentiment = (resp["entries"][0]["opinions"][0]["marl:polarityValue"]-neutral_polarity)/(max_polarity-neutral_polarity)
    params = {
        "text": text,
        "start": start,
        "end": end,
        "sentiment": sentiment
    }
    print(params)
    requests.get("http://demos.gsi.dit.upm.es/sentivid-controller/store/{}[{}]".format(name, algo),
                 params=params)
