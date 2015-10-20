// Conditional Comments
// --------------------
// Preprocess conditional blocks, varset, and includes
'use strict'

var RE       = require('./regexes'),
    evalExpr = require('./evalexpr'),
    path     = require('path')

//const
var NONE     = 0,
    IF       = 1,
    ELSE     = 2,

    WORKING  = 0,
    TESTING  = 1,
    ENDING   = 2,

    INCLUDE  = /^\s*("[^"]+"|'[^']+'|\S+)/

var options  = {},
    varset   = {}

/**
 * Parses conditional comments.
 * The key and value parameters was obtained with the `CC` regex.
 *
 * @param   {string } key  - Key of the conditional comment
 * @param   {string } expr - Value, can be empty
 * @param   {Object } cc   - Private configuration
 * @returns {boolean} Output state, `false` for hide the output
 */
function ccp(key, expr, cc) { // eslint-disable-line complexity
  var
      last  = cc.state.length - 1,
      state = cc.state[last]

  cc.insert = false

  if (key.slice(0, 3) !== 'inc') {

    expr = expr.replace(/\/\/.*/, '').trim()

    // All keywords, except `#else/#endif`, must have an expression
    if (!expr && key !== 'else' && key !== 'endif') {
      emitError('Expected expression for #' + key)
      return false
    }
  }

  switch (key) {
    // Conditional blocks. `#if-ifdef-ifndef` pushes the state and `#endif` pop it
    case 'if':
    case 'ifdef':
    case 'ifndef':
      ++last
      cc.block[last] = IF
      cc.state[last] = state === ENDING ? ENDING : getValue(expr, key) ? WORKING : TESTING
      break

    case 'elif':
      if (checkInBlock(IF)) {
        if (state === TESTING && getValue(expr, 'if'))
          cc.state[last] = WORKING
        else if (state === WORKING)
          cc.state[last] = ENDING
      }
      break

    case 'else':
      if (checkInBlock(IF)) {
        cc.block[last] = ELSE
        cc.state[last] = state === TESTING ? WORKING : ENDING
      }
      break

    case 'endif':
      if (checkInBlock(IF | ELSE)) {
        cc.block.pop()
        cc.state.pop()
        --last
      }
      break

    default:
      // Defines and includes, processed only for working blocks
      if (state === WORKING) {
        switch (key) {      // eslint-disable-line default-case
          case 'define':
          case 'set':
            options.def(expr)
            break
          case 'undef':
          case 'unset':
            options.undef(expr)
            break
          case 'include':
          case 'include_once':
            include(expr, key, cc)
            break
        }
      }
      break
  }

  cc.output = cc.state[last] === WORKING

  return cc.output

  // Inner helper - throws if the current block is not of the expected type
  function checkInBlock(mask) {
    var block = cc.block[last]
    if (block && block === (block & mask))
      return true
    emitError('Unexpected #' + key)
    return false
  }
}

function emitError(str) {
  options.emitError(str)
}

// Prepares `cc` for file insertion setting the `insert` and `once` properties of `cc`.
// Accepts quoted or unquoted filenames
function include(file, ckey, cc) {
  var
    match = file.match(INCLUDE)

  file = match && match[1]
  if (file) {
    var ch = file[0]
    if ((ch === '"' || ch === "'") && ch === file.slice(-1))
      file = file.slice(1, -1).trim()
  }
  if (!file)
    emitError('Expected filename for #' + ckey)
  else {
    cc.insert = file
    cc.once = !!ckey[8]
  }
}

// Expression evaluation.
// Intercepts the `#ifdef/ifndef` shorthands, call `evalExpr` for `#if` statements.
function getValue(expr, ckey) {

  if (ckey !== 'if') {
    var yes = ckey === 'ifdef' ? 1 : 0
    return expr in varset ? yes : yes ^ 1
  }

  // returns the raw value of the expression
  return evalExpr(expr, varset, options.emitError)
}

/**
 * Creates the configuration object for the given file.
 *
 * @param   {string} file  - Filename of current processing file
 * @param   {number} level - Nested level of processing file
 * @param   {Object} opts  - User options
 * @returns {Object} A new configuration object
 */
ccp.CC = function (file, level, opts) {

  this.output = true
  this.state  = [WORKING]
  this.block  = [NONE]
  this.fname  = file ? path.relative('.', file).replace(/\\/g, '/') : ''

  // Keep local reference to the global options & varset objects
  options = opts
  varset  = opts.getVars()

  options.setFile(this.fname)   // relative path

  // Read and evaluate the header for this file
  var hdr = opts[level > 0 ? 'headers' : 'header1']
  if (hdr)
    this.header = evalExpr.repVars(hdr, varset)

  return this
}

/**
 * Check blocks on old cc before vanish, restore the predefined symbol `__FILE`.
 * Changing __FILE here avoids setting the value in each call to `evalExpr`.
 *
 * @param   {Object} old - The configuration object to close
 * @param   {Object} cc  - The configuration object to reopen
 * @returns {Object} The same configuration object, with `__FILE` updated
 */
ccp.reset = function reset(old, cc) {

  if (old.block[1])
    emitError('Unclosed conditional block in ' + (old.fname || 'the input'))
  else
    options.setFile(cc ? cc.fname : '')

  return cc
}

module.exports = ccp
