HTMLWidgets.widget({

  name: 'codebook',

  type: 'output',

  factory: function(el, width, height) {

    // TODO: define shared variables for this instance

    return {

      renderValue: function(x) {

        el.innerHTML = "";

        var settings = {};

        x.data = HTMLWidgets.dataframeToD3(x.data);

       // console.log(x.settings);

        webcodebook.createChart(el, settings).init(x.data);
      },

      resize: function(width, height) {

        // TODO: code to re-render the widget with a new size

      }

    };
  }
});
