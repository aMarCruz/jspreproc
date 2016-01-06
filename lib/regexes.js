/*
  Shared regexes
 */
var RE = module.exports = {
  // Multi-line comment
  MLCOMMS: /\/\*[^*]*\*+(?:[^*\/][^*]*\*+)*\//g,
  // Single-line comment
  SLCOMMS: /\/\/.*$/g,
  // Quoted strings, take care about embedded eols
  STRINGS: /"(?:[^"\n\\]*|\\[\S\s])*"|'(?:[^'\n\\]*|\\[\S\s])*'/g,
  // Allows skip division operators to detect non-regex slash -- $1: the slash
  DIVISOR: /(?:\breturn\s+|(?:[$\w\)\]]|\+\+|--)\s*(\/)(?![*\/]))/g,
  // Matches regexes -- $1 last slash of the regex
  REGEXES: /\/(?=[^*\/])[^[/\\]*(?:(?:\[(?:\\.|[^\]\\]*)*\]|\\.)[^[/\\]*)*?(\/)[gim]*/g,
  // Matches the `defined()` function
  DEFINED: /\bdefined[ \t]*\([ \t]*([$_A-Z][_0-9A-Z]+)[ \t]*\)/g
}

RE.S_QBLOCKS = [
  RE.MLCOMMS.source,                  // --- multi-line comment
  RE.SLCOMMS.source,                  // --- single-line comment
  RE.STRINGS.source,                  // --- string, don't care about embedded eols
  RE.DIVISOR.source,                  // $1: division operator
  RE.REGEXES.source                   // $2: last slash of regex
].join('|')

// For replacing of jspreproc vars - $1: jsppvar, $2: slash, $3: slash
// This is multiline and global, for `string.replace()`
var REPVARS = RegExp(RE.S_QBLOCKS + '|([^$\\w])(\\$_[_0-9A-Z]+)\\b', 'gm')

/**
 * Replaces jspreproc variables that begins with '$_' through all the code.
 *
 * @param   {string} str    - Partial code to replace, with CC already preprocessed
 * @param   {object} varset - Contains the variables
 * @returns {string} Processed code, with varset replaced with their literal values
 * @since 1.0.4-beta.1
 */
RE.repVars = function repVars(str, varset) {

  if (str[0] === '$')
    str = str.replace(/^\$_[_0-9A-Z]+\b/, function (v) {
      return v in varset ? varset[v] : v
    })

  if (~str.indexOf('$_'))
    str = str.replace(REPVARS, function (m, _1, _2, p, v) {
      return v && v in varset ? p + varset[v] : m
    })

  return /__FILE/.test(str) ? str.replace(/\b__FILE\b/g, varset.__FILE) : str
}
