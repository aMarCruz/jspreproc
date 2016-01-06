// Conditional Comments
// --------------------
// Preprocess conditional blocks, varset, and includes
'use strict'

var evalExpr = require('./evalexpr'),
    repVars  = require('./regexes').repVars,
    path     = require('path')

//const
var NONE     = 0,
    IF       = 1,
    ELSE     = 2,

    WORKING  = 0,
    TESTING  = 1,
    ENDING   = 2,

    CCLINE1  = /^[ \t]*\/\/#[ \t]*(if|ifn?def|el(?:if|se)|endif|define|undef|set|unset|include(?:_once)?|indent)(?=[ \t\n\(/\*]|$)(.*)\n?/,
    CCLINE2  = /^[ \t]*\/\*#[ \t]*(if|ifn?def|el(?:if|se))(?=[ \t\n\(/\*]|$)(.*)\n?/,
    INCNAME  = /^\s*("[^"]+"|'[^']+'|\S+)/

/*
  CC Parser
*/
function CCParser(options) {
  var
      result = {output: true},
      queue  = [],
      cc     = null

  function emitError(str) {
    if (typeof str === 'string')
      str = str.replace('@', cc && cc.fname || 'the input')
    options.emitError(str)
  }

  // Expression evaluation.
  // Intercepts the `#ifdef/ifndef` shorthands, call `evalExpr` for `#if` statements.
  function getValue(ckey, expr) {

    if (ckey !== 'if') {
      var yes = expr in cc.varset ? 1 : 0
      return ckey === 'ifdef' ? yes : yes ^ 1
    }

    // returns the raw value of the expression
    return evalExpr(expr, cc.varset, emitError)
  }

  // Prepares `cc` for file insertion setting the `insert` and `once` properties of `cc`.
  // Accepts quoted or unquoted filenames
  function include(ckey, file) {
    var
      match = file.match(INCNAME)

    file = match && match[1]
    if (file) {
      var ch = file[0]
      if ((ch === '"' || ch === "'") && ch === file.slice(-1))
        file = file.slice(1, -1).trim()
    }
    if (file) {
      result.insert = file
      result.once = !!ckey[8]
    }
    else
      emitError('Expected filename for #' + ckey + ' in @')
  }

  // Removes any one-line comment and checks if expression is present
  function normalize(key, expr) {

    if (key.slice(0, 4) !== 'incl') {
      expr = expr.replace(/[/\*]\/.*/, '').trim()

      // all keywords must have an expression, except `#else/#endif`
      if (!expr && key !== 'else' && key !== 'endif') {
        emitError('Expected expression for #' + key + ' in @')
        return false
      }
    }
    return expr
  }

  /**
   * Parses conditional comments.
   *
   * @param   {Object } data - Directive created by the getData method
   * @returns {boolean} Output state, `false` for hide the output
   */
  this.parse = function _parse(data) { // eslint-disable-line complexity
    var
        last  = cc.state.length - 1,
        state = cc.state[last],
        key   = data.key,
        expr  = normalize(key, data.expr)

    result.insert = false

    if (expr === false) return expr

    switch (key) {
      // Conditional blocks -- `#if-ifdef-ifndef` pushes the state and `#endif` pop it
      case 'if':
      case 'ifdef':
      case 'ifndef':
        ++last
        cc.block[last] = IF
        cc.state[last] = state === ENDING ? ENDING : getValue(key, expr) ? WORKING : TESTING
        break

      case 'elif':
        if (checkInBlock(IF)) {
          if (state === TESTING && getValue('if', expr))
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
        // Defines and includes -- processed only for working blocks
        if (state === WORKING) {
          switch (key) {
            case 'define':
            case 'set':
              options.def(expr)
              break
            case 'undef':
            case 'unset':
              options.undef(expr)
              break
            case 'indent':
              options.merge({indent: expr})
              break
            case 'include':
            case 'include_once':
              include(key, expr)
              break
            // istanbul ignore next: just in case
            default:
              emitError('Unknown directive #' + key + ' in @')
              break
          }
        }
        break
    }

    result.output = cc.state[last] === WORKING

    return result

    // Inner helper - throws if the current block is not of the expected type
    function checkInBlock(mask) {
      var block = cc.block[last]
      if (block && block === (block & mask))
        return true
      emitError('Unexpected #' + key + ' in @')
      return false
    }
  }

  /**
   * Check if the line is a conditional comment
   *
   * @param   {Array}  match - line starting with "//#" or "/*#"
   * @returns {object} pair key-expr if the line contains a conditional comment
   */
  this.getData = function _getData(match) {

    if (match[1]) return {key: match[1], expr: match[2]}
    if (match[3]) return {key: match[3], expr: match[4]}
    return false
  }

  /**
   * Creates the configuration object for the given file.
   *
   * @param   {string} file  - Filename of current processing file
   * @param   {number} level - Nested level of processing file
   * @returns {Object} A new configuration object
   */
  this.start = function _start(file, level) {

    if (cc) queue.push(cc)

    cc = {
      state:  [WORKING],
      block:  [NONE],
      ffile:  file || '',
      fname:  file ? path.relative('.', file).replace(/\\/g, '/') : '',
      varset: options.getVars()
    }

    options.setFile(cc.fname)   // relative path

    // Read and evaluate the header for this file
    var hdr = options[level > 0 ? 'headers' : 'header1']
    cc.header = result.header = hdr && repVars(hdr, cc.varset) || ''

    return result
  }

  /**
   * Check unclosed blocks on old cc before vanish it and restore the previous state.
   * Changing __FILE here avoids setting the value in each call to `evalExpr`.
   *
   * @returns {Object} The current configuration
   */
  this.reset = function reset() {

    if (cc && cc.block.length > 1) emitError('Unclosed conditional block in @')

    cc = queue.pop()
    result.header = cc ? cc.header : ''
    options.setFile(cc ? cc.fname : '')

    return result
  }

  return this
}

CCParser.S_CCLINE = CCLINE1.source + '|' + CCLINE2.source

module.exports = CCParser
