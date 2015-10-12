
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
        //.replace(/\\/g, '\\\\')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')

  try {
    var fn = new Function('', 'return (' + expr + ');') // eslint-disable-line no-new-func
    expr = fn.call(null)
  }
  catch (e) {
    opts.emitError('Can\'t evaluate `' + str + '` (`' + expr + '`)')
    expr = 0
  }

  // Division by zero returns Infinity, catch here because Infinity is a trueish
  // value, so a test with #if / #elif is likely to expect false for this.
  return expr === Infinity ? 0 : expr
}
