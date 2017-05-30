(function (root, factory) {  
	if(typeof define === "function" && define.amd) {    
		define(["d3"], factory);  
	} 
	else if(typeof module === "object" && module.exports) {    
		module.exports = factory(require("d3"));  
	} 
	else {    
		root.webCharts = factory(root.d3);  }
	}(this, function(d3){

'use strict';

var version = '1.6.1';

function stringAccessor(o, s, v) {
  //adapted from http://jsfiddle.net/alnitak/hEsys/
  s = s.replace(/\[(\w+)\]/g, '.$1');
  s = s.replace(/^\./, '');
  var a = s.split('.');
  for (var i = 0, n = a.length; i < n; ++i) {
    var k = a[i];
    if (k in o) {
      if (i == n - 1 && v !== undefined) o[k] = v;
      o = o[k];
    } else {
      return;
    }
  }
  return o;
}

function makeTextControl(control, control_wrap) {
  var _this = this;

  var changer = control_wrap.append('input').attr('type', 'text').attr('class', 'changer').datum(control).property('value', function (d) {
    return _this.stringAccessor(_this.targets[0].config, control.option);
  });

  changer.on('change', function (d) {
    var value = changer.property('value');
    _this.changeOption(control.option, value, control.callback);
  });
}

function naturalSorter(a, b) {
  //adapted from http://www.davekoelle.com/files/alphanum.js
  function chunkify(t) {
    var tz = [];
    var x = 0,
        y = -1,
        n = 0,
        i = undefined,
        j = undefined;

    while (i = (j = t.charAt(x++)).charCodeAt(0)) {
      var m = i == 46 || i >= 48 && i <= 57;
      if (m !== n) {
        tz[++y] = "";
        n = m;
      }
      tz[y] += j;
    }
    return tz;
  }

  var aa = chunkify(a.toLowerCase());
  var bb = chunkify(b.toLowerCase());

  for (var x = 0; aa[x] && bb[x]; x++) {
    if (aa[x] !== bb[x]) {
      var c = Number(aa[x]),
          d = Number(bb[x]);
      if (c == aa[x] && d == bb[x]) {
        return c - d;
      } else {
        return aa[x] > bb[x] ? 1 : -1;
      }
    }
  }

  return aa.length - bb.length;
}

function makeSubsetterControl(control, control_wrap) {
  var targets = this.targets;
  var changer = control_wrap.append('select').attr('class', 'changer').attr('multiple', control.multiple ? true : null).datum(control);

  var option_data = control.values ? control.values : d3.set(this.data.map(function (m) {
    return m[control.value_col];
  }).filter(function (f) {
    return f;
  })).values();
  option_data.sort(naturalSorter);

  control.start = control.start ? control.start : control.loose ? option_data[0] : null;

  if (!control.multiple && !control.start) {
    option_data.unshift('All');
  }

  control.loose = !control.loose && control.start ? true : control.loose;

  var options = changer.selectAll('option').data(option_data).enter().append('option').text(function (d) {
    return d;
  }).property('selected', function (d) {
    return d === control.start;
  });

  targets.forEach(function (e) {
    var match = e.filters.slice().map(function (m) {
      return m.col === control.value_col;
    }).indexOf(true);
    if (match > -1) {
      e.filters[match] = { col: control.value_col, val: control.start ? control.start : 'All', choices: option_data, loose: control.loose };
    } else {
      e.filters.push({ col: control.value_col, val: control.start ? control.start : 'All', choices: option_data, loose: control.loose });
    }
  });

  function setSubsetter(target, obj) {
    var match = -1;
    target.filters.forEach(function (e, i) {
      if (e.col === obj.col) {
        match = i;
      }
    });
    if (match > -1) {
      target.filters[match] = obj;
    }
  }

  changer.on('change', function (d) {
    var _this2 = this;

    if (control.multiple) {
      (function () {
        var values = options.filter(function (f) {
          return d3.select(this).property('selected');
        })[0].map(function (m) {
          return d3.select(m).property('text');
        });

        var new_filter = { col: control.value_col, val: values, choices: option_data, loose: control.loose };
        targets.forEach(function (e) {
          setSubsetter(e, new_filter);
          //call callback function if provided
          if (control.callback) {
            control.callback();
          }
          e.draw();
        });
      })();
    } else {
      (function () {
        var value = d3.select(_this2).select("option:checked").property('text');
        var new_filter = { col: control.value_col, val: value, choices: option_data, loose: control.loose };
        targets.forEach(function (e) {
          setSubsetter(e, new_filter);
          //call callback function if provided
          if (control.callback) {
            control.callback();
          }
          e.draw();
        });
      })();
    }
  });
}

function makeRadioControl(control, control_wrap) {
  var _this3 = this;

  var changers = control_wrap.selectAll('label').data(control.values || d3.keys(this.data[0])).enter().append('label').attr('class', 'radio').text(function (d, i) {
    return control.relabels ? control.relabels[i] : d;
  }).append('input').attr('type', 'radio').attr('class', 'changer').attr('name', control.option.replace('.', '-') + '-' + this.targets[0].id).property('value', function (d) {
    return d;
  }).property('checked', function (d) {
    return _this3.stringAccessor(_this3.targets[0].config, control.option) === d;
  });

  changers.on('change', function (d) {
    var value = null;
    changers.each(function (c) {
      if (d3.select(this).property('checked')) {
        value = d3.select(this).property('value') === 'none' ? null : c;
      }
    });
    _this3.changeOption(control.option, value, control.callback);
  });
}

function makeNumberControl(control, control_wrap) {
  var _this4 = this;

  var changer = control_wrap.append('input').attr('type', 'number').attr('min', control.min !== undefined ? control.min : 0).attr('max', control.max).attr('step', control.step || 1).attr('class', 'changer').datum(control).property('value', function (d) {
    return _this4.stringAccessor(_this4.targets[0].config, control.option);
  });

  changer.on('change', function (d) {
    var value = +changer.property('value');
    _this4.changeOption(control.option, value, control.callback);
  });
}

function makeListControl(control, control_wrap) {
  var _this5 = this;

  var changer = control_wrap.append('input').attr('type', 'text').attr('class', 'changer').datum(control).property('value', function (d) {
    return _this5.stringAccessor(_this5.targets[0].config, control.option);
  });

  changer.on('change', function (d) {
    var value = changer.property('value') ? changer.property('value').split(',').map(function (m) {
      return m.trim();
    }) : null;
    _this5.changeOption(control.option, value, control.callback);
  });
}

function makeDropdownControl(control, control_wrap) {
  var _this6 = this;

  var mainOption = control.option || control.options[0];
  var changer = control_wrap.append('select').attr('class', 'changer').attr('multiple', control.multiple ? true : null).datum(control);

  var opt_values = control.values && control.values instanceof Array ? control.values : control.values ? d3.set(this.data.map(function (m) {
    return m[_this6.targets[0].config[control.values]];
  })).values() : d3.keys(this.data[0]);

  if (!control.require || control.none) {
    opt_values.unshift('None');
  }

  var options = changer.selectAll('option').data(opt_values).enter().append('option').text(function (d) {
    return d;
  }).property('selected', function (d) {
    return _this6.stringAccessor(_this6.targets[0].config, mainOption) === d;
  });

  changer.on('change', function (d) {
    var value = changer.property('value') === 'None' ? null : changer.property('value');

    if (control.multiple) {
      value = options.filter(function (f) {
        return d3.select(this).property('selected');
      })[0].map(function (m) {
        return d3.select(m).property('value');
      }).filter(function (f) {
        return f !== 'None';
      });
    }

    if (control.options) {
      _this6.changeOption(control.options, value, control.callback);
    } else {
      _this6.changeOption(control.option, value, control.callback);;
    }
  });

  return changer;
}

function makeCheckboxControl(control, control_wrap) {
  var _this7 = this;

  var changer = control_wrap.append('input').attr('type', 'checkbox').attr('class', 'changer').datum(control).property('checked', function (d) {
    return _this7.stringAccessor(_this7.targets[0].config, control.option);
  });

  changer.on('change', function (d) {
    var value = changer.property('checked');
    _this7.changeOption(d.option, value, control.callback);
  });
}

function makeBtnGroupControl(control, control_wrap) {
  var _this8 = this;

  var option_data = control.values ? control.values : d3.keys(this.data[0]);

  var btn_wrap = control_wrap.append('div').attr('class', 'btn-group');

  var changers = btn_wrap.selectAll('button').data(option_data).enter().append('button').attr('class', 'btn btn-default btn-sm').text(function (d) {
    return d;
  }).classed('btn-primary', function (d) {
    return _this8.stringAccessor(_this8.targets[0].config, control.option) === d;
  });

  changers.on('click', function (d) {
    changers.each(function (e) {
      d3.select(this).classed('btn-primary', e === d);
    });
    _this8.changeOption(control.option, d, control.callback);
  });
}

function makeControlItem(control) {
  var control_wrap = this.wrap.append('div').attr('class', 'control-group').classed('inline', control.inline).datum(control);
  var ctrl_label = control_wrap.append('span').attr('class', 'control-label').text(control.label);
  if (control.required) {
    ctrl_label.append('span').attr('class', 'label label-required').text('Required');
  }
  control_wrap.append('span').attr('class', 'span-description').text(control.description);

  if (control.type === 'text') {
    this.makeTextControl(control, control_wrap);
  } else if (control.type === 'number') {
    this.makeNumberControl(control, control_wrap);
  } else if (control.type === 'list') {
    this.makeListControl(control, control_wrap);
  } else if (control.type === 'dropdown') {
    this.makeDropdownControl(control, control_wrap);
  } else if (control.type === 'btngroup') {
    this.makeBtnGroupControl(control, control_wrap);
  } else if (control.type === 'checkbox') {
    this.makeCheckboxControl(control, control_wrap);
  } else if (control.type === 'radio') {
    this.makeRadioControl(control, control_wrap);
  } else if (control.type === 'subsetter') {
    this.makeSubsetterControl(control, control_wrap);
  } else {
    throw new Error('Each control must have a type! Choose from: "text", "number", "list", "dropdown", "btngroup", "checkbox", "radio", "subsetter"');
  }
}

function layout$2() {
  this.wrap.selectAll('*').remove();
  this.ready = true;
  this.controlUpdate();
}

function init$1(data) {
  this.data = data;
  if (!this.config.builder) {
    this.checkRequired(this.data);
  }
  this.layout();
}

function controlUpdate() {
  var _this9 = this;

  if (this.config.inputs && this.config.inputs.length && this.config.inputs[0]) {
    this.config.inputs.forEach(function (e) {
      return _this9.makeControlItem(e);
    });
  }
}

function checkRequired$1(dataset) {
  if (!dataset[0] || !this.config.inputs) {
    return;
  }
  var colnames = d3.keys(dataset[0]);
  this.config.inputs.forEach(function (e, i) {
    if (e.type === 'subsetter' && colnames.indexOf(e.value_col) === -1) {
      throw new Error('Error in settings object: the value "' + e.value_col + '" does not match any column in the provided dataset.');
    }
  });
}

function changeOption(option, value, callback) {
  var _this10 = this;

  this.targets.forEach(function (e) {
    if (option instanceof Array) {
      option.forEach(function (o) {
        return _this10.stringAccessor(e.config, o, value);
      });
    } else {
      _this10.stringAccessor(e.config, option, value);
    }
    //call callback function if provided
    if (callback) {
      callback();
    }
    e.draw();
  });
}

var controls = {
  changeOption: changeOption,
  checkRequired: checkRequired$1,
  controlUpdate: controlUpdate,
  init: init$1,
  layout: layout$2,
  makeControlItem: makeControlItem,
  makeBtnGroupControl: makeBtnGroupControl,
  makeCheckboxControl: makeCheckboxControl,
  makeDropdownControl: makeDropdownControl,
  makeListControl: makeListControl,
  makeNumberControl: makeNumberControl,
  makeRadioControl: makeRadioControl,
  makeSubsetterControl: makeSubsetterControl,
  makeTextControl: makeTextControl,
  stringAccessor: stringAccessor
};

function draw$1(raw_data, processed_data) {
  var raw = raw_data ? raw_data : this.raw_data;
  var config = this.config;
  var data = processed_data || this.transformData(raw);
  this.wrap.datum(data);
  var table = this.table;

  var col_list = config.cols.length ? config.cols : data.length ? d3.keys(data[0].values[0].raw) : [];

  if (config.bootstrap) {
    table.classed('table', true);
  } else {
    table.classed('table', false);
  }

  var header_data = !data.length ? [] : config.headers && config.headers.length ? config.headers : col_list;
  var headerRow = table.select('thead').select('tr.headers');
  var ths = headerRow.selectAll('th').data(header_data);
  ths.exit().remove();
  ths.enter().append('th');
  ths.text(function (d) {
    return d;
  });

  var tbodies = table.selectAll('tbody').data(data, function (d) {
    return d.key;
  });
  tbodies.exit().remove();
  tbodies.enter().append('tbody');

  if (config.row_per) {
    var rev_order = config.row_per.slice(0).reverse();
    rev_order.forEach(function (e) {
      tbodies.sort(function (a, b) {
        return a.values[0].raw[e] - b.values[0].raw[e];
      });
    });
  }
  var rows = tbodies.selectAll('tr').data(function (d) {
    return d.values;
  });
  rows.exit().remove();
  rows.enter().append('tr');

  if (config.sort_rows) {
    (function () {
      var row_order = config.sort_rows.slice(0);
      row_order.unshift('0');

      rows.sort(function (a, b) {
        var i = 0;
        while (i < row_order.length && a.raw[row_order[i]] == b.raw[row_order[i]]) {
          i++;
        }
        if (a.raw[row_order[i]] < b.raw[row_order[i]]) {
          return -1;
        }
        if (a.raw[row_order[i]] > b.raw[row_order[i]]) {
          return 1;
        }
        return 0;
      });
    })();
  }

  var tds = rows.selectAll('td').data(function (d) {
    return d.cells.filter(function (f) {
      return col_list.indexOf(f.col) > -1;
    });
  });
  tds.exit().remove();
  tds.enter().append('td');
  tds.attr('class', function (d) {
    return d.col;
  });
  if (config.as_html) {
    tds.html(function (d) {
      return d.text;
    });
  } else {
    tds.text(function (d) {
      return d.text;
    });
  }

  if (config.row_per) {
    rows.filter(function (f, i) {
      return i > 0;
    }).selectAll('td').filter(function (f) {
      return config.row_per.indexOf(f.col) > -1;
    }).text('');
  }

  if (config.data_tables) {
    if (jQuery() && jQuery().dataTable) {
      var dt_config = config.data_tables;
      dt_config.searching = config.searchable ? config.searchable : false;
      $(table.node()).dataTable(dt_config);
      var print_btn = $('.print-btn', wrap.node());
      print_btn.addClass('pull-right');
      $('.dataTables_wrapper').prepend(print_btn);
    } else {
      throw new Error('dataTables jQuery plugin not available');
    }
  }

  this.events.onDraw.call(this);
}

function transformData$1(data) {
  if (!data) {
    return;
  }
  var config = this.config;
  var colList = config.cols || d3.keys(data[0]);
  if (config.keep) {
    config.keep.forEach(function (e) {
      if (colList.indexOf(e) === -1) {
        colList.unshift(e);
      }
    });
  }
  this.config.cols = colList;

  var filtered = data;

  if (this.filters.length) {
    this.filters.forEach(function (e) {
      var is_array = e.val instanceof Array;
      filtered = filtered.filter(function (d) {
        if (is_array) {
          return e.val.indexOf(d[e.col]) !== -1;
        } else {
          return e.val !== 'All' ? d[e.col] === e.val : d;
        }
      });
    });
  }

  var slimmed = d3.nest().key(function (d) {
    if (config.row_per) {
      return config.row_per.map(function (m) {
        return d[m];
      }).join(' ');
    } else {
      return d;
    }
  }).rollup(function (r) {
    if (config.dataManipulate) {
      r = config.dataManipulate(r);
    }
    var nuarr = r.map(function (m) {
      var arr = [];
      for (var x in m) {
        arr.push({ col: x, text: m[x] });
      }
      arr.sort(function (a, b) {
        return config.cols.indexOf(a.col) - config.cols.indexOf(b.col);
      });
      return { cells: arr, raw: m };
    });
    return nuarr;
  }).entries(filtered);

  this.current_data = slimmed;

  this.events.onDatatransform.call(this);

  return this.current_data;
}

function layout$1() {
  d3.select(this.div).select('.loader').remove();
  var table = this.wrap.append('table');
  table.append('thead').append('tr').attr('class', 'headers');
  this.table = table;
  this.events.onLayout.call(this);
}

function yScaleAxis(max_range, domain, type) {
  if (max_range === undefined) {
    max_range = this.plot_height;
  }
  if (domain === undefined) {
    domain = this.y_dom;
  }
  if (type === undefined) {
    type = this.config.y.type;
  }
  var config = this.config;
  var y = undefined;
  if (type === 'log') {
    y = d3.scale.log();
  } else if (type === 'ordinal') {
    y = d3.scale.ordinal();
  } else if (type === 'time') {
    y = d3.time.scale();
  } else {
    y = d3.scale.linear();
  }

  y.domain(domain);

  if (type === 'ordinal') {
    y.rangeBands([+max_range, 0], config.padding, config.outer_pad);
  } else {
    y.range([+max_range, 0]).clamp(Boolean(config.y_clamp));
  }

  var y_format = config.y.format ? config.y.format : config.marks.map(function (m) {
    return m.summarizeY === 'percent';
  }).indexOf(true) > -1 ? '0%' : '.0f';
  var tick_count = Math.max(2, Math.min(max_range / 80, 8));
  var yAxis = d3.svg.axis().scale(y).orient('left').ticks(tick_count).tickFormat(type === 'ordinal' ? null : type === 'time' ? d3.time.format(y_format) : d3.format(y_format)).tickValues(config.y.ticks ? config.y.ticks : null).innerTickSize(6).outerTickSize(3);

  this.svg.select('g.y.axis').attr('class', 'y axis ' + type);

  this.y = y;
  this.yAxis = yAxis;
}

function xScaleAxis(max_range, domain, type) {
  if (max_range === undefined) {
    max_range = this.plot_width;
  }
  if (domain === undefined) {
    domain = this.x_dom;
  }
  if (type === undefined) {
    type = this.config.x.type;
  }
  var config = this.config;
  var x = undefined;

  if (type === 'log') {
    x = d3.scale.log();
  } else if (type === 'ordinal') {
    x = d3.scale.ordinal();
  } else if (type === 'time') {
    x = d3.time.scale();
  } else {
    x = d3.scale.linear();
  }

  x.domain(domain);

  if (type === 'ordinal') {
    x.rangeBands([0, +max_range], config.padding, config.outer_pad);
  } else {
    x.range([0, +max_range]).clamp(Boolean(config.x.clamp));
  }

  var format = config.x.format ? config.x.format : config.marks.map(function (m) {
    return m.summarizeX === 'percent';
  }).indexOf(true) > -1 ? '0%' : type === 'time' ? '%x' : '.0f';
  var tick_count = Math.max(2, Math.min(max_range / 80, 8));
  var xAxis = d3.svg.axis().scale(x).orient(config.x.location).ticks(tick_count).tickFormat(type === 'ordinal' ? null : type === 'time' ? d3.time.format(format) : d3.format(format)).tickValues(config.x.ticks ? config.x.ticks : null).innerTickSize(6).outerTickSize(3);

  this.svg.select('g.x.axis').attr('class', 'x axis ' + type);
  this.x = x;
  this.xAxis = xAxis;
}

function updateDataMarks() {
  this.drawBars(this.marks.filter(function (f) {
    return f.type === 'bar';
  }));
  this.drawLines(this.marks.filter(function (f) {
    return f.type === 'line';
  }));
  this.drawPoints(this.marks.filter(function (f) {
    return f.type === 'circle';
  }));
  this.drawText(this.marks.filter(function (f) {
    return f.type === 'text';
  }));
}

function summarize(vals, operation) {
  var nvals = vals.filter(function (f) {
    return +f || +f === 0;
  }).map(function (m) {
    return +m;
  });

  if (operation === 'cumulative') {
    return null;
  }

  var stat = operation || 'mean';
  var mathed = stat === 'count' ? vals.length : stat === 'percent' ? vals.length : d3[stat](nvals);

  return mathed;
}

function transformData(raw, mark) {
  var _this11 = this;

  var config = this.config;
  var x_behavior = config.x.behavior || 'raw';
  var y_behavior = config.y.behavior || 'raw';
  var sublevel = mark.type === 'line' ? config.x.column : mark.type === 'bar' && mark.split ? mark.split : null;
  var dateConvert = d3.time.format(config.date_format);
  var totalOrder = undefined;

  function calcStartTotal(e) {
    var axis = config.x.type === 'ordinal' || config.x.type === 'linear' && config.x.bin ? 'y' : 'x';
    e.total = d3.sum(e.values.map(function (m) {
      return +m.values[axis];
    }));
    var counter = 0;
    e.values.forEach(function (v, i) {
      if (config.x.type === 'ordinal' || config.x.type === 'linear' && config.x.bin) {
        v.values.y = mark.summarizeY === 'percent' ? v.values.y / e.total : v.values.y || 0;
        counter += +v.values.y;
        v.values.start = e.values[i - 1] ? counter : v.values.y;
      } else {
        v.values.x = mark.summarizeX === 'percent' ? v.values.x / e.total : v.values.x || 0;
        v.values.start = counter;
        counter += +v.values.x;
      }
    });
  }

  raw = mark.per && mark.per.length ? raw.filter(function (f) {
    return f[mark.per[0]];
  }) : raw;

  //make sure data has x and y values
  if (config.x.column) {
    raw = raw.filter(function (f) {
      return f[config.x.column] !== undefined;
    });
  }
  if (config.y.column) {
    raw = raw.filter(function (f) {
      return f[config.y.column] !== undefined;
    });
  }

  if (config.x.type === 'time') {
    raw = raw.filter(function (f) {
      return f[config.x.column] instanceof Date ? f[config.x.column] : dateConvert.parse(f[config.x.column]);
    });
    raw.forEach(function (e) {
      return e[config.x.column] = e[config.x.column] instanceof Date ? e[config.x.column] : dateConvert.parse(e[config.x.column]);
    });
  }
  if (config.y.type === 'time') {
    raw = raw.filter(function (f) {
      return f[config.y.column] instanceof Date ? f[config.y.column] : dateConvert.parse(f[config.y.column]);
    });
    raw.forEach(function (e) {
      return e[config.y.column] = e[config.y.column] instanceof Date ? e[config.y.column] : dateConvert.parse(e[config.y.column]);
    });
  }

  if ((config.x.type === 'linear' || config.x.type === 'log') && config.x.column) {
    raw = raw.filter(function (f) {
      return mark.summarizeX !== 'count' && mark.summarizeX !== 'percent' ? +f[config.x.column] || +f[config.x.column] === 0 : f;
    });
  }
  if ((config.y.type === 'linear' || config.y.type === 'log') && config.y.column) {
    raw = raw.filter(function (f) {
      return mark.summarizeY !== 'count' && mark.summarizeY !== 'percent' ? +f[config.y.column] || +f[config.y.column] === 0 : f;
    });
  }

  var raw_nest = undefined;
  if (mark.type === 'bar') {
    raw_nest = mark.arrange !== 'stacked' ? makeNest(raw, sublevel) : makeNest(raw);
  } else if (mark.summarizeX === 'count' || mark.summarizeY === 'count') {
    raw_nest = makeNest(raw);
  }

  var raw_dom_x = mark.summarizeX === 'cumulative' ? [0, raw.length] : config.x.type === 'ordinal' ? d3.set(raw.map(function (m) {
    return m[config.x.column];
  })).values().filter(function (f) {
    return f;
  }) : mark.split && mark.arrange !== 'stacked' ? d3.extent(d3.merge(raw_nest.nested.map(function (m) {
    return m.values.map(function (p) {
      return p.values.raw.length;
    });
  }))) : mark.summarizeX === 'count' ? d3.extent(raw_nest.nested.map(function (m) {
    return m.values.raw.length;
  })) : d3.extent(raw.map(function (m) {
    return +m[config.x.column];
  }).filter(function (f) {
    return +f || +f === 0;
  }));

  var raw_dom_y = mark.summarizeY === 'cumulative' ? [0, raw.length] : config.y.type === 'ordinal' ? d3.set(raw.map(function (m) {
    return m[config.y.column];
  })).values().filter(function (f) {
    return f;
  }) : mark.split && mark.arrange !== 'stacked' ? d3.extent(d3.merge(raw_nest.nested.map(function (m) {
    return m.values.map(function (p) {
      return p.values.raw.length;
    });
  }))) : mark.summarizeY === 'count' ? d3.extent(raw_nest.nested.map(function (m) {
    return m.values.raw.length;
  })) : d3.extent(raw.map(function (m) {
    return +m[config.y.column];
  }).filter(function (f) {
    return +f || +f === 0;
  }));

  var filtered = raw;

  function makeNest(entries, sublevel) {
    var dom_xs = [];
    var dom_ys = [];
    var this_nest = d3.nest();

    if (config.x.type === 'linear' && config.x.bin || config.y.type === 'linear' && config.y.bin) {
      (function () {
        var xy = config.x.type === 'linear' && config.x.bin ? 'x' : 'y';
        var quant = d3.scale.quantile().domain(d3.extent(entries.map(function (m) {
          return +m[config[xy].column];
        }))).range(d3.range(+config[xy].bin));

        entries.forEach(function (e) {
          return e.wc_bin = quant(e[config[xy].column]);
        });

        this_nest.key(function (d) {
          return quant.invertExtent(d.wc_bin);
        });
      })();
    } else {
      this_nest.key(function (d) {
        return mark.per.map(function (m) {
          return d[m];
        }).join(' ');
      });
    }

    if (sublevel) {
      this_nest.key(function (d) {
        return d[sublevel];
      });
      this_nest.sortKeys(function (a, b) {
        return config.x.type === 'time' ? d3.ascending(new Date(a), new Date(b)) : config.x_dom ? d3.ascending(config.x_dom.indexOf(a), config.x_dom.indexOf(b)) : sublevel === config.color_by && config.legend.order ? d3.ascending(config.legend.order.indexOf(a), config.legend.order.indexOf(b)) : config.x.type === 'ordinal' || config.y.type === 'ordinal' ? naturalSorter(a, b) : d3.ascending(+a, +b);
      });
    }
    this_nest.rollup(function (r) {
      var obj = { raw: r };
      var y_vals = r.map(function (m) {
        return m[config.y.column];
      }).sort(d3.ascending);
      var x_vals = r.map(function (m) {
        return m[config.x.column];
      }).sort(d3.ascending);
      obj.x = config.x.type === 'ordinal' ? r[0][config.x.column] : summarize(x_vals, mark.summarizeX);
      obj.y = config.y.type === 'ordinal' ? r[0][config.y.column] : summarize(y_vals, mark.summarizeY);

      obj.x_q25 = config.error_bars && config.y.type === 'ordinal' ? d3.quantile(x_vals, 0.25) : obj.x;
      obj.x_q75 = config.error_bars && config.y.type === 'ordinal' ? d3.quantile(x_vals, 0.75) : obj.x;
      obj.y_q25 = config.error_bars ? d3.quantile(y_vals, 0.25) : obj.y;
      obj.y_q75 = config.error_bars ? d3.quantile(y_vals, 0.75) : obj.y;
      dom_xs.push([obj.x_q25, obj.x_q75, obj.x]);
      dom_ys.push([obj.y_q25, obj.y_q75, obj.y]);

      if (mark.summarizeY === 'cumulative') {
        var interm = entries.filter(function (f) {
          return config.x.type === 'time' ? new Date(f[config.x.column]) <= new Date(r[0][config.x.column]) : +f[config.x.column] <= +r[0][config.x.column];
        });
        if (mark.per.length) {
          interm = interm.filter(function (f) {
            return f[mark.per[0]] === r[0][mark.per[0]];
          });
        }

        var cumul = config.x.type === 'time' ? interm.length : d3.sum(interm.map(function (m) {
          return +m[config.y.column] || +m[config.y.column] === 0 ? +m[config.y.column] : 1;
        }));
        dom_ys.push([cumul]);
        obj.y = cumul;
      }
      if (mark.summarizeX === 'cumulative') {
        var interm = entries.filter(function (f) {
          return config.y.type === 'time' ? new Date(f[config.y.column]) <= new Date(r[0][config.y.column]) : +f[config.y.column] <= +r[0][config.y.column];
        });
        if (mark.per.length) {
          interm = interm.filter(function (f) {
            return f[mark.per[0]] === r[0][mark.per[0]];
          });
        }
        dom_xs.push([interm.length]);
        obj.x = interm.length;
      }

      return obj;
    });

    var test = this_nest.entries(entries);

    var dom_x = d3.extent(d3.merge(dom_xs));
    var dom_y = d3.extent(d3.merge(dom_ys));

    if (sublevel && mark.type === 'bar' && mark.arrange === 'stacked') {
      test.forEach(calcStartTotal);
      if (config.x.type === 'ordinal' || config.x.type === 'linear' && config.x.bin) {
        dom_y = d3.extent(test.map(function (m) {
          return m.total;
        }));
      }
      if (config.y.type === 'ordinal' || config.y.type === 'linear' && config.y.bin) {
        dom_x = d3.extent(test.map(function (m) {
          return m.total;
        }));
      }
    } else if (sublevel && mark.type === 'bar' && mark.split) {
      test.forEach(calcStartTotal);
    } else {
      (function () {
        var axis = config.x.type === 'ordinal' || config.x.type === 'linear' && config.x.bin ? 'y' : 'x';
        test.forEach(function (e) {
          return e.total = e.values[axis];
        });
      })();
    }

    if (config.x.sort === 'total-ascending' && config.x.type == 'ordinal' || config.y.sort === 'total-descending' && config.y.type == 'ordinal') {
      totalOrder = test.sort(function (a, b) {
        return d3.ascending(a.total, b.total);
      }).map(function (m) {
        return m.key;
      });
    } else if (config.x.sort === 'total-descending' && config.x.type == 'ordinal' || config.y.sort === 'total-ascending' && config.y.type == 'ordinal') {
      totalOrder = test.sort(function (a, b) {
        return d3.descending(+a.total, +b.total);
      }).map(function (m) {
        return m.key;
      });
    }

    return { nested: test, dom_x: dom_x, dom_y: dom_y };
  }

  var filt1_xs = [];
  var filt1_ys = [];
  if (this.filters.length) {
    this.filters.forEach(function (e) {
      filtered = filtered.filter(function (d) {
        return e.val === 'All' ? d : e.val instanceof Array ? e.val.indexOf(d[e.col]) > -1 : d[e.col] === e.val;
      });
    });
    //get domain for all non-All values of first filter
    if (config.x.behavior === 'firstfilter' || config.y.behavior === 'firstfilter') {
      this.filters[0].choices.filter(function (f) {
        return f !== 'All';
      }).forEach(function (e) {
        var perfilter = raw.filter(function (f) {
          return f[_this11.filters[0].col] === e;
        });
        var filt_nested = makeNest(perfilter, sublevel);
        filt1_xs.push(filt_nested.dom_x);
        filt1_ys.push(filt_nested.dom_y);
      });
    }
  }

  //filter on mark-specific instructions
  if (mark.values) {
    var _loop = function (a) {
      filtered = filtered.filter(function (f) {
        return mark.values[a].indexOf(f[a]) > -1;
      });
    };

    for (var a in mark.values) {
      _loop(a);
    }
  }

  var filt1_dom_x = d3.extent(d3.merge(filt1_xs));
  var filt1_dom_y = d3.extent(d3.merge(filt1_ys));

  this.filtered_data = filtered;

  var current_nested = makeNest(filtered, sublevel);

  var flex_dom_x = current_nested.dom_x;
  var flex_dom_y = current_nested.dom_y;

  if (mark.type === 'bar') {
    if (config.y.type === 'ordinal' && mark.summarizeX === 'count') {
      config.x.domain = config.x.domain ? [0, config.x.domain[1]] : [0, null];
    } else if (config.x.type === 'ordinal' && mark.summarizeY === 'count') {
      config.y.domain = config.y.domain ? [0, config.y.domain[1]] : [0, null];
    }
  }

  //several criteria must be met in order to use the 'firstfilter' domain
  var nonall = Boolean(this.filters.length && this.filters[0].val !== 'All' && this.filters.slice(1).filter(function (f) {
    return f.val === 'All';
  }).length === this.filters.length - 1);

  var pre_x_dom = !this.filters.length ? flex_dom_x : x_behavior === 'raw' ? raw_dom_x : nonall && x_behavior === 'firstfilter' ? filt1_dom_x : flex_dom_x;
  var pre_y_dom = !this.filters.length ? flex_dom_y : y_behavior === 'raw' ? raw_dom_y : nonall && y_behavior === 'firstfilter' ? filt1_dom_y : flex_dom_y;

  var x_dom = config.x_dom ? config.x_dom : config.x.type === 'ordinal' && config.x.behavior === 'flex' ? d3.set(filtered.map(function (m) {
    return m[config.x.column];
  })).values() : config.x.type === 'ordinal' ? d3.set(raw.map(function (m) {
    return m[config.x.column];
  })).values() : config.x_from0 ? [0, d3.max(pre_x_dom)] : pre_x_dom;

  var y_dom = config.y_dom ? config.y_dom : config.y.type === "ordinal" && config.y.behavior === 'flex' ? d3.set(filtered.map(function (m) {
    return m[config.y.column];
  })).values() : config.y.type === "ordinal" ? d3.set(raw.map(function (m) {
    return m[config.y.column];
  })).values() : config.y_from0 ? [0, d3.max(pre_y_dom)] : pre_y_dom;

  if (config.x.domain && (config.x.domain[0] || config.x.domain[0] === 0)) {
    x_dom[0] = config.x.domain[0];
  }
  if (config.x.domain && (config.x.domain[1] || config.x.domain[1] === 0)) {
    x_dom[1] = config.x.domain[1];
  }
  if (config.y.domain && (config.y.domain[0] || config.y.domain[0] === 0)) {
    y_dom[0] = config.y.domain[0];
  }
  if (config.y.domain && (config.y.domain[1] || config.y.domain[1] === 0)) {
    y_dom[1] = config.y.domain[1];
  }

  if (config.x.type === 'ordinal' && !config.x.order) {
    config.x.order = totalOrder;
  }
  if (config.y.type === 'ordinal' && !config.y.order) {
    config.y.order = totalOrder;
  }

  this.current_data = current_nested.nested;

  this.events.onDatatransform.call(this);

  return { data: current_nested.nested, x_dom: x_dom, y_dom: y_dom };
}

function textSize(width) {
  var font_size = '14px';
  var point_size = 4;
  var stroke_width = 2;

  if (!this.config.scale_text) {
    font_size = this.config.font_size;
    point_size = this.config.point_size || 4;
    stroke_width = this.config.stroke_width || 2;
  } else if (width >= 600) {
    font_size = '14px';
    point_size = 4;
    stroke_width = 2;
  } else if (width > 450 && width < 600) {
    font_size = '12px';
    point_size = 3;
    stroke_width = 2;
  } else if (width > 300 && width < 450) {
    font_size = '10px';
    point_size = 2;
    stroke_width = 2;
  } else if (width <= 300) {
    font_size = '10px';
    point_size = 2;
    stroke_width = 1;
  }

  this.wrap.style('font-size', font_size);
  this.config.flex_point_size = point_size;
  this.config.flex_stroke_width = stroke_width;
}

function setMargins() {
  var _this12 = this;

  var y_ticks = this.yAxis.tickFormat() ? this.y.domain().map(function (m) {
    return _this12.yAxis.tickFormat()(m);
  }) : this.y.domain();

  var max_y_text_length = d3.max(y_ticks.map(function (m) {
    return String(m).length;
  }));
  if (this.config.y_format && this.config.y_format.indexOf('%') > -1) {
    max_y_text_length += 1;
  }
  max_y_text_length = Math.max(2, max_y_text_length);
  var x_label_on = this.config.x.label ? 1.5 : 0;
  var y_label_on = this.config.y.label ? 1.5 : 0.25;
  var font_size = parseInt(this.wrap.style('font-size'));
  var x_second = this.config.x2_interval ? 1 : 0;
  var y_margin = max_y_text_length * font_size * 0.5 + font_size * y_label_on * 1.5 || 8;
  var x_margin = font_size + font_size / 1.5 + font_size * x_label_on + font_size * x_second || 8;

  y_margin += 6;
  x_margin += 3;

  return {
    top: this.config.margin && this.config.margin.top ? this.config.margin.top : 8,
    right: this.config.margin && this.config.margin.right ? this.config.margin.right : 16,
    bottom: this.config.margin && this.config.margin.bottom ? this.config.margin.bottom : x_margin,
    left: this.config.margin && this.config.margin.left ? this.config.margin.left : y_margin
  };
}

function setDefaults() {

  this.config.x = this.config.x || {};
  this.config.y = this.config.y || {};

  this.config.x.label = this.config.x.label !== undefined ? this.config.x.label : this.config.x.column;
  this.config.y.label = this.config.y.label !== undefined ? this.config.y.label : this.config.y.column;

  this.config.x.sort = this.config.x.sort || 'alphabetical-ascending';
  this.config.y.sort = this.config.y.sort || 'alphabetical-descending';

  this.config.x.type = this.config.x.type || 'linear';
  this.config.y.type = this.config.y.type || 'linear';

  this.config.margin = this.config.margin || {};
  this.config.legend = this.config.legend || {};
  this.config.legend.label = this.config.legend.label !== undefined ? this.config.legend.label : this.config.color_by;
  this.config.legend.location = this.config.legend.location !== undefined ? this.config.legend.location : 'bottom';
  this.config.marks = this.config.marks && this.config.marks.length ? this.config.marks : [{}];

  this.config.date_format = this.config.date_format || '%x';

  this.config.padding = this.config.padding !== undefined ? this.config.padding : 0.3;
  this.config.outer_pad = this.config.outer_pad !== undefined ? this.config.outer_pad : 0.1;

  this.config.resizable = this.config.resizable !== undefined ? this.config.resizable : true;

  this.config.aspect = this.config.aspect || 1.33;

  this.config.colors = this.config.colors || ['rgb(102,194,165)', 'rgb(252,141,98)', 'rgb(141,160,203)', 'rgb(231,138,195)', 'rgb(166,216,84)', 'rgb(255,217,47)', 'rgb(229,196,148)', 'rgb(179,179,179)'];

  this.config.scale_text = this.config.scale_text === undefined ? true : this.config.scale_text;
  this.config.transitions = this.config.transitions === undefined ? true : this.config.transitions;
}

function setColorScale() {
  var config = this.config;
  var data = config.legend.behavior === 'flex' ? this.filtered_data : this.raw_data;
  var colordom = config.color_dom || d3.set(data.map(function (m) {
    return m[config.color_by];
  })).values().filter(function (f) {
    return f && f !== 'undefined';
  });

  if (config.legend.order) {
    colordom = colordom.sort(function (a, b) {
      return d3.ascending(config.legend.order.indexOf(a), config.legend.order.indexOf(b));
    });
  } else {
    colordom = colordom.sort(naturalSorter);
  }

  this.colorScale = d3.scale.ordinal().domain(colordom).range(config.colors);
}

function resize() {
  var config = this.config;

  var aspect2 = 1 / config.aspect;
  var div_width = parseInt(this.wrap.style('width'));
  var max_width = config.max_width ? config.max_width : div_width;
  var preWidth = !config.resizable ? config.width : !max_width || div_width < max_width ? div_width : this.raw_width;

  this.textSize(preWidth);

  this.margin = this.setMargins();

  var svg_width = config.x.type === 'ordinal' && +config.range_band ? this.raw_width + this.margin.left + this.margin.right : !config.resizable ? this.raw_width : !config.max_width || div_width < config.max_width ? div_width : this.raw_width;
  this.plot_width = svg_width - this.margin.left - this.margin.right;
  var svg_height = config.y.type === 'ordinal' && +config.range_band ? this.raw_height + this.margin.top + this.margin.bottom : !config.resizable && config.height ? config.height : !config.resizable ? svg_width * aspect2 : this.plot_width * aspect2;
  this.plot_height = svg_height - this.margin.top - this.margin.bottom;

  d3.select(this.svg.node().parentNode).attr('width', svg_width).attr('height', svg_height).select('g').attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

  this.svg.select('.overlay').attr('width', this.plot_width).attr('height', this.plot_height).classed('zoomable', config.zoomable);

  this.svg.select('.plotting-area').attr('width', this.plot_width).attr('height', this.plot_height + 1).attr('transform', 'translate(0, -1)');

  this.xScaleAxis();
  this.yScaleAxis();

  var g_x_axis = this.svg.select('.x.axis');
  var g_y_axis = this.svg.select('.y.axis');
  var x_axis_label = g_x_axis.select('.axis-title');
  var y_axis_label = g_y_axis.select('.axis-title');

  if (config.x_location !== 'top') {
    g_x_axis.attr('transform', 'translate(0,' + this.plot_height + ')');
  }
  var gXAxisTrans = config.transitions ? g_x_axis.transition() : g_x_axis;
  gXAxisTrans.call(this.xAxis);
  var gYAxisTrans = config.transitions ? g_y_axis.transition() : g_y_axis;
  gYAxisTrans.call(this.yAxis);

  x_axis_label.attr('transform', 'translate(' + this.plot_width / 2 + ',' + (this.margin.bottom - 2) + ')');
  y_axis_label.attr('x', -1 * this.plot_height / 2).attr('y', -1 * this.margin.left);

  this.svg.selectAll('.axis .domain').attr({ 'fill': 'none', 'stroke': '#ccc', 'stroke-width': 1, 'shape-rendering': 'crispEdges' });
  this.svg.selectAll('.axis .tick line').attr({ 'stroke': '#eee', 'stroke-width': 1, 'shape-rendering': 'crispEdges' });

  this.drawGridlines();
  //update legend - margins need to be set first
  this.makeLegend();

  //update the chart's specific marks
  this.updateDataMarks();

  //call .on("resize") function, if any
  this.events.onResize.call(this);
}

function makeLegend() {
  var scale = arguments.length <= 0 || arguments[0] === undefined ? this.colorScale : arguments[0];
  var label = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];
  var custom_data = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

  var config = this.config;

  config.legend.mark = config.legend.mark ? config.legend.mark : config.marks.length && config.marks[0].type === 'bar' ? 'square' : config.marks.length ? config.marks[0].type : 'square';

  var legend_label = label ? label : typeof config.legend.label === 'string' ? config.legend.label : '';

  var legendOriginal = this.legend || this.wrap.select('.legend');
  var legend = legendOriginal;

  if (this.config.legend.location === 'top' || this.config.legend.location === 'left') {
    this.wrap.node().insertBefore(legendOriginal.node(), this.svg.node().parentNode);
  } else {
    this.wrap.node().appendChild(legendOriginal.node());
  }
  legend.style('padding', 0);

  var legend_data = custom_data || scale.domain().slice(0).filter(function (f) {
    return f !== undefined && f !== null;
  }).map(function (m) {
    return { label: m, mark: config.legend.mark };
  });

  legend.select('.legend-title').text(legend_label).style('display', legend_label ? 'inline' : 'none').style('margin-right', '1em');

  var leg_parts = legend.selectAll('.legend-item').data(legend_data, function (d) {
    return d.label + d.mark;
  });

  leg_parts.exit().remove();

  var legendPartDisplay = this.config.legend.location === 'bottom' || this.config.legend.location === 'top' ? 'inline-block' : 'block';
  var new_parts = leg_parts.enter().append('li').attr('class', 'legend-item').style({ 'list-style-type': 'none', 'margin-right': '1em' });
  new_parts.append('span').attr('class', 'legend-mark-text').style('color', function (d) {
    return scale(d.label);
  });
  new_parts.append('svg').attr('class', 'legend-color-block').attr('width', '1.1em').attr('height', '1.1em').style({
    'position': 'relative',
    'top': '0.2em'
  });

  leg_parts.style('display', legendPartDisplay);

  if (config.legend.order) {
    leg_parts.sort(function (a, b) {
      return d3.ascending(config.legend.order.indexOf(a.label), config.legend.order.indexOf(b.label));
    });
  }

  leg_parts.selectAll('.legend-color-block').select('.legend-mark').remove();
  leg_parts.selectAll('.legend-color-block').each(function (e) {
    var svg = d3.select(this);
    if (e.mark === 'circle') {
      svg.append('circle').attr({ 'cx': '.5em', 'cy': '.45em', 'r': '.45em', 'class': 'legend-mark' });
    } else if (e.mark === 'line') {
      svg.append('line').attr({ 'x1': 0, 'y1': '.5em', 'x2': '1em', 'y2': '.5em', 'stroke-width': 2, 'shape-rendering': 'crispEdges', 'class': 'legend-mark' });
    } else if (e.mark === 'square') {
      svg.append('rect').attr({ 'height': '1em', 'width': '1em', 'class': 'legend-mark', 'shape-rendering': 'crispEdges' });
    }
  });
  leg_parts.selectAll('.legend-color-block').select('.legend-mark').attr('fill', function (d) {
    return d.color || scale(d.label);
  }).attr('stroke', function (d) {
    return d.color || scale(d.label);
  }).each(function (e) {
    d3.select(this).attr(e.attributes);
  });

  new_parts.append('span').attr('class', 'legend-label').style('margin-left', '0.25em').text(function (d) {
    return d.label;
  });

  if (scale.domain().length > 0) {
    var legendDisplay = this.config.legend.location === 'bottom' || this.config.legend.location === 'top' ? 'block' : 'inline-block';
    legend.style('display', legendDisplay);
  } else {
    legend.style('display', 'none');
  }

  this.legend = legend;
}

function layout() {
  this.svg = this.wrap.append("svg").attr({ "class": "wc-svg",
    "xmlns": "http://www.w3.org/2000/svg",
    "version": "1.1",
    "xlink": "http://www.w3.org/1999/xlink"
  }).append("g").style('display', 'inline-block');

  var defs = this.svg.append("defs");
  defs.append("pattern").attr({
    "id": "diagonal-stripes",
    "x": 0, "y": 0, "width": 3, "height": 8, 'patternUnits': "userSpaceOnUse", 'patternTransform': "rotate(30)"
  }).append("rect").attr({ "x": "0", "y": "0", "width": "2", "height": "8", "style": "stroke:none; fill:black" });

  defs.append('clipPath').attr('id', this.id).append('rect').attr('class', 'plotting-area');

  //y axis
  this.svg.append('g').attr('class', 'y axis').append('text').attr('class', 'axis-title').attr('transform', 'rotate(-90)').attr('dy', '.75em').attr('text-anchor', 'middle');
  //x axis
  this.svg.append('g').attr('class', 'x axis').append('text').attr('class', 'axis-title').attr('dy', '-.35em').attr('text-anchor', 'middle');
  //overlay
  this.svg.append('rect').attr('class', 'overlay').attr('opacity', 0).attr('fill', 'none').style('pointer-events', 'all');
  //add legend
  var legend = this.wrap.append('ul');
  legend.attr('class', 'legend').style('vertical-align', 'top').append('span').attr('class', 'legend-title');

  d3.select(this.div).select('.loader').remove();

  this.events.onLayout.call(this);
}

function init(data) {
  var _this13 = this;

  if (d3.select(this.div).select('.loader').empty()) {
    d3.select(this.div).insert('div', ':first-child').attr('class', 'loader').selectAll('.blockG').data(d3.range(8)).enter().append('div').attr('class', function (d) {
      return 'blockG rotate' + (d + 1);
    });
  }

  this.wrap.attr('class', 'wc-chart');

  this.setDefaults();

  this.raw_data = data;

  var startup = function startup(data) {
    //connect this chart and its controls, if any
    if (_this13.controls) {
      _this13.controls.targets.push(_this13);
      if (!_this13.controls.ready) {
        _this13.controls.init(_this13.raw_data);
      } else {
        _this13.controls.layout();
      }
    }

    //make sure container is visible (has height and width) before trying to initialize
    var visible = d3.select(_this13.div).property('offsetWidth') > 0;
    if (!visible) {
      console.warn('The chart cannot be initialized inside an element with 0 width. The chart will be initialized as soon as the container element is given a width > 0.');
      var onVisible = setInterval(function (i) {
        var visible_now = d3.select(_this13.div).property('offsetWidth') > 0;
        if (visible_now) {
          _this13.layout();
          _this13.wrap.datum(_this13);
          _this13.draw();
          clearInterval(onVisible);
        }
      }, 500);
    } else {
      _this13.layout();
      _this13.wrap.datum(_this13);
      _this13.draw();
    }
  };

  this.events.onInit.call(this);
  if (this.raw_data.length) {
    this.checkRequired(this.raw_data);
  }
  startup(data);

  return this;
}

function drawText(marks) {
  var _this14 = this;

  var config = this.config;

  var textSupergroups = this.svg.selectAll('.text-supergroup').data(marks, function (d, i) {
    return i + '-' + d.per.join('-');
  });
  textSupergroups.enter().append('g').attr('class', 'text-supergroup');
  textSupergroups.exit().remove();

  var texts = textSupergroups.selectAll('.text').data(function (d) {
    return d.data;
  }, function (d) {
    return d.key;
  });
  var oldTexts = texts.exit();

  // don't need to transition position of outgoing text
  // const oldTextsTrans = config.transitions ? oldTexts.selectAll('text').transition() : oldTexts.selectAll('text');

  var oldTextGroupTrans = config.transitions ? oldTexts.transition() : oldTexts;
  oldTextGroupTrans.remove();

  var nutexts = texts.enter().append('g').attr('class', function (d) {
    return d.key + ' text';
  });
  nutexts.append('text').attr('class', 'wc-data-mark');
  // don't need to set initial location for incoming text

  // attach mark info
  function attachMarks(d) {
    d.mark = d3.select(this.parentNode).datum();
    d3.select(this).select('text').attr(d.mark.attributes);
  }
  texts.each(attachMarks);

  // parse text like tooltips
  texts.select('text').text(function (d) {
    var tt = d.mark.text || '';
    var xformat = config.x.summary === 'percent' ? d3.format('0%') : config.x.type === 'time' ? d3.time.format(config.x.format) : d3.format(config.x.format);
    var yformat = config.y.summary === 'percent' ? d3.format('0%') : config.y.type === 'time' ? d3.time.format(config.y.format) : d3.format(config.y.format);
    return tt.replace(/\$x/g, config.x.type === 'time' ? xformat(new Date(d.values.x)) : xformat(d.values.x)).replace(/\$y/g, config.y.type === 'time' ? yformat(new Date(d.values.y)) : yformat(d.values.y)).replace(/\[(.+?)\]/g, function (str, orig) {
      return d.values.raw[0][orig];
    });
  });
  // animated attributes
  var textsTrans = config.transitions ? texts.select('text').transition() : texts.select('text');
  textsTrans.attr('x', function (d) {
    var xPos = _this14.x(d.values.x) || 0;
    return config.x.type === 'ordinal' ? xPos + _this14.x.rangeBand() / 2 : xPos;
  }).attr('y', function (d) {
    var yPos = _this14.y(d.values.y) || 0;
    return config.y.type === 'ordinal' ? yPos + _this14.y.rangeBand() / 2 : yPos;
  });

  return texts;
}

function drawPoints(marks) {
  var _this15 = this;

  var config = this.config;

  var point_supergroups = this.svg.selectAll('.point-supergroup').data(marks, function (d, i) {
    return i + '-' + d.per.join('-');
  });
  point_supergroups.enter().append('g').attr('class', 'point-supergroup');
  point_supergroups.exit().remove();

  var points = point_supergroups.selectAll('.point').data(function (d) {
    return d.data;
  }, function (d) {
    return d.key;
  });
  var oldPoints = points.exit();

  var oldPointsTrans = config.transitions ? oldPoints.selectAll('circle').transition() : oldPoints.selectAll('circle');
  oldPointsTrans.attr('r', 0);

  var oldPointGroupTrans = config.transitions ? oldPoints.transition() : oldPoints;
  oldPointGroupTrans.remove();

  var nupoints = points.enter().append('g').attr('class', function (d) {
    return d.key + ' point';
  });
  nupoints.append('circle').attr('class', 'wc-data-mark').attr('r', 0);
  nupoints.append('title');
  //static attributes
  points.select('circle').attr('fill-opacity', config.fill_opacity || config.fill_opacity === 0 ? config.fill_opacity : 0.6).attr('fill', function (d) {
    return _this15.colorScale(d.values.raw[0][config.color_by]);
  }).attr('stroke', function (d) {
    return _this15.colorScale(d.values.raw[0][config.color_by]);
  });
  //attach mark info
  points.each(function (d) {
    var mark = d3.select(this.parentNode).datum();
    d.mark = mark;
    d3.select(this).select('circle').attr(mark.attributes);
  });
  //animated attributes
  var pointsTrans = config.transitions ? points.select('circle').transition() : points.select('circle');
  pointsTrans.attr('r', function (d) {
    return d.mark.radius || config.flex_point_size;
  }).attr('cx', function (d) {
    var x_pos = _this15.x(d.values.x) || 0;
    return config.x.type === 'ordinal' ? x_pos + _this15.x.rangeBand() / 2 : x_pos;
  }).attr('cy', function (d) {
    var y_pos = _this15.y(d.values.y) || 0;
    return config.y.type === 'ordinal' ? y_pos + _this15.y.rangeBand() / 2 : y_pos;
  });

  points.select('title').text(function (d) {
    var tt = d.mark.tooltip || '';
    var xformat = config.x.summary === 'percent' ? d3.format('0%') : config.x.type === 'time' ? d3.time.format(config.x.format) : d3.format(config.x.format);
    var yformat = config.y.summary === 'percent' ? d3.format('0%') : config.y.type === 'time' ? d3.time.format(config.y.format) : d3.format(config.y.format);
    return tt.replace(/\$x/g, config.x.type === 'time' ? xformat(new Date(d.values.x)) : xformat(d.values.x)).replace(/\$y/g, config.y.type === 'time' ? yformat(new Date(d.values.y)) : yformat(d.values.y)).replace(/\[(.+?)\]/g, function (str, orig) {
      return d.values.raw[0][orig];
    });
  });

  return points;
}

function drawLines(marks) {
  var _this16 = this;

  var config = this.config;
  var line = d3.svg.line().interpolate(config.interpolate).x(function (d) {
    return config.x.type === 'linear' ? _this16.x(+d.values.x) : config.x.type === 'time' ? _this16.x(new Date(d.values.x)) : _this16.x(d.values.x) + _this16.x.rangeBand() / 2;
  }).y(function (d) {
    return config.y.type === 'linear' ? _this16.y(+d.values.y) : config.y.type === 'time' ? _this16.y(new Date(d.values.y)) : _this16.y(d.values.y) + _this16.y.rangeBand() / 2;
  });

  var line_supergroups = this.svg.selectAll('.line-supergroup').data(marks, function (d, i) {
    return i + '-' + d.per.join('-');
  });
  line_supergroups.enter().append('g').attr('class', 'line-supergroup');
  line_supergroups.exit().remove();

  var line_grps = line_supergroups.selectAll('.line').data(function (d) {
    return d.data;
  }, function (d) {
    return d.key;
  });
  line_grps.exit().remove();
  var nu_line_grps = line_grps.enter().append('g').attr('class', function (d) {
    return d.key + ' line';
  });
  nu_line_grps.append('path');
  nu_line_grps.append('title');

  var linePaths = line_grps.select('path').attr('class', 'wc-data-mark').datum(function (d) {
    return d.values;
  }).attr('stroke', function (d) {
    return _this16.colorScale(d[0].values.raw[0][config.color_by]);
  }).attr('stroke-width', config.stroke_width ? config.stroke_width : config.flex_stroke_width).attr('stroke-linecap', 'round').attr('fill', 'none');
  var linePathsTrans = config.transitions ? linePaths.transition() : linePaths;
  linePathsTrans.attr('d', line);

  line_grps.each(function (d) {
    var mark = d3.select(this.parentNode).datum();
    d.tooltip = mark.tooltip;
    d3.select(this).select('path').attr(mark.attributes);
  });

  line_grps.select('title').text(function (d) {
    var tt = d.tooltip || '';
    var xformat = config.x.summary === 'percent' ? d3.format('0%') : d3.format(config.x.format);
    var yformat = config.y.summary === 'percent' ? d3.format('0%') : d3.format(config.y.format);
    return tt.replace(/\$x/g, xformat(d.values.x)).replace(/\$y/g, yformat(d.values.y)).replace(/\[(.+?)\]/g, function (str, orig) {
      return d.values[0].values.raw[0][orig];
    });
  });

  return line_grps;
}

function drawGridlines() {
  this.wrap.classed('gridlines', this.config.gridlines);
  if (this.config.gridlines) {
    this.svg.select('.y.axis').selectAll('.tick line').attr('x1', 0);
    this.svg.select('.x.axis').selectAll('.tick line').attr('y1', 0);
    if (this.config.gridlines === 'y' || this.config.gridlines === 'xy') this.svg.select('.y.axis').selectAll('.tick line').attr('x1', this.plot_width);
    if (this.config.gridlines === 'x' || this.config.gridlines === 'xy') this.svg.select('.x.axis').selectAll('.tick line').attr('y1', -this.plot_height);
  } else {
    this.svg.select('.y.axis').selectAll('.tick line').attr('x1', 0);
    this.svg.select('.x.axis').selectAll('.tick line').attr('y1', 0);
  }
};

function drawBars(marks) {
  var _this17 = this;

  var rawData = this.raw_data;
  var config = this.config;

  var bar_supergroups = this.svg.selectAll('.bar-supergroup').data(marks, function (d, i) {
    return i + '-' + d.per.join('-');
  });
  bar_supergroups.enter().append('g').attr('class', 'bar-supergroup');
  bar_supergroups.exit().remove();

  var bar_groups = bar_supergroups.selectAll('.bar-group').data(function (d) {
    return d.data;
  }, function (d) {
    return d.key;
  });
  var old_bar_groups = bar_groups.exit();

  var nu_bar_groups = undefined;
  var bars = undefined;

  var oldBarsTrans = config.transitions ? old_bar_groups.selectAll('.bar').transition() : old_bar_groups.selectAll('.bar');
  var oldBarGroupsTrans = config.transitions ? old_bar_groups.transition() : old_bar_groups;

  if (config.x.type === 'ordinal') {
    (function () {
      oldBarsTrans.attr('y', _this17.y(0)).attr('height', 0);

      oldBarGroupsTrans.remove();

      nu_bar_groups = bar_groups.enter().append('g').attr('class', function (d) {
        return 'bar-group ' + d.key;
      });
      nu_bar_groups.append('title');

      bars = bar_groups.selectAll('rect').data(function (d) {
        return d.values instanceof Array ? d.values.sort(function (a, b) {
          return _this17.colorScale.domain().indexOf(b.key) - _this17.colorScale.domain().indexOf(a.key);
        }) : [d];
      }, function (d) {
        return d.key;
      });

      var exitBars = config.transitions ? bars.exit().transition() : bars.exit();
      exitBars.attr('y', _this17.y(0)).attr('height', 0).remove();
      bars.enter().append('rect').attr('class', function (d) {
        return 'wc-data-mark bar ' + d.key;
      }).style('clip-path', 'url(#' + _this17.id + ')').attr('y', _this17.y(0)).attr('height', 0).append('title');

      bars.attr('shape-rendering', 'crispEdges').attr('stroke', function (d) {
        return _this17.colorScale(d.values.raw[0][config.color_by]);
      }).attr('fill', function (d) {
        return _this17.colorScale(d.values.raw[0][config.color_by]);
      });

      bars.each(function (d) {
        var mark = d3.select(this.parentNode.parentNode).datum();
        d.tooltip = mark.tooltip;
        d.arrange = mark.split ? mark.arrange : null;
        d.subcats = config.legend.order ? config.legend.order.slice().reverse() : mark.values && mark.values[mark.split] ? mark.values[mark.split] : d3.set(rawData.map(function (m) {
          return m[mark.split];
        })).values();
        d3.select(this).attr(mark.attributes);
      });

      var xformat = config.marks.map(function (m) {
        return m.summarizeX === 'percent';
      }).indexOf(true) > -1 ? d3.format('0%') : d3.format(config.x.format);
      var yformat = config.marks.map(function (m) {
        return m.summarizeY === 'percent';
      }).indexOf(true) > -1 ? d3.format('0%') : d3.format(config.y.format);
      bars.select('title').text(function (d) {
        var tt = d.tooltip || '';
        return tt.replace(/\$x/g, xformat(d.values.x)).replace(/\$y/g, yformat(d.values.y)).replace(/\[(.+?)\]/g, function (str, orig) {
          return d.values.raw[0][orig];
        });
      });

      var barsTrans = config.transitions ? bars.transition() : bars;
      barsTrans.attr('x', function (d) {
        var position = undefined;
        if (!d.arrange || d.arrange === 'stacked') {
          return _this17.x(d.values.x);
        } else if (d.arrange === 'nested') {
          var _position = d.subcats.indexOf(d.key);
          var offset = _position ? _this17.x.rangeBand() / (d.subcats.length * 0.75) / _position : _this17.x.rangeBand();
          return _this17.x(d.values.x) + (_this17.x.rangeBand() - offset) / 2;
        } else {
          position = d.subcats.indexOf(d.key);
          return _this17.x(d.values.x) + _this17.x.rangeBand() / d.subcats.length * position;
        }
      }).attr('y', function (d) {
        if (d.arrange !== 'stacked') {
          return _this17.y(d.values.y);
        } else {
          return _this17.y(d.values.start);
        }
      }).attr('width', function (d) {
        if (!d.arrange || d.arrange === 'stacked') {
          return _this17.x.rangeBand();
        } else if (d.arrange === 'nested') {
          var position = d.subcats.indexOf(d.key);
          return position ? _this17.x.rangeBand() / (d.subcats.length * 0.75) / position : _this17.x.rangeBand();
        } else {
          return _this17.x.rangeBand() / d.subcats.length;
        }
      }).attr('height', function (d) {
        return _this17.y(0) - _this17.y(d.values.y);
      });
    })();
  } else if (config.y.type === 'ordinal') {
    (function () {
      oldBarsTrans.attr('x', _this17.x(0)).attr('width', 0);

      oldBarGroupsTrans.remove();

      nu_bar_groups = bar_groups.enter().append('g').attr('class', function (d) {
        return 'bar-group ' + d.key;
      });
      nu_bar_groups.append('title');

      bars = bar_groups.selectAll('rect').data(function (d) {
        return d.values instanceof Array ? d.values.sort(function (a, b) {
          return _this17.colorScale.domain().indexOf(b.key) - _this17.colorScale.domain().indexOf(a.key);
        }) : [d];
      }, function (d) {
        return d.key;
      });

      var exitBars = config.transitions ? bars.exit().transition() : bars.exit();
      exitBars.attr('x', _this17.x(0)).attr('width', 0).remove();
      bars.enter().append('rect').attr('class', function (d) {
        return 'wc-data-mark bar ' + d.key;
      }).style('clip-path', 'url(#' + _this17.id + ')').attr('x', _this17.x(0)).attr('width', 0).append('title');

      bars.attr('shape-rendering', 'crispEdges').attr('stroke', function (d) {
        return _this17.colorScale(d.values.raw[0][config.color_by]);
      }).attr('fill', function (d) {
        return _this17.colorScale(d.values.raw[0][config.color_by]);
      });

      bars.each(function (d) {
        var mark = d3.select(this.parentNode.parentNode).datum();
        d.arrange = mark.split && mark.arrange ? mark.arrange : mark.split ? 'grouped' : null;
        d.subcats = config.legend.order ? config.legend.order.slice().reverse() : mark.values && mark.values[mark.split] ? mark.values[mark.split] : d3.set(rawData.map(function (m) {
          return m[mark.split];
        })).values();
        d.tooltip = mark.tooltip;
      });

      var xformat = config.marks.map(function (m) {
        return m.summarizeX === 'percent';
      }).indexOf(true) > -1 ? d3.format('0%') : d3.format(config.x.format);
      var yformat = config.marks.map(function (m) {
        return m.summarizeY === 'percent';
      }).indexOf(true) > -1 ? d3.format('0%') : d3.format(config.y.format);
      bars.select('title').text(function (d) {
        var tt = d.tooltip || '';
        return tt.replace(/\$x/g, xformat(d.values.x)).replace(/\$y/g, yformat(d.values.y)).replace(/\[(.+?)\]/g, function (str, orig) {
          return d.values.raw[0][orig];
        });
      });

      var barsTrans = config.transitions ? bars.transition() : bars;
      barsTrans.attr('x', function (d) {
        if (d.arrange === 'stacked' || !d.arrange) {
          return d.values.start !== undefined ? _this17.x(d.values.start) : _this17.x(0);
        } else {
          return _this17.x(0);
        }
      }).attr('y', function (d) {
        if (d.arrange === 'nested') {
          var position = d.subcats.indexOf(d.key);
          var offset = position ? _this17.y.rangeBand() / (d.subcats.length * 0.75) / position : _this17.y.rangeBand();
          return _this17.y(d.values.y) + (_this17.y.rangeBand() - offset) / 2;
        } else if (d.arrange === 'grouped') {
          var position = d.subcats.indexOf(d.key);
          return _this17.y(d.values.y) + _this17.y.rangeBand() / d.subcats.length * position;
        } else {
          return _this17.y(d.values.y);
        }
      }).attr('width', function (d) {
        return _this17.x(d.values.x) - _this17.x(0);
      }).attr('height', function (d) {
        if (config.y.type === 'quantile') {
          return 20;
        } else if (d.arrange === 'nested') {
          var position = d.subcats.indexOf(d.key);
          return position ? _this17.y.rangeBand() / (d.subcats.length * 0.75) / position : _this17.y.rangeBand();
        } else if (d.arrange === 'grouped') {
          return _this17.y.rangeBand() / d.subcats.length;
        } else {
          return _this17.y.rangeBand();
        }
      });
    })();
  } else if (config.x.type === 'linear' && config.x.bin) {
    (function () {
      oldBarsTrans.attr('y', _this17.y(0)).attr('height', 0);

      oldBarGroupsTrans.remove();

      nu_bar_groups = bar_groups.enter().append('g').attr('class', function (d) {
        return 'bar-group ' + d.key;
      });
      nu_bar_groups.append('title');

      bars = bar_groups.selectAll('rect').data(function (d) {
        return d.values instanceof Array ? d.values : [d];
      }, function (d) {
        return d.key;
      });

      var exitBars = config.transitions ? bars.exit().transition() : bars.exit();
      exitBars.attr('y', _this17.y(0)).attr('height', 0).remove();
      bars.enter().append('rect').attr('class', function (d) {
        return 'wc-data-mark bar ' + d.key;
      }).style('clip-path', 'url(#' + _this17.id + ')').attr('y', _this17.y(0)).attr('height', 0).append('title');

      bars.attr('shape-rendering', 'crispEdges').attr('stroke', function (d) {
        return _this17.colorScale(d.values.raw[0][config.color_by]);
      }).attr('fill', function (d) {
        return _this17.colorScale(d.values.raw[0][config.color_by]);
      });

      bars.each(function (d) {
        var mark = d3.select(this.parentNode.parentNode).datum();
        d.arrange = mark.split ? mark.arrange : null;
        d.subcats = config.legend.order ? config.legend.order.slice().reverse() : mark.values && mark.values[mark.split] ? mark.values[mark.split] : d3.set(rawData.map(function (m) {
          return m[mark.split];
        })).values();
        d3.select(this).attr(mark.attributes);
        var parent = d3.select(this.parentNode).datum();
        var rangeSet = parent.key.split(',').map(function (m) {
          return +m;
        });
        d.rangeLow = d3.min(rangeSet);
        d.rangeHigh = d3.max(rangeSet);
        d.tooltip = mark.tooltip;
      });

      var xformat = config.marks.map(function (m) {
        return m.summarizeX === 'percent';
      }).indexOf(true) > -1 ? d3.format('0%') : d3.format(config.x.format);
      var yformat = config.marks.map(function (m) {
        return m.summarizeY === 'percent';
      }).indexOf(true) > -1 ? d3.format('0%') : d3.format(config.y.format);
      bars.select('title').text(function (d) {
        var tt = d.tooltip || '';
        return tt.replace(/\$x/g, xformat(d.values.x)).replace(/\$y/g, yformat(d.values.y)).replace(/\[(.+?)\]/g, function (str, orig) {
          return d.values.raw[0][orig];
        });
      });

      var barsTrans = config.transitions ? bars.transition() : bars;
      barsTrans.attr('x', function (d) {
        return _this17.x(d.rangeLow);
      }).attr('y', function (d) {
        if (d.arrange !== 'stacked') {
          return _this17.y(d.values.y);
        } else {
          return _this17.y(d.values.start);
        }
      }).attr('width', function (d) {
        return _this17.x(d.rangeHigh) - _this17.x(d.rangeLow);
      }).attr('height', function (d) {
        return _this17.y(0) - _this17.y(d.values.y);
      });
    })();
  } else if (config.y.type === 'linear' && config.y.bin) {
    (function () {
      oldBarsTrans.attr('x', _this17.x(0)).attr('width', 0);
      oldBarGroupsTrans.remove();

      nu_bar_groups = bar_groups.enter().append('g').attr('class', function (d) {
        return 'bar-group ' + d.key;
      });
      nu_bar_groups.append('title');

      bars = bar_groups.selectAll('rect').data(function (d) {
        return d.values instanceof Array ? d.values : [d];
      }, function (d) {
        return d.key;
      });

      var exitBars = config.transitions ? bars.exit().transition() : bars.exit();
      exitBars.attr('x', _this17.x(0)).attr('width', 0).remove();
      bars.enter().append('rect').attr('class', function (d) {
        return 'wc-data-mark bar ' + d.key;
      }).style('clip-path', 'url(#' + _this17.id + ')').attr('x', _this17.x(0)).attr('width', 0).append('title');

      bars.attr('shape-rendering', 'crispEdges').attr('stroke', function (d) {
        return _this17.colorScale(d.values.raw[0][config.color_by]);
      }).attr('fill', function (d) {
        return _this17.colorScale(d.values.raw[0][config.color_by]);
      });

      bars.each(function (d) {
        var mark = d3.select(this.parentNode.parentNode).datum();
        d.arrange = mark.split ? mark.arrange : null;
        d.subcats = config.legend.order ? config.legend.order.slice().reverse() : mark.values && mark.values[mark.split] ? mark.values[mark.split] : d3.set(rawData.map(function (m) {
          return m[mark.split];
        })).values();
        var parent = d3.select(this.parentNode).datum();
        var rangeSet = parent.key.split(',').map(function (m) {
          return +m;
        });
        d.rangeLow = d3.min(rangeSet);
        d.rangeHigh = d3.max(rangeSet);
        d.tooltip = mark.tooltip;
      });

      var xformat = config.marks.map(function (m) {
        return m.summarizeX === 'percent';
      }).indexOf(true) > -1 ? d3.format('0%') : d3.format(config.x.format);
      var yformat = config.marks.map(function (m) {
        return m.summarizeY === 'percent';
      }).indexOf(true) > -1 ? d3.format('0%') : d3.format(config.y.format);
      bars.select('title').text(function (d) {
        var tt = d.tooltip || '';
        return tt.replace(/\$x/g, xformat(d.values.x)).replace(/\$y/g, yformat(d.values.y)).replace(/\[(.+?)\]/g, function (str, orig) {
          return d.values.raw[0][orig];
        });
      });

      var barsTrans = config.transitions ? bars.transition() : bars;
      barsTrans.attr('x', function (d) {
        if (d.arrange === 'stacked') {
          return _this17.x(d.values.start);
        } else {
          return _this17.x(0);
        }
      }).attr('y', function (d) {
        return _this17.y(d.rangeHigh);
      }).attr('width', function (d) {
        return _this17.x(d.values.x);
      }).attr('height', function (d) {
        return _this17.y(d.rangeLow) - _this17.y(d.rangeHigh);
      });
    })();
  } else {
    oldBarsTrans.attr('y', this.y(0)).attr('height', 0);
    oldBarGroupsTrans.remove();
    bar_supergroups.remove();
  }
}

function drawArea(area_drawer, area_data, datum_accessor, class_match, bind_accessor) {
  if (class_match === undefined) class_match = 'chart-area';

  var _this18 = this;

  var attr_accessor = arguments.length <= 5 || arguments[5] === undefined ? function (d) {
    return d;
  } : arguments[5];

  var area_grps = this.svg.selectAll('.' + class_match).data(area_data, bind_accessor);
  area_grps.exit().remove();
  area_grps.enter().append('g').attr('class', function (d) {
    return class_match + ' ' + d.key;
  }).append('path');

  var areaPaths = area_grps.select('path').datum(datum_accessor).attr('fill', function (d) {
    var d_attr = attr_accessor(d);
    return d_attr ? _this18.colorScale(d_attr[_this18.config.color_by]) : null;
  }).attr('fill-opacity', this.config.fill_opacity || this.config.fill_opacity === 0 ? this.config.fill_opacity : 0.3);

  //don't transition if config says not to
  var areaPathTransitions = this.config.transitions ? areaPaths.transition() : areaPaths;

  areaPathTransitions.attr('d', area_drawer);

  return area_grps;
}

function draw(raw_data, processed_data) {
  var _this19 = this;

  var context = this;
  var config = this.config;
  var aspect2 = 1 / config.aspect;
  //if pre-processing callback, run it now
  this.events.onPreprocess.call(this);
  //then do normal processing
  var raw = raw_data ? raw_data : this.raw_data ? this.raw_data : [];
  var data = processed_data || this.consolidateData(raw);

  this.wrap.datum(data);

  var div_width = parseInt(this.wrap.style('width'));

  this.setColorScale();

  var max_width = config.max_width ? config.max_width : div_width;
  this.raw_width = config.x.type === "ordinal" && +config.range_band ? (+config.range_band + config.range_band * config.padding) * this.x_dom.length : config.resizable ? max_width : config.width ? config.width : div_width;
  this.raw_height = config.y.type === "ordinal" && +config.range_band ? (+config.range_band + config.range_band * config.padding) * this.y_dom.length : config.resizable ? max_width * aspect2 : config.height ? config.height : div_width * aspect2;

  var pseudo_width = this.svg.select(".overlay").attr("width") ? this.svg.select(".overlay").attr("width") : this.raw_width;
  var pseudo_height = this.svg.select(".overlay").attr("height") ? this.svg.select(".overlay").attr("height") : this.raw_height;

  this.svg.select(".x.axis").select(".axis-title").text(function (d) {
    return typeof config.x.label === "string" ? config.x.label : typeof config.x.label === "function" ? config.x.label.call(_this19) : null;
  });
  this.svg.select(".y.axis").select(".axis-title").text(function (d) {
    return typeof config.y.label === "string" ? config.y.label : typeof config.y.label === "function" ? config.y.label.call(_this19) : null;
  });

  this.xScaleAxis(pseudo_width);
  this.yScaleAxis(pseudo_height);

  if (config.resizable && typeof window !== 'undefined') {
    d3.select(window).on('resize.' + context.element + context.id, function () {
      context.resize();
    });
  } else if (typeof window !== 'undefined') {
    d3.select(window).on('resize.' + context.element + context.id, null);
  }

  this.events.onDraw.call(this);
  this.resize();
}

function consolidateData(raw) {
  var _this20 = this;

  var config = this.config;
  var all_data = [];
  var all_x = [];
  var all_y = [];

  this.setDefaults();

  config.marks.forEach(function (e, i) {
    if (e.type !== 'bar') {
      e.arrange = null;
      e.split = null;
    }
    var mark_info = e.per ? _this20.transformData(raw, e) : { data: [], x_dom: [], y_dom: [] };

    all_data.push(mark_info.data);
    all_x.push(mark_info.x_dom);
    all_y.push(mark_info.y_dom);
    _this20.marks[i] = Object.create(e);
    _this20.marks[i].data = mark_info.data;
    //this.marks[i] = {type: e.type, per: e.per, data: mark_info.data, split: e.split, arrange: e.arrange, order: e.order, summarizeX: e.summarizeX, summarizeY: e.summarizeY, tooltip: e.tooltip, radius: e.radius, attributes: e.attributes};
  });

  if (config.x.type === 'ordinal') {
    if (config.x.domain) {
      this.x_dom = config.x.domain;
    } else if (config.x.order) {
      this.x_dom = d3.set(d3.merge(all_x)).values().sort(function (a, b) {
        return d3.ascending(config.x.order.indexOf(a), config.x.order.indexOf(b));
      });
    } else if (config.x.sort && config.x.sort === 'alphabetical-ascending') {
      this.x_dom = d3.set(d3.merge(all_x)).values().sort(naturalSorter);
    } else if (config.y.type === 'time' && config.x.sort === 'earliest') {
      this.x_dom = d3.nest().key(function (d) {
        return d[config.x.column];
      }).rollup(function (d) {
        return d.map(function (m) {
          return m[config.y.column];
        }).filter(function (f) {
          return f instanceof Date;
        });
      }).entries(this.raw_data).sort(function (a, b) {
        return d3.min(b.values) - d3.min(a.values);
      }).map(function (m) {
        return m.key;
      });
    } else if (!config.x.sort || config.x.sort === 'alphabetical-descending') {
      this.x_dom = d3.set(d3.merge(all_x)).values().sort(naturalSorter);
    } else {
      this.x_dom = d3.set(d3.merge(all_x)).values();
    }
  } else if (config.marks.map(function (m) {
    return m.summarizeX === 'percent';
  }).indexOf(true) > -1) {
    this.x_dom = [0, 1];
  } else {
    this.x_dom = d3.extent(d3.merge(all_x));
  }

  if (config.y.type === 'ordinal') {
    if (config.y.domain) {
      this.y_dom = config.y.domain;
    } else if (config.y.order) {
      this.y_dom = d3.set(d3.merge(all_y)).values().sort(function (a, b) {
        return d3.ascending(config.y.order.indexOf(a), config.y.order.indexOf(b));
      });
    } else if (config.y.sort && config.y.sort === 'alphabetical-ascending') {
      this.y_dom = d3.set(d3.merge(all_y)).values().sort(naturalSorter);
    } else if (config.x.type === 'time' && config.y.sort === 'earliest') {
      this.y_dom = d3.nest().key(function (d) {
        return d[config.y.column];
      }).rollup(function (d) {
        return d.map(function (m) {
          return m[config.x.column];
        }).filter(function (f) {
          return f instanceof Date;
        });
      }).entries(this.raw_data).sort(function (a, b) {
        return d3.min(b.values) - d3.min(a.values);
      }).map(function (m) {
        return m.key;
      });
    } else if (!config.y.sort || config.y.sort === 'alphabetical-descending') {
      this.y_dom = d3.set(d3.merge(all_y)).values().sort(naturalSorter).reverse();
    } else {
      this.y_dom = d3.set(d3.merge(all_y)).values();
    }
  } else if (config.marks.map(function (m) {
    return m.summarizeY === 'percent';
  }).indexOf(true) > -1) {
    this.y_dom = [0, 1];
  } else {
    this.y_dom = d3.extent(d3.merge(all_y));
  }
}

function checkRequired(data) {
  var _this21 = this;

  var colnames = Object.keys(data[0]);
  var requiredVars = [];
  var requiredCols = [];
  if (this.config.x.column) {
    requiredVars.push('this.config.x.column');
    requiredCols.push(this.config.x.column);
  }
  if (this.config.y.column) {
    requiredVars.push('this.config.y.column');
    requiredCols.push(this.config.y.column);
  }
  if (this.config.color_by) {
    requiredVars.push('this.config.color_by');
    requiredCols.push(this.config.color_by);
  }
  this.config.marks.forEach(function (e, i) {
    if (e.per && e.per.length) {
      e.per.forEach(function (p, j) {
        requiredVars.push('this.config.marks[' + i + '].per[' + j + ']');
        requiredCols.push(p);
      });
    }
    if (e.split) {
      requiredVars.push('this.config.marks[' + i + '].split');
      requiredCols.push(e.split);
    }
  });

  requiredCols.forEach(function (e, i) {
    if (colnames.indexOf(e) < 0) {
      d3.select(_this21.div).select('.loader').remove();
      _this21.wrap.append('div').style('color', 'red').html('The value "' + e + '" for the <code>' + requiredVars[i] + '</code> setting does not match any column in the provided dataset.');
      throw new Error('Error in settings object: The value "' + e + '" for the ' + requiredVars[i] + ' setting does not match any column in the provided dataset.');
    }
  });
}

var chartProto = {
  raw_data: [],
  config: {}
};

var chart = Object.create(chartProto, {
  'checkRequired': { value: checkRequired },
  'consolidateData': { value: consolidateData },
  'draw': { value: draw },
  'drawArea': { value: drawArea },
  'drawBars': { value: drawBars },
  'drawGridlines': { value: drawGridlines },
  'drawLines': { value: drawLines },
  'drawPoints': { value: drawPoints },
  'drawText': { value: drawText },
  'init': { value: init },
  'layout': { value: layout },
  'makeLegend': { value: makeLegend },
  'resize': { value: resize },
  'setColorScale': { value: setColorScale },
  'setDefaults': { value: setDefaults },
  'setMargins': { value: setMargins },
  'textSize': { value: textSize },
  'transformData': { value: transformData },
  'updateDataMarks': { value: updateDataMarks },
  'xScaleAxis': { value: xScaleAxis },
  'yScaleAxis': { value: yScaleAxis }
});

var table = Object.create(chart, {
  'layout': { value: layout$1 },
  'transformData': { value: transformData$1 },
  'draw': { value: draw$1 }
});

var objects = {
  chart: chart,
  table: table,
  controls: controls
};

var chartCount = 0;

function createChart() {
  var element = arguments.length <= 0 || arguments[0] === undefined ? 'body' : arguments[0];
  var config = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
  var controls = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

  var thisChart = Object.create(chart);

  thisChart.div = element;

  thisChart.config = Object.create(config);

  thisChart.controls = controls;

  thisChart.raw_data = [];

  thisChart.filters = [];

  thisChart.marks = [];

  thisChart.wrap = d3.select(thisChart.div).append('div');

  thisChart.events = {
    onInit: function onInit() {},
    onLayout: function onLayout() {},
    onPreprocess: function onPreprocess() {},
    onDatatransform: function onDatatransform() {},
    onDraw: function onDraw() {},
    onResize: function onResize() {}
  };

  thisChart.on = function (event, callback) {
    var possible_events = ['init', 'layout', 'preprocess', 'datatransform', 'draw', 'resize'];
    if (possible_events.indexOf(event) < 0) {
      return;
    }
    if (callback) {
      thisChart.events['on' + event.charAt(0).toUpperCase() + event.slice(1)] = callback;
    }
  };

  //increment thisChart count to get unique thisChart id
  chartCount++;

  thisChart.id = chartCount;

  return thisChart;
}

function createControls() {
  var element = arguments.length <= 0 || arguments[0] === undefined ? 'body' : arguments[0];
  var config = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  var thisControls = Object.create(controls);

  thisControls.div = element;

  thisControls.config = Object.create(config);
  thisControls.config.inputs = thisControls.config.inputs || [];

  thisControls.targets = [];

  if (config.location === 'bottom') {
    thisControls.wrap = d3.select(element).append('div').attr('class', 'wc-controls');
  } else {
    thisControls.wrap = d3.select(element).insert('div', ':first-child').attr('class', 'wc-controls');
  }

  return thisControls;
}

function createTable() {
  var element = arguments.length <= 0 || arguments[0] === undefined ? 'body' : arguments[0];
  var config = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
  var controls = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

  var thisTable = Object.create(table);

  thisTable.div = element;

  thisTable.config = Object.create(config);

  thisTable.controls = controls;

  thisTable.filters = [];

  thisTable.required_cols = [];

  thisTable.marks = [];

  thisTable.wrap = d3.select(thisTable.div).append('div');

  thisTable.events = {
    onInit: function onInit() {},
    onLayout: function onLayout() {},
    onDatatransform: function onDatatransform() {},
    onDraw: function onDraw() {},
    onResize: function onResize() {}
  };

  thisTable.on = function (event, callback) {
    var possible_events = ['init', 'layout', 'datatransform', 'draw', 'resize'];
    if (possible_events.indexOf(event) < 0) {
      return;
    }
    if (callback) {
      thisTable.events['on' + event.charAt(0).toUpperCase() + event.slice(1)] = callback;
    }
  };

  return thisTable;
}

function multiply(chart, data, split_by, order) {
  var config = chart.config;
  var wrap = chart.wrap.classed('wc-layout wc-small-multiples', true).classed('wc-chart', false);
  var master_legend = wrap.append('ul').attr('class', 'legend');

  function goAhead(data) {
    var split_vals = d3.set(data.map(function (m) {
      return m[split_by];
    })).values().filter(function (f) {
      return f;
    });
    if (order) {
      split_vals = split_vals.sort(function (a, b) {
        return d3.ascending(order.indexOf(a), order.indexOf(b));
      });
    }

    split_vals.forEach(function (e) {
      var mchart = createChart(chart.wrap.node(), config, chart.controls);
      mchart.events = chart.events;
      mchart.legend = master_legend;
      mchart.filters.unshift({ col: split_by, val: e, choices: split_vals });
      mchart.wrap.insert('span', 'svg').attr('class', 'wc-chart-title').text(e);
      mchart.init(data);
    });
  }

  goAhead(data);
}

function lengthenRaw(data, columns) {
  var my_data = [];

  data.forEach(function (e) {

    columns.forEach(function (g) {
      var obj = Object.create(e);
      obj.wc_category = g;
      obj.wc_value = e[g];
      my_data.push(obj);
    });
  });

  return my_data;
}

function getValType(data, variable) {
  var var_vals = d3.set(data.map(function (m) {
    return m[variable];
  })).values();
  var vals_numbers = var_vals.filter(function (f) {
    return +f || +f === 0;
  });

  if (var_vals.length === vals_numbers.length && var_vals.length > 4) {
    return 'continuous';
  } else {
    return 'categorical';
  }
}

var dataOps = {
  getValType: getValType,
  lengthenRaw: lengthenRaw,
  naturalSorter: naturalSorter,
  summarize: summarize
};

var index = {
  version: version,
  dataOps: dataOps,
  objects: objects,
  createChart: createChart,
  createControls: createControls,
  createTable: createTable,
  multiply: multiply
};

var webCharts = index;

return webCharts;

}));