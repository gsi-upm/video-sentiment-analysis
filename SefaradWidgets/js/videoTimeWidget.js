// New widget
var videoTimeWidget = {
  // Widget name.
  name: "Video Time",
  // Widget description.
  description: "Video Time",
  // Path to the image of the widget.
  img: "img/widgets/videoTimeWidget.png",
  // Type of the widget.
  type: "videoTime",
  // Help display on the widget
  help: "Video Time",
  // [OPTIONAL] data taken from this field.
  // field: "polarityValue",
  // Category of the widget (1: textFilter, 2: numericFilter, 3: graph, 5:results)
  cat: 2,


  render: function () {
    var id = 'A' + Math.floor(Math.random() * 10001);
    var field = videoTimeWidget.field || "";
    vm.activeWidgetsLeft.push({
      "id": ko.observable(id),
      "title": ko.observable(videoTimeWidget.name),
      "type": ko.observable(videoTimeWidget.type),
      "help": ko.observable(videoTimeWidget.help),
      "field": ko.observable(field),
      "collapsed": ko.observable(false),
      "showWidgetHelp": ko.observable(false)
    });

    videoTimeWidget.timebox(id);
  },

  paint: function (id) {

  },

  timebox: function (id) {
    'use strict';

    $('#' + id).html('<input id="time-box" type="text" placeholder="Jump to time: (seconds)"></input><input id="time-box-submit" type="submit" value="Submit"></input>');
    /*******************************************
    * Create handler for video seek
    ******************************************/
    $('#time-box-submit').click(function (event) {
      event.preventDefault();

      var newTime = +$('#time-box').val();

      // Do nothing if a number wasn't provided or time exceeds video length
      if (!isNaN(newTime) && newTime <= videoWidget.$video.duration()) {
        prevTime = Math.round(videoWidget.$video.currentTime());
        console.log('Prev Time:', prevTime, 'New Time:', newTime);
        videoWidget.$video.currentTime(newTime);
      }
    });
  }
};
