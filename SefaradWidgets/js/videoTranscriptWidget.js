// New widget
var videoTranscriptWidget = {
  // Widget name.
  name: "Video Transcript",
  // Widget description.
  description: "Video Transcript",
  // Path to the image of the widget.
  img: "img/widgets/videoTranscriptWidget.png",
  // Type of the widget.
  type: "videoTranscript",
  // Help display on the widget
  help: "Video Transcript",
  // [OPTIONAL] data taken from this field.
  // field: "polarityValue",
  // Category of the widget (1: textFilter, 2: numericFilter, 3: graph, 5:results)
  cat: 5,


  render: function () {
    var id = 'A' + Math.floor(Math.random() * 10001);
    var field = videoTranscriptWidget.field || "";
    vm.activeWidgetsLeft.push({
      "id": ko.observable(id),
      "title": ko.observable(videoTranscriptWidget.name),
      "type": ko.observable(videoTranscriptWidget.type),
      "help": ko.observable(videoTranscriptWidget.help),
      "field": ko.observable(field),
      "collapsed": ko.observable(false),
      "showWidgetHelp": ko.observable(false)
    });

    videoTranscriptWidget.transcript(id);
  },

  paint: function (id) {

  },

  transcript: function (id) {
    $('#' + id).html('<style>#full-transcript{height:90px;overflow-y:auto;resize:vertical}#full-transcript p{color:black;display:inline;float:right;height:100%;text-align:left;width:100%}</style><div id="full-transcript"><p></p></div>');
  }
};
