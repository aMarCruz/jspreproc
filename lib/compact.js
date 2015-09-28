// Lines compactation
// ==================

// Also, trims trailing whitespace

'use strict'

module.exports = function (buffer, opts) {
  var swap = opts.eoltype === 'win' ? 1 : opts.eoltype === 'mac' ? 2 : 0,
      to = swap === 1 ? '\r\n' : swap === 2 ? '\r' : '\n',
      nn = opts.emptyLines

  buffer = buffer.replace(/[ \t]+$/gm, '')

  if (buffer.slice(-1) !== '\n')
    buffer += '\n'
  else if (buffer[buffer.length - 2] === '\n')
    buffer = buffer.replace(/\n+$/, '\n')

  if (!nn) {
    // remove all empty lines
    buffer = buffer.replace(/\n\n+/g, to)
    if (buffer[0] === '\n')
      buffer = buffer.slice(1)
  }
  else {
    // keep max n empty lines (n+1 sucesive eols), -1 keep all
    if (nn > 0) {
      var re = new RegExp('(\n{' + (nn + 1) + '})\n+', 'g')
      buffer = buffer.replace(re, '$1')

      var mm = buffer.match(/^\n+/)
      if (mm && mm.length > nn)
        buffer = buffer.slice(mm.length + 1 - nn)
    }
    // change line terminator?
    if (swap)
      buffer = buffer.replace(/\n/g, to)
  }

  return buffer
}
