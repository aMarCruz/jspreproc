// Global Configuration // ====================
// Class to manage and store configuration and methods per top file
'use strict'  // eslint-disable-line

// The constant values of this module
//const
var
    RE_VARPAIR = /^\s*([^\s=]+)\s*=?(.*)/,
    RE_VARNAME = /^\s*([$_A-Z][_0-9A-Z]+)\s*$/

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
      headers:    '\n// __FILE\n\n',
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
      varset   = {__FILE: '', $__FILE: '""'}

  //### Public Properties

  this.header1    = _defaults.header1
  this.headers    = _defaults.headers
  this.indent     = _defaults.indent
  this.eolType    = _defaults.eolType
  this.emptyLines = _defaults.emptyLines
  this.comments   = _defaults.comments
  this.filter     = _defaults.filter

  this.emitError  = procError     // error "handler"

  //### Public Methods

  this.invalid = function (msg, v) {
    this.emitError('Invalid ' + msg + ' ' + (v != null ? '"' + v + '"' : v))
  }

  this.getVars = function () {
    return varset
  }

  this.setFile = function (file) {
    varset.$__FILE = JSON.stringify(varset.__FILE = file)
  }

  this.def = function (s) {
    var m = s.match(RE_VARPAIR)

    if (m) {
      var k = m[1],
          v = m[2].trim()

      if (!RE_VARNAME.test(k))
        this.invalid('symbol name', k)
      else
        varset[k] = !v ? 1 :
          _fixValue(evalExpr(v, varset, this.emitError))
    }
    else
      this.invalid('symbol name or declaration', s) // only when starts with '='
  }

  this.undef = function (s) {
    var def = s.match(RE_VARNAME)

    if (def)
      delete varset[def[1]]
    else
      this.invalid('symbol name', s)
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

  // prepare a value for inclussion in the set of variables
  function _fixValue(v) {
    switch (typeof v) {
      case 'number':      // typeof NaN is 'number'
      case 'boolean':
      case 'undefined':
        break
      default:
        // date value returns 'new Date(NaN)' for null dates, ok
        v = v instanceof RegExp ? '' + v :
            v instanceof Date ? '(new Date(' + (+v) + '))' : // eslint-disable-line no-extra-parens
            v == null ? v : JSON.stringify(v)
        break
    }
    return v
  }

  // returns an array as-is or created from a delimited string
  function _split(v) {
    return Array.isArray(v) ? v : v.split(',')
  }

  // Enable filters for comments, 'all' enable all filters
  function _setFilter(filt) {
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
  function _createFilter(res) {
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

  function _formatHeader(str) {
    return !str ? '' :
      ('' + str)
      .replace(/\r\n?/g, '\n')
      .replace(/\^{1,2}/g, function (c) { return c[1] || '\n' })
  }

  function _setVars(set) {
    for (var k in set) {
      if (RE_VARNAME.test(k))
        varset[k] = _fixValue(set[k])
      else
        this.invalid('symbol name', k)
    }
  }

  /* eslint-disable guard-for-in, complexity */
  function merge(opt) {
    var k, v

    for (k in opt) {
      v = opt[k]

      switch (k) {
        case 'varset':
          _setVars.call(this, v)
          break
        case 'define':
        case 'set':
          _split(v).forEach(this.def, this)
          break
        case 'undef':
        case 'unset':
          _split(v).forEach(this.undef, this)
          break
        case 'filter':
          _split(v).forEach(_setFilter, this)
          break
        case 'customFilter':
          _createFilter(Array.isArray(v) ? v : [v])
          break
        case 'header1':
        case 'headers':
          this[k] = _formatHeader(v)
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
          if (/^\d+[ts]?/.test(v))
            this[k] = v
          else if (!v)
            this[k] = ''
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
