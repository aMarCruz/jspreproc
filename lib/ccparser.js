/*
  ### Conditional Comments
*/
'use strict'

var NONE    = 0,
    IF      = 1,
    ELSE    = 2,

    TESTING = 0,
    WORKING = 1,
    ENDING  = 2,

    VARNAME = /\b([$_A-Z][_A-Z]+)(?![$\w])/g,
    DEFINED = /\bdefined\s*\(\s*([$_A-Z][_A-Z]+)\s*\)/g,
    INCLUDE = /^\s*(?:"[^"]+"|'[^']+'|\S+)/,

    options

/**
 * Parses conditional comments.
 * The key and value parameters are obtained with the CC regex.
 * @param   { string  } key  - Key of the conditional comment
 * @param   { string  } expr - Value, can be empty
 * @param   { Object  } cc   - Private configuration
 * @returns { Boolean } - Output state, false for hide the output
 */
function _ccp(key, expr, cc) {
  var last  = cc.last,
      state = cc.state[last]

  cc.insert = false
  expr = expr.replace(/\/\/.*/, '').trim()

  // else/endif should not have an expression, all other cases must have one
  if (key === 'else' || key === 'endif' ? expr : !expr)
    throw new Error((expr ? 'Une' : 'E') + 'xpected expression after #' + key)

  switch (key) {
    case 'if':
    case 'ifdef':
    case 'ifndef':
      cc.last = ++last
      cc.block[last] = IF
      cc.state[last] = state === ENDING ? ENDING :
                      evalExpr(expr, key, cc) ? WORKING : TESTING
      break

    case 'elif':
      checkInBlock(IF)
      if (state === TESTING && evalExpr(expr, 'if', cc))
        cc.state[last] = WORKING
      else if (state === WORKING)
        cc.state[last] = ENDING
      break

    case 'else':
      checkInBlock(IF)
      cc.block[last] = ELSE
      cc.state[last] = state === TESTING ? WORKING : ENDING
      break

    case 'endif':
      checkInBlock(IF | ELSE)
      delete cc.block[last]
      delete cc.state[last]
      cc.last = --last
      break

    default:
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
        }
      }
      break
  }

  return cc.output = (cc.state[last] === WORKING)

  function checkInBlock(mask) {
    var block = cc.block[last]
    if (block !== (block & mask)) throw new Error('Unexpected #' + key)
  }
}
// _ccp ends

/*
  Prepares cc for file insertion
 */
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
    throw new Error('Expected filename to include')

  cc.insert = file
  cc.once = !!ckey[8]
}

/*
  Expression evaluation, low usage, so don't cache these.
*/
function evalExpr(expr, ckey, cc) {
  var defs = options.defines

  defs.__FILE = cc._file              // relative path

  if (ckey !== 'if') {
    var bdef = ckey === 'ifdef'
    return (expr in defs) ? bdef : !bdef
  }

  return expr && create(expr)(null)   // null context

  function create(expr) {

    expr = expr
      .replace(DEFINED, function (m, v) {
        return (v in defs) ? '1' : '0'
      })
      .replace(VARNAME, function (m, v) {
        return (v in defs) ? defs[v] : '0'
      })
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')

    return new Function('', 'return ' + expr + ';')
  }
}

/*
  Matches key & value of a conditional comment
  $1: key
  $2: value
*/
_ccp.RE = /^[ \t]*\/\/#[ \t]*(if(?:n?def)?|el(?:if|se)|endif|define|undef|include(?:_once)?)\b([^\n]*)\n?/

/*
  Creates the configuration for the given file
*/
_ccp.CC = function mkcc(file, opts) {
  var
    cc = {
      output: true,
      last:   0,
      state:  [WORKING],
      block:  [NONE],
      file:   file || '',
      _file:  file ?
        require('path').relative(process.cwd(), file).replace(/\\/g, '/') : ''
    },
    hdr

  options = opts

  if (hdr = opts.headers) {
    if (hdr[0] !== "'" && hdr[0] !== '"')
      hdr = opts.header = "'" + hdr.replace(/'/g, "\\'") + "'"
    cc.header = evalExpr(hdr, 'if', cc)
  }

  return cc
}

module.exports = _ccp
