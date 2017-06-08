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

        //coerce data to character before initializng chart (hacktastic bug fix)
        x.data.forEach(function(row){
            var cols = Object.keys(row)
            cols.forEach(function(col){
              row[col] = ""+row[col]
            })
        })
        
        console.log(x.data);

        chart = webcodebook.createChart(el, settings);
        chart.init(x.data);
      },

      resize: function(width, height) {

        // TODO: code to re-render the widget with a new size

      }

    };
  }
});
