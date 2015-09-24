'use strict'

var ccparser = require('./ccparser'),
    compact = require('./compact'),
    options = require('./options'),
    stream = require('stream'),
    path = require('path'),
    fs = require('fs')

//------------------------------------------------------------------------------
// Data
//------------------------------------------------------------------------------

var _files = {},
    _queue = [],
    _output,

    // Matches comments, strings, and cc directives
    RE_BLOCKS = new RegExp([
      ccparser.RE.source,                                       // $1: maybe a cc comment
      /\/\*[^*]*\*+(?:[^*\/][^*]*\*+)*\//.source,               // - multi-line comment
      /\/\/[^\n]*$/.source,                                     // - single-line comment
      /"(?:[^"\\]*|\\[\S\s])*"|'(?:[^'\\]*|\\[\S\s])*'/.source, // - string, don't care about embedded eols
      /(?:[$\w\)\]]|\+\+|--)\s*(\/)(?![*\/])/.source,           // $2: division operator
      /\/(?=[^*\/])[^[\/\\]*(?:(?:\[(?:\\.|[^\]\\]*)*\]|\\.)[^[\/\\]*)*?(\/)[gim]*/.source
      ].join('|'),                                              // $3: last slash of regex
      'm' // note: only multiline, this is for string.match()
    )

//------------------------------------------------------------------------------
// Public Interface
//------------------------------------------------------------------------------

/**
 * Process the stdin or input file.
 */
module.exports = function (file, opts) {
  var data

  process.on('uncaughtException', herror)

  options.merge(opts)

  _output = new stream.PassThrough({encoding: 'utf8', decodeStrings: false})
  _output.on('error', herror)

  if (file && Array.isArray(file)) {
    if (file.length > 1)
      data = '//#include ' + file.join('\n//#include ') + '\n'
    else
      file = file[0]
  }

  if (data) {
    procData(data)
  }
  else if (file) {
    readImport(file)
  }
  else {
    data = []
    process.stdin.setEncoding('utf8')
    process.stdin.resume()

    process.stdin.on('data', function (chunk) {
      data.push(chunk)
    })
    process.stdin.on('end', function () {
      procData(data.join(''))
      data.length = 0
    })
  }

  return _output
}

function herror(err) {
  console.error(err.stack)
  process.exit(1)
}

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

function fullPath(file, base) {

  if (!path.extname(file)) file += '.js'

  if (!path.isAbsolute(file)) {
    base = base ? path.dirname(base) : process.cwd()
    file = path.resolve(base, file)
  }
  return file
}


function readImport(file) {

  file = fullPath(file)

  fs.readFile(file, {encoding: 'utf8'}, function (err, data) {
    if (err)
      _output.emit('error', err)
    else
      procData(data, file)
  })
}


function procData(data, file) {
  if (!file) file = ''

  var cc = ccparser.CC(file, options),
      cache = [],
      match

  // normalize eols here
  if (~data.indexOf('\r')) data = data.replace(/\r\n?/g, '\n')

  if (cc.header) pushData(cc.header)

  while (1) {
    while (match = data.match(RE_BLOCKS)) {

      data = RegExp.rightContext
      pushData(RegExp.leftContext)

      if (match[1]) {
        flush()
        ccparser(match[1], match[2], cc)
        if (cc.insert && insert(cc.insert, file, cc.once))
          return
      }
      else if (cc.output) {
        var str = match[0]
        if (match[3] || match[4] || str[0] !== '/') // string, div, or regex
          pushData(str)
        else
          pushComment(str)  // regular comment
      }

    }
    pushData(data)
    flush()

    // now, check if there's something of a previous file
    if (!_queue.length)
      break
    cc   = _queue.pop()
    data = cc[1]
    cc   = cc[0]
    file = cc.file
  }

  _output.end()

  //// helpers -----

  function insert(file, base, once) {

    file = fullPath(file, base)

    var f = _files[file] | 0
    if (f > 1) return false     // 2 or 3 is include_once
    if (once) {
      _files[file] = 2          // 2
      if (f) return false
    }
    else
      _files[file] = f | 1      // 1 or 3

    if (isInQueue(file)) {
      cache.push('// ignored ' + path.relative('.', file) + '\n')
      return false
    }

    _queue.push([cc, data])
    readImport(file)

    return true

    function isInQueue(file) {
      var i = _queue.length
      while (--i >= 0 && _queue[i][0].file !== file);
      return ~i
    }
  }

  function pushData(str) {
    if (str && cc.output) cache.push(str)
  }

  function pushComment(str, idx) {
    if (cc.output) {
      var com = (idx |= 0) ? str.slice(idx) : str,
          opc = options.comments

      if (opc === 'filter') {
        if (/^\/[*\/]#/.test(com)) {
          str = str.slice(0, idx + 2) + com.slice(3)
        }
        else {
          var f = options.filter, i = f.length
          while (--i >= 0) {
            if (options._FILT[f[i]].test(com)) break
          }
          if (i < 0) opc = 'none'
        }
      }
      if (opc === 'none') {
        com = com[1] === '*' ? ' ' : ''
        str = idx ? str.slice(0, idx) + com : com
      }

      if (str) cache.push(str)
    }
  }

  function flush() {
    if (cache.length) {
      var buff = cache.join('')
      cache = []
      if (buff) _output.write(compact(buff, options))
    }
  }
}
