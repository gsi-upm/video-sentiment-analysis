from bson.json_util import dumps
from flask import Flask, request, render_template, Response, jsonify
import json
import OpenSSL
import os.path
from pymongo import MongoClient
import re
import requests

# Create new database for transcripts
client = MongoClient()
db = client.transcript_database
try:
    import config
    db.authenticate(config.user, config.pwd)
except ImportError:
    pass
collection = ''

# More info: http://flask.pocoo.org/docs/quickstart/
app = Flask(__name__)

# Get template on page load
@app.route('/')
def template():
    return render_template('video.html')

# Get phrase, calculate sentiment, and return score
@app.route('/sentiment/<phrase>')
def sentiment(phrase):
    # More info: https://github.com/gsi-upm/SEAS
    requestData = {
        'input': phrase.strip(),
        'informat': 'text',
        'intype': 'direct',
        'outformat': 'json-ld',
        'algo': request.args.get('name', type=str)
    }

    # Send to correct server address
    if request.args.get('restricted', type=str) == 'true':
        link = 'http://demos.gsi.dit.upm.es/tomcat/RestrictedToNIF/RestrictedService'
    else:
        link = 'http://demos.gsi.dit.upm.es/tomcat/SAGAtoNIF/Service'

    # Send request for sentiment analysis
    result = requests.post(link, requestData)
    # Decode as JSON and parse
    score = result.json()['entries'][0]['opinions'][0]['marl:polarityValue']
    print result.text
    return Response(str(score))

# Called for creating a new collection and inserting document into an
# existing collection
@app.route('/store/<videoName>')
def storeCollection(videoName):
    # If video name was provided, create collection with that name and its link
    if videoName.strip():
        global collection
        collection = db[videoName]
        collection.insert({'link': request.args.get('link', type=str)})
        print 'Added link'
        return jsonify({'status': 200})
    # Otherwise insert document into current collection
    collection.insert({
        'start': request.args.get('start', type=float),
        'end': request.args.get('end', type=float),
        'text': request.args.get('text', type=str),
        'sentiment': request.args.get('sentiment', type=float)
    })
    print request.args.get('sentiment', type=float)
    return jsonify({'status': 200})

# Create development server with automatic SSL credentials
# NOTE: Without SSL, microphone permission is repeatedly requested
if __name__ == '__main__':
    app.debug = True
    app.run(host='0.0.0.0', port=8676, ssl_context='adhoc')
