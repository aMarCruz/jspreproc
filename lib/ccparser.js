// Conditional Comments
// --------------------
// Preprocess conditional blocks, defines, and includes
'use strict'

//const
var
    NONE     = 0,
    IF       = 1,
    ELSE     = 2,

    TESTING  = 0,
    WORKING  = 1,
    ENDING   = 2,

    INCLUDE  = /^\s*(?:"[^"]+"|'[^']+'|\S+)/,
    LEFTVAR  = /^(\$_[_0-9A-Z]+)(?![$\w])/,
    REPVARS  = /(^|[^$\w])(\$_[_0-9A-Z]+)(?![$\w])/g

var evalExpr = require('./evalexpr'),
    path = require('path')

var options = {}

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
  var last  = cc.last,
      state = cc.state[last]

  cc.insert = false
  expr = expr.replace(/\/\/.*/, '').trim()

  // All keywords, except `#else/#endif`, must have an expression
  if (!expr && key !== 'else' && key !== 'endif') {
    emitError('Expected expression for #' + key)
    return false
  }

  switch (key) {
    // Conditional blocks. `#if-ifdef-ifndef` pushes the state and `#endif` pop it
    case 'if':
    case 'ifdef':
    case 'ifndef':
      cc.last = ++last
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
        delete cc.block[last]
        delete cc.state[last]
        cc.last = --last
      }
      break

    default:
      // Defines and includes, processed only for working blocks
      if (state === WORKING) {
        switch (key) {
          case 'define':
            options.def(expr)
            break
          case 'undef':
            options.undef(expr)
            break
          case 'include_once':
          case 'include':
            include(expr, key, cc)
            break
          default:
            break
        }
      }
      break
  }

  return cc.output = cc.state[last] === WORKING // eslint-disable-line no-return-assign

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

  file = match && match[0]
  if (file) {
    var ch = file[0]
    if ((ch === '"' || ch === "'") && ch === file.slice(-1))
      file = file.slice(1, -1).trim()
  }
  if (!file)
    emitError('Expected filename to include')
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
    return options.isDefined(expr) ? yes : yes ^ 1
  }

  return evalExpr(expr, options)  // returns the raw value of the expression
}

/**
 * Matches key & value of a conditional comment. $1: key, $2: value.
 * This regex is for use by the main module.
 */
ccp.RE = /^[ \t]*\/\/#[ \t]*(if(?:n?def)?|el(?:if|se)|endif|define|undef|include(?:_once)?)(?=[ \t\(\n]|$)([^\n]*)\n?/

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
  this.last   = 0
  this.state  = [WORKING]
  this.block  = [NONE]
  this.fname  = file ? path.relative('.', file).replace(/\\/g, '/') : ''

  // Keep local reference to the global options object
  options = opts
  options._setFile(this.fname)      // relative path

  // Read and evaluate the header for this file
  var hdr = opts[level > 0 ? 'headers' : 'header1']
  if (hdr)
    this.header = evalExpr(hdr, opts)

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
  if (old.last)
    emitError('Unclosed block in ' + (old.fname || 'stdin'))
  else
    options._setFile(cc ? cc.fname : '')

  return cc
}

/**
 * Replaces defines that begins with '$_' through all the code.
 * @param   {string} str - Partial code to replace, with CC already preprocessed
 * @returns {string} Processed code, with defines replaced with their literal values
 * @since 1.0.4-beta.1
 */
ccp.redef = function redef(str) {
  var defs

  function rep(m, x, v) {
    return v in defs ? x + defs[v] : m  // don't replace undefined names
  }

  if (~str.indexOf('$_')) {
    defs = options._getDefines()

    if (str[0] === '$')
      str = str.replace(LEFTVAR, rep)
    str = str.replace(REPVARS, rep)
  }
  return str
}

module.exports = ccp
