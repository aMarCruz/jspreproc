
// Evaluation of expressions
// -------------------------

var RE = require('./regexes')

module.exports = function evalExpr(str, varset, errhan) {

  // Uses Function ctor, obtains values from the given options instance
  'use strict'  // eslint-disable-line

  // For replacing of jspreproc variables - $1-$2: slash, $4: the cc var
  // This is multiline global, for `string.replace()`
  var REPVARS = new RegExp(
    RE.STRINGS.source + '|' +
    RE.DIVISOR.source + '|' +
    RE.REGEXES.source + '|(^|[^$\\w])([$_A-Z][_0-9A-Z]+)\\b', 'g')

  function _repVars(s) {
    var match

    REPVARS.lastIndex = 0

    while (match = REPVARS.exec(s)) { //eslint-disable-line no-cond-assign
      var v = match[4]

      if (v) {
        v = match[3] + (v in varset ? varset[v] : '0')
        s = RegExp.leftContext + v + RegExp.rightContext
        REPVARS.lastIndex = match.index + v.length
      }
    }
    return s
  }

  function _repDefs(_, v) {
    return v in varset ? '1' : '0'
  }

  var expr = _repVars(str.replace(RE.DEFINED, _repDefs))
              .replace(/\n/g, '\\n')
              .replace(/\r/g, '\\r')

  try {
    var fn = new Function('', 'return (' + expr + ');') // eslint-disable-line no-new-func
    expr = fn.call(null)
  }
  catch (e) {
    errhan(new Error('Can\'t evaluate `' + str + '` (`' + expr + '`)'))
    expr = 0
  }

  // Division by zero returns Infinity, catch here because Infinity is a trueish
  // value, so a test with #if / #elif is likely to expect false for this.
  return expr === Infinity ? 0 : expr
}

module.exports.repVars = RE.repVars
