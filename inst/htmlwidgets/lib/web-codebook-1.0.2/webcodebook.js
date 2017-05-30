var webcodebook = (function (webcharts) {
'use strict';

/*------------------------------------------------------------------------------------------------\
  Initialize codebook
\------------------------------------------------------------------------------------------------*/

function init(data) {
  var settings = this.config;

  //create chart wrapper in specified div
  this.wrap = d3.select(this.element).append("div").attr("class", "web-codebook");

  //save raw data
  this.data.raw = data;
  this.data.filtered = data; //assume no filters active on init :/

  //settings and defaults
  this.util.setDefaults(this);
  this.layout();

  //prepare the data summaries
  this.data.makeSummary(this);

  //draw controls
  this.util.makeAutomaticFilters(this);
  this.util.makeAutomaticGroups(this);
  this.controls.init(this);

  //initialize and then draw the codebook
  this.summaryTable.draw(this);

  //initialize and then draw the data listing
  this.dataListing.init(this);
}

/*------------------------------------------------------------------------------------------------\
  Generate HTML containers.
\------------------------------------------------------------------------------------------------*/

function layout() {
  this.controls.wrap = this.wrap.append("div").attr("class", "controls");

  this.summaryTable.wrap = this.wrap.append("div").attr("class", "summaryTable").classed("hidden", false);

  this.summaryTable.summaryText = this.summaryTable.wrap.append("strong").attr("class", "summaryText");

  this.dataListing.wrap = this.wrap.append("div").attr("class", "dataListing").classed("hidden", true);
}

function init$1(codebook) {
  codebook.controls.wrap.attr("onsubmit", "return false;");
  codebook.controls.wrap.selectAll("*").remove(); //Clear controls.

  //Draw controls.
  codebook.controls.dataListingToggle.init(codebook);
  codebook.controls.groups.init(codebook);
  codebook.controls.chartToggle.init(codebook);
  codebook.controls.filters.init(codebook);
}

/*------------------------------------------------------------------------------------------------\
  Initialize custom controls.
\------------------------------------------------------------------------------------------------*/

//export function init(selector, data, vars, settings) {
function init$2(codebook) {
  //initialize the wrapper
  var selector = codebook.controls.wrap.append("div").attr("class", "custom-filters");

  //add a list of values to each filter object
  codebook.config.filters.forEach(function (e) {
    e.values = d3.nest().key(function (d) {
      return d[e.value_col];
    }).entries(codebook.data.raw).map(function (d) {
      return { value: d.key, selected: true };
    });
  });

  //Clear custom controls.
  selector.selectAll("ul.nav").remove();

  //Add filter controls.
  var filterList = selector.append("ul").attr("class", "nav");

  var filterItem = filterList.selectAll("li").data(codebook.config.filters).enter().append("li").attr("class", function (d) {
    return "custom-" + d.key + " filterCustom";
  });

  var filterLabel = filterItem.append("span").attr("class", "filterLabel");

  filterLabel.append("span").html(function (d) {
    return d.label || d.value_col;
  });

  var filterCustom = filterItem.append("select").attr("multiple", true);

  //Add data-driven filter options.
  var filterItems = filterCustom.selectAll("option").data(function (d) {
    return d.values;
  }).enter().append("option").html(function (d) {
    return d.value;
  }).attr("value", function (d) {
    return d.value;
  }).attr("selected", function (d) {
    return d.selected ? "selected" : null;
  });

  //Initialize event listeners
  filterCustom.on("change", function () {
    // flag the selected options in the config
    d3.select(this).selectAll("option").each(function (option_d) {
      option_d.selected = d3.select(this).property("selected");
    });

    //update the codebook
    codebook.data.filtered = codebook.data.makeFiltered(codebook.data.raw, codebook.config.filters);
    codebook.data.makeSummary(codebook);
    codebook.summaryTable.draw(codebook);
    codebook.dataListing.init(codebook);
  });
}

/*------------------------------------------------------------------------------------------------\
  Define filter controls object.
\------------------------------------------------------------------------------------------------*/

var filters = { init: init$2 };

/*------------------------------------------------------------------------------------------------\
  Initialize group controls.
\------------------------------------------------------------------------------------------------*/

function init$3(codebook) {
  if (codebook.config.groups.length > 0) {
    var selector = codebook.controls.wrap.append("div").attr("class", "group-select");

    selector.append("span").text("Group by");

    var groupSelect = selector.append("select");

    var groupLevels = d3.merge([["None"], codebook.config.groups.map(function (m) {
      return m.value_col;
    })]);

    groupSelect.selectAll("option").data(groupLevels).enter().append("option").text(function (d) {
      return d;
    });

    groupSelect.on("change", function () {
      if (this.value !== "None") codebook.config.group = this.value;else delete codebook.config.group;
      codebook.data.filtered = codebook.data.makeFiltered(codebook.data.raw, codebook.config.filters);
      codebook.data.makeSummary(codebook);
      codebook.summaryTable.draw(codebook);
    });
  }
}

/*------------------------------------------------------------------------------------------------\
  Define filter controls object.
\------------------------------------------------------------------------------------------------*/

var groups = { init: init$3 };

/*------------------------------------------------------------------------------------------------\
  Initialize custom controls.
\------------------------------------------------------------------------------------------------*/

//export function init(selector, data, vars, settings) {
function init$4(codebook) {
  //initialize the wrapper
  var selector = codebook.controls.wrap.append("div").attr("class", "chart-toggle");

  var showAllButton = selector.append("button").text("Show All Charts").on("click", function () {
    codebook.wrap.selectAll(".variable-row").classed("hiddenChart", false);
    codebook.wrap.selectAll(".row-toggle").html("&#9660;");
  });

  var hideAllButton = selector.append("button").text("Hide All Charts").on("click", function () {
    codebook.wrap.selectAll(".variable-row").classed("hiddenChart", true);
    codebook.wrap.selectAll(".row-toggle").html("&#9658;");
  });
}

/*------------------------------------------------------------------------------------------------\
  Define chart toggle object.
\------------------------------------------------------------------------------------------------*/

var chartToggle = { init: init$4 };

function init$5(codebook) {
  var container = codebook.controls.wrap.append("div").classed("data-listing-toggle", true).text(codebook.dataListing.wrap.style("display") === "none" ? "View data" : "View codebook");
  container.on("click", function () {
    if (codebook.dataListing.wrap.style("display") === "none") {
      codebook.dataListing.wrap.classed("hidden", false);
      codebook.summaryTable.wrap.classed("hidden", true);
      container.text("View codebook");
    } else {
      codebook.dataListing.wrap.classed("hidden", true);
      codebook.summaryTable.wrap.classed("hidden", false);
      container.text("View data");
    }
  });
}

/*------------------------------------------------------------------------------------------------\
  Define chart toggle object.
\------------------------------------------------------------------------------------------------*/

var dataListingToggle = { init: init$5 };

/*------------------------------------------------------------------------------------------------\
  Define controls object.
\------------------------------------------------------------------------------------------------*/

var controls = {
  init: init$1,
  filters: filters,
  groups: groups,
  chartToggle: chartToggle,
  dataListingToggle: dataListingToggle
};

/*------------------------------------------------------------------------------------------------\
  draw/update the summaryTable
\------------------------------------------------------------------------------------------------*/

function draw(codebook) {
  //update Summary Text
  codebook.summaryTable.updateSummaryText(codebook);

  //enter/update/exit for variableDivs
  //BIND the newest data
  var varRows = codebook.summaryTable.wrap.selectAll("div.variable-row").data(codebook.data.summary, function (d) {
    return d.value_col;
  });

  //ENTER
  varRows.enter().append("div").attr("class", function (d) {
    return "variable-row hiddenChart " + d.type;
  });

  //ENTER + Update
  varRows.each(codebook.summaryTable.renderRow);

  //EXIT
  varRows.exit().remove();
}

function makeTitle(d) {
  var wrap = d3.select(this);
  var titleDiv = wrap.append("div").attr("class", "var-name");
  var valuesList = wrap.append("ul").attr("class", "value-list");

  //Title and type
  titleDiv.append("div").attr("class", "name").html(function (d) {
    return d.value_col;
  });
  titleDiv.append("div").attr("class", "type").html(function (d) {
    return d.type;
  });

  //make a list of values
  if (d.type == "categorical") {
    //valuesList.append("span").text( "Values (Most Frequent):")
    var topValues = d.statistics.values.sort(function (a, b) {
      return b.n - a.n;
    }).filter(function (d, i) {
      return i < 5;
    });

    valuesList.selectAll("li").data(topValues).enter().append("li").text(function (d) {
      return d.key + " (" + d3.format("0.1%")(d.prop_n) + ")";
    }).attr("title", function (d) {
      return "n=" + d.n;
    }).style("cursor", "help");

    if (d.statistics.values.length > 5) {
      var totLength = d.statistics.values.length;
      var extraCount = totLength - 5;
      var extra_span = valuesList.append("span").html("and " + extraCount + " more.");
    }
  } else if (d.type == "continuous") {
    //valuesList.append("span").text( "Values (Most Frequent):"
    var sortedValues = d3.set(d.values).values() //get unique
    .map(function (d) {
      return +d;
    }) //convert to numeric
    .sort(function (a, b) {
      return a - b;
    }); // sort low to high

    var minValues = sortedValues.filter(function (d, i) {
      return i < 3;
    });
    var nValues = sortedValues.length;
    var maxValues = sortedValues.filter(function (d, i) {
      return i >= nValues - 3;
    });
    var valList = d3.merge([minValues, ["..."], maxValues]);

    valuesList.selectAll("li").data(valList).enter().append("li").text(function (d) {
      return d;
    }).attr("title", function (d) {
      return d == "..." ? nValues - 6 + " other values" : "";
    }).style("cursor", function (d) {
      return d == "..." ? "help" : null;
    });
  }
}

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};

function clone(obj) {
  var copy = void 0;

  //boolean, number, string, null, undefined
  if ("object" != (typeof obj === "undefined" ? "undefined" : _typeof(obj)) || null == obj) return obj;

  //date
  if (obj instanceof Date) {
    copy = new Date();
    copy.setTime(obj.getTime());
    return copy;
  }

  //array
  if (obj instanceof Array) {
    copy = [];
    for (var i = 0, len = obj.length; i < len; i++) {
      copy[i] = clone(obj[i]);
    }
    return copy;
  }

  //object
  if (obj instanceof Object) {
    copy = {};
    for (var attr in obj) {
      if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
    }
    return copy;
  }

  throw new Error("Unable to copy [obj]! Its type is not supported.");
}

function moveYaxis(chart) {
  var ticks = chart.wrap.selectAll("g.y.axis g.tick");
  ticks.select("text").remove();
  ticks.append("title").text(function (d) {
    return d;
  });
  ticks.append("text").attr({
    "text-anchor": "start",
    "alignment-baseline": "middle",
    dx: ".5em",
    x: chart.plot_width
  }).text(function (d) {
    return d3.format("%")(d);
  });
}

function makeTooltip(d, i, context) {
  var format = d3.format(context.config.measureFormat);
  d.selector = "bar" + i;
  //Define tooltips.
  var tooltip = context.svg.append("g").attr("id", d.selector);
  var text = tooltip.append("text").attr({
    id: "text",
    x: context.x(d.key),
    y: context.plot_height,
    dy: "-.75em",
    "font-size": "75%",
    "font-weight": "bold",
    fill: "white"
  });
  text.append("tspan").attr({
    x: context.x(d.key),
    dx: context.x(d.key) < context.plot_width / 2 ? "1em" : "-1em",
    "text-anchor": context.x(d.key) < context.plot_width / 2 ? "start" : "end"
  }).text("" + d.key);
  text.append("tspan").attr({
    x: context.x(d.key),
    dx: context.x(d.key) < context.plot_width / 2 ? "1em" : "-1em",
    dy: "-1.5em",
    "text-anchor": context.x(d.key) < context.plot_width / 2 ? "start" : "end"
  }).text("n=" + d.values.raw[0].n + " (" + d3.format("0.1%")(d.total) + ")");
  var dimensions = text[0][0].getBBox();
  tooltip.classed("svg-tooltip", true); //have to run after .getBBox() in FF/EI since this sets display:none

  var background = tooltip.append("rect").attr({
    id: "background",
    x: dimensions.x - 5,
    y: dimensions.y - 2,
    width: dimensions.width + 10,
    height: dimensions.height + 4
  }).style({
    fill: "black",
    stroke: "white"
  });
  tooltip[0][0].insertBefore(background[0][0], text[0][0]);
}

function onResize() {
  var context = this;

  moveYaxis(this);
  //remove x-axis text
  var ticks = this.wrap.selectAll("g.x.axis g.tick");
  ticks.select("text").remove();
  this.svg.selectAll("g.bar-group").each(function (d, i) {
    makeTooltip(d, i, context);
  });

  //Add modal to nearest mark.
  var bars = this.svg.selectAll(".bar-group");
  var tooltips = this.svg.selectAll(".svg-tooltip");
  var statistics = this.svg.selectAll(".statistic");
  this.svg.on("mousemove", function () {
    //Highlight closest bar.
    var mouse = d3.mouse(this);
    var x = mouse[0];
    var y = mouse[1];
    var minimum = void 0;
    var bar = {};
    bars.each(function (d, i) {
      d.distance = Math.abs(context.x(d.key) - x);
      if (i === 0 || d.distance < minimum) {
        minimum = d.distance;
        bar = d;
      }
    });
    var closest = bars.filter(function (d) {
      return d.distance === minimum;
    }).filter(function (d, i) {
      return i === 0;
    }).select("rect").style("fill", "#7BAFD4");

    //Activate tooltip.
    var d = closest.datum();
    tooltips.classed("active", false);
    context.svg.select("#" + d.selector).classed("active", true);
  }).on("mouseout", function () {
    bars.select("rect").style("fill", "#999");
    context.svg.selectAll("g.svg-tooltip").classed("active", false);
  });
}

function onInit() {
  //Add group labels.
  var chart = this;
  if (this.config.group_col) {
    var groupTitle = this.wrap.append("p").attr("class", "panel-label").style("margin-left", chart.config.margin.left + "px").text(this.config.group_col + ": " + this.config.group_val + " (n=" + this.config.n + ")");
    this.wrap.node().parentNode.insertBefore(groupTitle.node(), this.wrap.node());
  }
}

function axisSort(a, b, type) {
  var alpha = a.key < b.key ? -1 : 1;
  if (type == "Alphabetical") {
    return alpha;
  } else if (type == "Descending") {
    return a.prop_n > b.prop_n ? -2 : a.prop_n < b.prop_n ? 2 : alpha;
  } else if (type == "Ascending") {
    return a.prop_n > b.prop_n ? 2 : a.prop_n < b.prop_n ? -2 : alpha;
  }
}

function createVerticalBars(this_, d) {
  var chartContainer = d3.select(this_).node();
  var rowSelector = d3.select(this_).node().parentNode;
  var sortType = d3.select(rowSelector).select(".row-controls").select("select").property("value");
  var chartSettings = {
    y: {
      column: "prop_n",
      type: "linear",
      label: "",
      format: "0.1%",
      domain: [0, null]
    },
    x: {
      column: "key",
      type: "ordinal",
      label: ""
    },
    marks: [{
      type: "bar",
      per: ["key"],
      summarizeX: "mean",
      attributes: {
        stroke: null,
        fill: "#999"
      }
    }],
    gridlines: "",
    resizable: false,
    height: this_.height,
    margin: this_.margin,
    value_col: d.value_col,
    group_col: d.group || null,
    overall: d.statistics.values,
    sort: sortType //Alphabetical, Ascending, Descending
  };

  chartSettings.margin.bottom = 10;

  var chartData = d.statistics.values.sort(function (a, b) {
    return axisSort(a, b, chartSettings.sort);
  });

  chartSettings.x.order = chartData.map(function (d) {
    return d.key;
  });
  var x_dom = chartData.map(function (d) {
    return d.key;
  });

  if (d.groups) {
    //Set upper limit of y-axis domain to the maximum group rate.
    chartSettings.y.domain[1] = d3.max(d.groups, function (di) {
      return d3.max(di.statistics.values, function (dii) {
        return dii.prop_n;
      });
    });

    chartSettings.x.domain = x_dom; //use the overall x domain in paneled charts
    d.groups.forEach(function (group) {
      //Define group-level settings.
      group.chartSettings = clone(chartSettings);
      group.chartSettings.group_val = group.group;
      group.chartSettings.n = group.values.length;

      //Sort data by descending rate and keep only the first five categories.
      group.data = group.statistics.values;

      //Define chart.
      group.chart = webCharts.createChart(chartContainer, group.chartSettings);
      group.chart.on("init", onInit);
      group.chart.on("resize", onResize);

      if (group.data.length) group.chart.init(group.data);else {
        d3.select(chartContainer).append("p").text(chartSettings.group_col + ": " + group.chartSettings.group_val + " (n=" + group.chartSettings.n + ")");

        d3.select(chartContainer).append("div").html("<em>No data available for this level.</em>.<br><br>");
      }
    });
  } else {
    //Define chart.
    var chart = webCharts.createChart(chartContainer, chartSettings);
    chart.on("init", onInit);
    chart.on("resize", onResize);
    chart.init(chartData);
  }
}

function createVerticalBarsControls(this_, d) {
  var sort_values = ["Alphabetical", "Ascending", "Descending"];
  var wrap = d3.select(this_).append("div").attr("class", "row-controls");
  wrap.append("small").text("Sort levels: ");
  var x_sort = wrap.append("select");
  x_sort.selectAll("option").data(sort_values).enter().append("option").text(function (d) {
    return d;
  });

  x_sort.on("change", function () {
    d3.select(this_).selectAll(".wc-chart").remove();
    d3.select(this_).selectAll(".panel-label").remove();
    createVerticalBars(this_, d);
  });
}

function onInit$1() {
  //Add group labels.
  var chart = this;
  if (this.config.group_col) {
    var groupTitle = this.wrap.append("p").attr("class", "panel-label").style("margin-left", chart.config.margin.left + "px").text(this.config.group_col + ": " + this.config.group_val + " (n=" + this.config.n + ")");
    this.wrap.node().parentNode.insertBefore(groupTitle.node(), this.wrap.node());
  }
}

function moveYaxis$1(chart) {
  var ticks = chart.wrap.selectAll("g.y.axis g.tick");
  ticks.select("text").remove();
  ticks.append("title").text(function (d) {
    return d;
  });
  ticks.append("text").attr({
    "text-anchor": "start",
    "alignment-baseline": "middle",
    dx: "2.5em",
    x: chart.plot_width
  }).text(function (d) {
    return d.length < 25 ? d : d.substring(0, 25) + "...";
  });
}

function drawOverallMark(chart) {
  //Clear overall marks.
  chart.svg.selectAll(".overall-mark").remove();

  //For each mark draw an overall mark.
  chart.config.overall.forEach(function (d) {
    if (chart.config.y.order.indexOf(d.key) > -1) {
      var g = chart.svg.append("g").classed("overall-mark", true);
      var x = d.prop_n;
      var y = d.key;

      //Draw vertical line representing the overall rate of the current categorical value.
      if (chart.y(y)) {
        var rateLine = g.append("line").attr({
          x1: chart.x(x),
          y1: chart.y(y),
          x2: chart.x(x),
          y2: chart.y(y) + chart.y.rangeBand()
        }).style({
          stroke: "black",
          "stroke-width": "2px",
          "stroke-opacity": "1"
        });
        rateLine.append("title").text("Overall rate: " + d3.format(".1%")(x));
      }
    }
  });
}

function drawDifferences(chart) {
  //Clear difference marks and annotations.
  chart.svg.selectAll(".difference-from-total").remove();

  //For each mark draw a difference mark and annotation.
  chart.current_data.forEach(function (d) {
    var overall = chart.config.overall.filter(function (di) {
      return di.key === d.key;
    })[0],
        g = chart.svg.append("g").classed("difference-from-total", true).style("display", "none"),
        x = overall.prop_n,
        y = overall.key;

    //Draw line from overall rate to group rate.
    var diffLine = g.append("line").attr({
      x1: chart.x(x),
      y1: chart.y(y) + chart.y.rangeBand() / 2,
      x2: chart.x(d.total),
      y2: chart.y(y) + chart.y.rangeBand() / 2
    }).style({
      stroke: "black",
      "stroke-width": "2px",
      "stroke-opacity": ".25"
    });
    diffLine.append("title").text("Difference from overall rate: " + d3.format(".1f")((d.total - x) * 100));
    var diffText = g.append("text").attr({
      x: chart.x(d.total),
      y: chart.y(y) + chart.y.rangeBand() / 2,
      dx: x < d.total ? "5px" : "-2px",
      "text-anchor": x < d.total ? "beginning" : "end",
      "font-size": "0.7em"
    }).text("" + (x < d.total ? "+" : x > d.total ? "-" : "") + d3.format(".1f")(Math.abs(d.total - x) * 100));
  });

  //Display difference from total on hover.
  chart.svg.on("mouseover", function () {
    chart.svg.selectAll(".difference-from-total").style("display", "block");
    chart.svg.selectAll(".difference-from-total text").each(function () {
      d3.select(this).attr("dy", this.getBBox().height / 4);
    });
  }).on("mouseout", function () {
    return chart.svg.selectAll(".difference-from-total").style("display", "none");
  });
}

function onResize$1() {
  moveYaxis$1(this);
  drawOverallMark(this);
  if (this.config.group_col) drawDifferences(this);
}

function createHorizontalBars(this_, d) {
  //hide the controls if the chart isn't Grouped
  var rowSelector = d3.select(this_).node().parentNode;
  var chartControls = d3.select(rowSelector).select(".row-controls").classed("hidden", !d.groups);

  //let height vary based on the number of levels
  var custom_height = d.statistics.values.length * 20 + 35; //35 ~= top and bottom margin

  //Chart settings
  var chartContainer = d3.select(this_).node();
  var chartSettings = {
    x: {
      column: "prop_n",
      type: "linear",
      label: "",
      format: "%",
      domain: [0, null]
    },
    y: {
      column: "key",
      type: "ordinal",
      label: ""
    },
    marks: [{
      type: "bar",
      per: ["key"],
      summarizeX: "mean",
      tooltip: "[key]: [n] ([prop_n_text])",
      attributes: {
        stroke: null
      }
    }],
    colors: ["#999", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99"],
    gridlines: "xy",
    resizable: false,
    height: custom_height,
    margin: this_.margin,
    value_col: d.value_col,
    group_col: d.group || null,
    overall: d.statistics.values
  };

  //Sort data by descending rate and keep only the first five categories.
  var chartData = d.statistics.values.sort(function (a, b) {
    return a.prop_n > b.prop_n ? -2 : a.prop_n < b.prop_n ? 2 : a.key < b.key ? -1 : 1;
  });

  chartSettings.y.order = chartData.map(function (d) {
    return d.key;
  }).reverse();

  if (d.groups) {
    //Set upper limit of x-axis domain to the maximum group rate.
    chartSettings.x.domain[1] = d3.max(d.groups, function (di) {
      return d3.max(di.statistics.values, function (dii) {
        return dii.prop_n;
      });
    });

    d.groups.forEach(function (group) {
      //Define group-level settings.
      group.chartSettings = clone(chartSettings);
      group.chartSettings.group_val = group.group;
      group.chartSettings.n = group.values.length;

      //Sort data by descending rate and keep only the first five categories.
      group.data = group.statistics.values.filter(function (di) {
        return chartSettings.y.order.indexOf(di.key) > -1;
      }).sort(function (a, b) {
        return a.prop_n > b.prop_n ? -2 : a.prop_n < b.prop_n ? 2 : a.key < b.key ? -1 : 1;
      });

      //Define chart.
      group.chart = webCharts.createChart(chartContainer, group.chartSettings);
      group.chart.on("init", onInit$1);
      group.chart.on("resize", onResize$1);

      if (group.data.length) group.chart.init(group.data);else {
        d3.select(chartContainer).append("p").text(chartSettings.group_col + ": " + group.chartSettings.group_val + " (n=" + group.chartSettings.n + ")");
        d3.select(chartContainer).append("div").html("<em>This group does not contain any of the first 5 most prevalent levels of " + d.value_col + "</em>.<br><br>");
      }
    });
  } else {
    //Define chart.
    var chart = webCharts.createChart(chartContainer, chartSettings);
    chart.on("init", onInit$1);
    chart.on("resize", onResize$1);
    chart.init(chartData);
  }
}

function moveYaxis$2(chart) {
  var ticks = chart.wrap.selectAll("g.y.axis g.tick");
  ticks.select("text").remove();
  ticks.append("title").text(function (d) {
    return d;
  });
  ticks.append("text").attr({
    "text-anchor": "start",
    "alignment-baseline": "middle",
    dx: "1em",
    x: chart.plot_width
  }).text(function (d) {
    return d.length < 30 ? d : d.substring(0, 30) + "...";
  });
}

function drawOverallMark$1(chart) {
  //Clear overall marks.
  chart.svg.selectAll(".overall-mark").remove();

  //For each mark draw an overall mark.
  chart.config.overall.forEach(function (d) {
    if (chart.config.y.order.indexOf(d.key) > -1) {
      var g = chart.svg.append("g").classed("overall-mark", true);
      var x = d.prop_n;
      var y = d.key;

      //Draw vertical line representing the overall rate of the current categorical value.
      if (chart.y(y)) {
        var rateLine = g.append("line").attr({
          x1: chart.x(x),
          y1: chart.y(y),
          x2: chart.x(x),
          y2: chart.y(y) + chart.y.rangeBand()
        }).style({
          stroke: "black",
          "stroke-width": "2px",
          "stroke-opacity": "1"
        });
        rateLine.append("title").text("Overall rate: " + d3.format(".1%")(x));
      }
    }
  });
}

function modifyOverallLegendMark(chart) {
  var legendItems = chart.wrap.selectAll(".legend-item"),
      overallMark = legendItems.filter(function (d) {
    return d.label === "Overall";
  }).select("svg"),
      BBox = overallMark.node().getBBox();
  overallMark.select(".legend-mark").remove();
  overallMark.append("line").classed("legend-mark", true).attr({
    x1: 3 * BBox.width / 4,
    y1: 0,
    x2: 3 * BBox.width / 4,
    y2: BBox.height
  }).style({
    stroke: "black",
    "stroke-width": "2px",
    "stroke-opacity": "1"
  });
  legendItems.selectAll("circle").attr("r", ".4em");
}

function onResize$2() {
  moveYaxis$2(this);
  drawOverallMark$1(this);
  if (this.config.color_by) modifyOverallLegendMark(this);

  //Hide overall dots.
  if (this.config.color_by) this.svg.selectAll(".Overall").remove();else this.svg.selectAll(".point").remove();
}

function createDotPlot(this_, d) {
  var chartContainer = d3.select(this_).node();
  var chartSettings = {
    x: {
      column: "prop_n",
      type: "linear",
      label: "",
      format: "%",
      domain: [0, null]
    },
    y: {
      column: "key",
      type: "ordinal",
      label: ""
    },
    marks: [{
      type: "circle",
      per: ["key"],
      summarizeX: "mean",
      tooltip: "[key]: [n] ([prop_n_text])"
    }],
    gridlines: "xy",
    resizable: false,
    height: this_.height,
    margin: this_.margin,
    value_col: d.value_col,
    group_col: d.group || null,
    overall: d.statistics.values
  };

  //Sort data by descending rate and keep only the first five categories.
  var chartData = d.statistics.values.sort(function (a, b) {
    return a.prop_n > b.prop_n ? -2 : a.prop_n < b.prop_n ? 2 : a.key < b.key ? -1 : 1;
  }).slice(0, 5);
  chartSettings.y.order = chartData.map(function (d) {
    return d.key;
  }).reverse();

  if (d.groups) {
    //Define overall data.
    chartData.forEach(function (di) {
      return di.group = "Overall";
    });

    //Add group data to overall data.
    d.groups.forEach(function (group) {
      group.statistics.values.filter(function (value) {
        return chartSettings.y.order.indexOf(value.key) > -1;
      }).sort(function (a, b) {
        return a.prop_n > b.prop_n ? -2 : a.prop_n < b.prop_n ? 2 : a.key < b.key ? -1 : 1;
      }).forEach(function (value) {
        value.group = group.group;
        chartData.push(value);
      });
    });

    //Overall mark
    chartSettings.marks[0].per.push("group");
    chartSettings.marks[0].values = { group: ["Overall"] };

    //Group marks
    chartSettings.marks[1] = clone(chartSettings.marks[0]);
    chartSettings.marks[1].values = { group: d.groups.map(function (d) {
        return d.group;
      }) };

    chartSettings.color_by = "group";
    chartSettings.legend = {
      label: "",
      order: d.groups.map(function (d) {
        return d.group;
      }),
      mark: "circle"
    };
  }

  var chart = webCharts.createChart(chartContainer, chartSettings);
  chart.on("resize", onResize$2);
  chart.init(chartData);
}

function createHorizontalBarsControls(this_, d) {
  var chart_type_values = ["Paneled (Bar Charts)", "Grouped (Dot Plot)"];
  var wrap = d3.select(this_).append("div").attr("class", "row-controls");
  wrap.append("small").text("Display Type: ");
  var type_control = wrap.append("select");
  type_control.selectAll("option").data(chart_type_values).enter().append("option").text(function (d) {
    return d;
  });

  type_control.on("change", function () {
    d3.select(this_).selectAll(".wc-chart").remove();
    d3.select(this_).selectAll(".panel-label").remove();
    if (this.value == "Paneled (Bar Charts)") {
      createHorizontalBars(this_, d);
    } else {
      createDotPlot(this_, d);
    }
  });
}

if (typeof Object.assign != "function") {
  (function () {
    Object.assign = function (target) {
      "use strict";

      if (target === undefined || target === null) throw new TypeError("Cannot convert undefined or null to object");

      var output = Object(target);

      for (var index = 1; index < arguments.length; index++) {
        var source = arguments[index];

        if (source !== undefined && source !== null) {
          for (var nextKey in source) {
            if (source.hasOwnProperty(nextKey)) output[nextKey] = source[nextKey];
          }
        }
      }

      return output;
    };
  })();
}

var defaultSettings = //Custom settings
{
  measure: null,
  panel: null,
  measureFormat: ",.2f",
  boxPlot: true,
  nBins: null,
  mean: true,
  overall: false,
  boxPlotHeight: 20,

  //Webcharts settings
  x: {
    column: null, // set in syncSettings()
    type: "linear",
    label: "",
    bin: null
  }, // set in syncSettings()
  y: {
    column: null, // set in syncSettings()
    type: "linear",
    label: "",
    domain: [0, null]
  },
  marks: [{
    type: "bar",
    per: null, // set in syncSettings()
    summarizeX: "mean",
    summarizeY: "count",
    attributes: {
      fill: "#999",
      stroke: "#333",
      "stroke-width": "2px"
    }
  }],
  gridlines: "y",
  resizable: true,
  aspect: 12,
  margin: {
    right: 25,
    left: 100
  } // space for panel value
};

//Replicate settings in multiple places in the settings object.
function syncSettings(settings) {
  var syncedSettings = clone(settings);

  if (syncedSettings.panel === null) syncedSettings.overall = true;
  syncedSettings.x.column = settings.measure;
  syncedSettings.x.bin = settings.nBins;
  syncedSettings.y.column = settings.measure;
  syncedSettings.y.label = settings.measure;
  syncedSettings.marks[0].per = [settings.measure];
  syncedSettings.margin.bottom = settings.boxPlotHeight + 20;
  return syncedSettings;
}

function makeTooltip$1(d, i, context) {
  var format = d3.format(context.config.measureFormat);
  d.midpoint = (d.rangeHigh + d.rangeLow) / 2;
  d.range = format(d.rangeLow) + "-" + format(d.rangeHigh);
  d.selector = "bar" + i;
  //Define tooltips.
  var tooltip = context.svg.append("g").attr("id", d.selector);
  var text = tooltip.append("text").attr({
    id: "text",
    x: context.x(d.midpoint),
    y: context.plot_height,
    dy: "-.75em",
    "font-size": "75%",
    "font-weight": "bold",
    fill: "white"
  });
  text.append("tspan").attr({
    x: context.x(d.midpoint),
    dx: context.x(d.midpoint) < context.plot_width / 2 ? "1em" : "-1em",
    "text-anchor": context.x(d.midpoint) < context.plot_width / 2 ? "start" : "end"
  }).text("Range: " + d.range);
  text.append("tspan").attr({
    x: context.x(d.midpoint),
    dx: context.x(d.midpoint) < context.plot_width / 2 ? "1em" : "-1em",
    dy: "-1.5em",
    "text-anchor": context.x(d.midpoint) < context.plot_width / 2 ? "start" : "end"
  }).text("n: " + d.total);
  var dimensions = text[0][0].getBBox();
  tooltip.classed("svg-tooltip", true); //have to run after .getBBox() in FF/EI since this sets display:none

  var background = tooltip.append("rect").attr({
    id: "background",
    x: dimensions.x - 5,
    y: dimensions.y - 2,
    width: dimensions.width + 10,
    height: dimensions.height + 4
  }).style({
    fill: "black",
    stroke: "white"
  });
  tooltip[0][0].insertBefore(background[0][0], text[0][0]);
}

function moveYaxis$3(chart) {
  var ticks = chart.wrap.selectAll("g.y.axis g.tick");
  ticks.select("text").remove();
  ticks.append("title").text(function (d) {
    return d;
  });
  ticks.append("text").attr({
    "text-anchor": "start",
    "alignment-baseline": "middle",
    dx: ".5em",
    x: chart.plot_width
  }).text(function (d) {
    return d;
  });
}

function onResize$3() {
  var context = this;
  var format = d3.format(this.config.measureFormat);

  moveYaxis$3(this);

  //Hide overall plot if [settings.overall] is set to false.
  if (!this.config.overall && !this.group) this.wrap.style("display", "none");else {
    //Clear custom marks.
    this.svg.selectAll("g.svg-tooltip").remove();
    this.svg.selectAll(".statistic").remove();

    this.svg.selectAll("g.bar-group").each(function (d, i) {
      makeTooltip$1(d, i, context);
    });

    //Annotate quantiles
    if (this.config.boxPlot) {
      var quantiles = [{ probability: 0.05, label: "5th percentile" }, { probability: 0.25, label: "1st quartile" }, { probability: 0.50, label: "Median" }, { probability: 0.75, label: "3rd quartile" }, { probability: 0.95, label: "95th percentile" }];

      for (var item in quantiles) {
        var quantile = quantiles[item];
        quantile.quantile = d3.quantile(this.values, quantile.probability);

        //Horizontal lines
        if ([0.05, 0.75].indexOf(quantile.probability) > -1) {
          var rProbability = quantiles[+item + 1].probability;
          var rQuantile = d3.quantile(this.values, rProbability);
          var whisker = this.svg.append("line").attr({
            class: "statistic",
            x1: this.x(quantile.quantile),
            y1: this.plot_height + this.config.boxPlotHeight / 2,
            x2: this.x(rQuantile),
            y2: this.plot_height + this.config.boxPlotHeight / 2
          }).style({
            stroke: "red",
            "stroke-width": "2px",
            opacity: 0.25
          });
          whisker.append("title").text("Q" + quantile.probability + "-Q" + rProbability + ": " + format(quantile.quantile) + "-" + format(rQuantile));
        }

        //Box
        if (quantile.probability === 0.25) {
          var q3 = d3.quantile(this.values, 0.75);
          var interQ = this.svg.append("rect").attr({
            class: "statistic",
            x: this.x(quantile.quantile),
            y: this.plot_height,
            width: this.x(q3) - this.x(quantile.quantile),
            height: this.config.boxPlotHeight
          }).style({
            fill: "#7BAFD4",
            opacity: 0.25
          });
          interQ.append("title").text("Interquartile range: " + format(quantile.quantile) + "-" + format(q3));
        }

        //Vertical lines
        quantile.mark = this.svg.append("line").attr({
          class: "statistic",
          x1: this.x(quantile.quantile),
          y1: this.plot_height,
          x2: this.x(quantile.quantile),
          y2: this.plot_height + this.config.boxPlotHeight
        }).style({
          stroke: [0.05, 0.95].indexOf(quantile.probability) > -1 ? "red" : [0.25, 0.75].indexOf(quantile.probability) > -1 ? "blue" : "black",
          "stroke-width": "3px"
        });
        quantile.mark.append("title").text(quantile.label + ": " + format(quantile.quantile));
      }
    }

    //Annotate mean.
    if (this.config.mean) {
      var mean = d3.mean(this.values);
      var sd = d3.deviation(this.values);
      var meanMark = this.svg.append("circle").attr({
        class: "statistic",
        cx: this.x(mean),
        cy: this.plot_height + this.config.boxPlotHeight / 2,
        r: this.config.boxPlotHeight / 3
      }).style({
        fill: "#ccc",
        stroke: "black",
        "stroke-width": "1px"
      });
      meanMark.append("title").text("n: " + this.values.length + "\nMean: " + format(mean) + "\nSD: " + format(sd));
    }

    //Rotate y-axis labels.

    this.svg.select("g.y.axis text.axis-title").remove();
    /*
    this.svg
      .select("g.y.axis")
      .insert("text", ":first-child")
      .attr({
        class: "axis-title",
        x: this.plot_width,
        y: this.plot_height / 2,
        dx: "1em"
      })
      .style("text-anchor", "start")
      .text(
        this.group
          ? "Level: " +
              this.config.y.label +
              " \n(n=" +
              this.values.length +
              ")"
          : ""
      );
    */
    //Hide legends.
    this.wrap.select("ul.legend").remove();

    //Shift x-axis tick labels downward.
    var yticks = this.svg.select(".x.axis").selectAll("g.tick");
    yticks.select("text").remove();
    yticks.append("text").attr("y", context.config.boxPlotHeight).attr("dy", "1em").attr("x", 0).attr("text-anchor", "middle").attr("alignment-baseline", "top").text(function (d) {
      return d;
    });

    //Add modal to nearest mark.
    var bars = this.svg.selectAll(".bar-group");
    var tooltips = this.svg.selectAll(".svg-tooltip");
    var statistics = this.svg.selectAll(".statistic");
    this.svg.on("mousemove", function () {
      //Highlight closest bar.
      var mouse = d3.mouse(this);
      var x = context.x.invert(mouse[0]);
      var y = context.y.invert(mouse[1]);
      var minimum = void 0;
      var bar = {};
      bars.each(function (d, i) {
        d.distance = Math.abs(d.midpoint - x);
        if (i === 0 || d.distance < minimum) {
          minimum = d.distance;
          bar = d;
        }
      });
      var closest = bars.filter(function (d) {
        return d.distance === minimum;
      }).filter(function (d, i) {
        return i === 0;
      }).select("rect").style("fill", "#7BAFD4");

      //Activate tooltip.
      var d = closest.datum();
      tooltips.classed("active", false);
      context.svg.select("#" + d.selector).classed("active", true);
    }).on("mouseout", function () {
      bars.select("rect").style("fill", "#999");
      context.svg.selectAll("g.svg-tooltip").classed("active", false);
    });
  }
}

function onInit$2() {
  var context = this;
  var config = this.initialSettings;
  var measure = config.measure;
  var panel = config.panel;

  //Add a label
  if (this.group) {
    var groupTitle = this.wrap.append("p").attr("class", "panel-label").style("margin-left", context.config.margin.left + "px").text("Group: " + this.group + " (n=" + this.raw_data.length + ")");
    this.wrap.node().parentNode.insertBefore(groupTitle.node(), this.wrap.node());
  }

  //Remove non-numeric and missing values.
  if (!this.group) {
    this.initialSettings.unfilteredData = this.raw_data;
    this.raw_data = this.initialSettings.unfilteredData.filter(function (d) {
      return !isNaN(+d[measure]) && !/^\s*$/.test(d[measure]);
    });
  }

  //Create array of values.
  this.values = this.raw_data.map(function (d) {
    return +d[measure];
  }).sort(function (a, b) {
    return a - b;
  });

  //Define x-axis domain as the range of the measure, regardless of subgrouping.
  if (!this.initialSettings.xDomain) {
    this.initialSettings.xDomain = d3.extent(this.values);
    config.xDomain = this.initialSettings.xDomain;
  }
  this.config.x.domain = this.initialSettings.xDomain;

  /**-------------------------------------------------------------------------------------------\
      Paneling
    \-------------------------------------------------------------------------------------------**/

  if (panel && !this.group) {
    //Nest data by paneling variable to efine y-axis domain as the maximum number of observations
    //in a single bin within a subgrouping.
    var max = 0;
    if (!config.y.domain[1]) {
      var nestedData = d3.nest().key(function (d) {
        return d[panel];
      }).entries(context.raw_data);
      nestedData.forEach(function (group) {
        var domain = d3.extent(group.values, function (d) {
          return +d[measure];
        });
        var binWidth = (domain[1] - domain[0]) / config.nBins;
        group.values.forEach(function (d) {
          d.bin = Math.floor((+d[measure] - domain[0]) / binWidth) - (+d[measure] === domain[1]) * 1;
        });
        var bins = d3.nest().key(function (d) {
          return d.bin;
        }).rollup(function (d) {
          return d.length;
        }).entries(group.values);
        max = Math.max(max, d3.max(bins, function (d) {
          return d.values;
        }));
      });
    }

    //Plot the chart for each group.
    var groups = d3.set(context.raw_data.map(function (d) {
      return d[panel];
    })).values().map(function (d) {
      return { group: d };
    }).sort(function (a, b) {
      return a.group < b.group ? -1 : 1;
    });
    groups.forEach(function (group, i) {
      group.settings = clone(config);
      group.settings.y.label = group.group;
      group.settings.y.domain = [0, max];
      group.data = context.raw_data.filter(function (d) {
        return d[panel] === group.group;
      });
      group.webChart = new webCharts.createChart(config.container, group.settings);
      group.webChart.initialSettings = group.settings;
      group.webChart.group = group.group;
      group.webChart.on("init", onInit$2);
      group.webChart.on("resize", onResize$3);
      group.webChart.init(group.data);
    });
  }
}

function defineHistogram(element, settings) {
  //Merge specified settings with default settings.
  var mergedSettings = Object.assign({}, defaultSettings, settings);

  //Sync properties within merged settings.
  var syncedSettings = syncSettings(mergedSettings);

  //Sync control inputs with merged settings.
  //let syncedControlInputs = syncControlInputs(controlInputs, mergedSettings);
  //let controls = createControls(element, {location: 'top', inputs: syncedControlInputs});

  //Define chart.
  var chart = webcharts.createChart(element, syncedSettings); // Add third argument to define controls as needed.
  chart.initialSettings = clone(syncedSettings);
  chart.initialSettings.container = element;
  chart.on("init", onInit$2);
  chart.on("resize", onResize$3);

  return chart;
}

function createHistogramBoxPlot(this_, d) {
  var chartContainer = d3.select(this_).node();
  var chartSettings = {
    measure: " ",
    resizable: false,
    height: 100,
    margin: this_.margin,
    nBins: d.bins
  };
  var chartData = [];

  if (d.groups) {
    chartSettings.panel = "group";
    d.groups.forEach(function (group) {
      group.values.forEach(function (value) {
        chartData.push({ group: group.group || "<no value>", " ": value });
      });
    });
  } else {
    d.values.forEach(function (d) {
      chartData.push({ " ": d });
    });
  }

  var chart = defineHistogram(chartContainer, chartSettings);
  chart.init(chartData);
}

/*------------------------------------------------------------------------------------------------\
  Define controls object.
\------------------------------------------------------------------------------------------------*/

var charts = {
  createVerticalBars: createVerticalBars,
  createVerticalBarsControls: createVerticalBarsControls,
  createHorizontalBars: createHorizontalBars,
  createHorizontalBarsControls: createHorizontalBarsControls,
  createHistogramBoxPlot: createHistogramBoxPlot,
  createDotPlot: createDotPlot
};

function makeChart(d) {
  //Common chart settings
  this.height = 100;
  this.margin = { right: 200, left: 30 };

  if (d.chartType === "horizontalBars") {
    charts.createHorizontalBarsControls(this, d);
    charts.createHorizontalBars(this, d);
  } else if (d.chartType === "verticalBars") {
    charts.createVerticalBarsControls(this, d);
    charts.createVerticalBars(this, d);
  } else if (d.chartType === "histogramBoxPlot") {
    // continuous outcomes
    charts.createHistogramBoxPlot(this, d);
  } else {
    console.warn("Invalid chart type for " + d.key);
  }
}

function makeDetails(d) {
  var wrap = d3.select(this);

  //Render Summary Stats
  var stats_div = wrap.append("div").attr("class", "stat-row");
  var statNames = Object.keys(d.statistics).filter(function (f) {
    return f != "values";
  });
  var statList = statNames.map(function (stat) {
    return {
      key: stat !== "nMissing" ? stat : "Missing",
      value: d.statistics[stat]
    };
  }).filter(function (statItem) {
    return ["min", "max"].indexOf(statItem.key) === -1;
  });

  //Render Values
  if (d.type == "categorical") {
    var stats = stats_div.selectAll("div").data(statList).enter().append("div").attr("class", "stat");
    stats.append("div").text(function (d) {
      return d.key;
    }).attr("class", "label");
    stats.append("div").text(function (d) {
      return d.value;
    }).attr("class", "value");
  } else if (d.type === "continuous") {
    var stats = stats_div.selectAll("div").data(statList.filter(function (statItem) {
      return statItem.key.indexOf("ile") === -1;
    })).enter().append("div").attr("class", "stat");
    stats.append("div").text(function (d) {
      return d.key;
    }).attr("class", "label");
    stats.append("div").text(function (d) {
      return d.value;
    }).attr("class", "value");
  }
}

/*------------------------------------------------------------------------------------------------\
  Intialize the summary table
\------------------------------------------------------------------------------------------------*/

function renderRow(d) {
  var rowWrap = d3.select(this);
  rowWrap.selectAll("*").remove();

  var rowHead = rowWrap.append("div").attr("class", "row-head section");

  rowHead.append("div").attr("class", "row-toggle").html("&#9658;").on("click", function () {
    var rowDiv = d3.select(this.parentNode.parentNode);
    var chartDiv = rowDiv.select(".row-chart");
    var hiddenFlag = rowDiv.classed("hiddenChart");
    rowDiv.classed("hiddenChart", !hiddenFlag);
    d3.select(this).html(hiddenFlag ? "&#9660;" : "&#9658;");
  });

  rowHead.append("div").attr("class", "row-title").each(makeTitle);
  rowHead.append("div").attr("class", "row-details").each(makeDetails);
  rowWrap.append("div").attr("class", "row-chart section").each(makeChart);
}

function updateSummaryText(codebook) {
  //Chart Summary Span
  if (codebook.data.summary.length > 0) {
    var nCols = codebook.data.summary.length;
    var nShown = codebook.data.summary[0].statistics.N;
    var nTot = codebook.data.raw.length;
    var percent = d3.format("0.1%")(nShown / nTot);
    var tableSummary = "Data summary for " + nCols + " columns and " + nShown + " of " + nTot + " (" + percent + ") rows shown below.";
  } else {
    tableSummary = "No values selected. Update the filters above or load a different data set.";
  }

  codebook.summaryTable.summaryText.text(tableSummary);
}

/*------------------------------------------------------------------------------------------------\
  Define summaryTable object (the meat and potatoes).
\------------------------------------------------------------------------------------------------*/
var summaryTable = {
  draw: draw,
  renderRow: renderRow,
  updateSummaryText: updateSummaryText
};

function layout$1(dataListing) {
  //Clear data listing.
  dataListing.wrap.selectAll("*").remove();

  //Add sort container.
  var sortContainer = dataListing.wrap.append("div").classed("sort-container", true);
  sortContainer.append("span").classed("description", true).text("Click any column header to sort that column.");

  //Add search container.
  var searchContainer = dataListing.wrap.append("div").classed("search-container", true);
  searchContainer.append("span").classed("description", true).text("Search:");
  searchContainer.append("input").attr("class", "search-box");

  //Add listing container.
  dataListing.wrap.append("div").classed("listing-container", true);

  //Add pagination container.
  var paginationContainer = dataListing.wrap.append("div").classed("pagination-container", true);
  paginationContainer.append("span").classed("description", true).text("Page:");
}

function updatePagination(dataListing) {
  //Reset pagination.
  dataListing.pagination.links.classed("active", false);

  //Set to active the selected page link and unhide associated rows.
  dataListing.pagination.links.filter(function (link) {
    return +link.rel === +dataListing.pagination.activeLink;
  }).classed("active", true);
  dataListing.pagination.startItem = dataListing.pagination.activeLink * dataListing.pagination.rowsShown;
  dataListing.pagination.endItem = dataListing.pagination.startItem + dataListing.pagination.rowsShown;
  var sub = dataListing.sorted_raw_data.filter(function (d, i) {
    return i >= dataListing.pagination.startItem & i < dataListing.pagination.endItem;
  });
  dataListing.table.draw(sub);
}

function sort(dataListing) {
  dataListing.sorted_raw_data = dataListing.sorted_raw_data.sort(function (a, b) {
    var order = 0;

    dataListing.sort.order.forEach(function (item) {
      var acell = a[item.variable];
      var bcell = b[item.variable];

      if (order === 0) {
        if (item.direction === "ascending" && acell < bcell || item.direction === "descending" && acell > bcell) order = -1;else if (item.direction === "ascending" && acell > bcell || item.direction === "descending" && acell < bcell) order = 1;
      }
    });
    return order;
  });
  updatePagination(dataListing);
}

function addSort(dataListing) {
  dataListing.table.wrap.selectAll(".headers th").on("click", function () {
    var variable = this.textContent;
    var sortItem = dataListing.sort.order.filter(function (item) {
      return item.variable === variable;
    })[0];

    if (!sortItem) {
      sortItem = {
        variable: variable,
        direction: "ascending",
        container: dataListing.sort.wrap.append("div").datum({ key: variable }).classed("sort-box", true).text(variable)
      };
      sortItem.container.append("span").classed("sort-direction", true).html("&darr;");
      sortItem.container.append("span").classed("remove-sort", true).html("&#10060;");
      dataListing.sort.order.push(sortItem);
    } else {
      sortItem.direction = sortItem.direction === "ascending" ? "descending" : "ascending";
      sortItem.container.select("span.sort-direction").html(sortItem.direction === "ascending" ? "&darr;" : "&uarr;");
    }

    sort(dataListing);
    dataListing.sort.wrap.select(".description").classed("hidden", true);

    //Add sort container deletion functionality.
    dataListing.sort.order.forEach(function (item, i) {
      item.container.on("click", function (d) {
        d3.select(this).remove();
        dataListing.sort.order.splice(dataListing.sort.order.map(function (d) {
          return d.variable;
        }).indexOf(d.key), 1);

        if (dataListing.sort.order.length) sort(dataListing);else dataListing.sort.wrap.select(".description").classed("hidden", false);
      });
    });
  });
}

function addSearch(dataListing) {
  dataListing.search = {};
  dataListing.search.wrap = dataListing.wrap.select(".search-container");
  dataListing.search.wrap.select(".search-box").on("input", function () {
    var inputText = this.value.toLowerCase();
    //Determine which rows contain input text.
    dataListing.sorted_raw_data = dataListing.super_raw_data.filter(function (d) {
      var match = false;
      var vars = Object.keys(d);
      vars.forEach(function (var_name) {
        if (match === false) {
          var cellText = "" + d[var_name];
          match = cellText.toLowerCase().indexOf(inputText) > -1;
        }
      });
      return match;
    });
    //render the codebook
    var sub = dataListing.sorted_raw_data.filter(function (d, i) {
      return i < 25;
    });
    //discard the sort
    dataListing.sort.order.forEach(function (item) {
      item.container.remove();
    });
    dataListing.sort.order = [];
    dataListing.sort.wrap.select(".description").classed("hidden", false);

    //reset to first page
    dataListing.pagination.activeLink = 0;
    updatePagination(dataListing);
  });
}

function addLinks(dataListing) {
  //Count rows.
  dataListing.pagination.rowsTotal = dataListing.sorted_raw_data.length;

  //Calculate number of pages needed and create a link for each page.
  dataListing.pagination.numPages = Math.ceil(dataListing.pagination.rowsTotal / dataListing.pagination.rowsShown);
  dataListing.pagination.wrap.selectAll("a").remove();
  for (var i = 0; i < dataListing.pagination.numPages; i++) {
    dataListing.pagination.wrap.append("a").datum({ rel: i }).attr({
      href: "#",
      rel: i
    }).text(i + 1).classed("active", function (d) {
      return d.rel == dataListing.pagination.activeLink;
    });
  }
  dataListing.pagination.links = dataListing.pagination.wrap.selectAll("a");
}

function addPagination(dataListing) {
  //Render page links.
  addLinks(dataListing);

  //Render a different page on click.
  dataListing.pagination.links.on("click", function () {
    dataListing.pagination.activeLink = d3.select(this).attr("rel");
    updatePagination(dataListing);
  });
}

function onDraw(dataListing) {
  dataListing.table.on("draw", function () {
    //Add header sort functionality.
    addSort(dataListing);

    //Add text search functionality.
    addSearch(dataListing);

    //Add pagination functionality.
    addPagination(dataListing);
  });
}

function init$6(codebook) {
  var dataListing = codebook.dataListing;
  layout$1(dataListing);
  //sort config
  dataListing.sort = {};
  dataListing.sort.wrap = dataListing.wrap.select(".sort-container");
  dataListing.sort.order = [];
  //pagination config
  dataListing.pagination = {};
  dataListing.pagination.wrap = dataListing.wrap.select(".pagination-container");
  dataListing.pagination.rowsShown = 25;
  dataListing.pagination.activeLink = 0;

  //Define table.
  dataListing.table = webcharts.createTable(".web-codebook .dataListing .listing-container", {});

  //Define callback.
  onDraw(dataListing);

  //Initialize table.
  dataListing.super_raw_data = codebook.data.filtered;
  dataListing.sorted_raw_data = codebook.data.filtered;
  var sub = dataListing.sorted_raw_data.filter(function (d, i) {
    return i < 25;
  });
  dataListing.table.init(sub);
}

/*------------------------------------------------------------------------------------------------\
  Define dataListing object (the meat and potatoes).
\------------------------------------------------------------------------------------------------*/

var dataListing = { init: init$6 };

var defaultSettings$1 = {
  filters: [],
  groups: [],
  autogroups: 5, //automatically include categorical vars with 2-5 levels in the groups dropdown
  autofilter: 10, //automatically make filters for categorical variables with 2-10 levels
  autobins: true,
  nBins: 100,
  levelSplit: 5 //cutpoint for # of levels to use levelPlot() renderer
};

function setDefaults(codebook) {
  /********************* Filter Settings *********************/
  codebook.config.filters = codebook.config.filters || defaultSettings$1.filters;
  codebook.config.filters = codebook.config.filters.map(function (d) {
    if (typeof d == "string") return { value_col: d };else return d;
  });

  //autofilter - don't use automatic filter if user specifies filters object
  codebook.config.autofilter = codebook.config.filters.length > 0 ? false : codebook.config.autofilter == null ? defaultSettings$1.autofilter : codebook.config.autofilter;

  /********************* Group Settings *********************/
  codebook.config.groups = codebook.config.groups || defaultSettings$1.groups;
  codebook.config.groups = codebook.config.groups.map(function (d) {
    if (typeof d == "string") return { value_col: d };else return d;
  });

  //autogroups - don't use automatic groups if user specifies groups object
  codebook.config.autogroups = codebook.config.groups.length > 0 ? false : codebook.config.autogroups == null ? defaultSettings$1.autogroups : codebook.config.autogroups;

  /********************* Histogram Settings *********************/
  codebook.config.nBins = codebook.config.nBins || defaultSettings$1.nBins;
  codebook.config.autobins = codebook.config.autobins == null ? defaultSettings$1.autobins : codebook.config.autobins;

  /********************* Histogram Settings *********************/
  codebook.config.levelSplit = codebook.config.levelSplit || defaultSettings$1.levelSplit;
}

function makeAutomaticFilters(codebook) {
  //make filters for all categorical variables with less than autofilter levels
  if (codebook.config.autofilter > 1) {
    var autofilters = codebook.data.summary.filter(function (f) {
      return f.type == "categorical";
    }) //categorical filters only
    .filter(function (f) {
      return f.statistics.values.length <= codebook.config.autofilter;
    }) //no huge filters
    .filter(function (f) {
      return f.statistics.values.length > 1;
    }) //no silly 1 item filters
    .map(function (m) {
      return { value_col: m.value_col };
    });

    codebook.config.filters = autofilters.length > 0 ? autofilters : null;
  }
}

function makeAutomaticGroups(codebook) {
  //make groups for all categorical variables with less than autofilter levels
  if (codebook.config.autogroups > 1) {
    var autogroups = codebook.data.summary.filter(function (f) {
      return f.type == "categorical";
    }) //categorical filters only
    .filter(function (f) {
      return f.statistics.values.length <= codebook.config.autogroups;
    }) //no groups
    .filter(function (f) {
      return f.statistics.values.length > 1;
    }) //no silly 1 item groups
    .map(function (m) {
      return { value_col: m.value_col };
    });

    codebook.config.groups = autogroups.length > 0 ? autogroups : null;
  }
}

// determine the number of bins to use in the histogram based on the data.
// Based on an implementation of the Freedman-Diaconis
// See https://en.wikipedia.org/wiki/Freedman%E2%80%93Diaconis_rule for more
// values should be an array of numbers

function getBinCounts(codebook) {
  //function to set the bin count for a single variable
  function setBinCount(summaryData) {
    //Freedman-Diaconis rule - returns the recommended bin size for a histogram
    function FreedmanDiaconis(IQR, n) {
      var cubeRootN = Math.pow(n, 1.0 / 3.0);
      return 2 * (IQR / cubeRootN);
    }

    var IQR = +summaryData.statistics["3rd quartile"] - +summaryData.statistics["1st quartile"];
    var n = summaryData.statistics["n"];
    var range = +summaryData.statistics["max"] - +summaryData.statistics["min"];
    var binSize = FreedmanDiaconis(IQR, n);
    var bins = Math.ceil(range / binSize);

    return bins;
  }

  var continuousVars = codebook.data.summary.filter(function (d) {
    return d.type == "continuous";
  });
  continuousVars.forEach(function (cvar) {
    cvar.bins = codebook.config.autoBins ? codebook.config.nBins : setBinCount(cvar);
    if (Object.keys(codebook.config).indexOf("group") > -1) {
      cvar.groups.forEach(function (gvar) {
        gvar.bins = codebook.config.autoBins ? codebook.config.nBins : setBinCount(gvar);
      });
    }
  });
}

/*------------------------------------------------------------------------------------------------\
  Define util object.
\------------------------------------------------------------------------------------------------*/

var util = {
  setDefaults: setDefaults,
  makeAutomaticFilters: makeAutomaticFilters,
  makeAutomaticGroups: makeAutomaticGroups,
  getBinCounts: getBinCounts
};

function makeSummary(codebook) {
  var data = codebook.data.filtered;
  var group = codebook.config.group;

  function determineType(vector) {
    var nonMissingValues = vector.filter(function (d) {
      return !/^\s*$/.test(d);
    });
    var numericValues = nonMissingValues.filter(function (d) {
      return !isNaN(+d);
    });
    var distinctValues = d3.set(numericValues).values();

    return nonMissingValues.length === numericValues.length && distinctValues.length > codebook.config.levelSplit ? "continuous" : "categorical";
  }

  var summarize = {
    categorical: function categorical(vector) {
      var statistics = {};
      statistics.N = vector.length;
      var nonMissing = vector.filter(function (d) {
        return !/^\s*$/.test(d) && d !== "NA";
      });
      statistics.n = nonMissing.length;
      statistics.nMissing = vector.length - statistics.n;
      statistics.values = d3.nest().key(function (d) {
        return d;
      }).rollup(function (d) {
        return {
          n: d.length,
          prop_N: d.length / statistics.N,
          prop_n: d.length / statistics.n,
          prop_N_text: d3.format("0.1%")(d.length / statistics.N),
          prop_n_text: d3.format("0.1%")(d.length / statistics.n)
        };
      }).entries(nonMissing);

      statistics.values.forEach(function (value) {
        for (var statistic in value.values) {
          value[statistic] = value.values[statistic];
        }
        delete value.values;
      });

      return statistics;
    },

    continuous: function continuous(vector) {
      var statistics = {};
      statistics.N = vector.length;
      var nonMissing = vector.filter(function (d) {
        return !isNaN(+d) && !/^\s*$/.test(d);
      }).map(function (d) {
        return +d;
      }).sort(function (a, b) {
        return a - b;
      });
      statistics.n = nonMissing.length;
      statistics.nMissing = vector.length - statistics.n;
      statistics.mean = d3.format("0.2f")(d3.mean(nonMissing));
      statistics.SD = d3.format("0.2f")(d3.deviation(nonMissing));
      var quantiles = [["min", 0], ["5th percentile", 0.05], ["1st quartile", 0.25], ["median", 0.5], ["3rd quartile", 0.75], ["95th percentile", 0.95], ["max", 1]];
      quantiles.forEach(function (quantile) {
        var statistic = quantile[0];
        statistics[statistic] = d3.format("0.1f")(d3.quantile(nonMissing, quantile[1]));
      });

      return statistics;
    }
  };

  if (codebook.data.filtered.length > 0) {
    var variables = Object.keys(data[0]);
    variables.forEach(function (variable, i) {
      //Define variable metadata and generate data array.
      variables[i] = { value_col: variable };
      variables[i].values = data.map(function (d) {
        return d[variable];
      });
      variables[i].type = determineType(variables[i].values);

      //Calculate statistics.
      if (variables[i].type === "categorical") variables[i].statistics = summarize.categorical(variables[i].values);else variables[i].statistics = summarize.continuous(variables[i].values);
      //determine the renderer to use
      variables[i].chartType = variables[i].type == "continuous" ? "histogramBoxPlot" : variables[i].type == "categorical" & variables[i].statistics.values.length > codebook.config.levelSplit ? "verticalBars" : variables[i].type == "categorical" & variables[i].statistics.values.length <= codebook.config.levelSplit ? "horizontalBars" : "error";

      //Handle groups.
      if (group) {
        variables[i].group = group;
        variables[i].groups = d3.set(data.map(function (d) {
          return d[group];
        })).values().map(function (g) {
          return { group: g };
        });

        variables[i].groups.forEach(function (g) {
          //Define variable metadata and generate data array.
          g.value_col = variables[i].value_col;
          g.values = data.filter(function (d) {
            return d[group] === g.group;
          }).map(function (d) {
            return d[variable];
          });
          g.type = variables[i].type;

          //Calculate statistics.
          if (variables[i].type === "categorical") g.statistics = summarize.categorical(g.values);else g.statistics = summarize.continuous(g.values);
        });
      }
    });

    codebook.data.summary = variables;
    //get bin counts
    codebook.util.getBinCounts(codebook);
  } else {
    codebook.data.summary = [];
  }
}

function makeFiltered(data, filters) {
  var filtered = data;
  filters.forEach(function (filter_d) {
    //remove the filtered values from the data based on the filters
    filtered = filtered.filter(function (rowData) {
      var currentValues = filter_d.values.filter(function (f) {
        return f.selected;
      }).map(function (m) {
        return m.value;
      });
      return currentValues.indexOf(rowData[filter_d.value_col]) > -1;
    });
  });
  return filtered;
}

/*------------------------------------------------------------------------------------------------\
  Define data object.
\------------------------------------------------------------------------------------------------*/

var data = {
  makeSummary: makeSummary,
  makeFiltered: makeFiltered
};

function createCodebook() {
  var element = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "body";
  var config = arguments[1];

  var codebook = {
    element: element,
    config: config,
    init: init,
    layout: layout,
    controls: controls,
    summaryTable: summaryTable,
    dataListing: dataListing,
    data: data,
    util: util
  };

  return codebook;
}

/*------------------------------------------------------------------------------------------------\
  Initialize explorer
\------------------------------------------------------------------------------------------------*/

function init$7() {
  var settings = this.config;

  //create wrapper in specified div
  this.wrap = d3.select(this.element).append("div").attr("class", "web-codebook-explorer");

  //layout the divs
  this.layout(this);

  //draw controls
  this.controls.init(this);

  //draw first codebook
  this.makeCodebook(this.config.files[0]);
}

/*------------------------------------------------------------------------------------------------\
  Generate HTML containers.
\------------------------------------------------------------------------------------------------*/

function layout$2() {
  this.controls.wrap = this.wrap.append("div").attr("class", "controls");

  this.codebookWrap = this.wrap.append("div").attr("class", "codebookWrap");
}

function init$8(explorer) {
  explorer.controls.wrap.attr("onsubmit", "return false;");
  explorer.controls.wrap.selectAll("*").remove(); //Clear controls.

  //Make file selector

  var file_select_wrap = explorer.controls.wrap.append("div").style("padding", ".5em").style("border-bottom", "2px solid black");

  file_select_wrap.append("span").text("Pick a file: ");

  var select = file_select_wrap.append("select");

  select.selectAll("option").data(explorer.config.files).enter().append("option").text(function (d) {
    return d.label;
  });

  select.on("change", function (d) {
    var current_text = this.value;
    var current_obj = explorer.config.files.filter(function (f) {
      return f.label == current_text;
    })[0];
    explorer.makeCodebook(current_obj);
  });
}

/*------------------------------------------------------------------------------------------------\
  Define controls object.
\------------------------------------------------------------------------------------------------*/

var controls$1 = {
  init: init$8
};

function makeCodebook(meta) {
  this.codebookWrap.selectAll("*").remove();
  var codebook = webcodebook.createCodebook(".web-codebook-explorer .codebookWrap", meta.settings);
  d3.csv(meta.path, function (error, data) {
    codebook.init(data);
  });
}

function createExplorer() {
  var element = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "body";
  var config = arguments[1];

  var explorer = {
    element: element,
    config: config,
    init: init$7,
    layout: layout$2,
    controls: controls$1,
    makeCodebook: makeCodebook
  };

  return explorer;
}

var index = {
  createCodebook: createCodebook,
  createChart: createCodebook,
  createExplorer: createExplorer,
  charts: charts
};

return index;

}(webCharts));
