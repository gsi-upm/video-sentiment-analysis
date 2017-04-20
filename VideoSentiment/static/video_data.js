var $video;

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
  $.get('retrieve/' + encodeURI(' '), function (data) {
    console.log(data);
    var dataArray = data.split(';;');
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

/*******************************
 * Create initial D3 Line Graph
 ******************************/
function drawLineGraph() {
  'use strict';

  var path, line, svg, x, y,
    updateLineGraph,
    videoData = [],
    // Viewport dimensions for line graph (depend on video size)
    CONTAINER_DIMENSIONS = {
      width: $('#main-video').width(),
      height: $('#main-video').height() / 3
    },
    MARGIN = {top: 10, right: 40, bottom: 40, left: 80},
    CHART_DIMENSIONS = {
      width: CONTAINER_DIMENSIONS.width - MARGIN.left - MARGIN.right,
      height: CONTAINER_DIMENSIONS.height - MARGIN.top - MARGIN.bottom
    };

  // Provide functions to move selected element to front or back
  d3.selection.prototype.moveToFront = function () {
    return this.each(function () {
      this.parentNode.appendChild(this);
    });
  };

  d3.selection.prototype.moveToBack = function () {
    return this.each(function() {
      var firstChild = this.parentNode.firstChild;
      if (firstChild) {
        this.parentNode.insertBefore(this, firstChild);
      }
    });
  };

  // Set x scale
  x = d3.scale.linear()
          .domain([0, 1])
          .range([0, CHART_DIMENSIONS.width]);

  // Set y scale
  y = d3.scale.linear()
          .domain([-1, 1])
          .range([CHART_DIMENSIONS.height, 0]);

  // Create svg
  svg = d3.select('#line-graph')
          .attr('viewBox', '0 0' + ' ' +
                String(CONTAINER_DIMENSIONS.width) + ' ' +
                String(CONTAINER_DIMENSIONS.height)
                )
          .append('g')
          .attr('transform',
            'translate(' + MARGIN.left + ',' + MARGIN.top + ')'
          );

  // Add x-axis
  svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + CHART_DIMENSIONS.height + ')')
      .call(d3.svg.axis().scale(x).orient('bottom'));

  d3.select('.x.axis')
    .append('text')
    .text('Index of Phrase')
    .attr('x', (CHART_DIMENSIONS.width - MARGIN.left - MARGIN.right) / 2)
    .attr('y', MARGIN.bottom)
    .style('font-size', '1em');

  // Add y-axis
  svg.append('g')
      .attr('class', 'y axis')
      .call(d3.svg.axis().scale(y).orient('left').ticks(5));

  d3.select('.y.axis')
    .append('text')
    .text('Sentiment')
    .attr('transform',
          'translate(' + -(MARGIN.right) + ', ' +
          (CHART_DIMENSIONS.height - MARGIN.top) + ')' +
          'rotate(-90)')
    .style('font-size', '1em');

  // Scales and data point path generation (d=data, i=index)
  line = d3.svg.line()
          .x(function (d, i) { return x(i); })
          .y(function (d, i) { return y(d[0]); });

  path = svg.append('path')
            .data([videoData])
            .attr('class', 'line')
            .attr('d', line);

  // Add grid lines to graph
  svg.selectAll('horizontal-lines')
      .data([-0.5, 0, 0.5, 1])
      .enter().append('line')
      .attr('x1', 0)
      .attr('x2', CHART_DIMENSIONS.width)
      .attr('y1', function (d) { return y(d); })
      .attr('y2', function (d) { return y(d); })
      .style('stroke', 'gray')
      .moveToBack();

  /****************************************
   * Update and add new data to line graph
   ***************************************/
  updateLineGraph = function updateLineGraph(options) {

    var newX, circleScale, circleColorScale,
      axisList, hoverText, mouseClick, mouseOver, mouseOut;

    // Used during a live analysis
    if (options.liveAnalysis) {
      console.log(options.sentiment + ', ' + options.line);
      // Add new sentiment value to array
      videoData.push([options.sentiment, options.line]);
    } else {
      // If reading from recorded transcript, get complete array
      videoData = options.videoData;
    }

    // Adjust x-axis scale and extend axis, only display 10 most recent points
    // Max function is to make sure the scale is created at time 0
    newX = d3.scale.linear()
                .domain([0, Math.max(videoData.length, 1)])
                .range([0, CHART_DIMENSIONS.width]);
    // Create scales for the size and color of circle data points
    circleScale = d3.scale.linear()
                      .domain([0, 1])
                      .range([2, 5]);
    circleColorScale = d3.scale.linear()
                           .domain([-1, 1])
                           .range(['red', 'green']);

    line.x(function (d, i) { return newX(i); });
    svg.selectAll('g.x.axis')
        .call(d3.svg.axis().scale(newX).orient('bottom'));

    // Extend line
    path.data([videoData])
          .transition()
          .duration(200)
          .ease('linear')
          .attr('d', line);

    // Recreate all data points to new scale
    svg.selectAll('circle')
        .remove();
    svg.selectAll('points')
          .data(videoData)
        .enter().append('circle')
          .style('stroke', 'black')
          .style('fill', function (d) { return circleColorScale(d[0]); })
          .attr('cx', function (d, i) { return newX(i); })
          .attr('cy', function (d, i) { return y(d[0]); })
          .attr('r', function (d, i) { return circleScale(Math.abs(d[0])); });

    // Create text area to display number when mouse hovers over point
    hoverText = d3.select('#tab2')
                  .selectAll('p')
                  .data([videoData])
                  .enter().append('p')
                  .attr('id', 'hover-text')
                  .attr('x', CHART_DIMENSIONS.width - MARGIN.left)
                  .attr('y', MARGIN.top + MARGIN.bottom);

    // Display sentiment value of data point in text
    // Note: Rounding is to show at most three decimals since value can be long
    mouseOver = function mouseOver() {
      var cy = Math.round(1000 * y.invert(d3.select(this).attr('cy'))) / 1000;
      d3.select('#hover-text').text(function () { return cy; })
          .style('display', 'inline');
      // Also make selected point appear slightly larger
      d3.select(this).attr('r', 7)
          .moveToFront();
    };

    // Hide text area containing sentiment value
    mouseOut = function mouseOut() {
      d3.select('#hover-text').style('display', 'none');
      // Reset size of circle
      d3.select(this).attr('r', function (d) {
        return circleScale(Math.abs(d[0]));
      });
    };

    // Show phrase corresponding to the data point below the graph
    // Note: Rounding is to prevent extra decimals that can appear from scaling
    mouseClick = function mouseClick() {
      var index = Math.round(newX.invert(d3.select(this).attr('cx')));
      d3.select(this).attr('text', function (d) {
        return String(index + ': ' + d[1]);
      });
      d3.select('#clicked-phrase')
          .text('Phrase ' + d3.select(this).attr('text'))
          .style('display', 'inline-block');
    };

    // Bind listener functions to all circle elements
    svg.selectAll('circle')
        .on('mouseover', mouseOver)
        .on('mouseout', mouseOut)
        .on('click', mouseClick);
  };

  return updateLineGraph;
}

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
    updateLineGraph = drawLineGraph();

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

    if ($video === undefined) {
      // Set video link as source for video and load the video
      // Note: .smart() tries to create/use appropriate wrapper for video
      $video = Popcorn.youtube('#main-video', videoLink);
    }

    $video.load();
    $video.controls(true);

    // Resize video and show line graph
    $('#main-video').height($('#main-video').height() / 1.5);
    $('#line-graph-box').show();

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
        $video.play();
        try {
          recognition.start();
        } catch (e) {
          console.log('Recognition already started!');
        }
        videoPause = false;
      } else {
        $video.play();
      }
    });

    $('#pause').click(function () {
      $video.pause();
      // If live analysis stop recognition
      if (liveAnalysis) {
        videoPause = true;
        recognition.stop();
      }
    });

    /**********************************
     * Create Video listener functions
     *********************************/
    $video.on('ended', function () {
      // If live analysis stop recognition
      if (liveAnalysis) {
        videoEnd = true;
        recognition.stop();
      }
    });

    /*******************************************
     * Create handler for video seek
     ******************************************/
    $('#time-box-submit').click(function () {
      event.preventDefault();

      var time = Number($('#time-box').val());

      // Do nothing if a number wasn't provided or time exceeds video length
      if (!isNaN(time) && time <= $video.duration()) {
        console.log('Prev Time:', $video.currentTime(), 'New Time:', time);
        $video.currentTime(time);
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
