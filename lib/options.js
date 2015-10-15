// Global Configuration // ====================
// Class to manage and store configuration and methods per top file
'use strict'  // eslint-disable-line

// The constant values of this module
//const
var
    RE_DEFPAIR = /^\s*([$_A-Z][_0-9A-Z]+)\s*(.*)/,
    RE_DEFNAME = /^\s*([$_A-Z][_0-9A-Z]+)\s*$/

// Options globals
var _filters = Options.filters = {
      // like the uglify -c option
      license:  /@license\b/,
      // markdown titles (for '#' only)
      titles:   /^\/(\/\s*|\*[*\s]*)#{1,}/,
      // http://usejsdoc.org/
      jsdoc:    /^\/\*\*[^@]*@[A-Za-z]/,
      // http://www.jslint.com/help.html
      jslint:   /^\/[*\/](?:jslint|global|property)\b/,
      // http://jshint.com/docs/#inline-configuration
      jshint:   /^\/[*\/]\s*(?:jshint|globals|exported)\s/,
      // http://eslint.org/docs/user-guide/configuring
      eslint:   /^\/[*\/]\s*(?:eslint(?:\s|-[ed])|global\s)/,
      // http://jscs.info/overview
      jscs:     /^\/[*\/]\s*jscs:[ed]/,
      // https://gotwarlost.github.io/istanbul/
      istanbul: /^\/[*\/]\s*istanbul\s/
    },
    _defaults = Options.defaults = {
      header1:    '',
      headers:    "'\n// __FILE\n\n'",
      indent:     '',
      eolType:    'unix',
      emptyLines: 1,
      comments:   'filter',
      filter:    ['license']
    }

// Used by Options #if/#elif directives
var evalExpr = require('./evalexpr')

// Default error handler, must be overwrite by procbuf
function procError(str) {
  throw new Error('jspreproc Error: ' + str)
}

// The main exported constructor
function Options(opts) {

  //### Private properties

  var custfilt = [],
      defines  = {}

  //### Public Properties

  this.header1    = _defaults.header1
  this.headers    = _defaults.headers
  this.indent     = _defaults.indent
  this.eolType    = _defaults.eolType
  this.emptyLines = _defaults.emptyLines
  this.comments   = _defaults.comments
  this.filter     = _defaults.filter

  this.emitError  = procError     // The default error "handler"

  //### Public Methods

  this.invalid = function (msg, v) {
    this.emitError('Invalid ' + msg + ' ' + (v != null ? '"' + v + '"' : v))
  }

  this._setFile = function (file) {
    defines.__FILE = file
  }

  // for ccparser
  this._getDefines = function () {
    return defines
  }

  this.isDefined = function (name) {
    return name in defines
  }

  this.getDefine = function (name) {
    return name in defines ? defines[name] : 0
  }

  this.def = function (s) {
    var m = s.match(RE_DEFPAIR)

    if (m) {
      var v = m[2].replace(/^=/, '').trim()

      if (v) {
        v = evalExpr(v, this)
        switch (typeof v) {
          case 'number':      // typeof NaN is 'number'
          case 'boolean':
          case 'undefined':
            break
          default:
            v = v instanceof RegExp ? '' + v :
                v instanceof Date ? sDate(v) :
                v == null ? v : JSON.stringify(v)
            break
        }
      }
      else v = 1

      defines[m[1]] = v
    }
    else
      this.invalid('define', s)

    // serializes Dates, returns 'new Date(NaN)' for NaN and its ok
    function sDate(dt) {
      return '(new Date(' + (+dt) + '))' // eslint-disable-line no-extra-parens
    }
  }

  this.undef = function (s) {
    var def = s.match(RE_DEFNAME)

    if (def)
      delete defines[def[1]]
    else
      this.invalid('undefine', s)
  }

  this.passFilter = function (str) {
    var i, f, filts

    for (i = 0; i < custfilt.length; ++i) {
      /* istanbul ignore else */
      if (custfilt[i].test(str)) return true
    }
    filts = this.filter
    if (filts === 'all')
      filts = Object.keys(_filters)
    for (i = 0; i < filts.length; ++i) {
      f = _filters[filts[i]]
      if (f.test(str)) return true
    }
    return false
  }

  this.merge = function (opt) {
    if (opt)
      merge.call(this, opt)
    return this
  }

  return this.merge(opts)

  //### Private methods

  function split(v) {
    return Array.isArray(v) ? v : v.split(',')
  }

  // Enable the given filter for comments, 'all' enable all filters
  function setFilter(filt) {
    filt = filt.trim()
    if (filt === 'all')
      this.filter = filt
    else if (filt in _filters) {
      if (this.filter !== 'all' && this.filter.indexOf(filt) < 0)
        this.filter.push(filt)
    }
    else this.invalid('filter', filt)
  }

  // Creates a custom filter
  function createFilter(res) {
    for (var i = 0; i < res.length; ++i) {
      var f = res[i]

      if (f instanceof RegExp)
        custfilt.push(f)
      else {
        //console.log('--- creating regex with `' + str + '`')
        try {
          f = new RegExp(f)
          custfilt.push(f)
        }
        catch (e) {
          f = null
        }
        if (!f) this.invalid('custom filter', res[i])
      }
    }
  }

  function formatHeader(str) {
    if (str) {
      str = ('' + str)
          .replace(/\r\n?/g, '\n')
          .replace(/\^{1,2}/g, function (c) { return c[1] || '\n' })
      var c = str[0]
      if (c !== "'" && c !== '"' || c !== str.slice(-1))
        str = '"' + str.replace(/"/g, '\\"') + '"'
    }
    return str || ''
  }

  /* eslint-disable guard-for-in, complexity */
  function merge(opt) {
    var k, v

    for (k in opt) {
      v = opt[k]

      switch (k) {
        case 'define':
          split(v).forEach(this.def, this)
          break
        case 'undef':
          split(v).forEach(this.undef, this)
          break
        case 'filter':
          split(v).forEach(setFilter, this)
          break
        case 'customFilter':
          createFilter(Array.isArray(v) ? v : [v])
          break
        case 'header1':
        case 'headers':
          this[k] = formatHeader(v)
          break
        case 'emptyLines':
          this[k] = v | 0
          break
        case 'eolType':
          if (/^(?:win|mac|unix)$/.test(v))
            this[k] = v
          else
            this.invalid(k, v)
          break
        case 'comments':
          if (/^(?:all|none|filter)$/.test(v))
            this[k] = v
          else
            this.invalid(k + ' value', v)
          break
        case 'indent':
          if (!v)
            this[k] = ''
          else if (/^\d+[ts]?/.test(v))
            this[k] = '' + v
          else
            this.invalid(k, v)
          break
        default:
          break
      }
      //else
      //  console.log('Ignoring option ' + k)
    }
  }
}

module.exports = Options
