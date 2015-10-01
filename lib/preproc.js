// jspreproc Main Module
// =====================

'use strict'

var ccparser = require('./ccparser'),
    compact = require('./compact'),
    stream = require('stream'),
    path = require('path'),
    fs = require('fs')

var Options = require('./options')

//------------------------------------------------------------------------------
// Data
//------------------------------------------------------------------------------

var _files,
    _queue,
    _output,
    options,

    // Matches comments, strings, and preprocessor directives
    RE_BLOCKS = new RegExp([
      ccparser.RE.source,                                       // $1: maybe a cc comment
      /\/\*[^*]*\*+(?:[^*\/][^*]*\*+)*\//.source,               // - multi-line comment
      /\/\/[^\n]*$/.source,                                     // - single-line comment
      /"(?:[^"\\]*|\\[\S\s])*"|'(?:[^'\\]*|\\[\S\s])*'/.source, // - string, don't care about embedded eols
      /(?:[$\w\)\]]|\+\+|--)\s*(\/)(?![*\/])/.source,           // $2: division operator
      /\/(?=[^*\/])[^[\/\\]*(?:(?:\[(?:\\.|[^\]\\]*)*\]|\\.)[^[\/\\]*)*?(\/)[gim]*/.source
    ].join('|'),                                              // $3: last slash of regex
    'm') // note: only multiline, this regex is for `string.match()`

//------------------------------------------------------------------------------
// Public Interface
//------------------------------------------------------------------------------

// Process stdin or the input file.
module.exports = function (file, opts) {
  var data,
      stdPush = function (chunk) { data.push(chunk) }

  // for global instances, as in tests
  if (!options)
    process.on('uncaughtException', herror)

  _files  = {}
  _queue  = []
  options = new Options(opts)

  _output = new stream.PassThrough({encoding: 'utf8', decodeStrings: false})
  _output.once('error', herror)

  if (opts.test) {
    data = file
  }
  else if (file && Array.isArray(file)) {
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
    process.stdin
      .on('data', stdPush).once('end', function () {
        process.stdin.removeListener(stdPush)
        procData(data.join('')),
        data.length = 0
      })
  }

  return _output
}

function herror(err) {
  console.error(err.stack)  // eslint-disable-line no-console
  process.exit(1)
}

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

// Get indentation. format is 2, 2t, 2s, etc. default is spaces
function getIndent(str, n) {
  if (n > 0 && str) {
    var match = str.match(/^(\d+)\s*([t])?/i)
    if (match) {
      var c = n * (match[1] | 0)
      if (c > 0)
        return (new Array(c + 1)).join(match[2] ? '\t' : ' ')
    }
  }
  return ''
}

function fullPath(file, base) {

  if (!path.extname(file)) file += '.js'

  base = base ? path.dirname(base) : process.cwd()
  return path.resolve(base, file)
}


function readImport(file, level) {

  file = fullPath(file)

  fs.readFile(file, {encoding: 'utf8'}, function (err, data) {
    if (err)
      _output.emit('error', err)
    else
      procData(data, file, level)
  })
}


function procData(data, file, level) {
  if (!file) file = ''
  level |= 0

  var cc = ccparser.CC(file, level, options),
      cache = [],
      match
  cc.indent = getIndent(options.indent, level)
  cc.file   = file

  // normalize eols here
  if (~data.indexOf('\r')) data = data.replace(/\r\n?/g, '\n')

  if (cc.header) pushData(cc.header)

  while (1) {               // eslint-disable-line no-constant-condition

    while ((match = data.match(RE_BLOCKS))) {

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
        if (match[3] || match[4] || str[0] !== '/')
          pushData(str)     // string, div, or regex
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
    cc   = ccparser.reset(cc[0])
    file = cc.file
    level--
  }

  closeOutput()

  // Helpers -----

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
    readImport(file, level + 1)

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

  function pushComment(str) {
    if (cc.output) {
      var opc = options.comments

      if (opc === 'none' || opc === 'filter' && !options.passFilter(str))
        str = str[1] === '*' ? ' ' : ''

      if (str) cache.push(str)
    }
  }

  function flush() {
    if (cache.length) {
      var buff = cache.join('')
      cache = []
      if (buff) {
        buff = compact(ccparser.redef(buff), cc.indent, options)
        if (buff) _output.write(buff)
      }
    }
  }

  function closeOutput() {
    _output.write(compact(null, cc.indent, options))
    _output.end()
  }
}
