/*
  Tests for jspreproc using jasmine
*/
/* eslint-env node, jasmine */

var jspp = require('../lib/preproc'),
    //stream = require('stream'),
    path = require('path'),
    fs = require('fs'),
    defaults = require('../lib/options').prototype.defaults

var fixtures = path.join(__dirname, 'fixtures')

function cat(file) {
  var f = path.join(__dirname, file)
  return fs.readFileSync(f, {encoding: 'utf8'})
}

function readExpect(file) {
  return cat(path.join('expect', file))
}

function testIt(str, opts, done) {
  var text = [],
      stpp = jspp(str, opts)

  function unlink() {
    stpp.removeAllListeners('data')
  }

  stpp
    .on('data', function (chunk) {
      text.push(chunk)
    })
    .once('end', function () {
      unlink()
      done(text = text.join(''))
    })
    .once('error', function (err) {
      unlink()
      done(err)
    })
}

function testFile(file, opts, callback) {
  (opts || (opts = {})).test = false
  testIt(path.join(fixtures, file), opts, callback)
}

function testStr(str, opts, callback) {
  (opts || (opts = {})).test = true
  testIt(str, opts, callback)
}

// set default headers and emptyLines to none, for easy test
var defaultHeaders = defaults.headers
defaults.headers = ''
var defaultEmptyLines = defaults.emptyLines
defaults.emptyLines = 0

// Comments Suite
// --------------

describe('Comments', function () {
  var opts = {}

  it('with defaults, only preserve comments with @license', function (done) {

    testFile('comments.js', opts, function (result) {
      var lic = /\/\/@license:/
      expect(result).toMatch(lic)
      expect(result.replace(lic, '')).not.toMatch(/\/[*\/]/)
      done()
    })
  })

  it('are completely removed with -C none', function (done) {
    opts.comments = 'none'

    testFile('comments.js', opts, function (result) {
      expect(result).not.toMatch(/\/[*\/]/)
      done()
    })
  })

  it('are preserved with -C all', function (done) {
    opts.comments = 'all'

    testFile('comments.js', opts, function (result) {
      expect(result).toBe(readExpect('comments_all.js'))
      done()
    })
  })

  it('are preserved for linters with -F all', function (done) {
    opts.comments = 'filter'
    opts.filter = 'all'

    testFile('comments.js', opts, function (result) {
      expect(result).toBe(readExpect('comments_linters.js'))
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
            compare: function(actual, expected) {
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

  it('default is empty lines 1 and unix style eols (\\n).', function (done) {

    testStr(buff, {emptyLines: defaultEmptyLines}, function (result) {
      expect(result).toHasLinesLike('\na\n\n')
      done()
    })
  })

  it('eols can be converted to Win CRLF (\\r\\n)', function (done) {

    testStr(buff, {eolType: 'win', emptyLines: 1}, function (result) {
      expect(result).toHasLinesLike('\r\na\r\n\r\n')
      done()
    })
  })

  it('or converted to Mac CR style (\\r)', function (done) {

    testStr(buff, {eolType: 'mac', emptyLines: 1}, function (result) {
      expect(result).toHasLinesLike('\ra\r\r')
      done()
    })
  })

  it('`--empty-lines -1` disable remotion of empty lines', function (done) {

    testStr(buff, {emptyLines: -1}, function (result) {
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

    testStr(buff, {emptyLines: 0}, function (result) {
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

    testStr(text, {}, function (result) {
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

    testStr(text, {}, function (result) {
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

    testStr(text, {}, function (result) {
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

    testStr(text, {}, function (result) {
      expect(result).toBe('log(true)')
      done()
    })
  })

  it('scope is their process (beginning at top file)', function (done) {
    var text = [
      '//#define $_FOO 1',
      '$_FOO'
    ].join('\n')

    testStr(text, {}, function (result) {
      var foo = '$_FOO'

      expect(result).toBe('1')
      testStr(foo, {}, function (result) {
        expect(result).toBe(foo)
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

    testStr(text, {}, function (result) {
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

    testStr(text, {}, function (result) {
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

    testStr(text, {}, function (result) {
      expect(result).toBe('  a\n')
      done()
    })
  })

  it('without correct secuence raises an exception', function (done) {
    var text = [
      '//#elif 0',
      '//#endif'
    ].join('\n')

    pending('I can\'t capture exceptions')

    testStr(text, {}, function (result) {
      if (result instanceof Error)
        done()
      else
        done.fail('Expected to fail')
    })
  })

  it('unclosed block raises an Exception!!!', function (done) {
    var text = [
      '//#if 0',
      '//#if 1',
      '//#elif 0',
      '//#endif'
    ].join('\n')

    pending('I can\'t capture exceptions')

    testStr(text, {}, function (result) {
      if (result instanceof Error)
        done()
      else
        done.fail('Expected to fail')
    })
  })

  it('unclosed block throws even in included files', function (done) {
    var text = [
      '//#if 1',
      '//#include ' + path.join(fixtures, 'unclosed'),
      '//#endif'
    ].join('\n')

    pending('I can\'t capture exceptions')

    testStr(text, {}, function (result) {
      if (result instanceof Error)
        done()
      else
        done.fail('Expected to fail')
    })
  })

  it('with a file', function (done) {

    pending('I can\'t capture exceptions')

    testFile('unclosed', {}, function (result) {
      if (result instanceof Error)
        done()
      else
        done.fail('Expected to fail')
    })
  })

})


// `#include` Suite
// ----------------

describe('#include', function () {

  it('files included in removed blocks are skipped (seems obvious?)', function (done) {

    testFile('include1.js', {}, function (result) {
      // ONCE not defined, 3 dummy.js cause include_once is skipped
      expect(result).toMatch('in dummy')
      expect(result.match(/in dummy/g).length).toBe(3)
      done()
    })
  })

  it('only 1 copy when include_once is seen', function (done) {

    testFile('include1.js', {define: 'ONCE'}, function (result) {
      // ONCE defined, found include_once, only 1 dummy.js
      expect(result).toMatch('in dummy')
      expect(result.match(/in dummy/g).length).toBe(1)
      done()
    })
  })

  it('default indentation of includes is 2 spaces', function (done) {
    var text = '//#include ' + path.join(fixtures, 'dummy')

    testStr(text, {}, function (result) {
      expect(result).toMatch(/^\ {2}'in dummy'/)
      done()
    })
  })

  it('you can change indent (e.g. for 1 tab use `--indent 1t`)', function (done) {
    var text = '//#include ' + path.join(fixtures, 'dummy')

    testStr(text, { indent: '1t' }, function (result) {
      expect(result).toMatch(/^\t'in dummy'/m)
      done()
    })
  })

  it('each level of includes adds indentation', function (done) {

    // include1 includes dummy and include2
    // include2 includes dummy twice
    testFile('include1', { indent: '1t' }, function (result) {
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

    testStr(text, {}, function (result) {
      expect(result).toMatch('log3')
      done()
    })
  })

})

describe('Headers', function () {

  it('Top file default header is none (--header1 option)', function (done) {

    testFile('include3', {}, function (result) {
      expect(result).not.toMatch('/include3')
      done()
    })

  })

  it('Default headers for includes is the relative filename (--headers)', function (done) {
    var text = '//#include ' + path.join(fixtures, 'include3')

    testStr(text, {headers: defaultHeaders}, function (result) {
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

    testStr(text, opts, function (result) {
      expect(result).toMatch('hi top')
      expect(result).toMatch('bye ')
      done()
    })

  })

})
