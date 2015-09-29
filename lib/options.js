// Global Configuration
// ====================
// Manages the global configuration and the defines store.

'use strict'

var RE_DEFPAIR = /^([$_A-Z][_0-9A-Z]+)\s*(.*)/,
    RE_DEFNAME = /^[$_A-Z][_0-9A-Z]+$/,
    evalExpr   = require('./evalexpr')

var options = module.exports = {
    defines:    {},
    header1:    '',
    headers:    '\'\n// __FILE\n\n\'',
    indent:     '2s',
    eolType:    'unix',
    emptyLines: 1,
    comments:   'filter',
    filter:    ['license']
    },
    VALID_OPTS = [
      'headers', 'header1', 'indent', 'eolType', 'emptyLines', 'comments'
    ]

// Methods and comment filters as read-only properties
Object.defineProperties(options, {
  merge:  { value: merge },
  def:    { value: def   },
  undef:  { value: undef },
  _FILT:  { value: {
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
            }
          }
  })

function def(s) {
  var m = ('' + s).match(RE_DEFPAIR)
  if (!m)
    throw new Error('invalid define "' + s + '"')

  var v = m[2].trim()
  if (v) {
    v = evalExpr(v, options)
    v = (v instanceof RegExp) ?
      ('' + v).replace(/\n/g, '\\n').replace(/\r/g, '\\r') : JSON.stringify(v)
  }
  else v = '1'

  options.defines[m[1]] = v
}

function undef(s) {
  var def = s.match(RE_DEFNAME)
  if (!def)
    throw new Error('invalid undefine "' + s + '"')

  delete options.defines[def[0]]
}

function setFilter(filter) {
  if (filter === 'all')
    options.filter = Object.keys(options._FILT)
  else if (filter in options._FILT) {
    if (options.filter.indexOf(filter) < 0) options.filter.push(filter)
  }
  else throw new Error('invalid filter "' + filter + '"')
}

function merge(opts) {

  if (!opts) opts = {}

  for (var k in opts) {       // jshint ignore:line
    var v = opts[k]

    if (k === 'defines') {
      for (var d in v) {
        if (RE_DEFNAME.test(d)) options.defines[d] = v[d]
        else throw new Error('invalid define "' + d + '"')
      }
    }
    else if (k === 'define') {
      if (!Array.isArray(v)) v = v.split(',')
      v.forEach(options.def)
    }
    else if (k === 'undef') {
      if (!Array.isArray(v)) v = v.split(',')
      v.forEach(options.undef)
    }
    else if (k === 'filter') {
      if (!Array.isArray(v)) v = v.split(',')
      v.forEach(setFilter)
    }
    else if (options[k] !== v && ~VALID_OPTS.indexOf(k)) {
      switch (k) {
        case 'header1':
        case 'headers':
          v = ('' + v).replace(/\r\n?/g, '\n')
          break
        case 'eolType':
          if (v !== 'win' && v !== 'mac' && v !== 'unix')
            throw new Error('invalid eolType "' + v + '"')
          break
        case 'emptyLines':
          if ((v |= 0) < -1) v = -1
          break
        case 'comments':
          if (['all', 'none'].indexOf(v) < 0) v = 'filter'
          break
      }
      options[k] = v
    }
  }

  return options
}
