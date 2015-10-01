// Lines compactation
// ==================
// Also, trims trailing whitespace

'use strict'

var cache = ''

module.exports = function (buffer, indent, opts) {
  var swap = opts.eolType === 'win' ? 1 : opts.eolType === 'mac' ? 2 : 0,
      to   = swap === 1 ? '\r\n' : swap === 2 ? '\r' : '\n',
      nn   = opts.emptyLines,
      pos  = -1

  if (buffer === null) {
    // flush
    //--nn
    return (nn <= 0 || !cache) ? '' : cache.slice(0, nn).replace(/\n/g, to)
  }

  // first we need trim all trailing whitespace for fast searching
  buffer = buffer.replace(/[ \t]+$/gm, '')

  // compact lines if emptyLines != -1
  if (nn >= 0) {

    // remove excess on leading lines (example with '\n\n\n\nX', and nn = 1)
    pos = buffer.search(/[^\n]/)        // pos = 4
    if (pos < 0) {
      // buffer.trim() === ''
      cache += buffer
      return ''
    }
    if (pos > nn) {                     // 4 > 1 (note: cases -1 > -1 == false)
      pos -= nn                         // 4 - 1 = 3
      buffer = buffer.slice(pos)        // slice(3) == '\nX'
    }
    else if (!nn) {                     // no empty lines
      if (pos) buffer = buffer.slice(pos)
    }
    else {                              // pos <= nn, check the cache
      cache = cache.slice(0, nn - pos)
      if (cache) buffer = cache + buffer
    }

    // top lines done, now leave only one eol at the end, save others in cache
    if (buffer.slice(-1) !== '\n') {
      cache = ''
//    buffer += '\n'
    }
    else {
      pos = buffer.search(/\n+$/) + 1
      cache = buffer.slice(pos)
      buffer = buffer.slice(0, pos)
    }
  }

  // finish with surrounding lines, now the inners
  if (!nn) {
    // remove all empty lines and change eols in one unique operation
    buffer = buffer.replace(/\n{2,}/g, to)
  }
  else {
    // keep max n empty lines (n+1 sucesive eols), -1 keep all
    if (nn > 0) {
      var re = new RegExp('(\n{' + (nn + 1) + '})\n+', 'g')
      buffer = buffer.replace(re, '$1')
    }

    // change line terminator if not unix
    if (swap) buffer = buffer.replace(/\n/g, to)
  }

  // apply indentation, regex `^.` and multiline matches non-empty lines
  if (indent)
    buffer = buffer.replace(/^./mg, indent + '$&')

  return buffer
}
