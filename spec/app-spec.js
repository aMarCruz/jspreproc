/*
  Tests for jspreproc using jasmine
*/
/* eslint-env node, jasmine */

var jspp = require('../lib/preproc'),
    stream = require('stream'),
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
  var sout = new stream.PassThrough({encoding: 'utf8', decodeStrings: false}),
      text = [],
      stpp = jspp(str, opts)

  function unlink(w, r) {
    w.unpipe(r)
    w.removeAllListeners('data')
    return null
  }

  stpp.pipe(sout)
    .on('data', function (chunk) {
      text.push(chunk)
    })
    .once('end', function () {
      stpp = sout = unlink(stpp, sout)
      done(text = text.join(''))
    })
    .once('error', function (err) {
      stpp = sout = unlink(stpp, sout)
      done.fail('' + err)
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


// Comments Suite
// --------------

describe('Comments', function () {
  var opts = { headers: '', emptyLines: 0 }

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
  var opts = { headers: '' },
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

  var customMatcher = {
    toHasLinesLike: function (util/*, customEqualityTesters*/) {
      function printable(str) {
        return str.replace(/\n/g, '\\n').replace(/\r/g, '\\r')
      }
      return {
        compare: function(actual, expected) {
          expected = expected ? printable(expected) : ''
          actual   = actual ? printable(actual) : ''
          var result = {
            pass: actual === expected
          }
          result.message = util
            .buildFailureMessage('toHasLinesLike', result.pass, actual, expected)
          return result
        }
      }
    }
  }

  beforeEach(function () {
    jasmine.addMatchers(customMatcher)
  })

  it('default is maximum empty lines 1 and unix style eols.', function (done) {
    opts.emptyLines = defaults.emptyLines

    testStr(buff, opts, function (result) {
      expect(result).toHasLinesLike('\na\n\n')
      done()
    })
  })

  it('terminators can be converted to Win or Mac style', function (done) {

    opts.eolType = 'win'
    testStr(buff, opts, function (result) {
      expect(result).toHasLinesLike('\r\na\r\n\r\n')
      done()
    })

    opts.eolType = 'mac'
    testStr(buff, opts, function (result) {
      expect(result).toHasLinesLike('\ra\r\r')
      done()
    })
  })

  it('`--empty-lines -1` disable remotion of empty lines', function (done) {
    opts.emptyLines = -1
    opts.eolType = 'unix'

    testStr(buff, opts, function (result) {
      var test = buff
        .replace(/\r\n?|\n/g, '\n')
        .replace(/\/\*[\s\S]*\*\//g, '')
        .replace(/\/\/[^\n]*/g, '')
        .replace(/[ \t]+$/, '')
      expect(result).toHasLinesLike(test)
      done()
    })
  })

  it('`--empty-lines 0` to remove all empty lines', function (done) {
    opts.emptyLines = 0
    opts.eolType = 'unix'

    testStr(buff, opts, function (result) {
      expect(result).toHasLinesLike('a\n')
      done()
    })
  })

})


// #define Suite
// -------------

describe('#define', function () {
  var opts = {
    emptyLines: 0,
    headers: ''
  }

  it('evaluates the expression immediately', function (done) {

    testStr('//#define N1 1\n//#define $_N N1+2\n$_N', opts,
      function (result) {
        expect(result).toBe('3')
        done()
      })
  })

  it('evaluation concatenate strings', function (done) {
    var srcStr = [
      '//#define FOO "fo"+"o"',
      '//#define BAR \'bar\'',
      '//#if FOO+BAR === "foobar"',
      'ok',
      '//#endif'
    ].join('\n')

    testStr(srcStr, opts, function (result) {
      expect(result).toBe('ok\n')
      done()
    })
  })

  it('names starting with `$_` can be used anywhere in the file', function (done) {
    var srcStr = [
      '//#define BAR "bar"',
      '//#define $_FOO "foo" + BAR',
      'log($_FOO)'
    ].join('\n')

    testStr(srcStr, opts, function (result) {
      expect(result).toBe('log("foobar")')
      done()
    })
  })

  it('preserve regexes', function (done) {

    testFile('define_regex.js', {headers: '', emptyLines: 0},
      function (result) {
        expect(result).toMatch(/(r=\/\^a'"b"\/g)\s*\1/)
        done()
      })
  })

})


// `#include` Suite
// ----------------

describe('#include', function () {

  it('skip files included in removed blocks', function (done) {

    testFile('include1.js', {headers: '', undef: 'ONCE'},
      function (result) {
        // ONCE not defined, 3 dummy.js
        expect(result).toMatch('in dummy')
        expect(result.match(/in dummy/g).length).toBe(3)
        done()
      })
  })

  it('only 1 copy when include_once is seen', function (done) {

    testFile('include1.js', {headers: '', define: 'ONCE'},
      function (result) {
        // ONCE defined, only 1 dummy.js
        expect(result).toMatch('in dummy')
        expect(result.match(/in dummy/g).length).toBe(1)
        done()
      })
  })

})
