// jspreproc Main Module
// =====================
'use strict'  // eslint-disable-line

var Options = require('./options'),
    procbuf = require('./procbuf')

//------------------------------------------------------------------------------
// Public Interface
//------------------------------------------------------------------------------

// Process stdin or the input file.
module.exports = function jspp(file, opts) {
  var data, options

  removeProcErr()
  process.on('uncaughtException', uerror)

  options = new Options(opts)

  if (opts.buffer) {
    data = opts.buffer
  }
  else {
    if (Array.isArray(file)) {
      if (file.length > 1)
        data = '//#include ' + file.join('\n//#include ') + '\n'
      else
        file = file[0]
    }
    else if (file && typeof file !== 'string' && !file.readable) {
      uerror(new Error('jspreproc: File is not a stream or is not readable'))
    }

    if (!file) file = process.stdin
  }

  return procbuf(data, file, options)
}

module.exports.version = require('./../package.json').version
module.exports.jspp    = module.exports

function removeProcErr() {
  process.removeListener('uncaughtException', uerror)
}

function uerror(err) {
  removeProcErr()
  throw err
}
