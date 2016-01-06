/*
  You need uglify to run this test
  https://github.com/mishoo/UglifyJS2
*/
var uglify = require('uglify-js'),
    path   = require('path'),
    jspp   = require('../index')
var srcdir = path.join(__dirname, 'uglify')

var errCode = 0

compare('core.js')
compare('riot.js')
compare('vue.js')

process.on('exit', function (code) {
  code = code || errCode || 0
  if (!code)
    console.log('no errors.')
  process.exit(code)
})

function compare(fname) {
  var
      ffile = path.join(srcdir, fname),
      buff0 = ''

  jspp(ffile, {headers1: '', comments: 'none', varset: {NODE: 1}})
    .on('data', function (chunk) {
      buff0 += chunk
    })
    .on('error', function (e) {
      errCode = 1
      console.error('Testing "' + fname + '" : ' + e)
    })
    .on('end', function () {
      var buff1 = uglify.minify(buff0, {compress: true, fromString: true}).code,
          buff2 = uglify.minify(path.join(srcdir, fname), {compress: true}).code

      for (var i = 0; i < buff1.length; ++i) {
        if (buff1[i] !== buff2[i]) {
          errCode = 1
          console.error('Test on file "' + fname + '" failed at pos ' + i +
            '\njspp len: ' + buff1.length + ', uglify len: ' + buff2.length +
            '\n' + buff1.substr(i, 60) + '...')
          break
        }
      }
    })
}
