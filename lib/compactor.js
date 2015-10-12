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
      _re     = new RegExp('(\n{' + (_nn + 1) + '})\n+', 'g'),
      _lastch = null,
      _indent = '',
      _cache  = ''

  this.emitter = new events.EventEmitter()
  this.emitter
    .on('swap', indent)
    .on('data', write)
    .on('end', close)

  return this

  // On file change, reset indentation.
  function indent(level) {
    var str = options.indent
    _indent = ''

    if (_lastch === null)
      _lastch = _to                 // as-is, this is the first file
    else if (_lastch !== _to) {
      _lastch = _to
      if (output)
        output.emit('data', _to)    // force eol after insert file
    }

    if (level > 0 && str) {
      // format is 2, 2t, 2s, etc. default is spaces
      var match = str.match(/^(\d+)\s*([t])?/i)
      if (match) {
        var c = level * (match[1] | 0)
        if (c > 0)
          _indent = (new Array(c + 1)).join(match[2] ? '\t' : ' ')
      }
    }
  }

  // On new data, trim trailing ws and transform eols before write
  function write(buffer) {

    // first we need trim trailing whitespace for fast searching
    buffer = buffer.replace(/[ \t]+$/gm, '')

    // compact lines if emptyLines != -1
    if (_nn >= 0)
      buffer = trimBuffer(buffer)

    if (!buffer) return

    // finish with surrounding lines, now the inners
    if (!_nn) {
      // remove empty lines and change eols in one unique operation
      buffer = buffer.replace(/\n{2,}/g, _to)
    }
    else {
      // keep max n empty lines (n+1 sucesive eols), -1 keep all
      if (_nn > 0)
        buffer = buffer.replace(_re, '$1')

      // change line terminator if not unix
      if (_to !== '\n') buffer = buffer.replace(/\n/g, _to)
    }

    // apply indentation, regex `^.` with `/m` matches non-empty lines
    if (_indent)
      buffer = buffer.replace(/^./mg, _indent + '$&')

    _lastch = buffer.slice(-1)
    if (output)
      output.emit('data', buffer)
  }

  function close(abort) {
    if (output && !abort) {
      if (_nn > 0 && _cache)
        output.emit('data', _cache.slice(0, _nn).replace(/\n/g, _to))
      output.emit('end')
    }
    output = null
  }

  function trimBuffer(buffer) {

    // first, remove excess of empty lines at top (leading eols)
    var pos = buffer.search(/[^\n]/)    // pos = eols count

    // if buffer.trim() === '' then don't output for now
    if (pos < 0) {
      _cache += buffer
      return ''
    }

    // at the point we have non-eol chars and ...
    // _nn >= 0
    // pos >= 0
    if (_nn < pos) {
      // remove excess of empty lines
      buffer = buffer.slice(pos - _nn)
    }
    else if (_nn > pos && _cache) {
      // add cached empty lines to complete `emptyLines` value
      buffer = _cache.slice(0, _nn - pos) + buffer
    }

    // top lines done, now leave only one eol at end, save others in _cache
    pos = buffer.search(/\n+$/) + 1
    if (pos && pos < buffer.length) {
      _cache = buffer.slice(pos)
      buffer = buffer.slice(0, pos)
    }
    else _cache = ''

    return buffer
  }

}
