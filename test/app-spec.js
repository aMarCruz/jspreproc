var jspp = require('../lib/preproc'),
    stream = require('stream'),
    path = require('path'),
    fs = require('fs')

function cat(file) {
  var f = path.join(__dirname, file)
  return fs.readFileSync(f, {encoding: 'utf8'})
}

function testStr(str, opts, callback) {
  var sout = new stream.PassThrough({encoding: 'utf8', decodeStrings: false}),
      text = []

  jspp(str, opts).pipe(sout)
    .on('data', function (chunk) {
      text.push(chunk)
    })
    .on('end', function () {
      callback(text = text.join(''))
    })
}

function testFile(file, opts, callback) {
  testStr(path.join('test', 'fixtures', file), opts, callback)
}


/*
  Comments Suite
*/
describe("Comments", function() {

  it('are preserved with -C all', function (done) {
    testFile('comments.js', {headers: '', comments: 'all'},
      function (result) {
        expect(result).toBe(cat('expect/comments_all.js'))
        done()
      })
  })

  it('are preserved for linters with -C filer -F all', function (done) {
    testFile('comments.js', {headers: '', comments: 'filter', filter: 'all', emptyLines: 0},
      function (result) {
        expect(result).toBe(cat('expect/comments_linters.js'))
        done()
      })
  })

})


/*
  #define Suite
*/
describe("#define", function() {
  var opts = {
    test: true,
    emptyLines: 0,
    headers: ''
  }

  it("evaluates the expression immediately", function (done) {

    testStr('//#define N1 1\n//#define $_N N1+2\n$_N', opts,
      function (result) {
        expect(result).toBe('3\n')
        done()
      })
  })

  it("concatenate strings", function (done) {

    testStr('//#define STR "a"\n//#define $_STR STR+"b"\n$_STR', opts,
      function (result) {
        expect(result).toBe('"ab"\n')
        done()
      })
  })

  it("preserve regexes", function (done) {

    testFile('define_regex.js', {headers: '', emptyLines: 0},
      function (result) {
        expect(result).toMatch(/(r=\/\^a'"b"\/g)\s*\1/)
        done()
      })
  })

})


/*
  include Suite
*/
describe('#include', function () {

  it('skip files included in removed blocks', function (done) {

    testFile('include1.js', {headers: '', undef: 'ONCE'},
      function (result) {
        // ONCE not defined, 3 dummy.js
        expect(result).toMatch("'dummy'")
        expect(result.match(/'dummy'/g).length).toBe(3)
        done()
      })
  })

  it('only 1 copy when include_once is seen', function (done) {

    testFile('include1.js', {headers: '', define: 'ONCE'},
      function (result) {
        // ONCE defined, only 1 dummy.js
        expect(result).toMatch("'dummy'")
        expect(result.match(/'dummy'/g).length).toBe(1)
        done()
      })
  })

})
