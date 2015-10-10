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


process.on('uncaughtException', function (err) {
  console.error('Uncaught Exception.')
  console.error(err.stack)
  process.exit(1)
})
jasmine.getEnv().catchExceptions(false)


// Comments Suite
// --------------

describe('Comments', function () {

  it('with the defaults, only preserve comments with "@license"', function (done) {

    testFile('comments.js', {}, function (err, result) {
      var lic = /\/\/@license:/
      expect(result).toMatch(lic)
      expect(result.replace(lic, '')).not.toMatch(/\/[*\/]/)
      done()
    })
  })

  it('are completely removed with the `-C none` option', function (done) {

    testFile('comments.js', {comments: 'none'}, function (err, result) {
      expect(result).not.toMatch(/\/[*\/]/)
      done()
    })
  })

  it('are preserved with `-C all`', function (done) {

    testFile('comments.js', {comments: 'all'}, function (err, result) {
      expect(result).toBe(readExpect('comments_all.js'))
      done()
    })
  })

  it('are preserved for linters with `-F all`', function (done) {
    var opts = {comments: 'filter', filter: 'all'}

    testFile('comments.js', opts, function (err, result) {
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
      expect(result).toHasLinesLike('\na\n\n')
      done()
    })
  })

  it('eols can be converted to Win CRLF style (\\r\\n)', function (done) {

    testStr(buff, {eolType: 'win', emptyLines: 1}, function (err, result) {
      expect(result).toHasLinesLike('\r\na\r\n\r\n')
      done()
    })
  })

  it('or converted to Mac CR style (\\r)', function (done) {

    testStr(buff, {eolType: 'mac', emptyLines: 1}, function (err, result) {
      expect(result).toHasLinesLike('\ra\r\r')
      done()
    })
  })

  it('`--empty-lines -1` disable remotion of empty lines', function (done) {

    testStr(buff, {emptyLines: -1}, function (err, result) {
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
      expect(result).toHasLinesLike('a\n')
      done()
    })
  })

})


// #define Suite
// -------------

describe('#define', function () {

  it('evaluates the expression immediately', function (done) {
    var text = '//#define N1 1\n//#define $_N N1+2\n$_N'

    testStr(text, {}, function (err, result) {
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
      expect(result).toBe('ok\n')
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
      expect(result).toBe('log("foobar")')
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
      expect(result).toBe('log(true)')
      done()
    })
  })

  it('scope is their process (beginning at top file)', function (done) {
    var text = [
      '//#define $_FOO 1',
      '$_FOO'
    ].join('\n')

    testStr(text, {}, function (err, result) {
      var foo = '$_FOO'

      expect(result).toBe('1')
      testStr(foo, {}, function (err2, result2) {
        expect(result2).toBe(foo)
        done()
      })
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

  it('with a file', function (done) {

    testFile('unclosed', {}, function (err, result) {
      err ? done() : done.fail('Expected to fail. Got: ' + result)
    })
  })

})


// `#include` Suite
// ----------------

describe('#include', function () {

  it('files included in removed blocks are skipped (seems obvious?)', function (done) {

    testFile('include1.js', {}, function (err, result) {
      // ONCE not defined, 3 dummy.js 'cause include_once is skipped
      expect(result).toMatch('in dummy')
      expect(result.match(/in dummy/g).length).toBe(3)
      done()
    })
  })

  it('only 1 copy when include_once is seen', function (done) {

    testFile('include1.js', {define: 'ONCE'}, function (err, result) {
      // ONCE defined, found include_once, only 1 dummy.js
      expect(result).toMatch('in dummy')
      expect(result.match(/in dummy/g).length).toBe(1)
      done()
    })
  })

  it('default indentation of includes is 2 spaces', function (done) {
    var text = '//#include ' + path.join(fixtures, 'dummy')

    testStr(text, {}, function (err, result) {
      expect(result).toMatch(/^\ {2}'in dummy'/)
      done()
    })
  })

  it('you can change indent (e.g. for 1 tab use `--indent 1t`)', function (done) {
    var text = '//#include ' + path.join(fixtures, 'dummy')

    testStr(text, { indent: '1t' }, function (err, result) {
      expect(result).toMatch(/^\t'in dummy'/m)
      done()
    })
  })

  it('each level of includes adds indentation', function (done) {

    // include1 includes dummy.js and include2.js
    // include2 includes dummy.js twice
    testFile('include1', { indent: '1t' }, function (err, result) {
      expect(result).toMatch(/^\t'in dummy'/m)
      expect(result).toMatch(/^\t\t'in dummy'/m)
      done()
    })
  })

  it('defines in included files are available anywhere', function (done) {
    var text = [
      '//#include ' + path.join(fixtures, 'include3'),
      '//#if INCLUDED3',    // defined in include3.js
      'log3',
      '//#endif'
    ].join('\n')

    testStr(text, {}, function (err, result) {
      expect(result).toMatch('log3')
      done()
    })
  })

})

describe('Headers', function () {

  it('Top file default header is none (--header1 option)', function (done) {

    testFile('include3', {}, function (err, result) {
      expect(result).not.toMatch('/include3')
      done()
    })

  })

  it('Default headers for includes is the relative filename (--headers)', function (done) {
    var text = '//#include ' + path.join(fixtures, 'include3')

    testStr(text, {headers: defaultHeaders}, function (err, result) {
      expect(result).toMatch('/include3')
      done()
    })

  })

  it('Top and included file headers can be customized', function (done) {
    var opts = {
          header1: 'hi top\n',
          headers: 'bye __FILE\n'
        },
        text = '//#include ' + path.join(fixtures, 'include3')

    testStr(text, opts, function (err, result) {
      expect(result).toMatch('hi top')
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
        text = '//#include ' + path.join(fixtures, 'include3')

    testStr(text, opts, function (err, result) {
      expect(result).toMatch(/\nhi\n \^top\n/)
      expect(result).toMatch(/bye\^\n /)
      done()
    })

  })

})

// TODO: test with streams, e.g. pipe a file to stdin
