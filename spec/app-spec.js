/*
  Tests for jspreproc using jasmine
*/
'use strict'

var jspp = require('../lib/preproc'),
    path = require('path'),
    fs = require('fs'),
    defaults = require('../lib/options').defaults

var fixtures = path.join(__dirname, 'fixtures')

function cat(file) {
  var f = path.join(__dirname, file)
  return fs.readFileSync(f, {encoding: 'utf8'})
}

function readExpect(file) {
  return cat(path.join('expect', file))
}

//var __id = 0, __st = 0
var errText1 = '--- a stream in error condition emitted an '

function testIt(str, opts, callback) {
  var text = [],
      stpp = jspp(str, opts)

  //if (stpp.__id)
  //  console.error('----- WHAT!!! stpp ALREADY HAS __id TO ' + stpp.__id)
  //stpp.__id = ++__id

  stpp
    .on('data', function (chunk) {
      if (stpp.__hasError)
        console.error(errText1 + '`data` event')
      text.push(chunk)
    })
    .on('end', function () {
    //console.error('--- [' + stpp.__id + '] is done!')
      if (stpp.__hasError)
        console.error(errText1 + '`end` event')
      stpp = null
      callback(null, text = text.join(''))
    })
    .on('error', function (err) {
    //console.error('--- [' + stpp.__id + '] have an error: ' + err)
      stpp = null
      callback(err)
    })
    .__hasError = false
}

function testFile(file, opts, callback) {
  (opts || (opts = {})).test = false
  testIt(path.join(fixtures, file), opts, callback)
}

function testStr(str, opts, callback) {
  (opts || (opts = {})).buffer = str
  testIt(null, opts, callback)
}

// set default headers and emptyLines to none, for easy test
var defaultHeaders = defaults.headers
defaults.headers = ''
var defaultEmptyLines = defaults.emptyLines
defaults.emptyLines = 0

/*
process.on('uncaughtException', function (err) {
  console.error('Uncaught Exception.')
  console.error(err.stack)
  process.exit(1)
})
jasmine.getEnv().catchExceptions(false)
*/

// Comments Suite
// --------------

describe('Comments', function () {

  it('with the defaults, only preserve comments with "@license"', function (done) {

    testFile('comments.js', {}, function (err, result) {
      if (err) throw err
      var lic = /\/\/@license:/
      expect(result).toMatch(lic)
      expect(result.replace(lic, '')).not.toMatch(/\/[*\/]/)
      done()
    })
  })

  it('are completely removed with the `-C none` option', function (done) {

    testFile('comments.js', {comments: 'none'}, function (err, result) {
      if (err) throw err
      expect(result).not.toMatch(/\/[*\/]/)
      done()
    })
  })

  it('are preserved with `-C all`', function (done) {

    testFile('comments.js', {comments: 'all'}, function (err, result) {
      if (err) throw err
      expect(result).toBe(readExpect('comments_all.js'))
      done()
    })
  })

  it('are preserved for linters with `-F all`', function (done) {
    var opts = {comments: 'filter', filter: 'all'}

    testFile('comments.js', opts, function (err, result) {
      if (err) throw err
      expect(result).toBe(readExpect('comments_linters.js'))
      done()
    })
  })

  it('can use custom filters, e.g. `--custom-filter "\\\\\* @module"`', function (done) {
    var opts = {customFilter: '\\\\\* @module'}, // "\\* @module" from console
        text = [
          '/* @module foo */',
          'exports = 0'
        ].join('\n')

    testStr(text, opts, function (err, result) {
      if (err) throw err
      expect(result).toMatch(/\* @m/)
      done()
    })
  })

})

// Lines Suite
// -----------

