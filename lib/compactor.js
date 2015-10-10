// Buffer compactation
// -------------------
// Removes duplicate empty lines and trailing whitespace, converts end of lines
'use strict'  // eslint-disable-line

//const
var eolstr = {unix: '\n', win: '\r\n', mac: '\r'}
var events = require('events')

/*
  class Compact
 */
module.exports = function (options, output) {

  var _to     = eolstr[options.eolType],
      _nn     = options.emptyLines,
      _indent = '',
      _cache  = ''

  this.emitter = new events.EventEmitter()
  this.emitter
    .on('swap', indent)
    .on('data', write)
    .on('end', close)

  return this

  // Changes indentation, format is 2, 2t, 2s, etc. default is spaces
  function indent(level) {
    var str = options.indent
    _indent = ''

    if (level > 0 && str) {
      var match = str.match(/^(\d+)\s*([t])?/i)
      if (match) {
        var c = level * (match[1] | 0)
        if (c > 0)
          _indent = (new Array(c + 1)).join(match[2] ? '\t' : ' ')
      }
    }
  }

  function write(buffer) {

    if (!output) return

    if (buffer === null) {
      // flush
      buffer = _nn <= 0 || !_cache ? '' : _cache.slice(0, _nn).replace(/\n/g, _to)
    }
    else {
      // first we need trim all trailing whitespace for fast searching
      buffer = buffer.replace(/[ \t]+$/gm, '')

      // compact lines if emptyLines != -1
      if (_nn >= 0)
        buffer = trimBuffer(buffer)

      // finish with surrounding lines, now the inners
      if (!_nn) {
        // remove all empty lines and change eols in one unique operation
        buffer = buffer.replace(/\n{2,}/g, _to)
      }
      else {
        // keep max n empty lines (n+1 sucesive eols), -1 keep all
        if (_nn > 0) {
          var re = new RegExp('(\n{' + (_nn + 1) + '})\n+', 'g')
          buffer = buffer.replace(re, '$1')
        }

        // change line terminator if not unix
        if (_to !== '\n') buffer = buffer.replace(/\n/g, _to)
      }
    }

    // apply indentation, regex `^.` and multiline matches non-empty lines
    if (indent)
      buffer = buffer.replace(/^./mg, _indent + '$&')

    if (buffer)
      output.emit('data', buffer)
  }

  function close(abort) {
    if (output && !abort) {
      write(null)
      output.emit('end')
    }
    output = null
  }

  function trimBuffer(buffer) {

    // remove excess on leading lines (example with '\n\n\n\nX', and _nn = 1)
    var pos = buffer.search(/[^\n]/)    // first non-eol char, pos = 4
    if (pos < 0) {                      // buffer.trim() === ''
      if (_cache) {
        _cache += buffer
        return ''
      }
      if (buffer) _cache += buffer.slice(1)
      return buffer[0]
    }
    if (pos > _nn) {                     // 4 > 1 (note: cases -1 > -1 == false)
      pos -= _nn                         // 4 - 1 = 3
      buffer = buffer.slice(pos)        // slice(3) == '\nX'
    }
    else if (!_nn) {                     // no empty lines
      if (pos) buffer = buffer.slice(pos)
    }
    else {                              // pos <= _nn, check the _cache
      _cache = _cache.slice(0, _nn - pos)
      if (_cache) buffer = _cache + buffer
    }

    // top lines done, now leave only one eol at the end, save others in _cache
    pos = buffer.search(/\n+$/) + 1
    if (pos) {
      _cache = buffer.slice(pos)
      buffer = buffer.slice(0, pos)
    }
    else _cache = ''

    return buffer
  }

}
