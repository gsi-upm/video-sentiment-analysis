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
   }

});

// Resize tab content when window resizes so that it matches video element
$(window).resize(function () {
  'use strict';
  $('.content').height($('#video-box').height());
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
    container_dimensions = {
      width: $('#main-video').width(),
      height: $('#main-video').height() / 3
    },
    margin = {top: 10, right: 40, bottom: 40, left: 80},
    chart_dimensions = {
      width: container_dimensions.width - margin.left - margin.right,
      height: container_dimensions.height - margin.top - margin.bottom
    };

  // Provide functions to move selected element to front or back
  d3.selection.prototype.moveToFront = function () {
    return this.each(function () {
      this.parentNode.appendChild(this);
    });
  };

  d3.selection.prototype.moveToBack = function() {
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
          .range([0, chart_dimensions.width]);

  // Set y scale
  y = d3.scale.linear()
          .domain([-1, 1])
          .range([chart_dimensions.height, 0]);

  // Create svg
  svg = d3.select("#line-graph")
          .attr("viewBox", "0 0" + " " +
                String(container_dimensions.width) + " " +
                String(container_dimensions.height)
                )
          .append("g")
          .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")"
          );

  // Add x-axis
  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + chart_dimensions.height + ")")
      .call(d3.svg.axis().scale(x).orient("bottom"));

  d3.select(".x.axis")
    .append("text")
    .text("Index of Phrase")
    .attr("x", (chart_dimensions.width - margin.left - margin.right) / 2)
    .attr("y", margin.bottom)
    .style("font-size", "1em");

  // Add y-axis
  svg.append("g")
      .attr("class", "y axis")
      .call(d3.svg.axis().scale(y).orient("left").ticks(5));

  d3.select(".y.axis")
    .append("text")
    .text("Sentiment")
    .attr("transform",
          "translate(" + -(margin.right) + ", " +
          (chart_dimensions.height - margin.top) + ")" +
          "rotate(-90)")
    .style("font-size", "1em");

  // Scales and data point path generation (d=data, i=index)
  line = d3.svg.line()
          .x(function (d, i) { return x(i); })
          .y(function (d, i) { return y(d[0]); });

  path = svg.append("path")
            .data([videoData])
            .attr("class", "line")
            .attr("d", line);

  // Add grid lines to graph
  svg.selectAll("horizontal-lines")
      .data([-0.5, 0, 0.5, 1])
      .enter().append("line")
      .attr("x1", 0)
      .attr("x2", chart_dimensions.width)
      .attr("y1", function (d) { return y(d); })
      .attr("y2", function (d) { return y(d); })
      .style("stroke", "gray")
      .moveToBack();

  /****************************************
   * Update and add new data to line graph
   ***************************************/
  updateLineGraph = function updateLineGraph(options) {

    var max_y, min_y, new_x, new_y, circleScale, circleColorScale,
      axisList, hoverText, mouseClick, mouseOver, mouseOut;

    console.log(options.sentiment + ", " + options.line);
    // Add new sentiment value to array
    videoData.push([options.sentiment, options.line]);

    // Adjust x-axis scale and extend axis, only display 10 most recent points
    new_x = d3.scale.linear()
                .domain([0, videoData.length])
                .range([0, chart_dimensions.width]);
    // Create scales for the size and color of circle data points
    circleScale = d3.scale.linear()
                      .domain([0, 1])
                      .range([2,5]);
    circleColorScale = d3.scale.linear()
                           .domain([-1,1])
                           .range(["red", "green"]);

    line.x(function (d, i) { return new_x(i); });
    svg.selectAll("g.x.axis")
        .call(d3.svg.axis().scale(new_x).orient("bottom"));

    // Extend line
    path.data([videoData])
          .transition()
          .duration(200)
          .ease("linear")
          .attr("d", line);

    // Recreate all data points to new scale
    svg.selectAll("circle")
        .remove();
    svg.selectAll("points")
          .data(videoData)
        .enter().append("circle")
          .style("stroke", "black")
          .style("fill", function (d) { return circleColorScale(d[0]); })
          .attr("cx", function (d, i) { return new_x(i); })
          .attr("cy", function (d, i) { return y(d[0]); })
          .attr("r", function (d, i) { return circleScale(Math.abs(d[0])); });

    // Create text area to display number when mouse hovers over point
    hoverText = d3.select("#tab2")
                  .selectAll("p")
                  .data([videoData])
                  .enter().append("p")
                  .attr("id", "hover-text")
                  .attr("x", chart_dimensions.width - margin.left)
                  .attr("y", margin.top + margin.bottom);

    // Display sentiment value of data point in text
    // Note: Rounding is to show at most three decimals since value can be long
    mouseOver = function mouseOver() {
      var cy = Math.round(1000*y.invert(d3.select(this).attr("cy")))/1000;
      d3.select("#hover-text").text(function () { return cy; })
          .style("display", "inline");
      // Also make selected point appear slightly larger
      d3.select(this).attr("r", 7)
          .moveToFront();
    };

    // Hide text area containing sentiment value
    mouseOut = function mouseOver() {
      d3.select("#hover-text").style("display", "none");
      // Reset size of circle
      d3.select(this).attr("r", function (d) {
        return circleScale(Math.abs(d[0]));
      });
    };

    // Show phrase corresponding to the data point below the graph
    // Note: Rounding is to prevent extra decimals that can appear from scaling
    mouseClick = function mouseClick() {
      var index = Math.round(new_x.invert(d3.select(this).attr("cx")));
      d3.select(this).attr("text", function (d) {
        return String(index + ": " + d[1]);
      });
      d3.select("#clicked-phrase")
          .text("Phrase " + d3.select(this).attr("text"))
          .style("display", "inline-block");
    };

    // Bind listener functions to all circle elements
    svg.selectAll("circle")
        .on("mouseover", mouseOver)
        .on("mouseout", mouseOut)
        .on("click", mouseClick);
  };

  return updateLineGraph;
}


