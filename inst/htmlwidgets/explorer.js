HTMLWidgets.widget({

  name: 'explorer',

  type: 'output',

  factory: function(el, width, height) {

    // TODO: define shared variables for this instance

    return {

      renderValue: function(rSettings) {

        console.log(rSettings)

        el.innerHTML = "";


        jsSettings = rSettings["settings"]

        chart = webcodebook.createExplorer(el, jsSettings);
        chart.init();
      },

      resize: function(width, height) {

        // TODO: code to re-render the widget with a new size

      }

    };
  }
});
