/*
  Tests for jspreproc using jasmine
*/
'use strict'

var jspp     = require('../lib/preproc'),
    path     = require('path'),
    fs       = require('fs'),
    defaults = require('../lib/options').defaults

var fixtures = path.join(__dirname, 'fixtures'),
    WANT_ERR = !0     // make visible

function cat(file) {
  var f = path.join(__dirname, file)
  return fs.readFileSync(f, {encoding: 'utf8'})
}

function fixPath(file) {
  return path.join(fixtures, file)
}

function readExpect(file) {
  return cat(path.join('expect', file))
}

//var errText = '--- DEBUG: a stream in error condition emitted an '

function testIt(any, opts, callback, wantErr) {
  var text = [],
      stpp = jspp(any, opts)

  //console.log('--- TRACE: using stream ' + stpp._jspp_id + ' for the next spec')
  stpp
    .on('data', function (chunk) {
      //if (opts.__hasError) console.error(errText + '`data` event')
      text.push(chunk)
    })
    .on('end', function () {
      //console.log('--- [' + stpp._jspp_id + '] is done!')
      //if (opts.__hasError) console.error(errText + '`end` event')
      callback(text = text.join(''))
    })
    .on('error', function (err) {
      //console.error('--- [' + stpp._jspp_id + '] have an error: ' + err)
      //opts.__hasError = true
      /* istanbul ignore else: make no sense if spec fails */
      if (wantErr) callback(err)
      else fail(err)
    })
}

function testStr(str, opts, callback, wantErr) {
  opts.buffer = str
  testIt(null, opts, callback, wantErr)
}

function testFile(file, opts, callback, wantErr) {
  testIt(fixPath(file), opts, callback, wantErr)
}