/************************
 * Submit Button Handler
 ***********************/
$('#form-submit-button').click(function () {
  'use strict';

  // Ignore regular submit button function
  event.preventDefault();

  // Get user inputted video name and dropdown selection and
  // create a boolean that is true if live analysis is selected
  var videoName = $('#start-options input.video-name').val(),
    videoLink = $('#start-options input.video-link').val(),
    dictList = document.getElementById('dictionary-list'),
    chosenDictInfo = {
      'name': dictList[dictList.selectedIndex].value,
      'restricted': dictList[dictList.selectedIndex].getAttribute('restricted')
    },
    // Create initial line graph
    updateLineGraph = drawLineGraph();

  // Video name cannot be left blank for a live analysis
  if (videoName.trim() === '') {
    alert('Must type a video name or select an existing transcript!');
    return;
  }

  // Otherwise send information to speech function to handle
  speechDataOptions(
    chosenDictInfo,
    updateLineGraph,
    videoLink,
    videoName
  );

  // Hide start options and show control bar
  $('#start-options').hide();
  $('#control-bar').css('visibility', 'visible');

    // Set video link as source for video and load the video
    // Note: .smart() tries to create/use appropriate wrapper for video
    $video = Popcorn.smart('#main-video', videoLink);
    $video.load();

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
      // Make sure microphone permission is given before starting, in order to
      // avoid missed data
      navigator.webkitGetUserMedia({audio:true}, function () {
        $video.play();
      });
      recognition.start();
      videoPause = false;
    });

    $('#pause').click(function () {
      $video.pause();
      videoPause = true;
      recognition.stop();
    });

    /**********************************
     * Create Video listener functions
     *********************************/
    $video.on("ended", function () {
      videoEnd = true;
      recognition.stop();
    });

});

/**************************************
 * Show Full Transcript Button Handler
 *************************************/
$('#full-transcript-button').click(function () {
  'use strict';

  $('#full-transcript').toggle();
});
