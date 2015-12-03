/*
  Shared regexes
 */
var RE = module.exports = {
  // Matches key & value of a conditional comment. $1: key, $2: value
  CCCOMMS: /^[ \t]*\/\/#[ \t]*(if(?:n?def)?|el(?:if|se)|endif|define|undef|set|unset|include(?:_once)?|indent)(?=[ \t\n\(]|$)([^\n]*)\n?/g,
  // Multi-line comment
  MLCOMMS: /\/\*[^*]*\*+(?:[^*\/][^*]*\*+)*\//g,
  // Single-line comment
  SLCOMMS: /\/\/[^\n]*$/gm,
  // Quoted strings, take care about embedded eols
  STRINGS: /"(?:[^"\r\n\\]*|\\[^])*"|'(?:[^'\r\n\\]*|\\[^])*'/g,
  // Allows skip division operators to detect non-regex slash $2: the slash
  DIVISOR: /(?:\breturn\s+|(?:[$\w\)\]]|\+\+|--)\s*(\/)(?![*\/]))/g,
  // Matches regexes - $1 last slash of the regex
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
 * @param   {string} str    - Partial code to replace, with CC already preprocessed
 * @param   {object} varset - Contains the variables
 * @returns {string} Processed code, with varset replaced with their literal values
 * @since 1.0.4-beta.1
 */
RE.repVars = function repVars(str, varset) {

  if (str[0] === '$')
    str = str.replace(/^\$_[_0-9A-Z]+\b/, function (v) {
      return v && v in varset ? varset[v] : v
    })

  if (~str.indexOf('$_')) {
    var match,
        re = RegExp(REPVARS)

    while (match = re.exec(str)) {        //eslint-disable-line no-cond-assign
      var v = match[4]

      if (v && v in varset) {             // Don't replace undefined names
        v = match[3] + varset[v]
        re.lastIndex = match.index + v.length
        str = RegExp.leftContext + v + RegExp.rightContext
      }
    }
  }

  return /__FILE/.test(str) ? str.replace(/\b__FILE\b/g, varset.__FILE) : str
}
