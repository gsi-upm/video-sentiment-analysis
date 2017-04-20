var recognition,
  videoPause = false,
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
  transcriptRequest = $.get('retrieve/' + encodeURI(collectionName.trim()),
    function (data) {
      var videoData,
          fullVideoData = [];

      // If the collection was empty or nonexistent,
      // alert the user of the problem
      if (data.status === 400) {
        window.alert('There was an error trying to access the collection!');
        return;
      }
      // Otherwise, loop through all the documents,
      // Each contains a line except the first which contains the video link
      $.each(data, function(index, value) {
        // Link to video is stored in first database document
        if (index === 0) {
          $video = Popcorn.youtube('#main-video', value.link);
        } else {

          // Set cues to add/remove data to/from graph
          $video.cue(value.start, function () {
            videoData = fullVideoData.slice(0, index);
            updateLineGraph({
              'liveAnalysis': false,
              'videoData': videoData
            });
          });

          // Have the rest of the links show up at the corresponding time
          $video.footnote({
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

  recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;

  // Log current time (either at beginning or after pause)
  recognition.onaudiostart = function () {
    console.log('Start Time: ' + $video.currentTime());
  };

  // When a new result is available from speech recognition...
  recognition.onresult = function () {
    var currentLine, splitNewLine, splitInterimTrans, currentSentiment,
      wordDifference, newWordCount, prevWordCount,
      getSentiment = function getSentiment() {
        // Send request to calculate sentiment
        $.get('/sentiment/' + encodeURI(currentLine), chosenDictInfo,
          function (data) {
            // On success get value (to at most 3 decimals)
            // and update line graph and info boxes
            currentSentiment = Math.round(parseFloat(data) * 1000) / 1000;
            totalSentiment += currentSentiment;
            updateLineGraph({
              'line': currentLine,
              'liveAnalysis': true,
              'sentiment': currentSentiment
            });
            $('#current-sentiment p').text(currentSentiment);
            $('#total-sentiment p').text(totalSentiment);
          }
        );
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
        currentTime = $video.currentTime();
        // Collect only the most recent words and add them to final transcript
        currentLine = String(splitNewLine.slice((-wordDifference)).join(' '));
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
  recognition.onend = function(event) {
    if (!videoPause && !videoEnd) {
      // If it was simply a restart then reset the interim transcript
      interimTranscript = '';
      recognition.start();
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
    recognition.lang = (countries === 1) ?
                       langs[langIndex][1] : langs[langIndex][countryIndex][0];
    console.log(recognition.lang);
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

  /*********************************************************************
   * Sets the initial country/language dropdown to default on page load
   * Note: Can be changed at top of function
   ********************************************************************/
  selectLanguage.options.selectedIndex = defaultLanguage;
  updateCountry();
  selectCountry.options.selectedIndex = defaultCountry;
  updateSpeechLang();
}
