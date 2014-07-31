// New widget
  videoWidget = {
	// Widget name.
	name: "Video",
	// Widget description.
	description: "Video Widget",
	// Path to the image of the widget.
	img: "img/widgets/videoWidget.png",
	// Type of the widget.
	type: "video",
	// Help display on the widget
	help: "Video Sentiment",
	// [OPTIONAL] data taken from this field.
	// field: "polarityValue",
	// Category of the widget (1: textFilter, 2: numericFilter, 3: graph, 4: other, 5: results)
	cat: 4,

	recognition: undefined,
	$video: undefined,

	render: function () {
		var id = 'A' + Math.floor(Math.random() * 10001);
		var field = videoWidget.field || "";
		vm.activeWidgetsRight.push({
			"id": ko.observable(id),
			"title": ko.observable(videoWidget.name),
			"type": ko.observable(videoWidget.type),
			"help": ko.observable(videoWidget.help),
			"field": ko.observable(field),
			"collapsed": ko.observable(false),
			"showWidgetHelp": ko.observable(false)
		});

		videoWidget.html(id);
		videoWidget.video(id);
	},

	html: function (id) {
		$('#' + id).html('<div id="video-box"><form id="start-options"><label class="video-name">Video Name:</label><input class="video-name" type="text"></input><br><label class="video-link">Video Link:</label><input class="video-link" type="text"></input><br><label class="dictionary-list">Select a Dictionary</label><select id="dictionary-list"><option value="spFinancial" restricted="false">Spanish finances - Paradigma</option><option value="enFinancial" restricted="true">English finances - Loughran and McDonald</option><option value="spFinancialEmoticon" restricted="false">Sp finances and emts - Paradigma</option><option value="enFinancialEmoticon" restricted="true">En finances and emts - Loughran and McDonald</option></select><label class="stored-transcript">Select Existing Transcript or <i>Live Analysis:</i></label><select id="stored-transcripts"><option id="live-analysis-option">Live Analysis</option></select><br><input class="submit" id="form-submit-button" type="submit" value="Submit"></input></form><div id="' + id + 'main-video"></div><div id="captions-bar"><p id="subtitles"></p></div><div id="control-bar"><button class="button" id="play">Play</button><button class="button" id="pause">Pause</button><button class="button" id="caption-show">Subtitles</button><select class="language" id="select-language"></select><select class="country" id="select-country"></select></div></div></div>');
		$('#' + id).append('<style>.LangCountrySelector{background:#053349;border:none;-webkit-border-radius:25px;-moz-border-radius:25px;-o-border-radius:25px;border-radius:25px;bottom:1%;color:white;font-size:100%;font-weight:bold;padding:.5%}body{background:#053349;font-family:\'Roboto\';margin:.25% 0}#captions-bar{background:black;display:none;height:50px;overflow:auto}#captions-bar #subtitles{color:white;font-weight:bold;font-size:1.5em;margin:0 auto;padding:1%;position:relative;text-align:center}#control-bar{visibility:hidden;position:relative}#control-bar .button{background:#0b6693;border:solid #053349;-webkit-border-radius:25px;-moz-border-radius:25px;-o-border-radius:25px;border-radius:25px;color:white;font-size:1.5em;margin:1% 0 1% .5%;padding:1%;cursor:pointer}#control-bar .country{background:#053349;border:none;-webkit-border-radius:25px;-moz-border-radius:25px;-o-border-radius:25px;border-radius:25px;bottom:1%;color:white;font-size:100%;font-weight:bold;padding:.5%;position:absolute;right:0;top:50%}#control-bar .language{clear:right;float:right;background:#053349;border:none;-webkit-border-radius:25px;-moz-border-radius:25px;-o-border-radius:25px;border-radius:25px;bottom:1%;color:white;font-size:100%;font-weight:bold;padding:.5%}#' + id + 'main-video{height:550px;width:100%}#video-box{background:black;margin:0 auto;max-height:500px;position:relative;width:100%}#start-options{background:#053349;color:white;height:100%;padding:0;position:absolute;top:0;width:100%}#start-options #dictionary-list{clear:both;font-size:1.3em;margin-left:25%}#start-options input.video-link,#start-options input.video-name{display:inline-block;font-size:1.3em;padding-top:1%;position:relative;top:10%;width:60%}#start-options input.submit{margin:2% 45%;font-size:1.3em}#start-options label.dictionary-list,#start-options label.stored-transcript{clear:both;float:left;font-size:1.3em;margin:3% 0;text-align:center;width:100%}#start-options label.video-link{clear:left;display:inline-block;font-size:1.3em;margin:0 5% 10% 0;position:relative;text-align:right;top:10%;width:30%}#start-options label.video-name{clear:left;display:inline-block;font-size:1.3em;margin:0 5% 10% 0;position:relative;text-align:right;top:10%;width:30%;margin-bottom:1%}#start-options #stored-transcripts{clear:both;font-size:1.3em;margin-left:20%;width:60%}</style>')
	},

  paint: function (id) {

  },

	video: function (id) {
		var videoPause = false,
			videoEnd = false;


		function speechDataOptions(chosenDictInfo,
								chosenTranscriptIndex,
								liveAnalysis,
								transcriptSelectList,
								updateLineGraph,
								videoName) {
  		'use strict';

  		var collectionName, finalTranscript, transcriptRequest;

  		/**************************************
  		* Speech Recognition
  		* Only available in Chrome/Chromium!
  		*************************************/
  		if (liveAnalysis) {
  			// Start up speech recognition
  			liveAnalysisSetup(chosenDictInfo, updateLineGraph);
  			languageOptions();
  			return;
  		}

  		/**********************************
  		* If existing transcript selected
  		*********************************/
  		// Hide unused elements
  		$('#select-country').hide();
  		$('#select-language').hide();
  		// Get name of chosen transcript
  		collectionName = String(transcriptSelectList[chosenTranscriptIndex].value);
  		// Send a request to get transcript from the database
  		transcriptRequest = $.get('php/mongo_transcript_load.php',
  			{'name': collectionName.trim()},
  			function (data) {
  			var videoData,
  				fullVideoData = [];

  			// Loop through all the documents,
  			// Each contains a line except the first which contains the video link
  			$.each(data, function (index, value) {
  				// Link to video is stored in first database document
  				if (index === 0) {
  					videoWidget.$video = Popcorn.smart('#' + id + 'main-video', value.link);
  				} else {

  				// Set cues to add/remove data to/from graph
  				videoWidget.$video.cue(value.start, function () {
  					videoData = fullVideoData.slice(0, index);
  					updateLineGraph({
  					'liveAnalysis': false,
  					'videoData': videoData
  					});
  				});

  				// Have the rest of the links show up at the corresponding time
  				videoWidget.$video.footnote({
  					start: value.start,
  					end: value.end,
  					text: value.text,
  					target: '#subtitles'
  				});

  				// Append each line to the final transcript
  				finalTranscript += value.text + ' ';

  				// Create array containing sentiment values
  				fullVideoData.push([value.sentiment, value.text]);
  				}
  			});

  		}, 'json');

  		// Once ready, set full transcript
  		transcriptRequest.done(function () {
  			$('#full-transcript p').text(finalTranscript);
  		});

  		return transcriptRequest;
  		}

  		/********************************
  		* Initialize Speech Recognition
  		*******************************/
  		function liveAnalysisSetup(chosenDictInfo, updateLineGraph) {
  		'use strict';

  		// Create recognition instance and initialize values
  		var currentTime = 0,
  			interimTranscript = '',
  			finalTranscript = '',
  			startTime = 0,
  			totalSentiment = 0;

  		videoWidget.recognition = new webkitSpeechRecognition();
  		videoWidget.recognition.continuous = true;
  		videoWidget.recognition.interimResults = true;

  		// Log current time (either at beginning or after pause)
  		videoWidget.recognition.onaudiostart = function () {
  			console.log('Start Time: ' + videoWidget.$video.currentTime());
  		};

  		// When a new result is available from speech recognition...
  		videoWidget.recognition.onresult = function () {
  			var currentLine, splitNewLine, splitInterimTrans, currentSentiment,
  			wordDifference, newWordCount, prevWordCount,
  			getSentiment = function getSentiment() {
  				// Send request to calculate sentiment
  				$.get('php/sentiment.php', chosenDictInfo, function (data) {
  					  // On success get value (to at most 3 decimals)
  					  // and update line graph and info boxes
  					  currentSentiment = Math.round(+data * 1000) / 1000;
  					  totalSentiment += currentSentiment;
  					  updateLineGraph({
  					  'line': currentLine,
  					  'liveAnalysis': true,
  					  'sentiment': currentSentiment
  					  });
  				   	$('#current-sentiment p').text(currentSentiment);
  				   	$('#total-sentiment p').text(totalSentiment);
  				  });
  			};

  			// Loop through results
  			for (var i = event.resultIndex; i < event.results.length; ++i) {
  			/************************************************************************
  			* If there have been more than five new words added then update the
  			* subtitles and the current line, send new words for analysis
  			* Note: This avoids single word/phrase outputs from interim results
  			***********************************************************************/
  			splitNewLine = event.results[i][0].transcript.split(' ');
  			splitInterimTrans = interimTranscript.split(' ');
  			newWordCount = splitNewLine.length;
  			prevWordCount = splitInterimTrans.length;
  			wordDifference = newWordCount - prevWordCount;

  			// If whole phrase is done reset the interim transcript
  			if (event.results[i].isFinal) {
  				interimTranscript = '';
  				// If phrase ended and it was five words or less, it won't be caught
  				// by the condition below, so update final transcript and subtitles
  				if (wordDifference <= 5) {
  				finalTranscript += ' ' + currentLine;
  				$('#full-transcript p').text(finalTranscript);
  				currentLine = splitNewLine.slice((-wordDifference)).join(' ');
  				$('#subtitles').text(currentLine);
  				// Send request to calculate sentiment
  				getSentiment();
  				}
  			}

  			// If there have been more than five new words added update subtitle and
  			// current line; send new words for analysis
  			if (wordDifference > 5) {
  				// Record time of completion
  				currentTime = videoWidget.$video.currentTime();
  				// Collect only the most recent words and add them to final transcript
  				currentLine = String(splitNewLine.slice((-wordDifference)).join(' '));
  				chosenDictInfo['currentLine'] = currentLine;
  				finalTranscript += ' ' + currentLine;
  				$('#full-transcript p').text(finalTranscript);

  				// Set new line as interim transcript
  				interimTranscript = event.results[i][0].transcript;
  				// Show caption
  				$('#subtitles').text(currentLine);
  				// Send request to calculate sentiment
  				getSentiment();
  				// Make next startTime the current time (for recording purposes)
  				startTime = currentTime;
  			}
  			}
  		};

  		// Restart (recognition stops every 60 secs) if video not paused or done
  		videoWidget.recognition.onend = function (event) {
  			if (!videoPause && !videoEnd) {
  			// If it was simply a restart then reset the interim transcript
  			interimTranscript = '';
  			videoWidget.recognition.start();
  			}
  		};
		}

		/**************************
		* Speech Language Options
		*************************/
		function languageOptions() {
  		var countries, langElem, langOpt, updateCountry, updateSpeechLang,
  			selectLanguage = document.getElementById('select-language'),
  			selectCountry = document.getElementById('select-country'),

  			/*****************************************
  			* Change default country and/or language
  			****************************************/
  			defaultLanguage = 6,
  			defaultCountry = 5,

  			langs = // Language array for recognition from Google
  			[['Afrikaans',       ['af-ZA']],
  			['Bahasa Indonesia',['id-ID']],
  			['Bahasa Melayu',   ['ms-MY']],
  			['Català',          ['ca-ES']],
  			['Čeština',         ['cs-CZ']],
  			['Deutsch',         ['de-DE']],
  			['English',         ['en-AU', 'Australia'],
  								['en-CA', 'Canada'],
  								['en-IN', 'India'],
  								['en-NZ', 'New Zealand'],
  								['en-ZA', 'South Africa'],
  								['en-GB', 'United Kingdom'],
  								['en-US', 'United States']],
  			['Español',         ['es-AR', 'Argentina'],
  								['es-BO', 'Bolivia'],
  								['es-CL', 'Chile'],
  								['es-CO', 'Colombia'],
  								['es-CR', 'Costa Rica'],
  								['es-EC', 'Ecuador'],
  								['es-SV', 'El Salvador'],
  								['es-ES', 'España'],
  								['es-US', 'Estados Unidos'],
  								['es-GT', 'Guatemala'],
  								['es-HN', 'Honduras'],
  								['es-MX', 'México'],
  								['es-NI', 'Nicaragua'],
  								['es-PA', 'Panamá'],
  								['es-PY', 'Paraguay'],
  								['es-PE', 'Perú'],
  								['es-PR', 'Puerto Rico'],
  								['es-DO', 'República Dominicana'],
  								['es-UY', 'Uruguay'],
  								['es-VE', 'Venezuela']],
  			['Euskara',         ['eu-ES']],
  			['Français',        ['fr-FR']],
  			['Galego',          ['gl-ES']],
  			['Hrvatski',        ['hr_HR']],
  			['IsiZulu',         ['zu-ZA']],
  			['Íslenska',        ['is-IS']],
  			['Italiano',        ['it-IT', 'Italia'],
  								['it-CH', 'Svizzera']],
  			['Magyar',          ['hu-HU']],
  			['Nederlands',      ['nl-NL']],
  			['Norsk bokmål',    ['nb-NO']],
  			['Polski',          ['pl-PL']],
  			['Português',       ['pt-BR', 'Brasil'],
  								['pt-PT', 'Portugal']],
  			['Română',          ['ro-RO']],
  			['Slovenčina',      ['sk-SK']],
  			['Suomi',           ['fi-FI']],
  			['Svenska',         ['sv-SE']],
  			['Türkçe',          ['tr-TR']],
  			['български',       ['bg-BG']],
  			['Pусский',         ['ru-RU']],
  			['Српски',          ['sr-RS']],
  			['한국어',            ['ko-KR']],
  			['中文',             ['cmn-Hans-CN', '普通话 (中国大陆)'],
  								['cmn-Hans-HK', '普通话 (香港)'],
  								['cmn-Hant-TW', '中文 (台灣)'],
  								['yue-Hant-HK', '粵語 (香港)']],
  			['日本語',           ['ja-JP']],
  			['Lingua latīna',   ['la']]];

  		// Populate language selection dropdown
  		for (var i = 0; i < langs.length; i++) {
  			langOpt = langs[i][0];
  			langElem = document.createElement('option');
  			langElem.textContent = langOpt;
  			langElem.value = langOpt;
  			selectLanguage.appendChild(langElem);
  		}

  		// Called when change made to selectLanguage or selectCountry elements
  		updateSpeechLang = function updateSpeechLang() {
  			var langIndex = selectLanguage.options.selectedIndex,
  				countryIndex = selectCountry.options.selectedIndex + 1;
  			videoWidget.recognition.lang = (countries === 1) ?
  							langs[langIndex][1] : langs[langIndex][countryIndex][0];
  			console.log(videoWidget.recognition.lang);
  		};

  		// Populate country selection dropdown
  		updateCountry = function updateCountry() {
  			var countryElem, countryOpt,
  			countries = langs[selectLanguage.options.selectedIndex].length - 1;
  			selectCountry.options.length = 0; // Clear list
  			// If only one country choice, do not display countries dropdown
  			if (countries == 1) {
  			selectCountry.options.selectedIndex = 1;
  			selectCountry.style.display = 'none';
  			} else {
  			// Otherwise populate countries dropdown and display
  			selectCountry.style.display = '';
  			for (var i = 1; i <= countries; i++) {
  				countryOpt = langs[selectLanguage.options.selectedIndex][i][1];
  				countryElem = document.createElement('option');
  				countryElem.textContent = countryOpt;
  				countryElem.value = countryOpt;
  				selectCountry.appendChild(countryElem);
  			}
  			}
  			// Make sure language is updated, in case only updateCountry was called
  			updateSpeechLang();
  		};

      /*****************************
       * Language Selector Handlers
       ****************************/
      $('#select-country').change(updateSpeechLang);
      $('#select-language').change(updateCountry);

  		/*********************************************************************
  		* Sets the initial country/language dropdown to default on page load
  		* Note: Can be changed at top of function
  		********************************************************************/
  		selectLanguage.options.selectedIndex = defaultLanguage;
  		updateCountry();
  		selectCountry.options.selectedIndex = defaultCountry;
  		updateSpeechLang();
  	}



		/********************************************
		* Responsive actions to window and document
		*******************************************/
		$(document).ready(function () {
		'use strict';

		/*********************************************
		* If speech recognition not available,
		* display message and hide unusable features
		********************************************/
		if (!('webkitSpeechRecognition' in window)) {
			$('#live-analysis-option').remove();
			window.alert('Sorry, only Chrome/Chromium support live analysis!');
			$('#start-options label.saved-transcript')
			.text('Select Existing Transcript');
		}

		// Get and list available transcripts in dropdown,
		// The blank is used as a false boolean server side
		$.get('php/mongo_transcript_load.php', function (data) {
		 	console.log(data);
		 	var dataArray = data.split(',');
		 	// If transcripts available, create options for dropdown
		 	if (data !== '') {
		   	$.each(dataArray, function (index, name) {
		   		$('#stored-transcripts').append(
		   			$('<option></option>')
		   			.text(name.trim())
				  );
		   	});
		 	}
		 });

		});

		/************************
		* Submit Button Handler
		***********************/
		$('#form-submit-button').click(function (event) {
  		'use strict';

  		// Ignore regular submit button function
  		event.preventDefault();

  		// Get user inputted video name and dropdown selection and
  		// create a boolean that is true if live analysis is selected
  		var videoName = $('#start-options input.video-name').val(),
  			videoLink = $('#start-options input.video-link').val(),
  			transcriptSelectList = document.getElementById('stored-transcripts'),
  			chosenTranscriptIndex = transcriptSelectList.selectedIndex,
  			dictList = document.getElementById('dictionary-list'),
  			chosenDictInfo = {
  			'name': dictList[dictList.selectedIndex].value,
  			'restricted': dictList[dictList.selectedIndex].getAttribute('restricted')
  			},
  			liveAnalysis = Boolean(chosenTranscriptIndex === 0),
  			handleVideo,
  			transcriptRequest,
  			// Create initial line graph
  			updateLineGraph =  videoDataWidget.updateLineGraph;

  		// Otherwise send information to speech function to handle
  		transcriptRequest = speechDataOptions(
  			chosenDictInfo,
  			chosenTranscriptIndex,
  			liveAnalysis,
  			transcriptSelectList,
  			updateLineGraph,
  			videoName
  		);

  		// Hide start options and show control bar
  		$('#start-options').hide();
  		$('#control-bar').css('visibility', 'visible');

  		handleVideo = function handleVideo() {

  			if (videoWidget.$video === undefined) {
  				// Set video link as source for video and load the video
  				// Note: .smart() tries to create/use appropriate wrapper for video
  				videoWidget.$video = Popcorn.smart('#' + id + 'main-video', videoLink);
  			}

  			videoWidget.$video.load();
  			videoWidget.$video.controls(false);

  			// Resize video
  			$('#' + id + 'main-video').height($('#' + id + 'main-video').height() / 1.5);

  			/*******************************
  			* Create Video Button Handlers
  			******************************/
  			// Toggle caption bar on button click
  			$('#caption-show').click(function () {$('#captions-bar').toggle();});

  			// Note: videoPause variable distinguishes between actual
  			// pause and recognition restart (every 60 secs)

  			$('#play').click(function () {
  			console.log('Live Analysis: ' + liveAnalysis);
  			// If live analysis try to start recognition
  			if (liveAnalysis) {
  				// Make sure microphone permission is given before starting, in order to
  				// avoid missed data
  				videoWidget.$video.play();
  				try {
  				videoWidget.recognition.start();
  				} catch (e) {
  				console.log('Recognition already started!');
  				}
  				videoPause = false;
  			} else {
  				videoWidget.$video.play();
  			}
  			});

  			$('#pause').click(function () {
  			  videoWidget.$video.pause();
  			  // If live analysis stop recognition
  			  if (liveAnalysis) {
  				  videoPause = true;
  				  videoWidget.recognition.stop();
  			  }
  			});

  			/**********************************
  			* Create Video listener functions
  			*********************************/
  			videoWidget.$video.on('ended', function () {
  			  // If live analysis stop recognition
  			  if (liveAnalysis) {
  				  videoEnd = true;
  				  videoWidget.recognition.stop();
  			  }
  			});
  		};

  		if (liveAnalysis) {
  			// If running a live analysis, set the video options immediately
  			handleVideo();
  		} else {
  			// If getting a transcript, wait for the data to arrive
  			transcriptRequest.done(handleVideo);
  		}

		});

		/**************************************
		* Show Full Transcript Button Handler
		*************************************/
		$('#full-transcript-button').click(function () {
  		'use strict';

  		$('#full-transcript').toggle();
		});
	}
};
