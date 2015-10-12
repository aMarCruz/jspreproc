// Process the buffer
// ------------------
// Read the input, calls to cc parser and the compactor
'use strict'

var Compactor = require('./compactor'),
    ccparser = require('./ccparser'),
    stream = require('stream'),
    path = require('path'),
    fs = require('fs')

// Matches comments, strings, and preprocessor directives
//const
var RE_BLOCKS = new RegExp([
  ccparser.RE.source,                                       // $1: maybe a cc comment
  /\/\*[^*]*\*+(?:[^*\/][^*]*\*+)*\//.source,               // - multi-line comment
  /\/\/[^\n]*$/.source,                                     // - single-line comment
  /"(?:[^"\\]*|\\[\S\s])*"|'(?:[^'\\]*|\\[\S\s])*'/.source, // - string, don't care about embedded eols
  /(?:[$\w\)\]]|\+\+|--)\s*(\/)(?![*\/])/.source,           // $2: division operator
  /\/(?=[^*\/])[^[\/\\]*(?:(?:\[(?:\\.|[^\]\\]*)*\]|\\.)[^[\/\\]*)*?(\/)[gim]*/.source
].join('|'),                                                // $3: last slash of regex
'm') // note: only multiline, for `string.match()`

/**
 * Take the input and options, and returns a readable stream with the results.
 *
 * Inyect data to eventEmitter with procData.
 * procData calls to ccparser, and emit a 'data' event.
 * compact handle 'data' event and writes to _output.
 *
 * @param   {string}       strbuf - String buffer to process directly.
 * @param   {string|stream} fname - File names for input or readable stream.
 * @param   {Object}      options - Processed global user options.
 * @returns {stream} The readable stream.
 */
module.exports = function procbuf(strbuf, fname, options) {

  //----------------------------------------------------------------------------
  // Data
  //
  var _output  = new stream.PassThrough({encoding: 'utf8', decodeStrings: false}),
      _emitter = new Compactor(options, _output).emitter,
      _level   = 0,
      _files   = {},
      _queue   = []

  options.emitError = errHandler

  process.nextTick(function () {
    if (strbuf) {
      procData(strbuf)
    }
    else if (typeof fname === 'string') {
      readImport(fname)
    }
    else {
      readStream(fname)
    }
  })

  return _output

  function errHandler(msg) {
    if (_output) {
      _output.removeAllListeners('data')
      _output.removeAllListeners('end')
      _emitter.emit('end', true)

      if (_output._events.error) {
        var e = msg instanceof Error ? msg : new Error(msg)
        _output.emit('error', e)
      }
      else {
        console.error('jspreproc: ' + msg + '\nExiting...')
        process.exit(1)
      }
      _output = null
    }
  }

  function readStream(st) {
    var buff = []

    function cleanup() {
      st.removeListener('data',  fdata)
      st.removeListener('end',   fend)
      st.removeListener('error', ferror)
      buff = null
    }
    function fdata(chunk) {
      buff.push(chunk)
    }
    function fend() {
      var str = buff.join('')
      cleanup()
      procData(str)
    }
    function ferror(err) {
      cleanup()
      errHandler(err)
    }

    if (st.setEncoding) st.setEncoding('utf8')
    st.resume()

    st.on('data',  fdata)
      .on('end',   fend)
      .on('error', ferror)
  }

  function readImport(file) {
    file = fullPath(file)

    fs.readFile(file, {encoding: 'utf8'}, function (err, data) {
      if (err)
        errHandler(err)
      else if (_output)
        procData(data, file)
    })
  }

  function procData(data, file) {   // eslint-disable-line complexity
    if (!file) file = ''

    var cc = new ccparser.CC(file, _level, options),
        cache = [],
        match,
        q
    cc.file_ = file

    // normalize eols here
    if (~data.indexOf('\r')) data = data.replace(/\r\n?/g, '\n')

    if (cc.header) {
      // call the compactor and flush the data for eol detection
      _emitter.emit('swap', _level)
      pushData(cc.header)
      flush()
    }

    while (data && _output) {

      // Reset the compactor, maybe the header needs eol
      _emitter.emit('swap', _level)

      while (_output && (match = data.match(RE_BLOCKS))) {

        data = RegExp.rightContext
        pushData(RegExp.leftContext)

        if (match[1]) {
          flush()
          ccparser(match[1], match[2], cc)
          if (cc.insert && insert(cc.insert, file, cc.once))
            return
        }
        else if (cc.output) {
          q = match[0]
          if (match[3] || match[4] || q[0] !== '/')
            pushData(q)       // string, div, or regex
          else
            pushComment(q)    // regular comment
        }
      }

      if (!_output) return
      pushData(data)
      flush()

      // now, check if there's something of a previous file
      if (!_queue.length) {
        ccparser.reset(cc)  // allows detect unclosed block
        break
      }
      q    = _queue.pop()
      data = q[1]
      cc   = ccparser.reset(cc, q[0])
      file = cc.file_
      --_level
    }

    _emitter.emit('end')

    // Helpers -----

    function insert(name, base, once) {

      name = fullPath(name, base)

      var f = _files[name] | 0
      if (f > 1) return false     // 2 or 3 is include_once
      if (once) {
        _files[name] = 2          // 2
        if (f) return false
      }
      else
        _files[name] = f | 1      // 1 or 3

      if (isInQueue()) {
        cache.push('// ignored ' + path.relative('.', name) + '\n')
        return false
      }

      _queue.push([cc, data])
      readImport(name, ++_level)

      return true

      function isInQueue() {
        var i = _queue.length
        while (--i >= 0 && _queue[i][0].file_ !== name);
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
          _emitter.emit('data', ccparser.redef(buff))
        }
      }
    }
  }
}

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

function fullPath(file, base) {

  if (!path.extname(file)) file += '.js'

  base = base ? path.dirname(base) : process.cwd()
  return path.resolve(base, file)
}