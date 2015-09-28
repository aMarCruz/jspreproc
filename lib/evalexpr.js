
// Evaluation of expressions
// =========================
'use strict'

var VARNAME = /\b[$_A-Z][_0-9A-Z]+(?![$\w])/g,
    DEFINED = /\bdefined\s*\(\s*([$_A-Z][_0-9A-Z]+)\s*\)/g

module.exports = function evalExpr(expr, opts) {
  var defs = opts.defines

  expr = expr
        .replace(DEFINED, function (m, v) {
          return (v in defs) ? '1' : '0'
        })
        .replace(VARNAME, function (v) {
          return (v in defs) ? defs[v] : '0'
        })

  try {
    var fn = new Function('', 'return (' + expr
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r') + ');')

    expr = fn.call(null)
  }
  catch (e) {
    console.error('Can\'t evaluate expression `' + expr + '`')
  }

  return expr
}
