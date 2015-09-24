/*
  TODO: Add mocha test, compare final output of core.js with uglifyjs
*/
var jspp = require('../jspreproc')
    opts = {}

opts.emptyLines = 0

testIt('test/include1.js', opts, function (data) {
  // no INC defined, 1 defines.js
  var match = data.match(/FOO def/g)
  if (!match || match.length !== 2)
    console.log('don\'t pass #1')
  else
    console.log('#1 pass')
})

return 0

function testIt(file, opts, cb) {
  var buffer = []

  jspp(file, opts)
    .on('data', function (data) {
    //console.log('** on data with ' + data)
      buffer.push(data)
    })
    .on('end', function () {
      cb(buffer.join(''))
    })
}
