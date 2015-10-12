/**
 * Run the test for jspreproc with Jasmine and jasmine-spec-reporter.
 * In non-developer environment, outputs a message with instructions
 * on how to run the tests.
 */
var Jasmine = null,
    Jreport = null

try {
  Jasmine = require('jasmine')
  Jreport = require('jasmine-spec-reporter')
}
catch (e) {
  var msg = [
    '',
    '  Please clone the github repository of jspreproc to run the tests:',
    '',
    '    git clone https://github.com/aMarCruz/jspreproc.git',
    '    cd jspreproc && npm i && npm test',
    '',
    '  Thank you for using jspreproc.',
    ''
  ]
  console.log(msg.join('\n'))
}

if (Jasmine && Jreport) {

  var jasmine = new Jasmine()
  var path = require('path')

  jasmine.configureDefaultReporter({print: function () {}})
  jasmine.loadConfigFile(path.join(__dirname, 'support', 'jasmine.json'))
  jasmine.addReporter(new Jreport())
  jasmine.execute(process.argv.slice(2))

}
