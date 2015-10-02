// Global Configuration
// ====================
// Manages the global configuration and the defines store.
var
    RE_DEFPAIR = /^\s*([$_A-Z][_0-9A-Z]+)\s*(.*)/,
    RE_DEFNAME = /^\s*([$_A-Z][_0-9A-Z]+)\s*$/,
    VALID_OPTS = ['header1', 'headers', 'indent', 'eolType', 'emptyLines', 'comments'],

    _filters = {
      license: /@license\b/,
      // markdown titles (for '#' only)
      titles: /\/[\/*]\s*#{1,5}[ \t]/,
      // http://usejsdoc.org/
      jsdoc:  /\/\*\*[^@]*@[A-Za-z]/,
      // http://www.jslint.com/help.html
      jslint: /\/[*\/](?:jslint|global|property)\b/,
      // http://jshint.com/docs/#inline-configuration
      jshint: /\/[*\/]\s*(?:jshint|globals|exported)\s/,
      // http://eslint.org/docs/user-guide/configuring
      eslint: /\/[*\/]\s*(?:eslint(?:\s|-[ed])|global\s)/,
      // http://jscs.info/overview
      jscs:   /\/[*\/]\s*jscs:[ed]/
    },
    _defaults = {
      header1:    '',
      headers:    "'\n// __FILE\n\n'",
      indent:     '2s',
      eolType:    'unix',
      emptyLines: 1,
      comments:   'filter',
      filter:    ['license']
    }

function Options(opts) {
  'use strict'

  //### Private properties

  var evalExpr = require('./evalexpr'),
      defines  = {}

  //### Private methods

  function invalid(msg, v) {
    return 'Invalid ' + msg + ' ' + (
      v === undefined ? 'undefined' : v === null ? 'null' : '"' + v + '"'
    )
  }

  function setFilter(filt) {
    if (filt === 'all')
      this.filter = filt
    else if (filt in _filters) {
      if (filt !== 'all' && this.filter.indexOf(filt) < 0)
        this.filter.push(filt)
    }
    else throw new Error(invalid('filter', filt))
  }

  //### Public Properties

  this.header1    = _defaults.header1
  this.headers    = _defaults.headers
  this.indent     = _defaults.indent
  this.eolType    = _defaults.eolType
  this.emptyLines = _defaults.emptyLines
  this.comments   = _defaults.comments
  this.filter     = _defaults.filter

  //### Public Methods

  this._setFile = function(file) {
    defines.__FILE = file
  }

  this.isDefined = function(name) {
    return name in defines
  }

  this.getDefine = function(name) {
    return name in defines ? defines[name] : 0
  }

  this.def = function (s) {
    var m = s.match(RE_DEFPAIR)
    if (!m)
      throw new Error(invalid('define', s))

    var v = m[2].trim()
    if (v) {
      v = evalExpr(v, this)
      v = (v instanceof RegExp) ?
        ('' + v).replace(/\n/g, '\\n').replace(/\r/g, '\\r') : JSON.stringify(v)
    }
    else v = '1'

    defines[m[1]] = v
  }

  this.undef = function (s) {
    var def = s.match(RE_DEFNAME)
    if (!def)
      throw new Error(invalid('undefine', s))

    delete defines[def[1]]
  }

  this.passFilter = function(str) {
    var filts = this.filter
    if (filts === 'all') filts = Object.keys(_filters)
    for (var i = 0; i < filts.length; ++i) {
      if (_filters[filts[i]].test(str)) return true
    }
    return false
  }

  this.merge = function (opts) {
    if (!opts) opts = {}

    for (var k in opts) {       // jshint ignore:line
      var v = opts[ k ],
          s

      if (k === 'defines') {
        for (s in v) {
          this.def(s + '=' + v)
        }
      }
      else if (k === 'define') {
        if (!Array.isArray(v)) v = v.split(',')
        v.forEach(this.def)
      }
      else if (k === 'undef') {
        if (!Array.isArray(v)) v = v.split(',')
        v.forEach(this.undef)
      }
      else if (k === 'filter') {
        if (!Array.isArray(v)) v = v.split(',')
        v.forEach(setFilter, this)
      }
      else if (this[k] !== v && ~VALID_OPTS.indexOf(k)) {
        switch (k) {
          case 'header1':
          case 'headers':
            if (v) {
              v = ('' + v).replace(/\r\n?|\^n/g, '\n')
              s = v[0]
              if ((s !== "'" && s !== '"') || s !== v.slice(-1))
                v = '"' + v.replace(/"/g, '\\"') + '"'
            }
            else v = ''
            break
          case 'eolType':
            if (v !== 'win' && v !== 'mac' && v !== 'unix')
              throw new Error(invalid(k, v))
            break
          case 'emptyLines':
            if ((v |= 0) < -1) v = -1
            break
          case 'comments':
            if (['all', 'none'].indexOf(v) < 0) v = 'filter'
            break
        }
        this[k] = v
      }
    }
    return this
  }

  // for ccparser
  this._getDefines = function () {
    return defines
  }

  return opts ? this.merge(opts) : this
}

Options.prototype.defaults = _defaults
Options.prototype.filters  = _filters

module.exports = Options
