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
catch (e) { /**/ }

if (Jasmine && Jreport) {

  var jasmine = new Jasmine(),
      jreport = new Jreport()

  //jasmine.configureDefaultReporter({print: function () {}})
  jasmine.loadConfigFile('spec/support/jasmine.json')
  jasmine.addReporter(jreport)
  jasmine.execute(process.argv.slice(2))

}
else {

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
