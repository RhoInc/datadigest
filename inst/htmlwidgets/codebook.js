HTMLWidgets.widget({

  name: 'codebook',

  type: 'output',

  factory: function(el, width, height) {

    // TODO: define shared variables for this instance

    return {

      renderValue: function(rSettings) {

        console.log(rSettings)

        el.innerHTML = "<div class='codebook'></div>";

        rSettings.data = HTMLWidgets.dataframeToD3(rSettings.data);

        //coerce data to character before initializng chart (hacktastic bug fix)
        rSettings.data.forEach(function(row){
            var cols = Object.keys(row)
            cols.forEach(function(col){
              row[col] = ""+row[col]
            })
        })

        console.log(rSettings.data);

        chart = webcodebook.createChart('.codebook', {});
        chart.init(rSettings.data);
      },

      resize: function(width, height) {

        // TODO: code to re-render the widget with a new size

      }

    };
  }
});
