// New widget
var videoDataWidget = {
  // Widget name.
  name: "Video Data",
  // Widget description.
  description: "Video Data",
  // Path to the image of the widget.
  img: "img/widgets/videoDataWidget.png",
  // Type of the widget.
  type: "videoData",
  // Help display on the widget
  help: "Video Data",
  // [OPTIONAL] data taken from this field.
  // field: "polarityValue",
  // Category of the widget (1: textFilter, 2: numericFilter, 3: graph, 5:results)
  cat: 3,


  render: function () {
    var id = 'A' + Math.floor(Math.random() * 10001);
    var field = videoDataWidget.field || "";
    vm.activeWidgetsLeft.push({
      "id": ko.observable(id),
      "title": ko.observable(videoDataWidget.name),
      "type": ko.observable(videoDataWidget.type),
      "help": ko.observable(videoDataWidget.help),
      "field": ko.observable(field),
      "collapsed": ko.observable(false),
      "showWidgetHelp": ko.observable(false)
    });

    videoDataWidget.updateLineGraph = videoDataWidget.paint(id);

  },

  paint: function (id) {
    'use strict';

    $('#' + id).html('<div id="line-graph-box"><h2 class="title" id="line-graph-title">Phrase vs. Sentiment Progression</h2><p class="sentiment" id="hover-text"></p><p class="phrase" id="clicked-phrase"></p><svg class="graph" id="line-graph"></svg></div>')
    $('#' + id).append('<style>#line-graph-box{background:white;}#line-graph-box .graph{height:100%;width:100%}#line-graph-box .graph .axis line,#line-graph-box .graph .axis path{fill:none;stroke:black;shape-rendering:crispEdges}#line-graph-box .graph .line{fill:none;stroke:#0b6693;stroke-width:2px}#line-graph-box .phrase{color:#053349;display:none;font-size:.5em}#line-graph-box .sentiment{color:#0b6693;display:none;font-size:1.1em;margin:0 auto;padding-left:5%;position:relative;text-align:right;top:4px}#line-graph-box .title{color:#053349;display:inline;font-size:1.5em;padding-left:11%;position:relative;text-align:left;top:4px}</style>');

    /*******************************
    * Create initial D3 Line Graph
    ******************************/
    var path, line, svg, x, y,
      updateLineGraph,
      videoData = [],
      // Viewport dimensions for line graph (depend on video size)
      CONTAINER_DIMENSIONS = {
        width: 400,
        height: 100
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
      return this.each(function () {
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
            CONTAINER_DIMENSIONS.width + ' ' +
            CONTAINER_DIMENSIONS.height
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
      .attr('y', MARGIN.bottom - MARGIN.top)
      .style('font-size', '.9em');

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
      .style('font-size', '.9em');

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
};
