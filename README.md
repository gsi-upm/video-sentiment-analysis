![GSI Logo](http://gsi.dit.upm.es/templates/jgsi/images/logo.png)
[SentiVid](https://github.com/gsi-upm/video-sentiment-analysis)
==================================

Introduction
------------
This project makes use of various APIs to analyze videos in real-time.
It can also store the data from an analysis for later access.

When running a live analysis, the [Google Web Speech Recognition API](http://updates.html5rocks.com/2013/01/Voice-Driven-Web-Apps-Introduction-to-the-Web-Speech-API) is used to transcribe the video as it is playing.
Then, after every few words, a phrase is sent to the [SEAS API](https://github.com/gsi-upm/SEAS).
A sentiment value is parsed from the result and displayed in a line graph.

It can be also be used in a larger scope by providing sentiment analysis for video media.

Installation instructions
-------------------------
Make a local copy of the folder containing the controller and widget (or one of them alone since they work individually).
Then, install the requirements<sup>1</sup> listed in the *stable-req.txt* file.
It is recommended, but not strictly required, that you do this in a virtual environment.

Once the necessary libraries are installed, run the *server.py* file.
By default the sites will be available at:
<br>Controller - https://localhost:8676
<br>Widget - https://localhost:8675

Usage
-----
####Live Analysis:
1. Insert a video name (optional for widget) and link.
2. Select a dictionary.
3. Select Live Analysis and press submit.
4. Modify the language and country accordingly.<sup>2</sup>
5. Press play to start recognition.<sup>3,4</sup>
6. Press pause to stop recognition.
7. Use the *Jump to time* text box to skip to a particular time in the video.<br>

  **Warning:** The in-browser Google Speech Recognition API that this project uses relies on microphone input.
  Thus, in order for it to work correctly, it is up to the user to redirect his/her sound output to a microphone.

####Existing Analysis:
1. Select the transcript name and press submit.
2. Use play, pause, and *Jump to time* to control the video.<sup>5</sup>

Overview
--------
|              | Controller   | Widget            |
|:------------:|:------------:|:-----------------:|
| **Analysis** | Live         | Live and Existing |
| **Database** | Storage Only | Access Only       |

Notes
-----
<sup>1</sup> The cryptography library will fail to install if it is missing certain dependencies.
More information is available [here](https://cryptography.io/en/latest/installation/).<br>
<sup>2</sup> The language options can be modified at any time.<br>
<sup>3</sup> Microphone permission will be required the first time the site loads.<br>
<sup>4</sup> When using the controller, the data you see is recorded to a database in MongoDB.
The default name is *transcript_collection*.<br>
<sup>5</sup> The data and subtitles will automatically adjust.<br>

***General:***
* The browser will repeatedly ask for microphone permission if SSL is not used.
