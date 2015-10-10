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
      license: /@license\b/,
      // markdown titles (for '#' only)
      titles: /\/(\/\s*|\*[*\s]*)#{1,}/,
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
    _defaults = Options.defaults = {
      header1:    '',
      headers:    "'\n// __FILE\n\n'",
      indent:     '2s',
      eolType:    'unix',
      emptyLines: 1,
      comments:   'filter',
      filter:    ['license']
    }

// Used by Options #if/#elif directives
var evalExpr = require('./evalexpr')

// Default error handler, must be overwrite by procbuf
function procError(str) {
  console.error('jspreproc Error: ' + str)
  process.exit(1)
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

  this._setFile = function (file) {
    defines.__FILE = file
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
      var v = m[2].trim()

      if (v) {
        v = evalExpr(v, this)
        v = v instanceof RegExp ?
          ('' + v).replace(/\n/g, '\\n').replace(/\r/g, '\\r') : JSON.stringify(v)
      }
      else v = '1'

      defines[m[1]] = v
    }
    else
      invalid('define', s)
  }

  this.undef = function (s) {
    var def = s.match(RE_DEFNAME)

    if (def)
      delete defines[def[1]]
    else
      invalid('undefine', s)
  }

  this.passFilter = function (str) {
    var i, f, filts

    for (i = 0; i < custfilt.length; ++i) {
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
      merge(this, opt)
    return this
  }

  // for ccparser
  this._getDefines = function () {
    return defines
  }

  return this.merge(opts)

  //### Private methods

  function split(v) {
    return Array.isArray(v) ? v :
      typeof v === 'string' ? v.split(',') : [v]
  }

  function invalid(msg, v) {
    this.emitError('Invalid ' + msg + ' ' + (v == null ? v : '"' + v + '"'))
  }

  // Enable the given filter for comments, 'all' enable all filters
  function setFilter(filt) {
    if (filt === 'all')
      this.filter = filt
    else if (filt in _filters) {
      if (this.filter !== 'all' && this.filter.indexOf(filt) < 0)
        this.filter.push(filt)
    }
    else invalid('filter', filt)
  }

  // Creates a custom filter
  function createFilter(res) {
    for (var i = 0; i < res.length; ++i) {
      var f = res[i]

      if (!(f instanceof RegExp)) {
        //console.log('--- creating regex with `' + str + '`')
        try {
          f = new RegExp(f)
        }
        catch (e) {
          f = null
        }
        if (!f) {
          invalid('custom filter', res[i])
          return
        }
      }
      custfilt.push(f)
    }
  }

  /* eslint-disable guard-for-in, complexity */
  function merge(self, opt) {
    var v, s

    for (var k in opt) {
      v = opt[k]

      switch (k) {
        case 'defines':
          for (s in v)
            self.def(s + '=' + v)
          break
        case 'define':
          split(v).forEach(self.def)
          break
        case 'undef':
          split(v).forEach(self.undef)
          break
        case 'filter':
          split(v).forEach(setFilter, self)
          break
        case 'customFilter':
          createFilter(split(v))
          break
        case 'header1':
        case 'headers':
          if (v) {
            v = ('' + v)
                .replace(/\r\n?/g, '\n')
                .replace(/\^{1,2}/, function (c) { return c[1] || '\n' })
            s = v[0]
            if (s !== "'" && s !== '"' || s !== v.slice(-1))
              v = '"' + v.replace(/"/g, '\\"') + '"'
          }
          self[k] = v || ''
          break
        case 'eolType':
          if (v === 'win' || v === 'mac' || v === 'unix')
            self[k] = v
          else
            invalid(k, v)
          break
        case 'emptyLines':
          self[k] = v |= 0
          break
        case 'comments':
          if (v === 'all' || v === 'none' || v === 'filter')
            self[k] = v
          else
            invalid('comments option', v)
          break
        case 'indent':
          self[k] = v
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
