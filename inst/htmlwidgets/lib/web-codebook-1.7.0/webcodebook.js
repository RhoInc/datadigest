(function(global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined'
    ? (module.exports = factory(require('d3'), require('webcharts')))
    : typeof define === 'function' && define.amd
      ? define(['d3', 'webcharts'], factory)
      : (global.webcodebook = factory(global.d3, global.webCharts));
})(this, function(d3$1, webcharts) {
  'use strict';

  if (typeof Object.assign != 'function') {
    Object.defineProperty(Object, 'assign', {
      value: function assign(target, varArgs) {
        if (target == null) {
          // TypeError if undefined or null
          throw new TypeError('Cannot convert undefined or null to object');
        }

        var to = Object(target);

        for (var index = 1; index < arguments.length; index++) {
          var nextSource = arguments[index];

          if (nextSource != null) {
            // Skip over if undefined or null
            for (var nextKey in nextSource) {
              // Avoid bugs when hasOwnProperty is shadowed
              if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                to[nextKey] = nextSource[nextKey];
              }
            }
          }
        }

        return to;
      },
      writable: true,
      configurable: true
    });
  }

  if (!Array.prototype.find) {
    Object.defineProperty(Array.prototype, 'find', {
      value: function value(predicate) {
        // 1. Let O be ? ToObject(this value).
        if (this == null) {
          throw new TypeError('"this" is null or not defined');
        }

        var o = Object(this);

        // 2. Let len be ? ToLength(? Get(O, 'length')).
        var len = o.length >>> 0;

        // 3. If IsCallable(predicate) is false, throw a TypeError exception.
        if (typeof predicate !== 'function') {
          throw new TypeError('predicate must be a function');
        }

        // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
        var thisArg = arguments[1];

        // 5. Let k be 0.
        var k = 0;

        // 6. Repeat, while k < len
        while (k < len) {
          // a. Let Pk be ! ToString(k).
          // b. Let kValue be ? Get(O, Pk).
          // c. Let testResult be ToBoolean(? Call(predicate, T, � kValue, k, O �)).
          // d. If testResult is true, return kValue.
          var kValue = o[k];
          if (predicate.call(thisArg, kValue, k, o)) {
            return kValue;
          }
          // e. Increase k by 1.
          k++;
        }

        // 7. Return undefined.
        return undefined;
      }
    });
  }

  if (!Array.prototype.findIndex) {
    Object.defineProperty(Array.prototype, 'findIndex', {
      value: function value(predicate) {
        // 1. Let O be ? ToObject(this value).
        if (this == null) {
          throw new TypeError('"this" is null or not defined');
        }

        var o = Object(this);

        // 2. Let len be ? ToLength(? Get(O, "length")).
        var len = o.length >>> 0;

        // 3. If IsCallable(predicate) is false, throw a TypeError exception.
        if (typeof predicate !== 'function') {
          throw new TypeError('predicate must be a function');
        }

        // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
        var thisArg = arguments[1];

        // 5. Let k be 0.
        var k = 0;

        // 6. Repeat, while k < len
        while (k < len) {
          // a. Let Pk be ! ToString(k).
          // b. Let kValue be ? Get(O, Pk).
          // c. Let testResult be ToBoolean(? Call(predicate, T, � kValue, k, O �)).
          // d. If testResult is true, return k.
          var kValue = o[k];
          if (predicate.call(thisArg, kValue, k, o)) {
            return k;
          }
          // e. Increase k by 1.
          k++;
        }

        // 7. Return -1.
        return -1;
      }
    });
  }

  var _typeof =
    typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol'
      ? function(obj) {
          return typeof obj;
        }
      : function(obj) {
          return obj &&
            typeof Symbol === 'function' &&
            obj.constructor === Symbol &&
            obj !== Symbol.prototype
            ? 'symbol'
            : typeof obj;
        };

  function clone(obj) {
    var copy = void 0;

    //boolean, number, string, null, undefined
    if (
      'object' != (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) ||
      null == obj
    )
      return obj;

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

    throw new Error('Unable to copy [obj]! Its type is not supported.');
  }

  function indicateLoading(codebook, element, callback) {
    codebook.statusWrap.selectAll('*').remove();
    codebook.loadingIndicator.style('display', 'block');
    //wait until the loading indicator is visible
    var loading = setInterval(function() {
      try {
        var laidOut = d3$1.select(element).property('offsetwidth') > 0,
          displayNone = d3$1.select(element).style('display') === 'none';

        //loading is complete
        if (!(laidOut && displayNone)) {
          if (callback) callback();
          clearInterval(loading);
          codebook.loadingIndicator.style('display', 'none');
          d3$1.select('#loading-text').remove();
        }
      } catch (err) {
        clearInterval(loading);
        codebook.loadingIndicator.style('display', 'none');
        d3$1.select('#loading-text').remove();

        codebook.statusWrap
          .append('div')
          .attr('class', 'status error')
          .html('There was a problem updating the chart:<br>' + err);

        console.warn(err);
      }
    }, 25);
  }

  /*------------------------------------------------------------------------------------------------\
    Initialize codebook
  \------------------------------------------------------------------------------------------------*/

  function init(data) {
    var _this = this;

    var settings = this.config;

    //create chart wrapper in specified div
    this.wrap = d3$1
      .select(this.element)
      .append('div')
      .attr('class', 'web-codebook')
      .datum(this); // bind codebook object to codebook container so as to pass down to successive child elements

    // call the before callback (if any)
    this.events.init.call(this);

    //save raw data
    this.data.raw = clone(data);
    this.data.raw.forEach(function(d, i) {
      d['web-codebook-index'] = i + 1; // define an index with which to identify records uniquely
    });
    this.data.filtered = this.data.raw; //assume no filters active on init :/
    this.data.highlighted = [];

    //settings and defaults
    this.util.setDefaults(this);
    this.layout();

    indicateLoading(this, '.web-codebook .settings', function() {
      //prepare the data summaries
      _this.data.makeSummary(_this);

      //make the title
      _this.title.init(_this);

      //draw controls
      _this.util.makeAutomaticFilters(_this);
      _this.util.makeAutomaticGroups(_this);
      _this.controls.init(_this);

      //initialize nav, title and instructions
      _this.nav.init(_this);
      _this.instructions.init(_this);

      //call after event (if any)
      _this.events.complete.call(_this);

      //initialize and then draw the codebook
      _this.summaryTable.draw(_this);

      //initialize and then draw the data listing
      _this.dataListing.init(_this);

      //initialize the chart maker
      _this.chartMaker.init(_this);

      //initialize the settings
      _this.settings.init(_this);
    });
  }

  /*------------------------------------------------------------------------------------------------\
    Generate HTML containers.
  \------------------------------------------------------------------------------------------------*/

  function layout() {
    this.loadingIndicator = this.wrap
      .append('div')
      .attr('id', 'loading-indicator')
      .style('display', 'none');

    this.loadingIndicator.append('div').attr('class', 'spinner');

    this.statusWrap = this.wrap
      .append('div')
      .attr('class', 'statusWrap section');
    this.title.wrap = this.wrap.append('div').attr('class', 'title section');
    this.nav.wrap = this.wrap.append('div').attr('class', 'wcb-nav section');
    this.controls.wrap = this.wrap
      .append('div')
      .attr('class', 'controls section');
    this.instructions.wrap = this.wrap
      .append('div')
      .attr('class', 'instructions section');
    this.summaryTable.wrap = this.wrap
      .append('div')
      .attr('class', 'summaryTable section')
      .classed('hidden', false);

    this.summaryTable.summaryText = this.summaryTable.wrap
      .append('strong')
      .attr('class', 'summaryText section');

    this.fileListing = {};
    this.fileListing.wrap = this.wrap
      .append('div')
      .attr('class', 'fileListing section')
      .classed('hidden', true);

    this.dataListing.wrap = this.wrap
      .append('div')
      .attr('class', 'dataListing section')
      .classed('hidden', true);

    this.chartMaker.wrap = this.wrap
      .append('div')
      .attr('class', 'chartMaker section')
      .classed('hidden', true);

    this.settings.wrap = this.wrap
      .append('div')
      .attr('class', 'settings section')
      .classed('hidden', true);
  }

  function init$1(codebook) {
    indicateLoading(codebook, '.web-codebook .controls .control-toggle');

    codebook.controls.wrap.attr('onsubmit', 'return false;');
    codebook.controls.wrap.selectAll('*:not(#loading-indicator)').remove(); //Clear controls.

    //Draw title
    codebook.controls.title = codebook.controls.wrap
      .append('div')
      .attr('class', 'controls-title')
      .text('Controls');
    codebook.controls.summaryWrap = codebook.controls.title.append('span');
    codebook.controls.rowCount = codebook.controls.summaryWrap
      .append('span')
      .attr('class', 'rowCount');
    codebook.controls.highlightCount = codebook.controls.summaryWrap
      .append('span')
      .attr('class', 'highlightCount');

    //Draw controls.
    codebook.controls.groups.init(codebook);
    codebook.controls.filters.init(codebook);
    codebook.controls.controlToggle.init(codebook);
    codebook.title.updateCountSummary(codebook);

    //Hide group-by options corresponding to variables specified in settings.hiddenVariables.
    codebook.controls.wrap
      .selectAll('.group-select option')
      .classed('hidden', function(d) {
        return codebook.config.hiddenVariables.indexOf(d) > -1;
      });

    //Hide filters corresponding to variables specified in settings.hiddenVariables.
    codebook.controls.wrap
      .selectAll('.filter-list li.filterCustom')
      .classed('hidden', function(d) {
        return codebook.config.hiddenVariables.indexOf(d.value_col) > -1;
      });
  }

  /*------------------------------------------------------------------------------------------------\
    Update filters.
  \------------------------------------------------------------------------------------------------*/

  function update(codebook) {
    var selector = codebook.controls.wrap.select('div.custom-filters'),
      filterList = selector.select('ul.filter-list');

    //add a list of values to each filter object
    codebook.config.filters.forEach(function(e) {
      if (!e.hasOwnProperty('values'))
        e.values = d3$1
          .nest()
          .key(function(d) {
            return d[e.value_col];
          })
          .entries(codebook.data.raw)
          .map(function(d) {
            var obj = { value: d.key, selected: true };
            obj.label = /^\s*$/.test(d.key) ? '[No value provided]' : d.key;
            return obj;
          });
      e.label = codebook.data.summary.filter(function(d) {
        return d.value_col === e.value_col;
      })[0].label;
    });

    //Add filter controls.
    var allFilterItem = filterList
      .selectAll('li')
      .data(codebook.config.filters, function(d) {
        return d.value_col;
      });
    var columns = Object.keys(codebook.data.raw[0]);
    allFilterItem.exit().remove();
    var filterItem = allFilterItem
      .enter()
      .append('li')
      .attr('class', function(d) {
        return 'custom-' + d.value_col + ' filterCustom';
      });
    allFilterItem.classed('hidden', function(d) {
      return codebook.config.hiddenVariables.indexOf(d.value_col) > -1;
    });
    allFilterItem.sort(function(a, b) {
      var aSort = columns.indexOf(a.value_col),
        bSort = columns.indexOf(b.value_col);
      return aSort - bSort;
    });

    var filterLabel = filterItem.append('span').attr('class', 'filterLabel');

    filterLabel
      .append('span')
      .classed('filter-variable', true)
      .html(function(d) {
        return d.value_col;
      });
    filterLabel
      .append('span')
      .classed('filter-label', true)
      .html(function(d) {
        return d.value_col !== d.label ? d.label : '';
      });

    var filterCustom = filterItem.append('select').attr('multiple', true);

    //Add data-driven filter options.
    var filterItems = filterCustom
      .selectAll('option')
      .data(function(d) {
        return d.values;
      })
      .enter()
      .append('option')
      .html(function(d) {
        return d.label;
      })
      .attr('value', function(d) {
        return d.value;
      })
      .attr('selected', function(d) {
        return d.selected ? 'selected' : null;
      });

    //Initialize event listeners
    var filters = codebook.controls.wrap
      .selectAll('.filterCustom select')
      .on('change', function(d) {
        var _this = this;

        indicateLoading(codebook, '#loading-indicator', function() {
          // flag the selected options in the config
          var options = d3$1.select(_this).selectAll('option');
          options.each(function(option_d) {
            option_d.selected = d3$1.select(this).property('selected');
          });
          codebook.config.filters.filter(function(filter) {
            return filter.value_col === d.value_col;
          })[0].values = options.data();

          //update the codebook
          codebook.data.filtered = codebook.data.makeFiltered(
            codebook.data.raw,
            codebook.config.filters
          );

          //clear highlights
          codebook.data.highlighted = [];
          codebook.data.makeSummary(codebook);
          codebook.title.updateCountSummary(codebook);
          codebook.summaryTable.draw(codebook);
          codebook.chartMaker.draw(codebook);
          codebook.dataListing.init(codebook);
        });
      });
  }

  /*------------------------------------------------------------------------------------------------\
    Initialize filters.
  \------------------------------------------------------------------------------------------------*/

  //export function init(selector, data, vars, settings) {
  function init$2(codebook) {
    //initialize the wrapper
    var selector = codebook.controls.wrap
        .append('div')
        .attr('class', 'custom-filters'),
      filterList = selector.append('ul').attr('class', 'filter-list');

    update(codebook);
  }

  /*------------------------------------------------------------------------------------------------\
    Define filter controls object.
  \------------------------------------------------------------------------------------------------*/

  var filters = {
    init: init$2,
    update: update
  };

  /*------------------------------------------------------------------------------------------------\
    Update group control.
  \------------------------------------------------------------------------------------------------*/

  function update$1(codebook) {
    var groupControl = codebook.controls.wrap.select('div.group-select'),
      groupSelect = groupControl.select('select'),
      columns = Object.keys(codebook.data.raw[0]),
      groupLevels = d3$1.merge([
        [{ value_col: 'None', label: 'None' }],
        codebook.config.groups.map(function(m) {
          return {
            value_col: m.value_col,
            label: codebook.data.summary.filter(function(variable) {
              return variable.value_col === m.value_col;
            })[0].label
          };
        })
      ]),
      groupOptions = groupSelect
        .selectAll('option')
        .data(groupLevels, function(d) {
          return d.value_col;
        });
    groupOptions
      .enter()
      .append('option')
      .property('label', function(d) {
        return d.value_col !== d.label
          ? d.value_col + ' (' + d.label + ')'
          : d.value_col;
      })
      .text(function(d) {
        return d.value_col;
      });
    groupOptions.exit().remove();
    var visibleOptionCount = 0;
    groupOptions.classed('hidden', function(d) {
      var hidden = codebook.config.hiddenVariables.indexOf(d.value_col) > -1;
      if (!hidden) visibleOptionCount = visibleOptionCount + 1;
      return hidden;
    });

    groupOptions.sort(function(a, b) {
      return columns.indexOf(a) - columns.indexOf(b);
    });
    groupSelect.on('change', function() {
      var _this = this;

      indicateLoading(codebook, '#loading-indicator', function() {
        if (_this.value !== 'None') codebook.config.group = _this.value;
        else delete codebook.config.group;

        codebook.data.highlighted = [];
        codebook.data.makeSummary(codebook);
        codebook.summaryTable.draw(codebook);
        codebook.chartMaker.draw(codebook);
        codebook.title.updateCountSummary(codebook);
      });
    });

    //Hide the group select if only the "None" option is visible;
    groupControl.style('display', visibleOptionCount <= 1 ? 'none' : null);
  }

  /*------------------------------------------------------------------------------------------------\
    Initialize group control.
  \------------------------------------------------------------------------------------------------*/

  function init$3(codebook) {
    var selector = codebook.controls.wrap
      .append('div')
      .attr('class', 'group-select');
    selector.append('span').text('Group by');
    var groupSelect = selector.append('select');
    update$1(codebook);
  }

  /*------------------------------------------------------------------------------------------------\
    Define filter controls object.
  \------------------------------------------------------------------------------------------------*/

  var groups = {
    init: init$3,
    update: update$1
  };

  /*------------------------------------------------------------------------------------------------\
    Initialize controls container hide/show toggle.
  \------------------------------------------------------------------------------------------------*/

  function init$4(codebook) {
    //render the control
    var controlToggle = codebook.controls.wrap
      .append('button')
      .attr('class', 'control-toggle');

    //set the initial
    codebook.controls.controlToggle.set(codebook);

    controlToggle.on('click', function() {
      codebook.config.controlVisibility =
        d3$1.select(this).text() == 'Hide'
          ? 'minimized' //click "-" to minimize controls
          : 'visible'; // click "+" to show controls

      codebook.controls.controlToggle.set(codebook);
    });
  }

  function set$1(codebook) {
    //update toggle text
    codebook.controls.wrap
      .select('button.control-toggle')
      .text(codebook.config.controlVisibility == 'visible' ? 'Hide' : 'Show');
    codebook.controls.wrap.attr(
      'class',
      'controls section ' + codebook.config.controlVisibility
    );

    //hide the controls if controlVisibility isn't "visible" ...
    codebook.controls.wrap
      .selectAll('div')
      .classed('hidden', !(codebook.config.controlVisibility == 'visible'));

    // but show the title and the toggle ...
    codebook.controls.wrap
      .select('div.controls-title')
      .classed('hidden', false);
    codebook.controls.wrap
      .select('button.control-toggle')
      .classed('hidden', false);

    // unless control visibility is hidden, in which case just hide it all
    codebook.controls.wrap.classed(
      'hidden',
      codebook.config.controlVisibility == 'hidden' ||
        codebook.config.controlVisibility == 'disabled'
    );
  }

  /*------------------------------------------------------------------------------------------------\
    Define chart toggle object.
  \------------------------------------------------------------------------------------------------*/

  var controlToggle = {
    init: init$4,
    set: set$1
  };

  /*------------------------------------------------------------------------------------------------\
    Define controls object.
  \------------------------------------------------------------------------------------------------*/

  var controls = {
    init: init$1,
    filters: filters,
    groups: groups,
    controlToggle: controlToggle
  };

  var availableTabs = [
    {
      key: 'files',
      label: 'Files',
      selector: '.fileListing',
      controls: false,
      instructions: 'Click a row to see the codebook for the file.'
    },
    {
      key: 'codebook',
      label: 'Codebook',
      selector: '.summaryTable',
      controls: true,
      instructions: 'Automatically generated data summaries for each column.'
    },
    {
      key: 'listing',
      label: 'Data Listing',
      selector: '.dataListing',
      controls: true,
      instructions: 'Listing of all selected records.'
    },
    {
      key: 'chartMaker',
      label: 'Charts',
      selector: '.chartMaker',
      controls: true,
      instructions:
        'Pick two variables to compare. Filter and group (panel) the chart using the controls above.'
    },
    {
      key: 'settings',
      label: '&#x2699;',
      selector: '.settings',
      controls: false,
      instructions:
        "This interactive table allows users to modify each column's metadata. Updating these settings will reset the codebook and data listing."
    }
  ];

  function init$5(codebook) {
    var defaultTabs = clone(availableTabs);
    codebook.nav.wrap.selectAll('*').remove();

    //permanently hide the codebook sections that aren't included
    defaultTabs.forEach(function(tab) {
      tab.wrap = codebook.wrap.select(tab.selector);
      tab.wrap.classed(
        'hidden',
        codebook.config.tabs
          .map(function(m) {
            return m.key;
          })
          .indexOf(tab.key) == -1
      );
    });

    //get the tabs for the current codebook
    codebook.nav.tabs = defaultTabs.filter(function(tab) {
      return (
        codebook.config.tabs
          .map(function(m) {
            return m.key;
          })
          .indexOf(tab.key) > -1
      );
    });

    //overwrite labels/instruction if specified by user
    codebook.nav.tabs.forEach(function(tab) {
      var settingsMatch = codebook.config.tabs.filter(function(f) {
        return f.key == tab.key;
      })[0];
      tab.label = settingsMatch.label || tab.label;
      tab.controls = settingsMatch.controls || tab.controls;
      tab.instructions = settingsMatch.instructions || tab.instructions;
    });

    //set the active tabs
    codebook.nav.tabs.forEach(function(t) {
      t.active = t.key == codebook.config.defaultTab;
      t.wrap.classed('hidden', !t.active);
    });

    //draw the nav
    if (codebook.nav.tabs.length > 1) {
      var chartNav = codebook.nav.wrap
        .append('ul')
        .attr('class', 'wcb-nav wcb-nav-tabs');
      var navItems = chartNav
        .selectAll('li')
        .data(codebook.nav.tabs) //make this a setting
        .enter()
        .append('li')
        .attr('class', function(d) {
          return d.key;
        })
        .classed('active', function(d, i) {
          return d.active; //make this a setting
        })
        .attr('title', function(d) {
          return 'View ' + d.key;
        });

      navItems.append('a').html(function(d) {
        return d.label;
      });

      //event listener for nav clicks
      navItems.on('click', function(d) {
        if (!d.active) {
          codebook.nav.tabs.forEach(function(t) {
            t.active = d.label == t.label; //set the clicked tab to active
            navItems
              .filter(function(f) {
                return f == t;
              })
              .classed('active', t.active); //style the active nav element
            t.wrap.classed('hidden', !t.active); //hide all of the wraps (except for the active one)
          });

          codebook.instructions.update(codebook);

          //show/hide the controls (unless they are disabled)
          if (codebook.config.controlVisibility !== 'hidden')
            codebook.config.previousControlVisibility =
              codebook.config.controlVisibility;
          if (codebook.config.controlVisibility != 'disabled') {
            codebook.config.controlVisibility = d.controls
              ? codebook.config.previousControlVisibility
              : 'hidden';
            codebook.controls.controlToggle.set(codebook);
          }
        }
      });
    }
  }

  /*------------------------------------------------------------------------------------------------\
    Define nav object.
  \------------------------------------------------------------------------------------------------*/

  var nav = {
    init: init$5
  };

  /*------------------------------------------------------------------------------------------------\
    draw/update the summaryTable
  \------------------------------------------------------------------------------------------------*/

  function draw(codebook) {
    /*
    indicateLoading(
      codebook,
      '.web-codebook .summaryTable .variable-row .row-title'
    );
    */

    //enter/update/exit for variableDivs
    //BIND the newest data
    var varRows = codebook.summaryTable.wrap
      .selectAll('div.variable-row')
      .data(codebook.data.summary, function(d) {
        return d.value_col;
      });

    //ENTER
    varRows
      .enter()
      .append('div')
      .attr('class', function(d) {
        return 'variable-row ' + d.type;
      });

    //Hide variable rows corresponding to variables specified in settings.hiddenVariables.
    varRows.classed('hidden', function(d) {
      return codebook.config.hiddenVariables.indexOf(d.value_col) > -1;
    });

    //Set chart visibility (on initial load only - then keep user settings)
    if (codebook.config.chartVisibility != 'user-defined') {
      varRows.classed(
        'hiddenDetails',
        codebook.config.chartVisibility != 'visible'
      );
    }

    codebook.config.chartVisibility =
      codebook.config.chartVisibility == 'hidden' ? 'hidden' : 'user-defined';

    //ENTER + Update
    varRows.each(codebook.summaryTable.renderRow);

    //EXIT
    varRows.exit().remove();

    codebook.summaryTable.wrap.selectAll('div.status.error').remove();
    if (varRows[0].length == 0) {
      codebook.summaryTable.wrap
        .append('div')
        .attr('class', 'status error')
        .text(
          'No values selected. Update the filters above or load a different data set.'
        );
    }
  }

  function moveYaxis(chart) {
    var ticks = chart.wrap.selectAll('g.y.axis g.tick');
    ticks.select('text').remove();
    ticks.append('title').text(function(d) {
      return d;
    });
    ticks
      .append('text')
      .attr({
        'text-anchor': 'start',
        'alignment-baseline': 'middle',
        dx: '.5em',
        x: chart.plot_width
      })
      .text(function(d) {
        return d3$1.format(chart.config.y.format)(d);
      });
  }

  function makeTooltip(d, i, context) {
    var format = d3$1.format(context.config.measureFormat);
    d.selector = 'bar' + i;
    //Define tooltips.
    var tooltip = context.svg.append('g').attr('id', d.selector);
    var text = tooltip.append('text').attr({
      id: 'text',
      x: context.x(d.values.x),
      y: context.plot_height,
      dy: '-.75em',
      'font-size': '75%',
      'font-weight': 'bold',
      fill: 'white'
    });
    text
      .append('tspan')
      .attr({
        x: context.x(d.values.x),
        dx: context.x(d.values.x) < context.plot_width / 2 ? '1em' : '-1em',
        'text-anchor':
          context.x(d.values.x) < context.plot_width / 2 ? 'start' : 'end'
      })
      .text('' + d.values.x);
    text
      .append('tspan')
      .attr({
        x: context.x(d.values.x),
        dx: context.x(d.values.x) < context.plot_width / 2 ? '1em' : '-1em',
        dy: '-1.5em',
        'text-anchor':
          context.x(d.values.x) < context.plot_width / 2 ? 'start' : 'end'
      })
      .text(
        'n=' + d.values.raw[0].n + ' (' + d3$1.format('0.1%')(d.total) + ')'
      );
    var dimensions = text[0][0].getBBox();
    tooltip.classed('svg-tooltip', true); //have to run after .getBBox() in FF/EI since this sets display:none

    var background = tooltip
      .append('rect')
      .attr({
        id: 'background',
        x: dimensions.x - 5,
        y: dimensions.y - 2,
        width: dimensions.width + 10,
        height: dimensions.height + 4
      })
      .style({
        fill: 'black',
        stroke: 'white'
      });
    tooltip[0][0].insertBefore(background[0][0], text[0][0]);
  }

  function highlightData(chart) {
    var codebook = d3$1
        .select(chart.wrap.node().parentNode.parentNode.parentNode)
        .datum(),
      // codebook object is attached to .summaryTable element
      bars = chart.svg.selectAll('.bar-group');

    bars.on('click', function(d) {
      indicateLoading(codebook, '.highlightCount', function() {
        var newIndexes =
          chart.config.chartType.indexOf('Bars') > -1
            ? d.values.raw[0].indexes
            : chart.config.chartType === 'histogramBoxPlot'
              ? d.values.raw.map(function(di) {
                  return di.index;
                })
              : [];
        var currentIndexes = codebook.data.highlighted.map(function(di) {
          return di['web-codebook-index'];
        });
        var removeIndexes = currentIndexes.filter(function(di) {
          return newIndexes.indexOf(di) > -1;
        });

        codebook.data.highlighted = codebook.data.filtered.filter(function(di) {
          return removeIndexes.length
            ? currentIndexes.indexOf(di['web-codebook-index']) > -1 &&
                removeIndexes.indexOf(di['web-codebook-index']) === -1
            : currentIndexes.indexOf(di['web-codebook-index']) > -1 ||
                newIndexes.indexOf(di['web-codebook-index']) > -1;
        });

        //Display highlighted data in listing & codebook.
        codebook.data.makeSummary(codebook);
        codebook.dataListing.init(codebook);
        codebook.summaryTable.draw(codebook);
        codebook.chartMaker.draw(codebook);
        codebook.title.updateCountSummary(codebook);
      });
    });
  }

  function onResize() {
    var context = this;

    moveYaxis(this);
    //remove x-axis text
    var ticks = this.wrap.selectAll('g.x.axis g.tick');
    ticks.select('text').remove();
    this.svg.selectAll('g.bar-group').each(function(d, i) {
      makeTooltip(d, i, context);
    });

    //Add modal to nearest mark.
    var bars = this.svg.selectAll('.bar-group:not(.sub)');
    var tooltips = this.svg.selectAll('.svg-tooltip');
    var statistics = this.svg.selectAll('.statistic');

    this.svg
      .on('mousemove', function() {
        //Highlight closest bar.
        var mouse = d3$1.mouse(this);
        var x = mouse[0];
        var y = mouse[1];
        var minimum = void 0;
        bars.each(function(d, i) {
          d.distance = Math.abs(context.x(d.values.x) - x);
          if (i === 0 || d.distance < minimum) {
            minimum = d.distance;
          }
        });

        //In the instance of equally close bars, e.g. an unhighlighted and highlighted bar, choose one randomly.
        var closest = bars.filter(function(d) {
          return d.distance === minimum;
        });
        if (closest.size() > 1) {
          var arbitrary = void 0;
          closest = closest.filter(function(d, i) {
            if (i === 0) arbitrary = Math.round(Math.random());
            return i === arbitrary;
          });
        }
        bars
          .select('rect')
          .style('stroke-width', null)
          .style('stroke', null);
        closest = closest.select('rect');

        //Activate tooltip.
        var d = closest.datum();
        tooltips.classed('active', false);
        context.svg.select('#' + d.selector).classed('active', true);

        closest.style('stroke-width', '3px').style('stroke', 'black');
      })
      .on('mouseout', function() {
        context.svg.selectAll('g.svg-tooltip').classed('active', false);
        bars
          .select('rect')
          .style('stroke-width', null)
          .style('stroke', null);
      });

    //Add event listener to marks to highlight data.
    highlightData(this);

    //hide legend
    this.legend.remove();
  }

  function onInit() {
    //Add group labels.
    var chart = this;
    if (this.config.group_col) {
      var groupTitle = this.wrap
        .append('p')
        .attr('class', 'panel-label')
        .style('margin-left', chart.config.margin.left + 'px')
        .html(
          this.config.group_col +
            ': <strong>' +
            this.config.group_val +
            '</strong> (n=' +
            this.config.n +
            ')'
        );
      this.wrap
        .node()
        .parentNode.insertBefore(groupTitle.node(), this.wrap.node());
    }
  }

  function axisSort(a, b, type) {
    var alpha = a.key < b.key ? -1 : 1;
    if (type == 'Alphabetical') {
      return alpha;
    } else if (type == 'Descending') {
      return a.prop_n > b.prop_n ? -2 : a.prop_n < b.prop_n ? 2 : alpha;
    } else if (type == 'Ascending') {
      return a.prop_n > b.prop_n ? 2 : a.prop_n < b.prop_n ? -2 : alpha;
    }
  }

  function createVerticalBars(this_, d) {
    var chartContainer = d3$1.select(this_).node();
    var rowSelector = d3$1.select(this_).node().parentNode;
    var sortType = d3$1
      .select(rowSelector)
      .select('.row-controls .x-axis-sort select')
      .property('value');
    var outcome = d3$1
      .select(rowSelector)
      .select('.row-controls .y-axis-outcome select')
      .property('value');
    var chartSettings = {
      y: {
        column: outcome === 'rate' ? 'prop_n' : 'n',
        type: 'linear',
        label: '',
        format: outcome === 'rate' ? '0.1%' : 'd',
        domain: [0, null]
      },
      x: {
        column: 'key',
        type: 'ordinal',
        label: ''
      },
      marks: [
        {
          type: 'bar',
          per: ['key'],
          attributes: {
            stroke: null
          }
        }
      ],
      colors: ['#999'],
      gridlines: 'y',
      resizable: false,
      height: this_.height,
      margin: this_.margin,
      value_col: d.value_col,
      group_col: d.group || null,
      group_label: d.groupLabel || null,
      overall: d.statistics.values,
      sort: sortType, //Alphabetical, Ascending, Descending
      chartType: d.chartType
    };

    chartSettings.margin.bottom = 10;

    var chartData = d.statistics.values.sort(function(a, b) {
      return axisSort(a, b, chartSettings.sort);
    });
    chartSettings.x.order = chartData.map(function(d) {
      return d.key;
    });
    var x_dom = chartData.map(function(d) {
      return d.key;
    });

    //Add highlight values (if any)
    chartData.forEach(function(d) {
      d.type = 'Main';
    });

    if (d.statistics.highlightValues) {
      d.statistics.highlightValues.forEach(function(d) {
        d.type = 'sub';
      });
      chartData = d3$1.merge([chartData, d.statistics.highlightValues]);

      chartSettings.marks[0].per = ['key', 'type'];
      chartSettings.marks[0].arrange = 'nested';
      chartSettings.color_by = 'type';
      chartSettings.colors = ['#999', 'orange'];
    }

    if (d.groups) {
      //Set upper limit of y-axis domain to the maximum group rate.
      chartSettings.y.domain[1] = d3$1.max(d.groups, function(di) {
        return d3$1.max(di.statistics.values, function(dii) {
          return dii[chartSettings.y.column];
        });
      });

      chartSettings.x.domain = x_dom; //use the overall x domain in paneled charts
      d.groups.forEach(function(group) {
        //Define group-level settings.
        group.chartSettings = clone(chartSettings);
        group.chartSettings.group_val = group.group;
        group.chartSettings.n = group.values.length;
        group.data = group.statistics.values;
        group.data.forEach(function(d) {
          d.type = 'main';
        });
        if (group.statistics.highlightValues) {
          group.statistics.highlightValues.forEach(function(d) {
            d.type = 'sub';
          });
          group.data = d3$1.merge([
            group.data,
            group.statistics.highlightValues
          ]);

          group.chartSettings.marks[0].per = ['key', 'type'];
          group.chartSettings.marks[0].arrange = 'nested';
          group.chartSettings.color_by = 'type';
          group.chartSettings.colors = ['#999', 'orange'];
        }

        //Define chart.
        group.chart = webcharts.createChart(
          chartContainer,
          group.chartSettings
        );
        group.chart.on('init', onInit);
        group.chart.on('resize', onResize);

        if (group.data.length) group.chart.init(group.data);
        else {
          d3$1
            .select(chartContainer)
            .append('p')
            .text(
              chartSettings.group_col +
                ': ' +
                group.chartSettings.group_val +
                ' (n=' +
                group.chartSettings.n +
                ')'
            );

          d3$1
            .select(chartContainer)
            .append('div')
            .html('<em>No data available for this level.</em>.<br><br>');
        }
      });
    } else {
      //Define chart.
      var chart = webcharts.createChart(chartContainer, chartSettings);
      chart.on('init', onInit);
      chart.on('resize', onResize);
      chart.init(chartData);
    }
  }

  function createVerticalBarsControls(this_, d) {
    var controlsContainer = d3$1
      .select(this_)
      .append('div')
      .classed('row-controls', true);

    //add control that changes y-axis scale
    var outcomes = ['rate', 'frequency'];
    var outcomeWrap = controlsContainer
      .append('div')
      .classed('y-axis-outcome', true);
    outcomeWrap.append('small').text('Summarize by: ');
    var outcomeSelect = outcomeWrap.append('select');
    outcomeSelect
      .selectAll('option')
      .data(outcomes)
      .enter()
      .append('option')
      .text(function(d) {
        return d;
      });

    outcomeSelect.on('change', function() {
      d3$1
        .select(this_)
        .selectAll('.wc-chart')
        .remove();
      d3$1
        .select(this_)
        .selectAll('.panel-label')
        .remove();
      createVerticalBars(this_, d);
    });

    //add control that changes x-axis order
    var sort_values = ['Alphabetical', 'Ascending', 'Descending'];
    var sortWrap = controlsContainer.append('div').classed('x-axis-sort', true);
    sortWrap.append('small').text('Sort levels: ');
    var x_sort = sortWrap.append('select');
    x_sort
      .selectAll('option')
      .data(sort_values)
      .enter()
      .append('option')
      .text(function(d) {
        return d;
      });

    x_sort.on('change', function() {
      d3$1
        .select(this_)
        .selectAll('.wc-chart')
        .remove();
      d3$1
        .select(this_)
        .selectAll('.panel-label')
        .remove();
      createVerticalBars(this_, d);
    });
  }

  function onInit$1() {
    //Add group labels.
    var chart = this;
    if (this.config.group_col) {
      var groupTitle = this.wrap
        .append('p')
        .attr('class', 'panel-label')
        .style('margin-left', chart.config.margin.left + 'px')
        .html(
          this.config.group_col +
            ': <strong>' +
            this.config.group_val +
            '</strong> (n=' +
            this.config.n +
            ')'
        );
      this.wrap
        .node()
        .parentNode.insertBefore(groupTitle.node(), this.wrap.node());
    }
  }

  function moveYaxis$1(chart) {
    var ticks = chart.wrap.selectAll('g.y.axis g.tick');
    ticks.select('text').remove();
    ticks.append('title').text(function(d) {
      return d;
    });
    ticks
      .append('text')
      .attr({
        'text-anchor': 'start',
        'alignment-baseline': 'middle',
        dx: '2.5em',
        x: chart.plot_width
      })
      .text(function(d) {
        return d.length < 25 ? d : d.substring(0, 25) + '...';
      });
  }

  function drawOverallMark(chart) {
    //Clear overall marks.
    chart.svg.selectAll('.overall-mark').remove();

    //For each mark draw an overall mark.
    chart.config.overall.forEach(function(d) {
      if (chart.config.y.order.indexOf(d.key) > -1) {
        var g = chart.svg.append('g').classed('overall-mark', true);
        var x = d[chart.config.x.column];
        var y = d.key;

        //Draw vertical line representing the overall rate of the current categorical value.
        if (chart.y(y)) {
          var rateLine = g
            .append('line')
            .attr({
              x1: chart.x(x),
              y1: chart.y(y),
              x2: chart.x(x),
              y2: chart.y(y) + chart.y.rangeBand()
            })
            .style({
              stroke: 'black',
              'stroke-width': '2px',
              'stroke-opacity': '1'
            });
          rateLine
            .append('title')
            .text('Overall rate: ' + d3$1.format(chart.config.x.format)(x));
        }
      }
    });
  }

  function drawDifferences(chart) {
    //Clear difference marks and annotations.
    chart.svg.selectAll('.difference-from-total').remove();

    //For each mark draw a difference mark and annotation.
    chart.current_data
      .filter(function(d) {
        return d.values.raw[0].type == 'main';
      })
      .forEach(function(d) {
        var overall = chart.config.overall.filter(function(di) {
            return di.key === d.values.raw[0].key;
          })[0],
          g = chart.svg
            .append('g')
            .classed('difference-from-total', true)
            .style('display', 'none'),
          x = overall[chart.config.x.column],
          y = overall.key;

        //Draw line from overall rate to group rate.
        var diffLine = g
          .append('line')
          .attr({
            x1: chart.x(x),
            y1: chart.y(y) + chart.y.rangeBand() / 2,
            x2: chart.x(d.total),
            y2: chart.y(y) + chart.y.rangeBand() / 2
          })
          .style({
            stroke: 'black',
            'stroke-width': '2px',
            'stroke-opacity': '.25'
          });
        diffLine
          .append('title')
          .text(
            'Difference from overall rate: ' +
              d3$1.format('.1f')((d.total - x) * 100)
          );
        var diffText = g
          .append('text')
          .attr({
            x: chart.x(d.total),
            y: chart.y(y) + chart.y.rangeBand() / 2,
            dx: x < d.total ? '5px' : '-2px',
            'text-anchor': x < d.total ? 'beginning' : 'end',
            'font-size': '0.7em'
          })
          .text(
            '' +
              (x < d.total ? '+' : x > d.total ? '-' : '') +
              d3$1.format('.1f')(Math.abs(d.total - x) * 100)
          );
      });

    //Display difference from total on hover.
    chart.svg
      .on('mouseover', function() {
        chart.svg.selectAll('.difference-from-total').style('display', 'block');
        chart.svg.selectAll('.difference-from-total text').each(function() {
          d3$1.select(this).attr('dy', this.getBBox().height / 4);
        });
      })
      .on('mouseout', function() {
        return chart.svg
          .selectAll('.difference-from-total')
          .style('display', 'none');
      });
  }

  function onResize$1() {
    moveYaxis$1(this);
    if (this.config.x.column === 'prop_n') {
      drawOverallMark(this);

      if (this.config.group_col) drawDifferences(this);
    }

    //Add event listener to marks to highlight data.
    highlightData(this);

    //hide legend
    this.legend.remove();
  }

  function createHorizontalBars(this_, d) {
    var rowSelector = d3$1.select(this_).node().parentNode,
      outcome = d3$1
        .select(rowSelector)
        .select('.row-controls .x-axis-outcome select')
        .property('value'),
      custom_height = d.statistics.values.length * 20 + 35,
      // let height vary based on the number of levels; 35 ~= top and bottom margin
      chartContainer = d3$1.select(this_).node(),
      chartSettings = {
        x: {
          column: outcome === 'rate' ? 'prop_n' : 'n',
          type: 'linear',
          label: '',
          format: outcome === 'rate' ? '%' : 'd',
          domain: [0, null]
        },
        y: {
          column: 'key',
          type: 'ordinal',
          label: ''
        },
        marks: [
          {
            type: 'bar',
            per: ['key'],
            tooltip: '[key]: [n] ([prop_n_text])',
            attributes: {
              stroke: null
            }
          }
        ],
        colors: ['#999'],
        gridlines: 'x',
        resizable: false,
        height: custom_height,
        margin: this_.margin,
        value_col: d.value_col,
        group_col: d.group || null,
        group_label: d.groupLabel || null,
        overall: d.statistics.values,
        chartType: d.chartType
      };
    var chartData = d.statistics.values.sort(function(a, b) {
      return a.prop_n > b.prop_n
        ? -2
        : a.prop_n < b.prop_n
          ? 2
          : a.key < b.key
            ? -1
            : 1;
    }); // sort data by descending rate and keep only the first five categories.

    chartSettings.y.order = chartData
      .map(function(d) {
        return d.key;
      })
      .reverse();

    //Add highlight values (if any)
    chartData.forEach(function(d) {
      d.type = 'Main';
    });

    if (d.statistics.highlightValues) {
      d.statistics.highlightValues.forEach(function(d) {
        d.type = 'sub';
      });
      chartData = d3$1.merge([chartData, d.statistics.highlightValues]);

      chartSettings.marks[0].per = ['key', 'type'];
      chartSettings.marks[0].arrange = 'nested';
      chartSettings.color_by = 'type';
      chartSettings.colors = ['#999', 'orange'];
    }

    if (d.groups) {
      //Set upper limit of x-axis domain to the maximum group rate.
      chartSettings.x.domain[1] = d3$1.max(d.groups, function(di) {
        return d3$1.max(di.statistics.values, function(dii) {
          return dii[chartSettings.x.column];
        });
      });

      d.groups.forEach(function(group) {
        //Define group-level settings.
        group.chartSettings = clone(chartSettings);
        group.chartSettings.group_val = group.group;
        group.chartSettings.n = group.values.length;

        //Sort data by descending rate and keep only the first five categories.
        group.data = group.statistics.values
          .filter(function(di) {
            return chartSettings.y.order.indexOf(di.key) > -1;
          })
          .sort(function(a, b) {
            return a.prop_n > b.prop_n
              ? -2
              : a.prop_n < b.prop_n
                ? 2
                : a.key < b.key
                  ? -1
                  : 1;
          });

        group.data.forEach(function(d) {
          d.type = 'main';
        });
        if (group.statistics.highlightValues) {
          group.statistics.highlightValues.forEach(function(d) {
            d.type = 'sub';
          });
          group.data = d3$1.merge([
            group.data,
            group.statistics.highlightValues
          ]);

          group.chartSettings.marks[0].per = ['key', 'type'];
          group.chartSettings.marks[0].arrange = 'nested';
          group.chartSettings.color_by = 'type';
          group.chartSettings.colors = ['#999', 'orange'];
        }

        //Define chart.
        group.chart = webcharts.createChart(
          chartContainer,
          group.chartSettings
        );
        group.chart.on('init', onInit$1);
        group.chart.on('resize', onResize$1);

        if (group.data.length) group.chart.init(group.data);
        else {
          d3$1
            .select(chartContainer)
            .append('p')
            .text(
              chartSettings.group_col +
                ': ' +
                group.chartSettings.group_val +
                ' (n=' +
                group.chartSettings.n +
                ')'
            );
          d3$1
            .select(chartContainer)
            .append('div')
            .html('<em>All values missing in this group.</em>.<br><br>');
        }
      });
    } else {
      //Define chart.
      var chart = webcharts.createChart(chartContainer, chartSettings);
      chart.on('init', onInit$1);
      chart.on('resize', onResize$1);
      chart.init(chartData);
    }
  }

  function moveYaxis$2(chart) {
    var ticks = chart.wrap.selectAll('g.y.axis g.tick');
    ticks.select('text').remove();
    ticks.append('title').text(function(d) {
      return d;
    });
    ticks
      .append('text')
      .attr({
        'text-anchor': 'start',
        'alignment-baseline': 'middle',
        dx: '1em',
        x: chart.plot_width
      })
      .text(function(d) {
        return d.length < 30 ? d : d.substring(0, 30) + '...';
      });
  }

  function drawOverallMark$1(chart) {
    //Clear overall marks.
    chart.svg.selectAll('.overall-mark').remove();

    //For each mark draw an overall mark.
    chart.config.overall.forEach(function(d) {
      if (chart.config.y.order.indexOf(d.key) > -1) {
        var g = chart.svg.append('g').classed('overall-mark', true);
        var x = d.prop_n;
        var y = d.key;

        //Draw vertical line representing the overall rate of the current categorical value.
        if (chart.y(y)) {
          var rateLine = g
            .append('line')
            .attr({
              x1: chart.x(x),
              y1: chart.y(y),
              x2: chart.x(x),
              y2: chart.y(y) + chart.y.rangeBand()
            })
            .style({
              stroke: 'black',
              'stroke-width': '2px',
              'stroke-opacity': '1'
            });
          rateLine
            .append('title')
            .text('Overall rate: ' + d3$1.format('.1%')(x));
        }
      }
    });
  }

  function modifyOverallLegendMark(chart) {
    var legendItems = chart.wrap.selectAll('.legend-item'),
      overallMark = legendItems
        .filter(function(d) {
          return d.label === 'Overall';
        })
        .select('svg'),
      BBox = overallMark.node().getBBox();
    overallMark.select('.legend-mark').remove();
    overallMark
      .append('line')
      .classed('legend-mark', true)
      .attr({
        x1: (3 * BBox.width) / 4,
        y1: 0,
        x2: (3 * BBox.width) / 4,
        y2: BBox.height
      })
      .style({
        stroke: 'black',
        'stroke-width': '2px',
        'stroke-opacity': '1'
      });
    legendItems.selectAll('circle').attr('r', '.4em');
  }

  function onResize$2() {
    moveYaxis$2(this);
    if (this.config.x.column === 'prop_n') {
      drawOverallMark$1(this);
      if (this.config.color_by) modifyOverallLegendMark(this);

      //Hide overall dots.
      if (this.config.color_by) this.svg.selectAll('.Overall').remove();
      else this.svg.selectAll('.point').remove();
    }
  }

  function createDotPlot(this_, d) {
    var rowSelector = d3$1.select(this_).node().parentNode,
      outcome = d3$1
        .select(rowSelector)
        .select('.row-controls .x-axis-outcome select')
        .property('value'),
      chartContainer = d3$1.select(this_).node(),
      chartSettings = {
        x: {
          column: outcome === 'rate' ? 'prop_n' : 'n',
          type: 'linear',
          label: '',
          format: outcome === 'rate' ? '%' : 'd',
          domain: [0, null]
        },
        y: {
          column: 'key',
          type: 'ordinal',
          label: ''
        },
        marks: [
          {
            type: 'circle',
            per: ['key'],
            summarizeX: 'mean',
            tooltip: '[key]: [n] ([prop_n_text])'
          }
        ],
        gridlines: 'xy',
        resizable: false,
        height: this_.height,
        margin: this_.margin,
        value_col: d.value_col,
        group_col: d.group || null,
        group_label: d.groupLabel || null,
        overall: d.statistics.values,
        chartType: d.chartType
      },
      chartData = d.statistics.values
        .sort(function(a, b) {
          return a.prop_n > b.prop_n
            ? -2
            : a.prop_n < b.prop_n
              ? 2
              : a.key < b.key
                ? -1
                : 1;
        })
        .slice(0, 5); // sort data by descending rate and keep only the first five categories.

    chartSettings.y.order = chartData
      .map(function(d) {
        return d.key;
      })
      .reverse();

    if (d.groups) {
      //Define overall data.
      chartData.forEach(function(di) {
        return (di.group = 'Overall');
      });

      //Add group data to overall data.
      d.groups.forEach(function(group) {
        group.statistics.values
          .filter(function(value) {
            return chartSettings.y.order.indexOf(value.key) > -1;
          })
          .sort(function(a, b) {
            return a.prop_n > b.prop_n
              ? -2
              : a.prop_n < b.prop_n
                ? 2
                : a.key < b.key
                  ? -1
                  : 1;
          })
          .forEach(function(value) {
            value.group = group.group;
            chartData.push(value);
          });
      });

      chartSettings.marks[0].per.push('group');

      //Overall mark
      if (outcome === 'rate') {
        chartSettings.marks[0].values = { group: ['Overall'] };

        //Group marks
        chartSettings.marks[1] = clone(chartSettings.marks[0]);
        chartSettings.marks[1].values = {
          group: d.groups.map(function(d) {
            return d.group;
          })
        };
      }

      chartSettings.color_by = 'group';
      chartSettings.legend = {
        label: '',
        order: d.groups.map(function(d) {
          return d.group;
        }),
        mark: 'circle'
      };
    }

    var chart = webcharts.createChart(chartContainer, chartSettings);
    chart.on('resize', onResize$2);
    chart.init(
      chartData.filter(function(d) {
        return !(outcome === 'frequency' && d.group === 'Overall');
      })
    );
  }

  function createHorizontalBarsControls(this_, d) {
    var controlsContainer = d3$1
      .select(this_)
      .append('div')
      .classed('row-controls', true);

    //add control that changes y-axis scale
    var outcomes = ['rate', 'frequency'];
    var outcomeWrap = controlsContainer
      .append('div')
      .classed('x-axis-outcome', true);
    outcomeWrap.append('small').text('Summarize by: ');
    var outcomeSelect = outcomeWrap.append('select');
    outcomeSelect
      .selectAll('option')
      .data(outcomes)
      .enter()
      .append('option')
      .text(function(d) {
        return d;
      });

    outcomeSelect.on('change', function() {
      d3$1
        .select(this_)
        .selectAll('.wc-chart')
        .remove();
      d3$1
        .select(this_)
        .selectAll('.panel-label')
        .remove();
      if (type_control.property('value') === 'Paneled (Bar Charts)') {
        createHorizontalBars(this_, d);
      } else {
        createDotPlot(this_, d);
      }
    });

    //add control that change chart type
    var chart_type_values = ['Paneled (Bar Charts)', 'Grouped (Dot Plot)'];
    var chartTypeWrap = controlsContainer
      .append('div')
      .classed('chart-type', true)
      .classed('hidden', !d.groups); // hide the controls if the chart isn't Grouped
    chartTypeWrap.append('small').text('Display Type: ');
    var type_control = chartTypeWrap.append('select');
    type_control
      .selectAll('option')
      .data(chart_type_values)
      .enter()
      .append('option')
      .text(function(d) {
        return d;
      });

    type_control.on('change', function() {
      d3$1
        .select(this_)
        .selectAll('.wc-chart')
        .remove();
      d3$1
        .select(this_)
        .selectAll('.panel-label')
        .remove();
      if (this.value == 'Paneled (Bar Charts)') {
        createHorizontalBars(this_, d);
      } else {
        createDotPlot(this_, d);
      }
    });
  }

  var defaultSettings =
    //Custom settings
    {
      measure: null,
      panel: null,
      measureFormat: ',.2f',
      boxPlot: true,
      nBins: null,
      mean: true,
      overall: false,
      boxPlotHeight: 20,
      commonScale: true,
      //Webcharts settings
      x: {
        column: null, // set in syncSettings()
        type: 'linear',
        label: '',
        bin: null
      }, // set in syncSettings()
      y: {
        column: null, // set in syncSettings()
        type: 'linear',
        label: '',
        domain: [0, null]
      },
      marks: [
        {
          type: 'bar',
          per: null, // set in syncSettings()
          summarizeX: 'mean',
          summarizeY: 'count',
          attributes: {
            fill: '#999',
            stroke: '#333',
            'stroke-width': '1px'
          }
        }
      ],
      gridlines: 'y',
      resizable: true,
      aspect: 12,
      margin: {
        right: 25,
        left: 100 // space for panel value
      }
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
    var format = d3$1.format(context.config.measureFormat),
      offset = context.plot_width / context.config.x.bin / 2 + 8;
    d.midpoint = (d.rangeHigh + d.rangeLow) / 2;
    d.range = format(d.rangeLow) + '-' + format(d.rangeHigh);
    d.selector = 'bar' + i;
    d.side = context.x(d.midpoint) < context.plot_width / 2 ? 'left' : 'right';
    d.xPosition =
      d.side === 'left'
        ? context.x(d.midpoint) + offset
        : context.x(d.midpoint) - offset;

    //Define tooltips.
    var tooltip = context.svg.append('g').attr('id', d.selector),
      text = tooltip.append('text').attr({
        id: 'text',
        x: d.xPosition,
        y: context.plot_height,
        dy: '-.75em',
        'font-size': '75%',
        'font-weight': 'bold',
        fill: 'white'
      });
    text
      .append('tspan')
      .attr({
        x: d.xPosition,
        'text-anchor': d.side === 'left' ? 'start' : 'end'
      })
      .text('Range: ' + d.range);
    text
      .append('tspan')
      .attr({
        x: d.xPosition,
        dy: '-1.5em',
        'text-anchor': d.side === 'left' ? 'start' : 'end'
      })
      .text('n: ' + d.total);
    var dimensions = text[0][0].getBBox();
    tooltip.classed('svg-tooltip', true); //have to run after .getBBox() in FF/EI since this sets display:none

    var background = tooltip
      .append('rect')
      .attr({
        id: 'background',
        x: dimensions.x - 5,
        y: dimensions.y - 2,
        width: dimensions.width + 10,
        height: dimensions.height + 4
      })
      .style({
        fill: 'black',
        stroke: 'white'
      });
    tooltip[0][0].insertBefore(background[0][0], text[0][0]);
  }

  function moveYaxis$3(chart) {
    var ticks = chart.wrap.selectAll('g.y.axis g.tick');
    ticks.select('text').remove();
    ticks.append('title').text(function(d) {
      return d;
    });
    ticks
      .append('text')
      .attr({
        'text-anchor': 'start',
        'alignment-baseline': 'middle',
        dx: '.5em',
        x: chart.plot_width
      })
      .text(function(d) {
        return d;
      });
  }

  function moveXaxis(chart) {
    var xticks = chart.svg.select('.x.axis').selectAll('g.tick');
    xticks.select('text').remove();
    xticks
      .append('text')
      .attr('y', chart.config.boxPlotHeight)
      .attr('dy', '1em')
      .attr('x', 0)
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'top')
      .text(function(d) {
        return d;
      });
  }

  function addHighlightMarks(chart) {
    //add highlights for each bar (if any exist)
    var bars = chart.svg.selectAll('g.bar-group').each(function(d) {
      var highlightCount = d3$1.sum(d.values.raw, function(d) {
        return d.highlighted ? 1 : 0;
      });
      //Clone the rect (if there are highlights)
      if (highlightCount > 0) {
        var rect = d3$1.select(this).select('rect');
        var rectNode = rect.node();
        var highlightRect = d3$1.select(this).append('rect');

        highlightRect
          .attr('x', chart.x(d.rangeLow) + 1)
          .attr('y', chart.y(highlightCount))
          .attr('height', chart.y(0) - chart.y(highlightCount))
          .attr('width', chart.x(d.rangeHigh) - 1 - (chart.x(d.rangeLow) + 1))
          .attr('fill', 'orange');
      }
    });
  }

  function addBoxPlot(chart) {
    var format = d3$1.format(chart.config.measureFormat);

    //Annotate quantiles
    if (chart.config.boxPlot) {
      var quantiles = [
        { probability: 0.05, label: '5th percentile' },
        { probability: 0.25, label: '1st quartile' },
        { probability: 0.5, label: 'Median' },
        { probability: 0.75, label: '3rd quartile' },
        { probability: 0.95, label: '95th percentile' }
      ];

      for (var item in quantiles) {
        var quantile = quantiles[item];
        quantile.quantile = d3$1.quantile(chart.values, quantile.probability);

        //Horizontal lines
        if ([0.05, 0.75].indexOf(quantile.probability) > -1) {
          var rProbability = quantiles[+item + 1].probability;
          var rQuantile = d3$1.quantile(chart.values, rProbability);
          var whisker = chart.svg
            .append('line')
            .attr({
              class: 'statistic',
              x1: chart.x(quantile.quantile),
              y1: chart.plot_height + chart.config.boxPlotHeight / 2,
              x2: chart.x(rQuantile),
              y2: chart.plot_height + chart.config.boxPlotHeight / 2
            })
            .style({
              stroke: 'black',
              'stroke-width': '2px',
              opacity: 0.25
            });
          whisker
            .append('title')
            .text(
              'Q' +
                quantile.probability +
                '-Q' +
                rProbability +
                ': ' +
                format(quantile.quantile) +
                '-' +
                format(rQuantile)
            );
        }

        //Box
        if (quantile.probability === 0.25) {
          var q3 = d3$1.quantile(chart.values, 0.75);
          var interQ = chart.svg
            .append('rect')
            .attr({
              class: 'statistic',
              x: chart.x(quantile.quantile),
              y: chart.plot_height,
              width: chart.x(q3) - chart.x(quantile.quantile),
              height: chart.config.boxPlotHeight
            })
            .style({
              fill: '#ccc',
              opacity: 0.25
            });
          interQ
            .append('title')
            .text(
              'Interquartile range: ' +
                format(quantile.quantile) +
                '-' +
                format(q3)
            );
        }

        //Vertical lines
        quantile.mark = chart.svg
          .append('line')
          .attr({
            class: 'statistic',
            x1: chart.x(quantile.quantile),
            y1: chart.plot_height,
            x2: chart.x(quantile.quantile),
            y2: chart.plot_height + chart.config.boxPlotHeight
          })
          .style({
            stroke:
              [0.05, 0.95].indexOf(quantile.probability) > -1
                ? 'black'
                : [0.25, 0.75].indexOf(quantile.probability) > -1
                  ? 'black'
                  : 'black',
            'stroke-width': '3px'
          });
        quantile.mark
          .append('title')
          .text(quantile.label + ': ' + format(quantile.quantile));
      }

      var outliers = chart.values.filter(function(f) {
        var low_outlier =
          f <
          quantiles.filter(function(q) {
            if (q.probability == 0.05) {
              return q;
            }
          })[0]['quantile'];
        var high_outlier =
          f >
          quantiles.filter(function(q) {
            if (q.probability == 0.95) {
              return q;
            }
          })[0]['quantile'];
        return low_outlier || high_outlier;
      });

      if (outliers.length < 100) {
        chart.svg
          .selectAll('line.outlier')
          .data(outliers)
          .enter()
          .append('line')
          .attr('class', 'outlier')
          .attr('x1', function(d) {
            return chart.x(d);
          })
          .attr('x2', function(d) {
            return chart.x(d);
          })
          .attr('y1', function(d) {
            return chart.plot_height * 1.07;
          })
          .attr('y2', function(d) {
            return (chart.plot_height + chart.config.boxPlotHeight) / 1.07;
          })
          .style({
            fill: '#000000',
            stroke: 'black',
            'stroke-width': '1px'
          });
      } else {
        console.log(
          outliers.length + ' outliers not drawn for the following chart:'
        );
        console.log(chart.wrap);
      }
    }

    //Annotate mean.
    if (chart.config.mean) {
      var mean = d3$1.mean(chart.values);
      var sd = d3$1.deviation(chart.values);
      var meanMark = chart.svg
        .append('circle')
        .attr({
          class: 'statistic',
          cx: chart.x(mean),
          cy: chart.plot_height + chart.config.boxPlotHeight / 2,
          r: chart.config.boxPlotHeight / 3
        })
        .style({
          fill: '#000000',
          stroke: 'black',
          'stroke-width': '1px'
        });
      meanMark
        .append('title')
        .text(
          'n: ' +
            chart.values.length +
            '\nMean: ' +
            format(mean) +
            '\nSD: ' +
            format(sd)
        );
    }
  }

  function addModals(chart) {
    var bars = chart.svg.selectAll('.bar-group');
    var tooltips = chart.svg.selectAll('.svg-tooltip');
    var statistics = chart.svg.selectAll('.statistic');
    chart.svg
      .on('mousemove', function() {
        //Highlight closest bar.
        var mouse = d3$1.mouse(this);
        var x = chart.x.invert(mouse[0]);
        var y = chart.y.invert(mouse[1]);
        var minimum = void 0;
        bars.each(function(d, i) {
          d.distance = Math.abs(d.midpoint - x);
          if (i === 0 || d.distance < minimum) {
            minimum = d.distance;
          }
        });
        var closest = bars
          .filter(function(d) {
            return d.distance === minimum;
          })
          .filter(function(d, i) {
            return i === 0;
          })
          .select('rect');
        bars.select('rect').style('stroke-width', '1px');
        closest.style('stroke-width', '3px');

        //Activate tooltip.
        var d = closest.datum();
        tooltips.classed('active', false);
        chart.svg.select('#' + d.selector).classed('active', true);
      })
      .on('mouseout', function() {
        bars.select('rect').style('stroke-width', '1px');
        chart.svg.selectAll('g.svg-tooltip').classed('active', false);
      });
  }

  function onResize$3() {
    var context = this;

    //Hide overall plot if [settings.overall] is set to false.
    if (!this.config.overall && !this.group) {
      this.wrap.style('display', 'none');
      this.wrap.classed('overall', true);
    } else {
      //Clear custom marks.
      this.svg.selectAll('g.svg-tooltip').remove();
      this.svg.selectAll('.statistic').remove();

      //Add boxPlot
      addBoxPlot(this);

      //Create tooltips
      this.svg.selectAll('g.bar-group').each(function(d, i) {
        makeTooltip$1(d, i, context);
      });

      this.svg.select('g.y.axis text.axis-title').remove(); //Remove y-axis label
      this.wrap.select('ul.legend').remove(); //Hide legends.
      moveXaxis(this); //Shift x-axis tick labels downward.
      addModals(this); //Add modal to nearest mark.
    }

    moveYaxis$3(this); //Move Y axis to the right
    highlightData(this); //Add event listener to marks to highlight data.
    addHighlightMarks(this); //add new rects for highlight marks (if any)
  }

  function onInit$2() {
    var context = this;
    var config = this.initialSettings;
    var measure = config.measure;
    var panel = config.panel;

    //Add a label
    if (this.group) {
      var groupTitle = this.wrap
        .append('p')
        .attr('class', 'panel-label')
        .style('margin-left', context.config.margin.left + 'px')
        .html(
          this.config.group_col +
            ': <strong>' +
            this.group +
            '</strong> (n=' +
            this.raw_data.length +
            ')'
        );
      this.wrap
        .node()
        .parentNode.insertBefore(groupTitle.node(), this.wrap.node());
    }

    //Remove non-numeric and missing values.
    if (!this.group) {
      this.initialSettings.unfilteredData = this.raw_data;
      this.raw_data = this.initialSettings.unfilteredData.filter(function(d) {
        return !isNaN(+d[measure]) && !/^\s*$/.test(d[measure]);
      });
    }

    //Create array of values.
    this.values = this.raw_data
      .map(function(d) {
        return +d[measure];
      })
      .sort(function(a, b) {
        return a - b;
      });

    //Define x-axis domain as the range of the measure, regardless of subgrouping.
    if (!this.initialSettings.xDomain) {
      this.initialSettings.xDomain = d3$1.extent(this.values);
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
        var nestedData = d3$1
          .nest()
          .key(function(d) {
            return d[panel];
          })
          .entries(context.raw_data);
        nestedData.forEach(function(group) {
          var domain = d3$1.extent(group.values, function(d) {
            return +d[measure];
          });
          var binWidth = (domain[1] - domain[0]) / config.nBins;
          group.values.forEach(function(d) {
            d.bin =
              Math.floor((+d[measure] - domain[0]) / binWidth) -
              (+d[measure] === domain[1]) * 1;
          });
          var bins = d3$1
            .nest()
            .key(function(d) {
              return d.bin;
            })
            .rollup(function(d) {
              return d.length;
            })
            .entries(group.values);
          max = Math.max(
            max,
            d3$1.max(bins, function(d) {
              return d.values;
            })
          );
        });
      }

      //Plot the chart for each group.
      var groups = d3$1
        .set(
          context.raw_data.map(function(d) {
            return d[panel];
          })
        )
        .values()
        .map(function(d) {
          return { group: d };
        })
        .sort(function(a, b) {
          return a.group < b.group ? -1 : 1;
        });

      groups.forEach(function(group, i) {
        group.settings = clone(config);
        group.settings.y.label = group.group;
        group.settings.y.domain = config.commonScale ? [0, max] : [0, null];
        group.data = context.raw_data.filter(function(d) {
          return d[panel] === group.group;
        });
        group.settings.xDomain = config.commonScale
          ? config.xDomain
          : d3$1.extent(group.data, function(d) {
              return +d[measure];
            });
        group.settings.x.domain = group.settings.xDomain;
        group.webChart = new webcharts.createChart(
          config.container,
          group.settings
        );
        group.webChart.initialSettings = group.settings;
        group.webChart.group = group.group;
        group.webChart.on('init', onInit$2);
        group.webChart.on('resize', onResize$3);
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
    chart.on('init', onInit$2);
    chart.on('resize', onResize$3);

    return chart;
  }

  function createHistogramBoxPlot(this_, d) {
    var chartContainer = d3$1.select(this_).node();
    var chartSettings = {
      measure: ' ',
      resizable: false,
      height: 100,
      margin: this_.margin,
      nBins: d.bins,
      chartType: d.chartType,
      commonScale: d.commonScale == undefined ? true : d.commonScale
    };
    var chartData = [];

    if (d.groups) {
      chartSettings.panel = 'group';
      chartSettings.group_col = d.group;
      chartSettings.group_label = d.groupLabel;
      d.groups.forEach(function(group) {
        group.values.forEach(function(value) {
          chartData.push({
            group: group.group || '<no value>',
            ' ': value.value,
            index: value.index,
            highlighted: value.highlighted
          });
        });
      });
    } else {
      d.values.forEach(function(d) {
        chartData.push({
          ' ': d.value,
          index: d.index,
          highlighted: d.highlighted
        });
      });
    }

    var chart = defineHistogram(chartContainer, chartSettings);
    chart.init(chartData);
  }

  function createHistogramBoxPlotControls(this_, d) {
    var controlsContainer = d3$1
      .select(this_)
      .append('div')
      .classed('row-controls', true);

    //add control for commonScale control (only if data is grouped)
    if (d.group) {
      var commonScaleWrap = controlsContainer
        .append('div')
        .classed('common-scale-control', true);
      commonScaleWrap.append('small').text('Standardize axes across panels? ');
      var commonScaleCheckbox = commonScaleWrap
        .append('input')
        .attr('type', 'checkbox')
        .attr('checked', true);

      commonScaleCheckbox.on('change', function() {
        d3$1
          .select(this_)
          .selectAll('.wc-chart')
          .remove();
        d3$1
          .select(this_)
          .selectAll('.panel-label')
          .remove();
        d.commonScale = this.checked;
        createHistogramBoxPlot(this_, d);
      });
    }
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
    createHistogramBoxPlotControls: createHistogramBoxPlotControls,
    createDotPlot: createDotPlot
  };

  function makeChart(d) {
    //Common chart settings
    this.height = 100;
    this.margin = { right: 200, left: 30 };
    if (d.statistics.n > 0) {
      if (d.chartType === 'horizontalBars') {
        charts.createHorizontalBarsControls(this, d);
        charts.createHorizontalBars(this, d);
      } else if (d.chartType === 'verticalBars') {
        charts.createVerticalBarsControls(this, d);
        charts.createVerticalBars(this, d);
      } else if (d.chartType === 'character') {
        var summary = d3$1
          .select(this)
          .append('div')
          .attr('class', 'characterSummary')
          .html(d.summaryText);

        summary.select('span.drawLevel').on('click', function() {
          var node = this.parentNode.parentNode.parentNode;
          d3.select(node)
            .select('div.characterSummary')
            .remove();
          charts.createVerticalBarsControls(node, d);
          charts.createVerticalBars(node, d);
        });
      } else if (d.chartType === 'histogramBoxPlot') {
        charts.createHistogramBoxPlotControls(this, d);
        charts.createHistogramBoxPlot(this, d);
      } else {
        console.warn('Invalid chart type for ' + d.key);
      }
    } else {
      d3$1
        .select(this)
        .append('div')
        .attr('class', 'missingText')
        .text('All values missing.');
    }
  }

  function renderValues(d, list) {
    //make a list of values
    if (d.type == 'categorical') {
      var topValues = d.statistics.values
        .sort(function(a, b) {
          return b.n - a.n;
        })
        .filter(function(d, i) {
          return i < 5;
        });

      var valueItems = list
        .selectAll('li.value')
        .data(topValues)
        .enter()
        .append('li')
        .attr('class', 'value');

      valueItems
        .append('div')
        .text(function(d) {
          return d.key;
        })
        .attr('class', 'wcb-label')
        .attr('title', function(d) {
          return d.key;
        });

      valueItems
        .append('div')
        .text(function(d) {
          return d.n + ' (' + d3$1.format('0.1%')(d.prop_n) + ')';
        })
        .attr('class', 'value');

      if (d.statistics.values.length > 5) {
        var totLength = d.statistics.values.length;
        var extraCount = totLength - 5;
        var extra_span = list
          .append('li')
          .attr('class', 'value')
          .append('div')
          .attr('class', 'wcb-label')
          .html('and ' + extraCount + ' more.');
      }
    } else if (d.type == 'continuous') {
      var nonMissing = d.values
        .filter(function(f) {
          return !f.missing;
        })
        .map(function(m) {
          return +m.value;
        });
      var sortedValues = d3$1
        .set(nonMissing)
        .values() //get unique
        .sort(function(a, b) {
          return a - b;
        }); // sort low to high

      if (sortedValues.length > 6) {
        var minValues = sortedValues.filter(function(d, i) {
          return i < 3;
        });
        var nValues = sortedValues.length;
        var maxValues = sortedValues.filter(function(d, i) {
          return i >= nValues - 3;
        });
        var valList = d3$1.merge([minValues, ['...'], maxValues]);
      } else {
        var valList = sortedValues;
      }
      var valueItems = list
        .selectAll('li.value')
        .data(valList)
        .enter()
        .append('li')
        .attr('class', 'value');

      valueItems
        .append('div')
        .attr('class', 'wcb-label')
        .text(function(d, i) {
          return i == 0 ? 'Min' : i == valList.length - 1 ? 'Max' : ' ';
        });
      valueItems
        .append('div')
        .attr('class', 'value')
        .text(function(d) {
          return d;
        })
        .attr('title', function(d) {
          return d == '...' ? nValues - 6 + ' other values' : '';
        })
        .style('cursor', function(d) {
          return d == '...' ? 'help' : null;
        });
    }
  }

  //Render Summary Stats
  function renderStats(d, list) {
    var ignoreStats = [
      'values',
      'highlightValues',
      'min',
      'max',
      'n',
      'N',
      'nMissing',
      'percentMissing'
    ];

    var statNames = Object.keys(d.statistics)
      .filter(function(f) {
        return ignoreStats.indexOf(f) === -1;
      }) //remove value lists
      .filter(function(f) {
        return f.indexOf('ile') === -1;
      }); //remove "percentiles"

    var statList = statNames.map(function(stat) {
      return {
        key: stat !== 'missingSummary' ? stat : 'Missing',
        value: d.statistics[stat]
      };
    });

    var stats = list
      .selectAll('li.stat')
      .data(statList)
      .enter()
      .append('li')
      .attr('class', 'stat');
    stats
      .append('div')
      .text(function(d) {
        return d.key;
      })
      .attr('class', 'wcb-label');
    stats
      .append('div')
      .text(function(d) {
        return d.value;
      })
      .attr('class', 'value');
  }

  //Render metadata
  function renderMeta(d, list) {
    list.selectAll('*').remove();

    // don't renderer items with no
    var dropped = [];
    d.meta.forEach(function(d) {
      if (!d.value) {
        d.hidden = true;
        dropped.push(' "' + d.key + '"');
      }
    });

    //render the items
    var metaItems = list
      .selectAll('li.meta')
      .data(
        d.meta.filter(function(f) {
          return f.key != 'Type';
        })
      )
      .enter()
      .append('li')
      .classed('meta', true)
      .classed('hidden', function(d) {
        return d.hidden;
      });

    metaItems
      .append('div')
      .text(function(d) {
        return d.key;
      })
      .attr('class', 'wcb-label');
    metaItems
      .append('div')
      .text(function(d) {
        return d.value;
      })
      .attr('class', 'value');

    if (dropped.length) {
      list
        .append('li')
        .attr('class', 'details')
        .append('div')
        .html('&#9432;')
        .property(
          'title',
          'Meta data for ' +
            dropped.length +
            ' item(s) (' +
            dropped.toString() +
            ') were empty and are hidden.'
        );
    }
  }

  function makeDetails(d) {
    var stat_list = d3$1
      .select(this)
      .append('ul')
      .attr('class', 'stats');
    var val_list = d3$1
      .select(this)
      .append('ul')
      .attr('class', 'values');

    var parent = d3$1.select(this.parentNode.parentNode);

    //render stats & values on initial load
    renderStats(d, stat_list);
    renderValues(d, val_list);
  }

  function makeMeta(d) {
    var hasMeta =
      d.meta
        .filter(function(f) {
          return !f.hidden;
        })
        .filter(function(f) {
          return f.key.toLowerCase() != 'type';
        }).length > 0;
    if (hasMeta) {
      var meta_list = d3$1
        .select(this)
        .append('ul')
        .attr('class', 'meta');

      var parent = d3$1.select(this.parentNode.parentNode);
      renderMeta(d, meta_list);
    } else {
      d3$1.select(this).style('display', 'none');
    }
  }

  function makeHist(this_, d) {
    var height = 15,
      width = 100;

    var svg = d3$1
      .select(this_)
      .append('svg')
      .attr('height', height)
      .attr('width', width)
      .style('margin-right', '0.1em');

    if (d.type == 'categorical') {
      var bins = d.statistics.values;
      bins.forEach(function(d) {
        d.title = d.key + ' - ' + d.n + ' (' + d.prop_n_text + ')';
        d.color = '#999';
      });
    } else if (d.type == 'continuous') {
      var values = d.values
        .filter(function(f) {
          return !f.missing;
        })
        .map(function(m) {
          return +m.value;
        });
      var x_linear = d3$1.scale
        .linear()
        .domain(d3$1.extent(values))
        .range([0, width]);
      var bins = d3$1.layout
        .histogram()
        .bins(x_linear.ticks(50))(values)
        .map(function(m, i) {
          m.key = '[' + m.x + '-' + (m.x + m.dx) + ')';
          m.n = m.length;
          m.title = m.key + ' - ' + m.n;
          m.color = 'black';
          return m;
        });
    }

    // scales
    var x = d3$1.scale
      .ordinal()
      .domain(
        bins.map(function(d) {
          return d.key;
        })
      )
      .rangeBands([0, width], 0.1, 0);

    var width = x.rangeBand();

    var y = d3$1.scale
      .linear()
      .domain([
        0,
        d3$1.max(bins, function(d) {
          return d.n;
        })
      ])
      .range([height, 0]);

    var bar = svg
      .selectAll('.bar')
      .data(bins)
      .enter()
      .append('g')
      .attr('class', 'bar')
      .attr('transform', function(d) {
        return 'translate(' + x(d.key) + ',' + y(d.n) + ')';
      });

    bar
      .append('rect')
      .attr('x', 1)
      .attr('width', width)
      .attr('height', function(d) {
        return height - y(d.n);
      })
      .attr('fill', d.type == 'categorical' ? '#999' : 'black')
      .append('title')
      .text(function(d) {
        return d.title;
      });
  }

  function createSpark() {
    var d = d3$1.select(this).datum();
    if (d.statistics.n > 0) {
      makeHist(this, d);
    }
  }

  function makeTitle(d) {
    var rowDiv = d3$1.select(this.parentNode.parentNode.parentNode);
    var chartDiv = rowDiv.select('.row-chart');
    var hiddenFlag = rowDiv.classed('hiddenDetails');

    //Add row toggle
    d3$1
      .select(this)
      .append('div')
      .attr('class', 'row-toggle')
      .html(hiddenFlag ? '&#9660;' : '&#9658;')
      .classed('hidden', function(d) {
        return d.chartVisibility == 'hidden';
      })
      .on('click', function() {
        var rowDiv = d3$1.select(this.parentNode.parentNode.parentNode);
        var chartDiv = rowDiv.select('.row-chart');
        var hiddenFlag = rowDiv.classed('hiddenDetails');
        rowDiv.classed('hiddenDetails', !hiddenFlag);
        d3$1.select(this).html(hiddenFlag ? '&#9660;' : '&#9658;');
      });

    //add variable name in quotes
    d3$1
      .select(this)
      .append('span')
      .attr('class', 'title-span')
      .text(function(d) {
        return "'" + d.value_col + "'";
      });

    //add variable label (if any)
    if (d.value_col != d.label) {
      d3$1
        .select(this)
        .append('span')
        .attr('class', 'label-span')
        .text(function(d) {
          return d.label;
        });
    }

    //add variable type
    /*
    d3select(this)
      .append('span')
      .attr('class', 'type')
      .text(d => d.type);
    */

    //add sparklines
    var sparkDiv = d3$1
      .select(this)
      .append('div')
      .attr('class', 'spark')
      .datum(d);

    if (d.chartType != 'character') {
      sparkDiv.each(createSpark);
    }

    var type =
      d.type == 'continuous'
        ? 'continuous'
        : d.chartType == 'character'
          ? 'character'
          : 'categorical';
    sparkDiv
      .append('div')
      .attr('class', 'sparkLabel')
      .text(type == 'continuous' ? '#' : type == 'character' ? 'abc' : 'cat')
      .attr('title', type + ' column');

    //add percent missing (if > 0%)
    d3$1
      .select(this)
      .append('span')
      .attr('class', 'percent-missing')
      .text(function(d) {
        return d3$1.format('0.1%')(d.statistics.percentMissing) + ' missing';
      })
      .style('display', function(d) {
        return d.statistics.percentMissing == 0 ? 'none' : null;
      })
      .style('cursor', 'pointer')
      .style('color', function(d) {
        return d.statistics.percentMissing >= 0.1 ? 'red' : '#999';
      })
      .attr('title', function(d) {
        return (
          d.statistics.nMissing +
          ' of ' +
          d.statistics.N +
          ' missing. Missing values include:\n' +
          d.missingSummary
        );
      });
  }

  /*------------------------------------------------------------------------------------------------\
    Intialize the summary table
  \------------------------------------------------------------------------------------------------*/

  function renderRow(d) {
    var rowWrap = d3$1.select(this);
    rowWrap.selectAll('*').remove();

    rowWrap
      .append('div')
      .attr('class', 'row-head section')
      .append('div')
      .attr('class', 'row-title')
      .each(makeTitle);

    rowWrap
      .append('div')
      .attr('class', 'row-details section')
      .each(makeDetails);

    rowWrap
      .append('div')
      .attr('class', 'row-chart section')
      .each(makeChart);

    rowWrap
      .append('div')
      .attr('class', 'row-meta section')
      .each(makeMeta);
  }

  /*------------------------------------------------------------------------------------------------\
    Define summaryTable object (the meat and potatoes).
  \------------------------------------------------------------------------------------------------*/

  var summaryTable = {
    draw: draw,
    renderRow: renderRow
  };

  function onDraw(dataListing) {
    dataListing.table.on('draw', function() {
      //Attach variable name rather than variable label to header to be able to apply settings.hiddenVariables to column headers.
      this.table.selectAll('th').attr('title', function(d) {
        var label = dataListing.config.variableLabels.filter(function(di) {
          return di.value_col === d;
        })[0];
        return label ? label.label : null;
      });

      //Hide data listing columns corresponding to variables specified in settings.hiddenVariables.
      this.table.selectAll('th,td').classed('hidden', function(d) {
        return (
          dataListing.config.hiddenVariables.indexOf(d.col ? d.col : d) > -1
        );
      });

      //highlight rows
      this.table.selectAll('tr').classed('highlight', function(d) {
        var highlightedIds = dataListing.codebook.data.highlighted.map(function(
          m
        ) {
          return m['web-codebook-index'];
        });
        return highlightedIds.indexOf(d['web-codebook-index']) > -1;
      });
    });
  }

  function init$6(codebook) {
    //indicateLoading(codebook, '.web-codebook .dataListing .wc-chart');

    var dataListing = codebook.dataListing;
    dataListing.codebook = codebook;
    dataListing.config = codebook.config;
    dataListing.wrap.selectAll('*').remove();

    //Define table.
    dataListing.table = webcharts.createTable(
      codebook.wrap.select('.dataListing').node(),
      {}
    );

    //Define callback.
    onDraw(dataListing);

    //Initialize table.
    dataListing.super_raw_data = codebook.data.filtered;
    dataListing.sorted_raw_data = codebook.data.filtered.sort(function(a, b) {
      var a_highlight = codebook.data.highlighted.indexOf(a) > -1;
      var b_highlight = codebook.data.highlighted.indexOf(b) > -1;
      if (a_highlight == b_highlight) {
        return 0;
      } else if (a_highlight) {
        return -1;
      } else if (b_highlight) {
        return 1;
      }
    });

    dataListing.table.init(dataListing.sorted_raw_data);
  }

  /*------------------------------------------------------------------------------------------------\
    Define dataListing object (the meat and potatoes).
  \------------------------------------------------------------------------------------------------*/

  var dataListing = { init: init$6 };

  var chartMakerSettings = {
    width: 800, //changed to 300 for paneled charts
    aspect: 1.5,
    resizable: false,
    x: {
      column: null,
      type: null,
      label: null
    },
    y: {
      column: null,
      type: null,
      label: null
    },
    marks: [
      {
        type: null,
        per: ['row_index']
      }
    ],
    colors: ['#999', 'orange'],
    color_by: 'highlight'
  };

  // Makes a valid settings object for the current selections.
  // settings is the settings object that needs updated
  // xvar and yvar are data objects created by codebook/data/makeSummary.js

  function makeSettings(settings, xvar, yvar) {
    //set x config
    settings.x = {
      column: xvar.value_col,
      label: xvar.label,
      type: xvar.type == 'categorical' ? 'ordinal' : 'linear'
    };

    //set y config
    settings.y = {
      column: yvar.value_col,
      label: yvar.label,
      type: yvar.type == 'categorical' ? 'ordinal' : 'linear'
    };

    // set mark and color
    if ((settings.x.type == 'linear') & (settings.y.type == 'linear')) {
      //mark types: x = linear vs. y = linear
      settings.marks = [
        {
          type: 'circle',
          per: ['web-codebook-index']
        }
      ];
      settings.legend = null;
      settings.color_by = 'highlight';
      settings.colors = ['#999', 'orange'];
    } else if ((settings.x.type == 'linear') & (settings.y.type == 'ordinal')) {
      //mark types: x = linear vs. y = ordinal
      settings.marks = [
        {
          type: 'circle',
          per: ['web-codebook-index']
        },
        {
          type: 'text',
          text: '|',
          per: [yvar.value_col],
          summarizeX: 'mean',
          attributes: {
            'text-anchor': 'middle',
            'alignment-baseline': 'middle'
          }
        }
      ];
      settings.legend = null;
      settings.color_by = 'highlight';
      settings.colors = ['#999', 'orange'];
    } else if ((settings.x.type == 'ordinal') & (settings.y.type == 'linear')) {
      //mark types: x = ordinal vs. y = linear
      settings.marks = [
        {
          type: 'circle',
          per: ['web-codebook-index']
        },
        {
          type: 'text',
          text: '---',
          per: [xvar.value_col],
          summarizeY: 'mean',
          attributes: {
            'text-anchor': 'middle',
            'alignment-baseline': 'middle'
          }
        }
      ];
      settings.legend = null;
      settings.color_by = 'highlight';
      settings.colors = ['#999', 'orange'];
    } else if (
      (settings.x.type == 'ordinal') &
      (settings.y.type == 'ordinal')
    ) {
      //mark types: x = ordinal vs. y = ordinal

      settings.y = {
        column: '',
        type: 'linear',
        label: 'Number of observations',
        domain: [0, null]
      };
      settings.marks = [
        {
          type: 'bar',
          arrange: 'stacked',
          split: yvar.value_col,
          per: [xvar.value_col],
          summarizeY: 'count'
        }
      ];
      settings.legend = { label: yvar.label };
      settings.color_by = yvar.value_col;
      settings.colors = [
        '#e41a1c',
        '#377eb8',
        '#4daf4a',
        '#984ea3',
        '#ff7f00',
        '#ffff33',
        '#a65628',
        '#f781bf',
        '#999999'
      ];
    }
    return settings;
  }

  function draw$1(codebook) {
    indicateLoading(codebook, '.web-codebook .chartMaker');
    var chartMaker = codebook.chartMaker;

    //clear current chart
    chartMaker.chartWrap.selectAll('*').remove();
    chartMaker.wrap.selectAll('.status.error').remove();

    //get selected variable objects
    var x_var = chartMaker.controlsWrap
      .select('.column-select.x select')
      .property('value');
    var x_obj = codebook.data.summary.filter(function(f) {
      return f.label == x_var;
    })[0];

    var y_var = chartMaker.controlsWrap
      .select('.column-select.y select')
      .property('value');
    var y_obj = codebook.data.summary.filter(function(f) {
      return f.label == y_var;
    })[0];

    //get settings and data for the chart
    if (x_obj == undefined || y_obj == undefined) {
      chartMaker.wrap
        .append('div')
        .attr('class', 'status error')
        .text(
          'No continuous and/or group variables available to plot. Visit the settings tabs to update variable settings.'
        );
    } else {
      chartMaker.chartSettings = makeSettings(chartMakerSettings, x_obj, y_obj);
      chartMaker.chartSettings.width = codebook.config.group ? 320 : 600;
      chartMaker.chartData = clone(codebook.data.filtered);

      //flag highlighted rows
      var highlightedRows = codebook.data.highlighted.map(function(m) {
        return m['web-codebook-index'];
      });
      chartMaker.chartData.forEach(function(d) {
        d.highlight = highlightedRows.indexOf(d['web-codebook-index']) > -1;
      });

      //Define chart.
      chartMaker.chart = webcharts.createChart(
        codebook.wrap.select('.chartMaker.section .cm-chart').node(),
        chartMaker.chartSettings
      );

      //remove legend unless it's a bar chart
      chartMaker.chart.on('resize', function() {
        if (this.config.legend.label == 'highlight') {
          this.legend.remove();
        }
      });

      if (codebook.config.group) {
        chartMaker.chart.on('draw', function() {
          var level = this.wrap.select('.wc-chart-title').text();
          this.wrap
            .select('.wc-chart-title')
            .text(codebook.config.group + ': ' + level);
        });
        webcharts.multiply(
          chartMaker.chart,
          chartMaker.chartData,
          codebook.config.group
        );
      } else {
        chartMaker.chart.init(chartMaker.chartData);
      }
    }
  }

  function initAxisSelect(codebook) {
    //X & Y Variables
    var x_wrap = codebook.chartMaker.controlsWrap
      .append('span')
      .attr('class', 'control column-select x');

    var y_wrap = codebook.chartMaker.controlsWrap
      .append('span')
      .attr('class', 'control column-select y');

    x_wrap.append('small').html('x variable: ');
    y_wrap.append('small').html('y variable: ');

    var x_select = x_wrap.append('select');
    var y_select = y_wrap.append('select');

    var axisOptions = codebook.data.summary
      .filter(function(f) {
        return (
          f.type == 'continuous' ||
          codebook.config.groups
            .map(function(m) {
              return m.value_col;
            })
            .indexOf(f.value_col) >= 0
        );
      })
      .filter(function(f) {
        return f.label != 'web-codebook-index';
      });

    var x_items = x_select
      .selectAll('option')
      .data(axisOptions)
      .enter()
      .append('option')
      .property('selected', function(d, i) {
        return i == 0;
      })
      .html(function(d) {
        return d.label;
      });

    var y_items = y_select
      .selectAll('option')
      .data(axisOptions)
      .enter()
      .append('option')
      .property('selected', function(d, i) {
        return i == 1;
      })
      .html(function(d) {
        return d.label;
      });

    //Handlers for label events
    x_select.on('change', function() {
      codebook.chartMaker.draw(codebook);
    });

    y_select.on('change', function() {
      codebook.chartMaker.draw(codebook);
    });
  }

  /*------------------------------------------------------------------------------------------------\
    Initialize detail select
  \------------------------------------------------------------------------------------------------*/

  function init$7(codebook) {
    initAxisSelect(codebook);
  }

  function init$8(codebook) {
    var chartMaker = codebook.chartMaker;
    chartMaker.codebook = codebook;
    chartMaker.config = codebook.config;

    //layout
    chartMaker.wrap.selectAll('*').remove();
    chartMaker.controlsWrap = chartMaker.wrap
      .append('div')
      .attr('class', 'cm-controls');
    chartMaker.chartWrap = chartMaker.wrap
      .append('div')
      .attr('class', 'cm-chart');

    if (codebook.data.summary.length > 2) {
      init$7(codebook); //make controls
      chartMaker.draw(codebook); //draw the initial codebook
    } else {
      chartMaker.wrap
        .append('div')
        .attr('class', 'status')
        .text('Two or more variables required to use Charts module.');
    }
  }

  /*------------------------------------------------------------------------------------------------\
    Define chartmaker object
  \------------------------------------------------------------------------------------------------*/

  var chartMaker = {
    draw: draw$1,
    init: init$8
  };

  var defaultSettings$1 = {
    filters: [],
    groups: [],
    variableLabels: [],
    variableTypes: [],
    hiddenVariables: [],
    meta: [],
    autogroups: 5, //automatically include categorical vars with 2-5 levels in the groups dropdown
    autofilter: 10, //automatically make filters for categorical variables with 2-10 levels
    autobins: true,
    nBins: 100,
    levelSplit: 5, //cutpoint for # of levels to use levelPlot() renderer
    maxLevels: 100, //bar charts with more than maxLevels are hidden by default
    controlVisibility: 'visible',
    chartVisibility: 'minimized',
    tabs: ['codebook', 'listing', 'chartMaker', 'settings'],
    dataName: '',
    whiteSpaceAsMissing: true,
    missingValues: [null, NaN, undefined]
  };

  function setDefaults(codebook) {
    /**************** Column Metadata ************/
    codebook.config.meta = codebook.config.meta || defaultSettings$1.meta;

    // If labels are specified in the metadata, use them as the default
    if (codebook.config.meta.length) {
      var metaLabels = [];
      codebook.config.meta.forEach(function(m) {
        var mKeys = Object.keys(m).map(function(m) {
          return m.toLowerCase();
        });
        if ((mKeys.indexOf('value_col') > -1) & (mKeys.indexOf('label') > -1)) {
          metaLabels.push({ value_col: m['value_col'], label: m['label'] });
        }
      });
      defaultSettings$1.variableLabels = metaLabels;

      // If types are specified in the metadata, use them as the default
      var metaTypes = [];
      codebook.config.meta.forEach(function(m) {
        var mKeys = Object.keys(m);
        if ((mKeys.indexOf('value_col') > -1) & (mKeys.indexOf('type') > -1)) {
          if (
            ['categorical', 'continuous'].indexOf(m.type.toLowerCase()) > -1
          ) {
            metaTypes.push({
              value_col: m['value_col'],
              type: m['type'].toLowerCase()
            });
          } else {
            console.log(
              "Invalid type ('" +
                m.type +
                "') for " +
                m.value_col +
                ' specified in metadata.'
            );
          }
        }
      });
      defaultSettings$1.variableTypes = metaTypes;
    }

    /********************* Filter Settings *********************/
    codebook.config.filters =
      codebook.config.filters || defaultSettings$1.filters;
    codebook.config.filters = codebook.config.filters.map(function(d) {
      if (typeof d == 'string') return { value_col: d };
      else return d;
    });

    //autofilter - don't use automatic filter if user specifies filters object
    codebook.config.autofilter =
      codebook.config.filters.length > 0
        ? false
        : codebook.config.autofilter == null
          ? defaultSettings$1.autofilter
          : codebook.config.autofilter;

    /********************* Group Settings *********************/
    codebook.config.groups = codebook.config.groups || defaultSettings$1.groups;
    codebook.config.groups = codebook.config.groups.map(function(d) {
      if (typeof d == 'string') return { value_col: d };
      else return d;
    });

    /********************* Variable Label Settings *********************/

    //check any user specified labels to make sure they are in the correct format
    codebook.config.variableLabels = codebook.config.variableLabels || [];
    codebook.config.variableLabels = codebook.config.variableLabels.filter(
      function(label, i) {
        var is_object =
            (typeof label === 'undefined' ? 'undefined' : _typeof(label)) ===
            'object',
          has_value_col = label.hasOwnProperty('value_col'),
          has_label = label.hasOwnProperty('label'),
          legit = is_object && has_value_col && has_label;
        if (!legit)
          console.warn(
            'Item ' +
              i +
              ' of settings.variableLabels (' +
              JSON.stringify(label) +
              ') must be an object with both a "value_col" and a "label" property.'
          );

        return legit;
      }
    );

    if (
      codebook.config.variableLabels.length &&
      defaultSettings$1.variableLabels.length
    ) {
      //merge the defaults with the user specified labels if both are populated
      var userLabelVars = codebook.config.variableLabels.map(function(m) {
        return m.value_col;
      });

      //Keep the default label if the user hasn't specified a label for the column
      defaultSettings$1.variableLabels.forEach(function(defaultLabel) {
        if (userLabelVars.indexOf(defaultLabel.value_col) == -1) {
          codebook.config.variableLabels.push(defaultLabel);
        }
      });
    } else {
      codebook.config.variableLabels = codebook.config.variableLabels.length
        ? codebook.config.variableLabels
        : defaultSettings$1.variableLabels;
    }
    //autogroups - don't use automatic groups if user specifies groups object
    codebook.config.autogroups =
      codebook.config.groups.length > 0
        ? false
        : codebook.config.autogroups == null
          ? defaultSettings$1.autogroups
          : codebook.config.autogroups;

    /********************* Variable Type Settings *********************/

    //check any user specified types to make sure they are in the correct format
    codebook.config.variableTypes = codebook.config.variableTypes || [];
    codebook.config.variableTypes = codebook.config.variableTypes.filter(
      function(type, i) {
        var is_object =
            (typeof type === 'undefined' ? 'undefined' : _typeof(type)) ===
            'object',
          has_value_col = type.hasOwnProperty('value_col'),
          has_type = type.hasOwnProperty('type'),
          legit_structure = is_object && has_value_col && has_type,
          legit = legit_structure
            ? ['continuous', 'categorical'].indexOf(type.type) > -1
            : false;
        if (!legit)
          console.warn(
            'Item ' +
              i +
              ' of settings.variableType (' +
              JSON.stringify(type) +
              ') must be an object with both a "value_col" and a "type" property of "continuous" or "categorical".'
          );

        return legit;
      }
    );

    if (
      codebook.config.variableTypes.length &&
      defaultSettings$1.variableTypes.length
    ) {
      //merge the defaults with the user specified type if both are populated
      var userTypeVars = codebook.config.variableTypes.map(function(m) {
        return m.value_col;
      });

      //Keep the default Type if the user hasn't specified a label for the column
      defaultSettings$1.variableTypes.forEach(function(defaultType) {
        if (userTypeVars.indexOf(defaultType.value_col) == -1) {
          codebook.config.variableTypes.push(defaultType);
        }
      });
    } else {
      codebook.config.variableTypes = codebook.config.variableTypes.length
        ? codebook.config.variableTypes
        : defaultSettings$1.variableTypes;
    }

    /********************* Hidden Variable Settings ***************/
    codebook.config.hiddenVariables =
      codebook.config.hiddenVariables || defaultSettings$1.hiddenVariables;
    codebook.config.hiddenVariables.push('web-codebook-index'); // internal variables should always be hidden

    /********************* Histogram Settings *********************/
    codebook.config.nBins = codebook.config.nBins || defaultSettings$1.nBins;
    codebook.config.autobins =
      codebook.config.autobins == null
        ? defaultSettings$1.autobins
        : codebook.config.autobins;

    codebook.config.levelSplit =
      codebook.config.levelSplit || defaultSettings$1.levelSplit;

    codebook.config.maxLevels =
      codebook.config.maxLevels || defaultSettings$1.maxLevels;

    /********************* Nav Settings *********************/
    codebook.config.tabs = codebook.config.tabs || defaultSettings$1.tabs;
    codebook.config.tabs = codebook.config.tabs.map(function(d) {
      if (typeof d == 'string') return { key: d };
      else return d;
    });

    codebook.config.defaultTab =
      codebook.config.defaultTab || codebook.config.tabs[0].key;
    if (
      codebook.config.tabs
        .map(function(m) {
          return m.key;
        })
        .indexOf(codebook.config.defaultTab) == -1
    ) {
      console.warn(
        "Invalid starting tab of '" +
          codebook.config.defaultTab +
          "' specified. Using '" +
          codebook.config.tabs[0] +
          "' instead."
      );
      codebook.config.defaultTab = codebook.config.tabs[0].key;
    }

    /********************* Missing Value Settings *********************/
    codebook.config.whiteSpaceAsMissing =
      codebook.config.whiteSpaceAsMissing == undefined
        ? defaultSettings$1.whiteSpaceAsMissing
        : codebook.config.whiteSpaceAsMissing;

    codebook.config.missingValues =
      codebook.config.missingValues || defaultSettings$1.missingValues;

    /********************* Control Visibility Settings *********************/
    codebook.config.controlVisibility =
      codebook.config.controlVisibility || defaultSettings$1.controlVisibility;

    /********************* Chart Visibility Settings *********************/
    codebook.config.chartVisibility =
      codebook.config.chartVisibility || defaultSettings$1.chartVisibility;

    //hide the controls appropriately according to the start tab
    if (codebook.config.controlVisibility !== 'disabled') {
      var startTab = availableTabs.find(function(f) {
        return f.key == codebook.config.defaultTab;
      });
      codebook.config.controlVisibility = startTab.controls
        ? codebook.config.controlVisibility
        : 'hidden';
    }
  }

  function makeAutomaticFilters(codebook) {
    //make filters for all categorical variables with less than autofilter levels
    if (codebook.config.autofilter > 1) {
      var autofilters = codebook.data.summary
        .filter(function(f) {
          return f.type == 'categorical';
        }) //categorical filters only
        .filter(function(f) {
          return f.statistics.values.length <= codebook.config.autofilter;
        }) //no huge filters
        .filter(function(f) {
          return f.statistics.values.length > 1;
        }) //no silly 1 item filters
        .map(function(m) {
          return { value_col: m.value_col };
        });

      codebook.config.filters = autofilters.length > 0 ? autofilters : [];
    }

    codebook.data.summary.forEach(function(variable) {
      variable.filter =
        codebook.config.filters
          .map(function(filter) {
            return filter.value_col;
          })
          .indexOf(variable.value_col) > -1;
    });
  }

  function makeAutomaticGroups(codebook) {
    //make groups for all categorical variables with less than autofilter levels
    if (codebook.config.autogroups > 1) {
      var autogroups = codebook.data.summary
        .filter(function(f) {
          return f.type == 'categorical';
        }) //categorical filters only
        .filter(function(f) {
          return f.statistics.values.length <= codebook.config.autogroups;
        }) //no groups
        .filter(function(f) {
          return f.statistics.values.length > 1;
        }) //no silly 1 item groups
        .map(function(m) {
          return { value_col: m.value_col };
        });

      codebook.config.groups = autogroups.length > 0 ? autogroups : [];
    }

    codebook.data.summary.forEach(function(variable) {
      variable.groupOption =
        codebook.config.groups
          .map(function(group) {
            return group.value_col;
          })
          .indexOf(variable.value_col) > -1;
    });
  }

  // determine the number of bins to use in the histogram based on the data.

  function getBinCounts(codebook) {
    //function to set the bin count for a single variable
    function setBinCount(summaryData) {
      //Freedman-Diaconis rule - returns the recommended bin size for a histogram
      function FreedmanDiaconis(IQR, n) {
        var cubeRootN = Math.pow(n, 1.0 / 3.0);
        return 2 * (IQR / cubeRootN);
      }

      var IQR =
        +summaryData.statistics['3rd quartile'] -
        +summaryData.statistics['1st quartile'];
      var n = summaryData.statistics['n'];
      var range =
        +summaryData.statistics['max'] - +summaryData.statistics['min'];
      var binSize = FreedmanDiaconis(IQR, n);
      var bins =
        binSize > 0
          ? Math.ceil(range / binSize)
          : codebook.config.nBins > 0
            ? codebook.config.nBins
            : defaultSettings$1.nBins;

      return bins;
    }

    var continuousVars = codebook.data.summary.filter(function(d) {
      return d.type == 'continuous';
    });
    continuousVars.forEach(function(cvar) {
      cvar.bins = codebook.config.autoBins
        ? codebook.config.nBins
        : setBinCount(cvar);
      if (Object.keys(codebook.config).indexOf('group') > -1) {
        cvar.groups.forEach(function(gvar) {
          gvar.bins = codebook.config.autoBins
            ? codebook.config.nBins
            : setBinCount(gvar);
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

  function makeFiltered(data, filters) {
    var filtered = data;
    filters.forEach(function(filter_d) {
      //remove the filtered values from the data based on the filters
      filtered = filtered.filter(function(rowData) {
        var currentValues = filter_d.values
          .filter(function(f) {
            return f.selected;
          })
          .map(function(m) {
            return m.value;
          });
        return currentValues.indexOf('' + rowData[filter_d.value_col]) > -1;
      });
    });
    return filtered;
  }

  function determineType(vector, levelSplit) {
    var nonMissingValues = vector.filter(function(f) {
      return !f.missing;
    });
    var numericValues = nonMissingValues.filter(function(d) {
      return !isNaN(+d.value);
    });
    var distinctValues = d3$1
      .set(
        numericValues.map(function(d) {
          return d.value;
        })
      )
      .values();

    return nonMissingValues.length === numericValues.length &&
      distinctValues.length > levelSplit
      ? 'continuous'
      : 'categorical';
  }

  function categorical(vector, sub) {
    var statistics = {};
    statistics.N = vector.length;
    var nonMissing = vector.filter(function(f) {
      return !f.missing;
    });
    statistics.n = nonMissing.length;
    statistics.nMissing = vector.length - statistics.n;
    statistics.percentMissing = statistics.nMissing / statistics.N;
    statistics.missingSummary =
      statistics.nMissing +
      '/' +
      statistics.N +
      ' (' +
      d3$1.format('0.1%')(statistics.percentMissing) +
      ')';
    statistics.values = d3$1
      .nest()
      .key(function(d) {
        return d.value;
      })
      .rollup(function(d) {
        var stats = {
          n: d.length,
          prop_N: d.length / statistics.N,
          prop_n: d.length / statistics.n,
          prop_N_text: d3$1.format('0.1%')(d.length / statistics.N),
          prop_n_text: d3$1.format('0.1%')(d.length / statistics.n),
          indexes: d.map(function(di) {
            return di.index;
          })
        };
        return stats;
      })
      .entries(nonMissing);

    statistics.Unique = d3$1
      .set(
        nonMissing.map(function(d) {
          return d.value;
        })
      )
      .values().length;

    statistics.values.forEach(function(value) {
      for (var statistic in value.values) {
        value[statistic] = value.values[statistic];
      }
      delete value.values;
    });

    if (sub) {
      statistics.highlightValues = d3$1
        .nest()
        .key(function(d) {
          return d.value;
        })
        .rollup(function(d) {
          var stats = {
            n: d.length,
            prop_N: d.length / statistics.N,
            prop_n: d.length / statistics.n,
            prop_N_text: d3$1.format('0.1%')(d.length / statistics.N),
            prop_n_text: d3$1.format('0.1%')(d.length / statistics.n),
            indexes: d.map(function(di) {
              return di.index;
            })
          };
          return stats;
        })
        .entries(nonMissing.filter(sub));

      statistics.highlightValues.forEach(function(value) {
        for (var statistic in value.values) {
          value[statistic] = value.values[statistic];
        }
        delete value.values;
      });
    }

    return statistics;
  }

  function continuous(vector, sub) {
    var statistics = {};
    statistics.N = vector.length;
    var nonMissing = vector
      .filter(function(d) {
        return !d.missing;
      })
      .map(function(d) {
        return +d.value;
      })
      .sort(function(a, b) {
        return a - b;
      });
    statistics.n = nonMissing.length;
    statistics.nMissing = vector.length - statistics.n;
    statistics.percentMissing = statistics.nMissing / statistics.N;
    statistics.missingSummary =
      statistics.nMissing +
      '/' +
      statistics.N +
      ' (' +
      d3$1.format('0.1%')(statistics.percentMissing) +
      ')';
    statistics.mean = d3$1.format('0.2f')(d3$1.mean(nonMissing));
    statistics.SD = d3$1.format('0.2f')(d3$1.deviation(nonMissing));
    var quantiles = [
      ['min', 0],
      ['5th percentile', 0.05],
      ['1st quartile', 0.25],
      ['median', 0.5],
      ['3rd quartile', 0.75],
      ['95th percentile', 0.95],
      ['max', 1]
    ];
    quantiles.forEach(function(quantile) {
      var statistic = quantile[0];
      statistics[statistic] = d3$1.format('0.1f')(
        d3$1.quantile(nonMissing, quantile[1])
      );
    });

    if (sub) {
      var sub_vector = vector
        .filter(sub)
        .filter(function(d) {
          return !isNaN(+d.value) && !/^\s*$/.test(d.value);
        })
        .map(function(d) {
          return +d.value;
        })
        .sort(function(a, b) {
          return a - b;
        });
      statistics.mean_sub = d3$1.format('0.2f')(d3$1.mean(sub_vector));
      statistics.SD_sub = d3$1.format('0.2f')(d3$1.deviation(sub_vector));
      quantiles.forEach(function(quantile) {
        var statistic = quantile[0];
        statistics[statistic + '_sub'] = d3$1.format('0.1f')(
          d3$1.quantile(sub_vector, quantile[1])
        );
      });
    }

    return statistics;
  }

  var summarize = {
    determineType: determineType,
    categorical: categorical,
    continuous: continuous
  };

  function makeSummary(codebook) {
    var config = codebook.config;
    var data = codebook.data.filtered;
    var group = codebook.config.group;

    if (codebook.data.filtered.length > 0) {
      var variables = Object.keys(data[0]).map(function(variable) {
        //change from string to object
        var varObj = { value_col: variable };

        //get a list of raw values
        varObj.values = data.map(function(d) {
          var current = {
            index: d['web-codebook-index'],
            value: d[variable],
            highlighted: codebook.data.highlighted.indexOf(d) > -1,
            missingWhiteSpace: config.whiteSpaceAsMissing
              ? /^\s*$/.test(d[variable])
              : false,
            missingValue: config.missingValues.indexOf(d[variable]) > -1
          };
          current.missing = current.missingWhiteSpace || current.missingValue;

          return current;
        });

        //get hidden status
        varObj.hidden = codebook.config.hiddenVariables.indexOf(variable) > -1;
        varObj.chartVisibility = codebook.config.chartVisibility;

        //get variable label
        varObj.label =
          codebook.config.variableLabels
            .map(function(variableLabel) {
              return variableLabel.value_col;
            })
            .indexOf(variable) > -1
            ? codebook.config.variableLabels.filter(function(variableLabel) {
                return variableLabel.value_col === variable;
              })[0].label
            : variable;

        //Determine Type
        varObj.type =
          codebook.config.variableTypes
            .map(function(variableType) {
              return variableType.value_col;
            })
            .indexOf(variable) > -1
            ? codebook.config.variableTypes.filter(function(variableLabel) {
                return variableLabel.value_col === variable;
              })[0].type
            : summarize.determineType(
                varObj.values,
                codebook.config.levelSplit
              );

        // update missingness for non-numeric values in continuous columns
        if (varObj.type == 'continuous') {
          varObj.values.forEach(function(d, i) {
            d.numeric = !isNaN(d.value) && !isNaN(parseFloat(d.value));
            d.missing = d.missing || !d.numeric;
          });
        }

        //create a list of missing values
        var missings = varObj.values
          .filter(function(f) {
            return f.missing;
          })
          .map(function(m) {
            return m.value;
          });
        if (missings.length) {
          varObj.missingList = d3$1
            .nest()
            .key(function(d) {
              return d;
            })
            .rollup(function(d) {
              return d.length;
            })
            .entries(missings)
            .sort(function(a, b) {
              return b.values - a.values;
            });

          varObj.missingSummary = varObj.missingList
            .map(function(m) {
              return '"' + m.key + '" (n=' + m.values + ')';
            })
            .join('\n');
        } else {
          varObj.missingList = [];
        }

        // Add metadata Object
        varObj.meta = [];
        var metaMatch = codebook.config.meta.filter(function(f) {
          return f.value_col == variable;
        });
        if (metaMatch.length == 1) {
          var metaKeys = Object.keys(metaMatch[0]).filter(function(f) {
            return ['value_col', 'label'].indexOf(f) === -1;
          });
          metaKeys.forEach(function(m) {
            varObj.meta.push({ key: m, value: metaMatch[0][m] });
          });
        }

        //calculate variable statistics (including for highlights - if any)
        var sub =
          codebook.data.highlighted.length > 0
            ? function(d) {
                return d.highlighted;
              }
            : null;
        varObj.statistics =
          varObj.type === 'continuous'
            ? summarize.continuous(varObj.values, sub)
            : summarize.categorical(varObj.values, sub);

        //get chart type
        varObj.chartType = 'none';
        if (varObj.type == 'continuous') {
          varObj.chartType = 'histogramBoxPlot';
        } else if (varObj.type == 'categorical') {
          if (varObj.statistics.values.length > codebook.config.maxLevels) {
            varObj.chartType = 'character';
            varObj.summaryText =
              'Character variable with ' +
              varObj.statistics.values.length +
              ' unique levels.<br>' +
              "<span class='caution'><span class='drawLevel'>Click here</span> to treat this variable as categorical and draw a histogram with " +
              varObj.statistics.values.length +
              ' levels. Note that this may slow down or crash your browser.</span>';
          } else if (
            varObj.statistics.values.length > codebook.config.levelSplit
          ) {
            varObj.chartType = 'verticalBars';
          } else if (
            varObj.statistics.values.length <= codebook.config.levelSplit
          ) {
            varObj.chartType = 'horizontalBars';
          }
        }

        //Handle groups.
        if (group) {
          varObj.group = group;
          varObj.groupLabel =
            codebook.config.variableLabels
              .map(function(variableLabel) {
                return variableLabel.value_col;
              })
              .indexOf(group) > -1
              ? codebook.config.variableLabels.filter(function(variableLabel) {
                  return variableLabel.value_col === group;
                })[0].label
              : group;
          varObj.groups = d3$1
            .set(
              data.map(function(d) {
                return d[group];
              })
            )
            .values()
            .map(function(g) {
              return { group: g };
            });

          varObj.groups.forEach(function(g) {
            //Define variable metadata and generate data array.
            g.value_col = variable;
            g.values = data
              .filter(function(d) {
                return d[group] === g.group;
              })
              .map(function(d) {
                return {
                  index: d['web-codebook-index'],
                  value: d[variable],
                  highlighted: codebook.data.highlighted.indexOf(d) > -1
                };
              });
            g.type = varObj.type;

            //Calculate statistics.
            if (varObj.type === 'categorical')
              g.statistics = summarize.categorical(g.values, sub);
            else g.statistics = summarize.continuous(g.values, sub);
          });
        }
        return varObj;
      });

      codebook.data.summary = variables;
      //get bin counts
      codebook.util.getBinCounts(codebook);
    } else {
      codebook.data.summary = [];
    }
  }

  /*------------------------------------------------------------------------------------------------\
    Define data object.
  \------------------------------------------------------------------------------------------------*/

  var data = {
    makeFiltered: makeFiltered,
    makeSummary: makeSummary
  };

  function init$9(codebook) {
    indicateLoading(codebook, '.web-codebook .settings .column-table');

    codebook.settings.layout(codebook);
  }

  function reset(codebook) {
    indicateLoading(
      codebook,
      '.web-codebook .dataListing .wc-chart',
      function() {
        //remove grouping and select 'None' group option
        delete codebook.config.group;
        codebook.controls.groups.update(codebook);
        codebook.controls.wrap
          .select('.group-select')
          .selectAll('option')
          .property('selected', function(d) {
            return d.value_col === 'None';
          });

        //remove filtering and select all filter options
        codebook.data.highlighted = [];
        codebook.data.filtered = codebook.data.raw;
        codebook.controls.filters.update(codebook);
        codebook.controls.wrap
          .selectAll('.filterCustom option')
          .property('selected', true);

        //redraw data summary, codebook, and listing.
        codebook.data.makeSummary(codebook);
        codebook.title.updateCountSummary(codebook);
        codebook.summaryTable.draw(codebook);
        codebook.dataListing.init(codebook);
        codebook.chartMaker.init(codebook);
      }
    );
  }

  function updateSettings(codebook, column) {
    var setting =
      column === 'Label'
        ? 'variableLabels'
        : column === 'Group'
          ? 'groups'
          : column === 'Filter'
            ? 'filters'
            : column === 'Hide'
              ? 'hiddenVariables'
              : column === 'Type'
                ? 'variableTypes'
                : console.warn('Something unsetting has occurred...');
    var inputs = codebook.settings.wrap.selectAll('.column-table td.' + column);
    if (['Group', 'Filter', 'Hide'].indexOf(column) > -1) {
      //redefine settings array
      codebook.config[setting] = inputs
        .filter(function() {
          return d3$1
            .select(this)
            .select('input')
            .property('checked');
        })
        .data()
        .map(function(d) {
          return column !== 'Hide' ? { value_col: d.column } : d.column;
        });
    } else if (['Label', 'Type'].indexOf(column) > -1) {
      //redefine settings array
      var inputType = column == 'Label' ? 'input' : 'select';
      var currentValues = inputs
        .filter(function(d) {
          d.value.value = d3$1
            .select(this)
            .select(inputType)
            .property('value');
          return d.value.value !== '';
        })
        .data()
        .map(function(d) {
          var obj = { value_col: d.column };
          obj[column.toLowerCase()] = d.value.value;
          return obj;
        });
      if (column == 'Type') {
        currentValues = currentValues.filter(function(f) {
          return f.type.slice(0, 4) != 'auto';
        });
      }
      codebook.config[setting] = currentValues;
    }

    //reset
    reset(codebook);
  }

  function layout$1(codebook) {
    //Create list of columns in the data file.
    var columns = codebook.data.summary.map(function(d) {
        return d.value_col;
      }),
      groupColumns = codebook.config.groups.map(function(d) {
        return d.value_col;
      }),
      filterColumns = codebook.config.filters.map(function(d) {
        return d.value_col;
      }),
      hiddenColumns = codebook.config.hiddenVariables,
      labeledColumns = codebook.config.variableLabels.map(function(d) {
        return d.value_col;
      }),
      typedColumns = codebook.config.variableTypes.map(function(d) {
        return d.value_col;
      }),
      columnTableColumns = [
        'Column',
        'Label',
        'Type',
        'Group',
        'Filter',
        'Hide'
      ],
      columnMetadata = columns.map(function(column) {
        var columnDatum = {
          Column: column,
          Label: {
            type: 'text',
            value:
              labeledColumns.indexOf(column) > -1
                ? codebook.config.variableLabels[labeledColumns.indexOf(column)]
                    .label
                : ''
          },
          Type: {
            type: 'text',
            value:
              typedColumns.indexOf(column) > -1
                ? codebook.config.variableTypes[typedColumns.indexOf(column)]
                    .type
                : '',
            autoType: codebook.data.summary.filter(function(f) {
              return f.value_col == column;
            })[0].type
          },
          Group: {
            type: 'checkbox',
            checked: groupColumns.indexOf(column) > -1
          },
          Filter: {
            type: 'checkbox',
            checked: filterColumns.indexOf(column) > -1
          },
          Hide: {
            type: 'checkbox',
            checked: hiddenColumns.indexOf(column) > -1
          }
        };

        return columnDatum;
      }),
      //define table
      columnTable = codebook.settings.wrap
        .append('table')
        .classed('column-table', true),
      //define table headers
      columnTableHeader = columnTable.append('thead').append('tr'),
      columnTableHeaders = columnTableHeader
        .selectAll('th')
        .data(columnTableColumns)
        .enter()
        .append('th')
        .attr('class', function(d) {
          return d;
        })
        .text(function(d) {
          return d;
        }),
      //define table rows
      columnTableRows = columnTable
        .append('tbody')
        .selectAll('tr')
        .data(columnMetadata)
        .enter()
        .append('tr')
        .classed('hidden', function(d) {
          return d.Column === 'web-codebook-index';
        }),
      columnTableCells = columnTableRows
        .selectAll('td')
        .data(function(d) {
          return Object.keys(d).map(function(di) {
            return { column: d.Column, key: di, value: d[di] };
          });
        })
        .enter()
        .append('td')
        .attr('class', function(d) {
          return d.key;
        })
        .each(function(d, i) {
          var cell = d3$1.select(this);

          switch (d.key) {
            case 'Column':
              cell.text(d.value);
              break;
            case 'Label':
              cell.attr('title', 'Define variable label');
              cell
                .append('input')
                .attr('type', d.value.type)
                .property('value', d.value.value)
                .on('change', function() {
                  return updateSettings(codebook, d.key);
                });
              break;
            case 'Type':
              cell.attr('title', 'Specify Variable Type');
              var typeSelect = cell.append('select').on('change', function() {
                return updateSettings(codebook, d.key);
              });
              var typeOptions = [
                'automatic (' + d.value.autoType + ')',
                'continuous',
                'categorical'
              ];

              typeSelect
                .selectAll('option')
                .data(typeOptions)
                .enter()
                .append('option')
                .property('selected', function(opt) {
                  return opt == d.value.value;
                })
                .text(function(opt) {
                  return opt;
                });
              break;
            default:
              cell.attr(
                'title',
                (d.value.checked ? 'Remove' : 'Add') +
                  ' ' +
                  d.column +
                  ' ' +
                  (d.value.checked ? 'from' : 'to') +
                  ' ' +
                  d.key.toLowerCase() +
                  ' list'
              );
              var checkbox = cell
                .append('input')
                .attr('type', d.value.type)
                .property('checked', d.value.checked)
                .on('change', function() {
                  return updateSettings(codebook, d.key);
                });
          }
        });
  }

  /*------------------------------------------------------------------------------------------------\
    Define settings object.
  \------------------------------------------------------------------------------------------------*/

  var settings = {
    init: init$9,
    layout: layout$1
  };

  function init$a(codebook) {
    codebook.title.fileWrap = codebook.title.wrap
      .append('span')
      .attr('class', 'file')
      .text(
        codebook.config.dataName
          ? codebook.config.dataName + ' Codebook'
          : 'Codebook'
      );

    codebook.title.countSummary = codebook.title.wrap
      .append('span')
      .attr('class', 'countSummary');

    codebook.title.highlight.init(codebook);

    codebook.title.updateCountSummary(codebook);
  }

  /*------------------------------------------------------------------------------------------------\
    Initialize clear highlighting button.
  \------------------------------------------------------------------------------------------------*/

  function init$b(codebook) {
    //initialize the wrapper
    codebook.title.highlight.clearButton = codebook.title.wrap
      .append('button')
      .classed('clear-highlight', true)
      .classed('hidden', codebook.data.highlighted.length == 0)
      .text('Clear Highlighting')
      .on('click', function() {
        codebook.data.highlighted = [];

        codebook.data.makeSummary(codebook);
        codebook.dataListing.init(codebook);
        codebook.summaryTable.draw(codebook);
        codebook.chartMaker.draw(codebook);
        codebook.title.updateCountSummary(codebook);
      });
  }

  /*------------------------------------------------------------------------------------------------\
    Define clear highlighting button object.
  \------------------------------------------------------------------------------------------------*/

  var highlight = { init: init$b };

  function updateCountSummary(codebook) {
    //get number of rows shown
    if (codebook.data.summary.length > 0) {
      var nShown = codebook.data.summary[0].statistics.N;
      var nTot = codebook.data.raw.length;
      var percent = d3$1.format('0.1%')(nShown / nTot);
      var rowSummary =
        nShown + ' of ' + nTot + ' (' + percent + ') rows selected';
    } else {
      var rowSummary = 'No rows selected.';
    }

    //Add note regarding highlighted cells and show/hide the clear highlight button
    var highlightSummary =
      codebook.data.highlighted.length > 0
        ? ' and ' +
          codebook.data.highlighted.length +
          ' <span class="highlightLegend">highlighted</span>. '
        : '.';

    codebook.title.highlight.clearButton.classed(
      'hidden',
      codebook.data.highlighted.length == 0
    );

    //get number of columns hidden
    var nCols_sub = codebook.data.summary.filter(function(d) {
      return !d.hidden;
    }).length;
    var nCols_all = codebook.data.summary.length - 1; //-1 is for the index var
    var nCols_diff = nCols_all - nCols_sub;
    //var percent = d3format('0.1%')(nCols_sub / nCols_all);
    var colSummary = nCols_diff > 0 ? nCols_diff + ' columns hidden' : '';

    var tableSummary = rowSummary + highlightSummary + ' ' + colSummary;

    codebook.title.countSummary.html(tableSummary);
  }

  /*------------------------------------------------------------------------------------------------\
    Define title object.
  \------------------------------------------------------------------------------------------------*/

  var title = {
    init: init$a,
    highlight: highlight,
    updateCountSummary: updateCountSummary
  };

  function init$c(codebook) {
    //no action needed on init, just update to the current text
    codebook.instructions.update(codebook);
  }

  /*------------------------------------------------------------------------------------------------\
    Initialize show/hide all charts toggles.
  \------------------------------------------------------------------------------------------------*/

  //export function init(selector, data, vars, settings) {
  function init$d(codebook) {
    //initialize the wrapper
    var selector = codebook.instructions.wrap
      .append('span')
      .attr('class', 'control chart-toggle')
      .classed('hidden', codebook.config.chartVisibility == 'hidden');

    selector.append('small').text('Toggle Details: ');
    var showAllButton = selector
      .append('button')
      .text('Show All Details')
      .on('click', function() {
        codebook.wrap
          .selectAll('.variable-row')
          .classed('hiddenDetails', false);
        codebook.wrap.selectAll('.row-toggle').html('&#9660;');
      });

    var hideAllButton = selector
      .append('button')
      .text('Hide All Details')
      .on('click', function() {
        codebook.wrap.selectAll('.variable-row').classed('hiddenDetails', true);
        codebook.wrap.selectAll('.row-toggle').html('&#9658;');
      });
  }

  function update$2(codebook) {
    var activeTab = codebook.nav.tabs.filter(function(d) {
      return d.active;
    })[0];

    //add instructions text
    codebook.instructions.wrap.text(activeTab.instructions);

    //add tab-specific controls
    if (activeTab.key == 'codebook') {
      init$d(codebook);
    }
  }

  /*------------------------------------------------------------------------------------------------\
    Define instructions object.
  \------------------------------------------------------------------------------------------------*/

  var instructions = {
    init: init$c,
    update: update$2
  };

  function createCodebook() {
    var element =
      arguments.length > 0 && arguments[0] !== undefined
        ? arguments[0]
        : 'body';
    var config = arguments[1];

    var codebook = {
      element: element,
      config: config,
      init: init,
      layout: layout,
      controls: controls,
      title: title,
      nav: nav,
      instructions: instructions,
      summaryTable: summaryTable,
      dataListing: dataListing,
      chartMaker: chartMaker,
      data: data,
      util: util,
      settings: settings
    };

    var cbClone = clone(codebook);
    cbClone.events = {
      init: function init$$1() {},
      complete: function complete() {}
    };

    cbClone.on = function(event, callback) {
      var possible_events = ['init', 'complete'];
      if (possible_events.indexOf(event) < 0) {
        return;
      }
      if (callback) {
        cbClone.events[event] = callback;
      }
    };

    return cbClone;
  }

  var defaultSettings$2 = {
    ignoredColumns: [],
    meta: [],
    defaultCodebookSettings: {},
    tableConfig: {
      sortable: false,
      searchable: false,
      pagination: false,
      exportable: false
    },
    fileLoader: false
  };

  function setDefaults$1() {
    var explorer = this;
    /********************* meta *********************/
    explorer.config.meta = explorer.config.meta || defaultSettings$2.meta;

    /********************* ignoredColumns *********************/
    explorer.config.ignoredColumns =
      explorer.config.ignoredColumns || defaultSettings$2.ignoredColumns;

    /********************* labelColumn *********************/
    var firstKey = Object.keys(explorer.config.files[0])[0];
    explorer.config.labelColumn = explorer.config.labelColumn || firstKey;

    /********************* tableConfig ***************/
    explorer.config.tableConfig =
      explorer.config.tableConfig || defaultSettings$2.tableConfig;

    //drop ignoredColumns and system variables
    explorer.config.tableConfig.cols = Object.keys(explorer.config.files[0])
      .filter(function(f) {
        return explorer.config.ignoredColumns.indexOf(f) == -1;
      })
      .filter(function(f) {
        return (
          ['fileID', 'settings', 'selected', 'event', 'json'].indexOf(f) == -1
        );
      }); //drop system variables from table

    /********************* defaultCodebookSettings ***************/
    explorer.config.defaultCodebookSettings =
      explorer.config.defaultCodebookSettings ||
      defaultSettings$2.defaultCodebookSettings;

    /********************* files[].settings ***************/
    explorer.config.files.forEach(function(f, i) {
      f.settings = f.settings || explorer.config.defaultCodebookSettings;
      f.fileID = i;
    });
  }

  /*------------------------------------------------------------------------------------------------\
    Initialize explorer
  \------------------------------------------------------------------------------------------------*/

  function init$e() {
    var settings = this.config;

    //call the init callback
    this.events.init.call(this);

    //set the defailts
    setDefaults$1.call(this);

    //prepare to draw the codebook for the first file
    this.current = this.config.files[0];
    this.current.event = 'load';

    //create wrapper in specified div
    this.wrap = d3$1
      .select(this.element)
      .append('div')
      .attr('class', 'web-codebook-explorer');

    //layout the divs
    this.layout.call(this);

    //draw first codebook
    this.makeCodebook.call(this);
  }

  /*------------------------------------------------------------------------------------------------\
    Generate HTML containers.
  \------------------------------------------------------------------------------------------------*/

  function layout$2() {
    this.codebookWrap = this.wrap.append('div').attr('class', 'codebookWrap');
  }

  function onDraw$1() {
    var explorer = this;

    explorer.codebook.fileListing.table.on('draw', function() {
      //highlight the current row
      this.table
        .select('tbody')
        .selectAll('tr')
        .classed('selected', function(f) {
          return f.fileID === explorer.current.fileID;
        });

      //Linkify the labelColumn
      var labelCells = this.table
        .selectAll('tbody tr')
        .on('click', function(d) {
          explorer.current = d;
          explorer.current.event = 'click';
          explorer.makeCodebook(explorer);
        })
        .selectAll('td')
        .filter(function(f) {
          return f.col == explorer.config.labelColumn;
        })
        .classed('link', true);
    });
  }

  function init$f() {
    var explorer = this;

    var fileWrap = explorer.codebook.fileListing.wrap;
    fileWrap.selectAll('*').remove(); //Clear controls.

    //Make file selector
    var file_select_wrap = fileWrap
      .append('div')
      .classed('listing-container', true);

    //Create the table
    explorer.codebook.fileListing.table = webcharts.createTable(
      '.web-codebook .fileListing .listing-container',
      explorer.config.tableConfig
    );

    //show the selected file first
    explorer.config.files.forEach(function(d) {
      return (d.selected = d == explorer.current);
    });
    var sortedFiles = explorer.config.files.sort(function(a, b) {
      return a.selected ? -1 : b.selected ? 1 : 0;
    });

    //assign callbacks and initialize
    onDraw$1.call(explorer);
    explorer.codebook.fileListing.table.init(sortedFiles);
  }

  /*------------------------------------------------------------------------------------------------\
    Define controls object.
  \------------------------------------------------------------------------------------------------*/

  var fileListing = {
    init: init$f
  };

  function addFile(label, csv_raw) {
    var explorer = this;

    // parse the file object
    this.newFileObject = {};
    this.newFileObject[explorer.config.labelColumn] = label;
    this.newFileObject.json = d3$1.csv.parse(csv_raw);
    this.newFileObject.settings = {};
    this.newFileObject.fileID = explorer.config.files.length + 1;

    //call the addFile event (if any)
    explorer.events.addFile.call(this);

    //add new files to file list
    this.config.files = d3$1.merge([
      [explorer.newFileObject],
      this.config.files
    ]);

    //re-draw the file listing
    explorer.codebook.fileListing.table.draw(this.config.files);
  }

  function initFileLoad() {
    //draw the control
    var explorer = this;
    explorer.dataFileLoad = {};
    explorer.dataFileLoad.wrap = explorer.codebook.fileListing.wrap
      .insert('div', '*')
      .attr('class', 'dataLoader');

    explorer.dataFileLoad.wrap.append('span').text('Add a local .csv file: ');

    explorer.dataFileLoad.loader_wrap = explorer.dataFileLoad.wrap
      .append('label')
      .attr('class', 'file-load-label');

    explorer.dataFileLoad.loader_label = explorer.dataFileLoad.loader_wrap
      .append('span')
      .text('Choose a File');

    explorer.dataFileLoad.loader_input = explorer.dataFileLoad.loader_wrap
      .append('input')
      .attr('type', 'file')
      .attr('class', 'file-load-input')
      .on('change', function() {
        var files = this.files;
        explorer.dataFileLoad.loader_label.text(files[0].name);

        if (this.value.slice(-4).toLowerCase() == '.csv') {
          loadStatus.text(' loading ...').style('color', 'green');
          var fr = new FileReader();
          fr.onload = function(e) {
            // get the current date/time
            var d = new Date();
            var n = d3$1.time.format('%X')(d);

            addFile.call(explorer, files[0].name, e.target.result);

            //clear the file input
            loadStatus.text('Loaded.').style('color', 'green');
            explorer.dataFileLoad.loader_input.property('value', '');
          };

          fr.readAsText(files.item(0));
        } else {
          loadStatus
            .text("Can't Load. File is not a csv.")
            .style('color', 'red');
        }
      });

    var loadStatus = explorer.dataFileLoad.wrap
      .append('span')
      .attr('class', 'loadStatus')
      .text('');

    loadStatus
      .append('sup')
      .html('&#9432;')
      .property(
        'title',
        'Create a codebook for a local file. File is added to the data set list, and is only available for a single session and is not saved.'
      )
      .style('cursor', 'help');
  }

  function makeCodebook() {
    var _this = this;

    var explorer = this;

    explorer.codebookWrap.selectAll('*').remove();

    //add the Files section to the nav for each config
    this.current.settings.tabs = this.current.settings.tabs
      ? d3$1.merge([['files'], this.current.settings.tabs])
      : ['files', 'codebook', 'listing', 'chartMaker', 'settings'];

    //set the default tab to the codebook or listing view assuming they are visible
    if (this.current.event == 'click') {
      this.current.settings.defaultTab =
        this.current.settings.tabs
          .map(function(tab) {
            return tab.key ? tab.key : tab;
          })
          .indexOf('codebook') > -1
          ? 'codebook'
          : this.current.settings.tabs.indexOf('listing') > -1
            ? 'listing'
            : 'files';
    }

    this.current.settings.dataName =
      '"' + this.current[this.config.labelColumn] + '"';

    //reset the group to null (only matters the 2nd time the file is clicked)
    delete this.current.settings.group;

    //pass along any relevant column metadata
    this.current.settings.meta = explorer.config.meta.filter(function(f) {
      return f.file == _this.current[_this.config.labelColumn];
    });

    //create the codebook
    explorer.codebook = webcodebook.createCodebook(
      '.web-codebook-explorer .codebookWrap',
      this.current.settings
    );

    explorer.codebook.on('complete', function() {
      explorer.fileListing.init.call(explorer);
      if (explorer.config.fileLoader) {
        initFileLoad.call(explorer);
      }
    });

    if (this.current.json) {
      explorer.codebook.init(this.current.json);
    } else if (this.current.path) {
      d3$1.csv(this.current.path, function(error, data) {
        explorer.codebook.init(data);
      });
    } else {
      alert('No data provided for the selected file.');
    }

    //call the makeCodebook event (if any)
    explorer.events.makeCodebook.call(this);
  }

  function createExplorer() {
    var element =
      arguments.length > 0 && arguments[0] !== undefined
        ? arguments[0]
        : 'body';
    var config = arguments[1];

    var explorer = {
      element: element,
      config: config,
      init: init$e,
      layout: layout$2,
      fileListing: fileListing,
      makeCodebook: makeCodebook,
      addFile: addFile
    };

    explorer.events = {
      init: function init() {},
      addFile: function addFile$$1() {},
      makeCodebook: function makeCodebook$$1() {}
    };

    explorer.on = function(event, callback) {
      var possible_events = ['init', 'addFile', 'makeCodebook'];
      if (possible_events.indexOf(event) < 0) {
        return;
      }
      if (callback) {
        explorer.events[event] = callback;
      }
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
});