describe('Lines', function () {
  var
      customMatcher = {
        toHasLinesLike: function (util/*, customEqualityTesters*/) {
          function printable(str) {
            return str.replace(/\n/g, '\\n').replace(/\r/g, '\\r')
          }
          return {
            compare: function (actual, expected) {
              expected = expected ? printable(expected) : ''
              actual   = actual ? printable(actual) : ''
              var result = {pass: actual === expected}
              result.message = util
                .buildFailureMessage('toHasLinesLike', result.pass, actual, expected)
              return result
            }
          }
        }
      },
      buff = [
        '\n', '\r\n', '\n', '\r\n',     // 4
        'a',
        '\r', '\r\n', '\r\n', '\r',     // 4
        '//x',
        '\n', '\n', '\n', '\n', '\n',   // 5
        '/* \n\n */',
        '\n', '\n', '\n', '\n', '\n',   // 5
        '\n'                            // 1
      ].join('')

  beforeEach(function () {
    jasmine.addMatchers(customMatcher)
  })

  it('default is one empty line and style eols "unix" (\\n).', function (done) {

    testStr(buff, {emptyLines: defaultEmptyLines}, function (err, result) {
      if (err) throw err
      expect(result).toHasLinesLike('\na\n\n')
      done()
    })
  })

  it('eols can be converted to Win CRLF style (\\r\\n)', function (done) {

    testStr(buff, {eolType: 'win', emptyLines: 1}, function (err, result) {
      if (err) throw err
      expect(result).toHasLinesLike('\r\na\r\n\r\n')
      done()
    })
  })

  it('or converted to Mac CR style (\\r)', function (done) {

    testStr(buff, {eolType: 'mac', emptyLines: 1}, function (err, result) {
      if (err) throw err
      expect(result).toHasLinesLike('\ra\r\r')
      done()
    })
  })

  it('`--empty-lines -1` disable remotion of empty lines', function (done) {

    testStr(buff, {emptyLines: -1}, function (err, result) {
      if (err) throw err
      var test = buff
        .replace(/\r\n?|\n/g, '\n')
        .replace(/\/\*[\s\S]*\*\//g, '')
        .replace(/\/\/[^\n]*/g, '')
        .replace(/[ \t]+$/, '')
      expect(result).toHasLinesLike(test)
      done()
    })
  })

  it('`--empty-lines 0` remove all empty lines', function (done) {

    testStr(buff, {emptyLines: 0}, function (err, result) {
      if (err) throw err
      expect(result).toHasLinesLike('a\n')
      done()
    })
  })

  it('`--empty-lines` must no add empty lines', function (done) {
    var s = '\n1\n\n2\n\n'

    testStr(s, {emptyLines: 2}, function (err, result) {
      if (err) throw err
      expect(result).toHasLinesLike('\n1\n\n2\n\n')
      done()
    })
  })

  it('`--empty-lines` must obey limit', function (done) {
    var s = '\n\n\n\n1\n\n\n\n2\n\n\n\n'

    testStr(s, {emptyLines: 2}, function (err, result) {
      if (err) throw err
      expect(result).toHasLinesLike('\n\n1\n\n\n2\n\n\n')
      done()
    })
  })

})


// #define Suite
// -------------

describe('#define', function () {

  it('once emitted, has global scope', function (done) {
    var text = [
      '//#define $_FOO 1',
      '$_FOO'
    ].join('\n')

    testStr(text, {}, function (err, result) {
      if (err) throw err
      var foo = '$_FOO'

      expect(result).toBe('1')
      testStr(foo, {}, function (err2, result2) {
        expect(result2).toBe(foo)
        done()
      })
    })
  })

  it('can include other defines', function (done) {
    var text = [
      '//#define $_A "\\n1\\\\n2\\t3"',
      '//#define $_B ($_A)',
      '//#define $_C $_B + "." + $_A',
      '$_A.$_B.$_C'
    ].join('\n')

    testStr(text, {emptyLines: -1}, function (err, result) {
      if (err) throw err
      var test = '\\n1\\\\n2\\t3'
      result = result.replace(/['"]/g, '')
      expect(result).toBe(test + '.' + test + '.' + test + '.' + test)
      done()
    })
  })

  it('evaluates the expression immediately', function (done) {
    var text = '//#define N1 1\n//#define $_N N1+2\n$_N'

    testStr(text, {}, function (err, result) {
      if (err) throw err
      expect(result).toBe('3')
      done()
    })
  })

  it('evaluation concatenate strings', function (done) {
    var text = [
      '//#define FOO "fo"+"o"',
      '//#define BAR \'bar\'',
      '//#if FOO+BAR === "foobar"',
      'ok',
      '//#endif'
    ].join('\n')

    testStr(text, {}, function (err, result) {
      if (err) throw err
      expect(result).toBe('ok\n')
      done()
    })
  })

  it('evaluation performs mathematical operations', function (done) {
    var text = [
      '//#define FOO 1+2',
      '//#define BAR 3',
      '//#if FOO+BAR === 6',
      'ok',
      '//#endif'
    ].join('\n')

    testStr(text, {}, function (err, result) {
      if (err) throw err
      expect(result).toBe('ok\n')
      done()
    })
  })

  it('evaluation recognizes and preserves regexes', function (done) {
    var text = [
      '//#define RE /^f/',
      '//#define $_OUT RE.test("foo")',
      'log($_OUT)'
    ].join('\n')

    testStr(text, {}, function (err, result) {
      if (err) throw err
      expect(result).toBe('log(true)')
      done()
    })
  })

  it('emit error event on evaluation errors', function (done) {
    var text = [
      '//#define $_FOO 5*10)',
      '$_FOO'
    ].join('\n')

    testStr(text, {}, function (err, result) {
      err ? done() : done.fail('Expected to fail. Got: `' + result + '`')
    })
  })

  it('Infinity value (e.g. division by 0) is converted to zero', function (done) {
    var text = [
      '//#define $_FOO Infinity',
      '//#define $_BAR 5/0',
      '$_FOO-$_BAR'
    ].join('\n')

    testStr(text, {}, function (err, result) {
      if (err) throw err
      expect(result).toBe('0-0')
      done()
    })
  })

  it('names starting with `$_` can be used anywhere in the file', function (done) {
    var text = [
      '//#define BAR "bar"',
      '//#define $_FOO "foo" + BAR',
      'log($_FOO)'
    ].join('\n')

    testStr(text, {}, function (err, result) {
      if (err) throw err
      expect(result).toBe('log("foobar")')
      done()
    })
  })

  it('be careful with backslashes in macro-substitution!', function (done) {
    var text = [
      '//#define $_FOO "a\b"',
      '//#define $_BAR "c\t"',
      '//#define $_BAZ "e\\\\f"',
      '$_FOO~$_BAR~$_BAZ',
      '//#if ~$_FOO.indexOf("\b")',
      '~ok',
      '//#endif'
    ].join('\n')

    testStr(text, {}, function (err, result) {
      if (err) throw err
      result = result.replace('\b', '{BS}').replace('\t', '{TAB}')
//    console.log('--- Result: `' + result + '`')
      expect(result).toMatch(/a\\b/)
      expect(result).toMatch(/c\\t/)
      expect(result).toMatch(/e\\\\f/)
      expect(result).toMatch(/~ok/)
      done()
    })

  })

  it('be careful with backslashes in macro-substitution! (file)', function (done) {

    testFile('macrosubs.txt', {}, function (err, result) {
      if (err) throw err
      result = result.replace('\b', '{BS}').replace('\t', '{TAB}')
//    console.log('--- Result: `' + result + '`')
      expect(result).toMatch(/a\\b/)
      expect(result).toMatch(/c\\t/)
      expect(result).toMatch(/e\\\\f/)
      expect(result).toMatch(/~ok/)
      done()
    })

  })

})


// Conditional Blocks
// ------------------

describe('Conditionals Blocks', function () {

  it('can be indented', function (done) {
    var text = [
      '//#define _A',
      '//#if 1',
      '  //#if _A',
      '  a',
      '  //#endif',
      '//#endif'
    ].join('\n')

    testStr(text, {}, function (err, result) {
      if (err) throw err
      expect(result).toBe('  a\n')
      done()
    })
  })

  it('can include spaces between `//#` and the keyword', function (done) {
    var text = [
      '//# define _A',
      '//# if 1',
      '//#   if _A',
      '  a',
      '  //# endif',
      '//# endif'
    ].join('\n')

    testStr(text, {}, function (err, result) {
      if (err) throw err
      expect(result).toBe('  a\n')
      done()
    })
  })

  it('can NOT include spaces between `//` and the `#`', function (done) {
    var text = [
      '// #if 0',
      '  a',
      '// #endif'
    ].join('\n')

    testStr(text, {}, function (err, result) {
      if (err) throw err
      expect(result).toBe('  a\n')
      done()
    })
  })

  it('with incorrect sequence raises an exception', function (done) {
    var text = [
      '//#elif 0',
      '//#endif'
    ].join('\n')

    testStr(text, {}, function (err) {
      err ? done() : done.fail('Expected to fail')
    })
  })

  it('unclosed block raises an Exception!!!', function (done) {
    var text = [
      '//#if 0',
      '//#if 1',
      '//#elif 0',
      '//#endif'
    ].join('\n')

    testStr(text, {}, function (err, result) {
      err ? done() : done.fail('Expected to fail. Got: ' + result)
    })
  })

  it('unclosed block throws even in included files', function (done) {
    var text = [
      '//#if 1',
      '//#include ' + path.join(fixtures, 'unclosed'),
      '//#endif'
    ].join('\n')

    testStr(text, {}, function (err, result) {
      err ? done() : done.fail('Expected to fail. Got: ' + result)
    })
  })

  it('or in single file', function (done) {

    testFile('unclosed', {}, function (err, result) {
      err ? done() : done.fail('Expected to fail. Got: ' + result)
    })
  })

  it('Infinity values equals to 0', function (done) {
    var text = [
      '//#if 5/0',
      '//#else',
      'Infinity',
      '//#endif',
      '//#define $_X Infinity',
      '~$_X~'
    ].join('\n')

    testStr(text, {}, function (err, result) {
      if (err) throw err
      expect(result).toMatch(/Inf/)
      expect(result).toMatch(/~0~/)
      done()
    })
  })

  it('expressions are simply JavaScript (buffer)', function (done) {
    var text = [
      '//#if !""',
      'empty',
      '//#endif',
      '//#if "0" | 1',
      'one',
      '//#endif',
      '//#if typeof {} === "object"',
      'object',
      '//#endif',
      '//#if NaN !== NaN',
      'NaN',
      '//#endif',
      '//#define $_S "\\ntr\\\\nim\\t ".trim()',
      '$_S~'
    ].join('\n')

    testStr(text, {}, function (err, result) {
      if (err) throw err
      var i, test = ['empty', 'one', 'object', 'NaN', (/['"]tr\\\\nim['"]/)] // eslint-disable-line no-extra-parens

      for (i = 0; i < test.length; i++)
        expect(result).toMatch(test[i])
      done()
    })
  })

  it('expressions are simply JavaScript (file)', function (done) {

    testFile('simplyjs.txt', {}, function (err, result) {
      if (err) throw err
      var i, test = ['empty', 'one', 'object', 'NaN', (/['"]tr\\\\nim['"]/)] // eslint-disable-line no-extra-parens

      for (i = 0; i < test.length; i++)
        expect(result).toMatch(test[i])
      done()
    })
  })

})


// `#include` Suite
// ----------------

describe('#include', function () {

  it('files included in removed blocks are skipped (seems obvious?)', function (done) {

    testFile('include1.txt', {}, function (err, result) {
      if (err) throw err
      // ONCE not defined, 3 dummy.js 'cause include_once is skipped
      expect(result).toMatch('in dummy')
      expect(result.match(/in dummy/g).length).toBe(3)
      done()
    })
  })

  it('only 1 copy when include_once is seen', function (done) {

    testFile('include1.txt', {define: 'ONCE'}, function (err, result) {
      if (err) throw err
      // ONCE defined, found include_once, only 1 dummy.js
      expect(result).toMatch('in dummy')
      expect(result.match(/in dummy/g).length).toBe(1)
      done()
    })
  })

  it('defines are available after the included file ends', function (done) {
    var text = [
      '//#include ' + path.join(fixtures, 'include3.txt'),
      '//#if INCLUDED3',    // defined in include3.txt
      'log3',
      '//#endif'
    ].join('\n')

    testStr(text, {}, function (err, result) {
      if (err) throw err
      expect(result).toMatch('log3')
      done()
    })
  })

  describe('- Indentation', function () {

    it('default of includes is nothing', function (done) {
      var text = '//#include ' + path.join(fixtures, 'dummy')

      testStr(text, {}, function (err, result) {
        if (err) throw err
        expect(result).toMatch(/^'in dummy'/)
        done()
      })
    })

    it('can set to tab or spaces (e.g. `--indent 1t`)', function (done) {
      var text = '//#include ' + path.join(fixtures, 'dummy')

      testStr(text, { indent: '1t' }, function (err, result) {
        if (err) throw err
        expect(result).toMatch(/^\t'in dummy'/m)
        done()
      })
    })

    it('is added in each level', function (done) {

      // include1 includes dummy.js and include2.txt
      // include2 includes dummy.js twice
      testFile('include1.txt', { indent: '2s' }, function (err, result) {
        if (err) done.fail(err)
        expect(result).toMatch(/^ {2}'in dummy'/m)
        expect(result).toMatch(/^ {4}'in dummy'/m)
        done()
      })
    })

  })

  describe('- Empty lines', function () {

    it('force eol after any file, even with emptyLines 0', function (done) {
      var text = [
        '//#include ' + path.join(fixtures, 'noeol.txt'),
        '//#include ' + path.join(fixtures, 'noeol.txt'),
        'ok'
      ].join('\n')

      testStr(text, {emptyLines: 0}, function (err, result) {
        if (err) done.fail(err)
        expect(result).toMatch(/^no_eol\nno_eol\nok$/)
        done()
      })
    })

    it('limit empty lines to `emptyLines` value between files', function (done) {
      var text = '//#include ' + path.join(fixtures, 'manyeols.txt')

      text = '\n\n\n\n' + text + '\n' + text + '\n\n\n\n'
      testStr(text, {emptyLines: 2}, function (err, result) {
        if (err) done.fail(err)
        expect(result).toMatch(/^\n\neol\n\n\neol\n\n\n$/)
        done()
      })
    })

    it('don\'t add unnecessary eol after insert a file', function (done) {
      var text = '//#include ' + path.join(fixtures, 'noeol.txt')

      testStr(text, {}, function (err, result) {
        if (err) done.fail(err)
        expect(result).toMatch(/^no_eol$/)
        done()
      })
    })

  })

})

// Headers suite
// -------------

describe('Headers', function () {

  it('Top file default header is none (--header1 option)', function (done) {

    testFile('include3.txt', {}, function (err, result) {
      if (err) done.fail(err)
      expect(result).not.toMatch('/include3')
      done()
    })

  })

  it('Default headers for includes is the relative filename (--headers)', function (done) {
    var text = '//#include ' + path.join(fixtures, 'include3.txt')

    testStr(text, {headers: defaultHeaders}, function (err, result) {
      if (err) done.fail(err)
      expect(result).toMatch('/include3')
      done()
    })

  })

  it('Top and included file headers can be customized', function (done) {
    var opts = {
          header1: 'hi top\n',
          headers: 'bye __FILE\n',
          emptyLines: 0
        },
        text = '//#include ' + path.join(fixtures, 'include3.txt')

    testStr(text, opts, function (err, result) {
      if (err) done.fail(err)
      expect(result).toMatch('hi top\nb')
      expect(result).toMatch('bye ')
      done()
    })

  })

  it('one ^ is replaced with eol, and ^^ with the ^ char', function (done) {
    var opts = {
          header1: '^hi^ ^^top^',
          headers: 'bye^^^__FILE^',
          emptyLines: 1
        },
        text = '//#include ' + path.join(fixtures, 'noeol.txt')

    testStr(text, opts, function (err, result) {
      if (err) done.fail(err)
      expect(result).toMatch(/^\nhi\n \^top\n/)
      expect(result).toMatch(/bye\^\n(?!\n)/)
      done()
    })

  })

  it('eol is forced after headers, even with `emptyLines` 0', function (done) {
    var opts = {
          header1: 'hi',
          headers: 'bye',
          emptyLines: 1
        },
        text = 'A\n//#include ' + path.join(fixtures, 'noeol.txt')

    testStr(text, opts, function (err, result) {
      if (err) done.fail(err)
      expect(result).toMatch(/^hi\nA\nbye\nno_eol$/)
      done()
    })

  })

})

// TODO: test with streams, e.g. pipe a file to stdin