function testOther(any, opts, callback, wantErr) {
  testIt(any, opts, callback, wantErr)
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

    testFile('comments', {}, function (result) {
      var lic = /\/\/\s*@license:/
      expect(result).toMatch(lic)
//      expect(result.replace(lic, '')).not.toMatch(/\/[*\/]/)
      done()
    })
  })

  it('are completely removed with the `-C none` option', function (done) {

    testFile('comments', {comments: 'none'}, function (result) {
      expect(result).not.toMatch(/\/[*\/]/)
      done()
    })
  })

  it('are preserved with `-C all`', function (done) {

    testFile('comments', {comments: 'all'}, function (result) {
      expect(result).toBe(readExpect('comments_all.js'))
      done()
    })
  })

  it('are preserved for linters with `-F all`', function (done) {
    var opts = {comments: 'filter', filter: 'all'}

    testFile('comments', opts, function (result) {
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

    testStr(text, opts, function (result) {
      expect(result).toMatch(/\* @m/)
      done()
    })
  })

  it('you can pass an array of regexes in the customFiler property', function (done) {
    var opts = {customFilter: [/@m/, / #/]},
        text = [
          '/* @module foo */',
          '// # bar'
        ].join('\n')

    testStr(text, opts, function (result) {
      expect(result).toMatch(/foo[*\/#\s]+bar/)
      done()
    })
  })

})

// Lines Suite
// -----------

describe('Lines', function () {
  var buff = [
    '\n', '\r\n', '\n', '\r\n',     // 4
    'a',
    '\r', '\r\n', '\r\n', '\r',     // 4
    '//x',
    '\n', '\n', '\n', '\n', '\n',   // 5
    '/* \n\n */',
    '\n', '\n', '\n', '\n', '\n',   // 5
    '\n'                            // 1
  ].join('')

  it('default is one empty line and style eols "unix" (\\n).', function (done) {

    testStr(buff, {emptyLines: defaultEmptyLines}, function (result) {
      expect(result).toHasLinesLike('\na\n\n')
      done()
    })
  })

  it('eols can be converted to Win CRLF style (\\r\\n)', function (done) {

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

  it('`--empty-lines` must no add empty lines', function (done) {
    var s = '\n1\n\n2\n\n'

    testStr(s, {emptyLines: 2}, function (result) {
      expect(result).toHasLinesLike('\n1\n\n2\n\n')
      done()
    })
  })

  it('`--empty-lines` must obey limit', function (done) {
    var s = '\n\n\n\n1\n\n\n\n2\n\n\n\n'

    testStr(s, {emptyLines: 2}, function (result) {
      expect(result).toHasLinesLike('\n\n1\n\n\n2\n\n\n')
      done()
    })
  })

})


// #define Suite
// -------------

describe('#define', function () {

  it('once emitted, has global scope to the *top* file', function (done) {
    var text = [
      '//#define FOO',
      '//#ifdef FOO',
      '1',
      '//#endif'
    ].join('\n')

    testStr(text, {}, function (result) {     // text is the top file
      var foo = '$_FOO'

      expect(result).toBe('1\n')
      testStr(foo, {}, function (result2) {   // foo is other top file
        expect(result2).toBe(foo)             // $_FOO is not defined
        done()
      })
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

  it('can include other defined symbols', function (done) {
    var text = [
      '//#define $_A  "A"',
      '//#define $_B  $_A + "." + $_A',
      '//#define $_C  $_A + "." + $_B',
      '$_C'
    ].join('\n')

    testStr(text, {emptyLines: -1}, function (result) {
      //var test = 'A.A.A'
      //result = result.replace(/['"]/g, '')
      expect(result).toBe('"A.A.A"')
      done()
    })
  })

  it('evaluates the expression immediately', function (done) {
    var text = [
      '//#define N_1  1',
      '//#define $_R  N_1 + 2',
      '$_R'
    ].join('\n')

    testStr(text, {}, function (result) {
      expect(result).toBe('3')
      done()
    })
  })

  it('evaluation performs mathematical operations', function (done) {
    var text = [
      '//#define FOO 1 + 2',
      '//#define BAR 3',
      '//#if FOO+BAR === 6',
      'ok',
      '//#endif'
    ].join('\n')

    testStr(text, {}, function (result) {
      expect(result).toBe('ok\n')
      done()
    })
  })

  it('evaluation concatenate strings', function (done) {
    var text = [
      '//#define FOO "fo" + "o"',
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

  it('recognizes and preserves regexes', function (done) {
    var text = [
      '//#define RE /^f/',
      '//#define $_R /\\n+/',
      '//#define $_V RE.test("foo")',
      '($_V, $_R)'
    ].join('\n')

    testStr(text, {}, function (result) {
      expect(result).toBe('(true, /\\n+/)')
      done()
    })
  })

  it('recognizes and preserves Date objects', function (done) {
    var text = [
      '//#define $_D new Date(2015,9,10)',
      '//#define $_E +$_D',
      '//#if ($_D instanceof Date) && (typeof $_E === "number")',
      'date',
      '//#endif',
      '//#define $_E $_D.getFullYear()',
      '//#define $_D +(new Date("x"))',
      '$_E~$_D'
    ].join('\n')

    testStr(text, {}, function (result) {
      expect(result).toMatch(/date\D+2015~NaN/)
      done()
    })
  })

  it('null, undefined and NaN values are preserved too', function (done) {
    var text = [
      '//#define $_X null',
      '//#define $_U undefined',
      '//#define $_N parseInt("x", 10)',
      '($_X,$_U,$_N)'
    ].join('\n')

    testStr(text, {}, function (result) {
      expect(result).toBe('(null,undefined,NaN)')
      done()
    })
  })

  it('Infinity (e.g. division by 0) is converted to zero', function (done) {
    var text = [
      '//#define $_FOO Infinity',
      '//#define $_BAR 5/0',
      '$_FOO-$_BAR'
    ].join('\n')

    testStr(text, {}, function (result) {
      expect(result).toBe('0-0')
      done()
    })
  })

  it('emit error event on evaluation errors', function (done) {
    var text = [
      '//#define $_FOO 5*10)',
      '$_FOO'
    ].join('\n')

    testStr(text, {}, function (result) {
      expect(result).toErrorContain('Can\'t evaluate')
      done()
    }, WANT_ERR)
  })

  it('be careful with backslashes in macro-substitution!', function (done) {
    var text = [
      '//#define $_FOO "a\b"',
      '//#define $_BAR "c\t"',
      '//#define $_BAZ "e\\\\f"',
      '$_FOO~$_BAR~$_BAZ',
      '//#if ~$_FOO.indexOf("\b")',
      'ok',
      '//#endif'
    ].join('\n')

    testStr(text, {}, function (result) {
//    console.log('--- Result: `' + result + '`')
      result = result.replace(/['"]/g, '')
      expect(result).toMatch(/a\\b~c\\t~e\\\\f/)
      expect(result).toMatch(/ok/)
      done()
    })

  })

  it('be careful with backslashes in macro-substitution! (file)', function (done) {

    testFile('macrosubs.txt', {}, function (result) {
//    console.log('--- Result: `' + result + '`')
      result = result.replace(/['"]/g, '')
      expect(result).toMatch(/a\\b~c\\t~e\\\\f/)
      expect(result).toMatch(/ok/)
      done()
    })

  })

})


// Conditional Blocks
// ------------------

describe('Conditionals Blocks', function () {

  var UNCLOSED_BLOCK = 'Unclosed conditional block'

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

  it('#if blocks can be nested', function (done) {
    var text = [
      '//#define _A   ',
      '//#if 1        ',
      '//#  if 1      ',
      '//#    if _A   ',
      '         ok    ',
      '//#    else    ',
      '//#      if 1  ',
      '           no  ',
      '//#      endif ',
      '//#    endif   ',
      '//#    if !0   ',
      '         yes   ',
      '//#    endif   ',
      '//#  endif     ',
      '//#endif       '
    ].join('\n')

    testStr(text, {}, function (result) {
      expect(result).toMatch(/ ok\s*yes\s*$/)
      done()
    })
  })

  it('incorrect sequence raises an error event', function (done) {

    testStr('//#elif 0', {}, function (result) {
      expect(result).toErrorContain('Unexpected #elif')

      testStr('//#else', {}, function (result2) {
        expect(result2).toErrorContain('Unexpected #else')

        testStr('//#endif', {}, function (result3) { // eslint-disable-line max-nested-callbacks
          expect(result3).toErrorContain('Unexpected #endif')
          done()
        }, WANT_ERR)
      }, WANT_ERR)
    }, WANT_ERR)
  })

  it('unclosed conditional block emits error event', function (done) {
    var text = [
      '//#if _A',
      '//#else',
      '#endif'
    ].join('\n')

    testStr(text, {}, function (result) {
      expect(result).toErrorContain(UNCLOSED_BLOCK)

      testStr('//#ifndef X\n//#enif', {}, function (result2) {
        expect(result2).toErrorContain(UNCLOSED_BLOCK)
        done()
      }, WANT_ERR)
    }, WANT_ERR)
  })

  it('unclosed block throws even in included files', function (done) {
    var text = [
      '//#include ' + fixPath('unclosed'),
      '//#endif'
    ].join('\n')

    testStr(text, {}, function (result) {
      expect(result).toErrorContain(UNCLOSED_BLOCK)
      done()
    }, WANT_ERR)
  })

  it('each file have to close theirs blocks', function (done) {

    testFile('unclosed', {}, function (result) {
      expect(result).toErrorContain(UNCLOSED_BLOCK)
      done()
    }, WANT_ERR)
  })

  it('all keywords, except #else/#endif, must have an expression', function (done) {

    testStr('//#if\n//#endif', {}, function (result) {
      expect(result).toErrorContain('Expected expression for #')
      done()
    }, WANT_ERR)
  })

  // can
  it('#elif expression can be included after #ifdef/#ifndef', function (done) {
    var text = [
      '//#ifdef _UNDEF_VAL_',
      'no',
      '//#elif 0',
      'no',
      '//#elif 1',
      'ok',
      '//#else',
      'no',
      '//#endif'
    ].join('\n')

    testStr(text, {}, function (result) {
      expect(result).toMatch(/ok/)
      expect(result).not.toMatch(/no/)
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

    testStr(text, {}, function (result) {
      var i, test = ['empty', 'one', 'object', 'NaN', (/['"]tr\\\\nim['"]/)] // eslint-disable-line no-extra-parens

      for (i = 0; i < test.length; i++) {
        expect(result).toMatch(test[i])
      }
      done()
    })
  })

  it('expressions are simply JavaScript (file)', function (done) {

    testFile('simplyjs.txt', {}, function (result) {
      var i, test = ['empty', 'one', 'object', 'NaN', (/['"]tr\\\\nim['"]/)] // eslint-disable-line no-extra-parens

      for (i = 0; i < test.length; i++)
        expect(result).toMatch(test[i])
      done()
    })
  })

  it('#if/#elif supports the `defined()` function', function (done) {
    var text = [
      '//#define _A',
      '//#if defined(_B) || defined(_A)',
      'ok1',
      '//#endif',
      '//#if !defined(_Z)',
      'ok2',
      '//#endif'
    ].join('\n')

    testStr(text, {}, function (result) {
      expect(result).toMatch(/ok1[^o]*ok2/)
      done()
    })
  })

  it('#ifdef/#ifndef are shorthands to `defined`', function (done) {
    var text = [
      '//#define _A',
      '//#ifdef _A',
      'ok1',
      '//#endif',
      '//#ifndef _Z',
      'ok2',
      '//#endif'
    ].join('\n')

    testStr(text, {}, function (result) {
      expect(result).toMatch(/ok1[^o]*ok2/)
      done()
    })
  })

})


// `#include` Suite
// ----------------

describe('#include', function () {

  it('default extension is js, single or double quoted filenames ok', function (done) {
    var text = [
      '//#include "' + fixPath('dummy') + '"',
      "//#include '" + fixPath('dummy') + "'"
    ].join('\n')

    testStr(text, {}, function (result) {
      expect(result).toMatch(/Dummy[\S\s]*?Dummy/)
      done()
    })
  })

  it('files included in removed blocks are skipped (seems obvious?)', function (done) {

    testFile('include1.txt', {}, function (result) {
      // ONCE not defined, 3 dummy.js 'cause include_once is skipped
      expect(result).toMatch(/Dummy/)
      expect(result.match(/Dummy/g).length).toBe(3)
      done()
    })
  })

  it('only 1 copy is included when include_once is seen', function (done) {

    testFile('include1.txt', {define: 'ONCE'}, function (result) {
      // ONCE defined, found include_once, only 1 dummy.js
      expect(result).toMatch(/Dummy/)
      expect(result.match(/Dummy/g).length).toBe(1)
      done()
    })
  })

  it('defines are available after the included file ends', function (done) {
    var text = [
      '//#include ' + fixPath('include3.txt'),
      '//#if INCLUDED3',    // defined in include3.txt
      'ok1',
      '//#endif',
      '//#include ' + fixPath('incundef3.txt'),
      '//#if !INCLUDE3',
      'ok2',
      '//#endif'
    ].join('\n')

    testStr(text, {}, function (result) {
      expect(result).toMatch('ok1')
      expect(result).toMatch('ok2')
      done()
    })
  })

  it('emit error if filenames is missing or invalid', function (done) {

    testStr('//#include ""\n', {}, function (result) {
      expect(result).toErrorContain('Expected filename')
      done()
    }, WANT_ERR)
  })

  describe('Indentation', function () {

    it('default of includes is nothing', function (done) {
      var text = '//#include ' + fixPath('dummy')

      testStr(text, {}, function (result) {
        expect(result).toMatch(/^Dummy/)
        done()
      })
    })

    it('can set to tab or spaces (e.g. `--indent 1t`)', function (done) {
      var text = '//#include ' + fixPath('dummy')

      testStr(text, { indent: '1t' }, function (result) {
        expect(result).toMatch(/^\tDummy/m)
        done()
      })
    })

    it('each level adds one indentation more', function (done) {

      // include1 includes dummy.js and include2.txt
      // include2 includes dummy.js twice
      testFile('include1.txt', { indent: '2s' }, function (result) {
        expect(result).toMatch(/^ {2}Dummy/m)
        expect(result).toMatch(/^ {4}Dummy/m)
        done()
      })
    })

  })

  describe('- Empty lines', function () {

    it('force eol after any file, even with emptyLines 0', function (done) {
      var text = [
        '//#include ' + fixPath('noeol.txt'),
        '//#include ' + fixPath('noeol.txt'),
        'ok'
      ].join('\n')

      testStr(text, {emptyLines: 0}, function (result) {
        expect(result).toHasLinesLike('noEol\nnoEol\nok')
        done()
      })
    })

    it('limit empty lines to `emptyLines` value between files', function (done) {
      var text = '//#include ' + fixPath('manyeols.txt')
      text = '\n\n\n\n' + text + '\n' + text + '\n\n\n\n'

      testStr(text, {emptyLines: 2}, function (result) {
        expect(result).toHasLinesLike('\n\neol\n\n\neol\n\n\n')
        done()
      })
    })

    it('don\'t add unnecessary eol after insert a file', function (done) {
      var text = '//#include ' + fixPath('noeol.txt')

      testStr(text, {}, function (result) {
        expect(result).toBe('noEol')
        done()
      })
    })

  })

})

// Headers suite
// -------------

describe('Headers', function () {

  it('for top file default is none (the --header1 option)', function (done) {

    testFile('include3.txt', {}, function (result) {
      expect(result).not.toMatch('/include3')
      done()
    })
  })

  it('for included files is the relative filename (--headers)', function (done) {
    var text = '//#include ' + fixPath('include3.txt')

    testStr(text, {headers: defaultHeaders}, function (result) {
      expect(result).toMatch('/include3')
      done()
    })
  })

  it('for top and included files can be customized', function (done) {
    var opts = {
          header1: 'hi top\n',
          headers: 'bye __FILE\n',
          emptyLines: 0
        },
        text = '//#include ' + fixPath('include3.txt')

    testStr(text, opts, function (result) {
      expect(result).toMatch('hi top\nb')
      expect(result).toMatch('bye ')
      done()
    })
  })

  it('can be removed with the empty string: --headers ""', function (done) {
    var opts = {
          headers: '',
          emptyLines: 0
        },
        text = '//#include ' + fixPath('noeol.txt')

    testStr(text, opts, function (result) {
      expect(result).toMatch(/^noEol/)
      done()
    })
  })

  it('^ is replaced with eol, and ^^ with the ^ char', function (done) {
    var opts = {
          header1: '^hi^ ^^top^',
          headers: 'bye^^^__FILE^',
          emptyLines: 1
        },
        text = '//#include ' + fixPath('noeol.txt')

    testStr(text, opts, function (result) {
      expect(result).toMatch(/^\nhi\n \^top\n/)
      expect(result).toMatch(/bye\^\n(?!\n)/)
      done()
    })
  })

  it('ensure is ending with eol, even with `emptyLines` 0', function (done) {
    var opts = {
          header1: 'hi',    // no EOL in headers
          headers: 'bye',
          emptyLines: 1
        },
        text = 'A\n//#include ' + fixPath('noeol.txt')

    testStr(text, opts, function (result) {
      expect(result).toMatch(/^hi\nA\nbye\nnoEol$/)
      done()
    })
  })

})

describe('Parameters', function () {

  it('wrong options throws exceptions', function () {
    var jopt = new (require('../lib/options'))(),
        opts = {},
        vals = ['comments', 'eolType', 'filter', 'define', 'undef', 'indent'],
        test = function () { jopt.merge(opts) }

    for (var i = 0; i < vals.length; ++i) {
      opts = {}
      opts[vals[i]] = 'foo'
      expect(test).toThrow()
    }
    opts = {customFilter: '['}
    expect(test).toThrow()
    opts = {eolType: null}
    expect(test).toThrow()
  })

  it('can accept different types and formats', function () {
    var jopt = new (require('../lib/options'))(),
        opts = {},
        test = function () { opts = jopt.merge(opts) }

    opts = {indent: ''}
    expect(test).not.toThrow()
    opts = {filter: 'jsdoc, eslint'}
    expect(test).not.toThrow()
    opts = {filter: ['jsdoc', 'eslint']}
    expect(test).not.toThrow()
    opts = {customFilter: '@'}
    expect(test).not.toThrow()
    opts = {customFilter: /@/}
    expect(test).not.toThrow()
    opts = {emptyLines: 'z'}
    expect(test).not.toThrow()
    opts = {define: 'FOO,BAR=2,BAZ=""'}
    expect(test).not.toThrow()

    opts = jopt._getDefines()
    expect(opts.FOO).toEqual(1)
    expect(opts.BAR).toEqual(2)
    expect(opts.BAZ).toBe('""')
  })

  it('undef can be an array, or a string delimited with commas', function (done) {
    var text = [
      '//#if !AA',
      'aa',
      '//#endif',
      '$_BB~$_CC'
    ].join('\n')

    testStr(text, {define: ['AA', '$_BB', '$_CC'], undef: 'AA, $_BB'}, function (result) {
      expect(result).toMatch(/aa/)
      expect(result).toMatch(/\$_BB~1/)
      done()
    })
  })

  it('1st parameter of jspp can be an array of filenames', function (done) {
    var files = [fixPath('dummy'), fixPath('noeol.txt')]

    testOther(files, {}, function (result) {
      expect(result).toMatch(/^Dummy\s+noEol/)

      files.splice(1)
      testOther(files, {}, function (result2) {
        expect(result2).toMatch(/^Dummy\s*$/)
        done()
      })
    })
  })

  it('jspp file can be a stream, if null, defaults to stdin', function (done) {

    process.stdin.push('foo')     // queue the data to output through stdin
    process.stdin.push(null)      // queue the EOF signal
    testOther(null, {}, function (result) {
      expect(result).toBe('foo')
      done()
    })
  })

  it('you can pipe jspp with the input stream', function (done) {
    var buff = '',
        stin = fs.createReadStream(fixPath('dummy.js')),
        stpp = jspp(null, {})

    stin.pipe(stpp)
      .on('data', function (chunk) {
        buff += chunk
      })
      .once('end', function () {
        expect(buff).toBe('Dummy\n')
        done()
      })
  })

  it('if the stream is not readable, jspp throws', function () {
    var Writable = require('stream').Writable

    expect(function () {
      testOther(new Writable(), {})
    }).toThrow()
  })
/*
  it('without an on("error") handler, jspp throws an exception', function (done) {
    var stpp = jspp(null, {buffer: '#if'})
  })
*/
})

// TODO: test with streams, e.g. pipe a file to stdin
