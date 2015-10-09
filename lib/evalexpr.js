
// Evaluation of expressions
// -------------------------
// Uses Function ctor, obtains values from the given options instance
'use strict'  // eslint-disable-line

var VARNAME = /(^|[^$_A-Z])([$_A-Z][_0-9A-Z]+)(?![$\w])/g,
    DEFINED = /\bdefined\s*\(\s*([$_A-Z][_0-9A-Z]+)\s*\)/g

module.exports = function evalExpr(str, opts) {
  var expr = str
        .replace(DEFINED, function (_, v) {
          return opts.isDefined(v) ? '1' : '0'
        })
        .replace(VARNAME, function (_, p, v) {
          return p + opts.getDefine(v)
        })

  try {
    var fn = new Function('', 'return (' + expr // eslint-disable-line no-new-func
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r') + ');')

    expr = fn.call(null)
  }
  catch (e) {
    console.error('Can\'t evaluate expression `' + expr + '` (src: `' + str + '`)')
  }

  return expr
}
