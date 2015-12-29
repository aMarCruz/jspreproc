
// Evaluation of expressions
// -------------------------

var RE = require('./regexes')

// For replacing of jspreproc variables -- $1-$2: slash, $3: var prefix, $4: the cc var
var DEFINED = RE.DEFINED,
    REPVARS = RegExp(
    RE.STRINGS.source + '|' +
    RE.DIVISOR.source + '|' +
    RE.REGEXES.source + '|(^|[^$\\w])([$_A-Z][_0-9A-Z]+)\\b', 'g')

/**
 * Performs the evaluation of the received string using a function instantiated dynamically.
 *
 * @param   {string}   str    - String to evaluate, can include other defined vars
 * @param   {object}   varset - Set of variable definitions
 * @param   {function} errhan - Function to handle evaluation errors
 * @returns {*} The result can have any type
 */
module.exports = function evalExpr(str, varset, errhan) {

  // Uses Function ctor, obtains values from the given options instance
  'use strict'  // eslint-disable-line

  function _repDefs(_, v) {
    return v in varset ? '1' : '0'
  }
  function _repVars(m, _1, _2, p, v) {
    return v ? p + (v in varset ? varset[v] : '0') : m
  }

  if (typeof str !== 'string') {
    var s1 = 'evalExpr(str) with type ' + typeof str
    console.log(s1)
    throw new Error(s1)
  }

  var expr = str
            .replace(DEFINED, _repDefs)
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(REPVARS, _repVars)

  try {
    var fn = new Function('', 'return (' + expr + ');') // eslint-disable-line no-new-func
    expr = fn.call(null)
  }
  catch (e) {
    errhan(new Error('Can\'t evaluate `' + str + '` (`' + expr + '`)'))
    expr = 0
  }

  // Division by zero returns Infinity, catch it here because Infinity is a trueish
  // value, and a test with #if / #elif is likely to expect false for this ???
  // JSON.stringify convert this to null.
  return expr === Infinity ? 0 : expr
}
