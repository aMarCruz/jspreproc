// jspreproc Main Module
// =====================
'use strict'  // eslint-disable-line

var Options = require('./options'),
    procbuf = require('./procbuf')

//------------------------------------------------------------------------------
// Public Interface
//------------------------------------------------------------------------------

// Process stdin or the input file.
module.exports = function (file, opts) {
  var data, options

  options = new Options(opts)

  if (opts.buffer) {
    data = opts.buffer
  }
  else if (Array.isArray(file)) {
    if (file.length > 1)
      data = '//#include ' + file.join('\n//#include ') + '\n'
    else
      file = file[0] || process.stdin
  }
  else if (typeof file !== 'string') {
    if (!file)
      file = process.stdin
    else if (!file.readable)
      throw new Error('jspreproc: File is not a stream or is not readable')
  }
  // else file is 'string' (filename)

  removeProcErr()
  process.on('uncaughtException', uerror)

  return procbuf(data, file, options)
}

module.exports.version = require('./../package.json').version

function removeProcErr() {
  process.removeListener('uncaughtException', uerror)
}

function uerror(err) {
  console.error('Uncaught Exception in jspreproc.\n' + (err.stack || err))
  process.exit(1)
}
