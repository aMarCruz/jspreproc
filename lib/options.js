'use strict'

var RE_DEFPAIR = /^([$_A-Z][_A-Z]+)\s*(.*)/,
    RE_DEFNAME = /^[$_A-Z][_A-Z]+$/

var options = module.exports = {
    defines:    {},
    headers:    '\'\n//// __FILE\n\n\'',
    eolType:    'unix',
    emptyLines: 1,
    comments:   'filter',
    filter:    ['license']
  }

Object.defineProperties(options, {
  merge:  { value: _merge },
  def:    { value: _def   },
  undef:  { value: _undef },
  _FILT:  { value: {
            license: /@license\b/,
            // http://usejsdoc.org/
            jsdoc:  /\/\*\*[^@]*@[A-Za-z]/,
            // http://www.jslint.com/help.html
            jslint: /\/[*\/](?:jslint|global|property)\b/,
            // http://jshint.com/docs/#inline-configuration
            jshint: /\/[*\/]\s*(?:jshint|globals|exported)\s/,
            // http://eslint.org/docs/user-guide/configuring
            eslint: /\/[*\/]\s*(?:eslint(?:\s|-[ed])|global\s)/
            }
          }
  })

function _def(s) {
  var m = ('' + s).match(RE_DEFPAIR)
  if (!m)
    throw new Error('invalid define "' + s + '"')

  options.defines[m[1]] = m[2].trim() || '1'
}

function _undef(s) {
  var def = s.match(RE_DEFNAME)
  if (!def)
    throw new Error('invalid undefine "' + s + '"')

  delete options.defines[def[0]]
}

function _merge(opts) {

  if (!opts) opts = {}

  for (var k in opts) {
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
    else if (k === 'filter') {
      if (!Array.isArray(v)) v = v.split(',')
      v.forEach(function (f) {
        if (f === 'all')
          options.filter = Object.keys(options._FILT)
        else if (f in options._FILT) {
          if (options.filter.indexOf(f) < 0) options.filter.push(f)
        }
        else throw new Error('invalid filter "' + f + '"')
      })
    }
    else if (options[k] !== v && ~[
        'headers', 'eolType', 'emptyLines', 'comments'].indexOf(k)) {
      switch (k) {
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
