// Process the buffer
// ------------------
// Read the input, calls to cc parser and the compactor
'use strict'

var RE = require('./regexes'),
    Compactor = require('./compactor'),
    CCParser = require('./ccparser'),
    stream = require('stream'),
    path = require('path'),
    fs = require('fs')

// Matches comments, strings, and preprocessor directives - $1: cc directive
// This is multiline only, for `string.match()`
var RE_BLOCKS = RegExp(CCParser.CCLINE.source + '|' + RE.S_QBLOCKS, 'm')

var _id = 0

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

function fullPath(file, base) {
  if (!path.extname(file)) file += '.js'
  base = base ? path.dirname(base) : process.cwd()
  return path.resolve(base, file)
}

/**
 * Take the input and options, and returns a readable stream with the results.
 *
 * Inyect data to eventEmitter with procData.
 * procData calls to _parser, and emit a 'data' event.
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
      _parser  = new CCParser(options),
      _level   = 0,
      _files   = {},
      _queue   = []

  _output._jspp_id = ++_id   // eslint-disable-line

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

  /*
    Minimun error handler
  */
  function errHandler(err) {
    /* istanbul ignore else */
    if (_output) {
      err = err instanceof Error ? err : new Error(err)
      _emitter.emit('end', err)
      _output = null
    }
    else
      console.error('jspreproc: ' + err)
  }

  /*
    Reads the input stream
   */
  function readStream(st) {
    var buff = []

    function cleanup() {
      st.removeListener('data', fdata)
      st.removeListener('end',  fend)
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

    st.setEncoding('utf8')
    st.resume()

    st.on('data', fdata)
      .on('end',  fend)
  }

  function readImport(file) {
    file = fullPath(file)

    fs.readFile(file, {encoding: 'utf8'}, function (err, data) {
      // istanbul ignore next
      if (err)
        errHandler(err)
      else if (_output)
        procData(data, file)
    })
  }

  function procData(data, file) {   // eslint-disable-line complexity
    if (!file) file = ''

    var cc = _parser.start(file, _level),
        cache = [],
        match,
        q
    console.log('- PROCBUF entry: "' + file + '", ' + _level)
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

        q = match[1] && _parser.getData(match[1])
        if (q) {
          flush()
          cc = _parser.parse(q)
          if (cc.insert && insert(cc.insert, file, cc.once))
            return
        }
        else if (cc.output) {
          q = match[0]
          if (match[2] || match[3] || q[0] !== '/')
            pushData(q)       // string, div, or regex
          else
            pushComment(q)    // regular comment
        }
      }

      if (!_output) return
      pushData(data)
      flush()

      cc = _parser.reset()    // allows detect unclosed block

      // now, check if there's something of a previous file
      if (!_queue.length)
        break
      q = _queue.pop()
      file = q[0]
      data = q[1]
      --_level
      console.log('- PROCBUF pop() "' + file + '", ' + _level)
    }

    _emitter.emit('end')

    // Helpers -----

    /**
     * Pushes the current filename and remaining data and inserts a new file.
     * Skips the insertion if the file is in the queue, avoiding recursion,
     * or if it's an include_once directive and the file was already inserted
     * anywhere in the process.
     *
     * @param   {string}  name - The file's name being included, relative to base
     * @param   {string}  base - The file's name being processed
     * @param   {boolean} once - `true` for unique inclusion
     * @returns {boolean} - `true` if the file can be inserted
     */
    function insert(name, base, once) {

      name = fullPath(name, base)

      // _files is an object with keys of all the processed files
      var f = _files[name] | 0
      if (f > 1) return false     // 2: already include_once
      if (once) {
        _files[name] = 2          // mark as include_once
        if (f) return false       // 1: already included
      }
      else
        _files[name] = 1          // mark as normal include

      // abort if the file is an ancestor (is in the queue)
      f = _queue.length
      while (--f >= 0) {
        if (_queue[f][0] === name) return false
      }

      _queue.push([base, data])
      readImport(name, ++_level)

      return true
    }

    function pushData(str) {
      if (str && cc.output) cache.push(str)
    }

    function pushComment(str) {
      var opc = options.comments

      if (opc === 'none' || opc === 'filter' && !options.passFilter(str))
        str = str[1] === '*' ? ' ' : ''

      if (str) cache.push(str)
    }

    function flush() {
      if (cache.length) {
        var buff = cache.join('')
        cache = []
        _emitter.emit('data', RE.repVars(buff, options.getVars()))
      }
    }
  }
}
