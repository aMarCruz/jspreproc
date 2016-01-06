#!/usr/bin/env node

// Comand-Line Interface
// =====================
/* eslint no-console: 0, quote-props: 0 */
'use strict'  // eslint-disable-line

var jspp     = require('../'),
    Options  = require('../lib/options')
var defaults = Options.defaults

var argv = require('minimist')(process.argv.slice(2),
    {
      alias: {
        set:     ['D', 'define'],
        comments: 'C',
        filter:   'F',
        version:  'V',
        help:     'h'
      },
      string: [
        'set',
        'header1',
        'headers',
        'indent',
        'eol-type',
        'comments',
        'filter',
        'custom-filter'
      ],
      boolean: ['showme'],
      default: {
        'header1':     defaults.header1,
        'headers':     defaults.headers,
        'indent':      defaults.indent,
        'eol-type':    defaults.eolType,
        'empty-lines': defaults.emptyLines,
        'comments':    defaults.comments
      },
      unknown: function (opt) {
        if (opt[0] === '-' && opt !== '--empty-lines') {
          console.error('warning: unknown option "%s"', opt)
          return false
        }
      }
    })

if (argv.V) {
  showVersion()
}
else if (argv.h) {
  showHelp()
}
else {
  Object.keys(argv).forEach(function (k) {
    if (~k.indexOf('-')) {
      var s = k.replace(/-[^\-]/, function (c) { return c[1].toUpperCase() })
      argv[s] = argv[k]
      delete argv[k]
    }
  })
  if (argv.showme)
    showOpts(argv)
  else
    jspp(argv._, argv).pipe(process.stdout)
}

/*
 * Wait for the stdout buffer to drain.
 * The CLI object should *not* call process.exit() directly. It should only return
 * exit codes. This allows other programs to use the CLI object and still control
 * when the program exits.
 */
process.on('exit', function (code) {
  process.exit(code | 0)
})

function showOpts(args) {
  var opt = new Options(args)
  console.dir(args._)
  console.dir(opt)
}

/*
 * Send version to the output and exit
 */
function showVersion() {
  process.stdout.write(jspp.version)
}

/*
 * Displays version and usage
 */
function showHelp() {
  var hlp = [
    '',
    '  Usage: \x1B[1mjspp\x1B[0m [options] [file...]',
    '',
    '    Tiny C-style source file preprocessor for JavaScript, with duplicate',
    '    empty lines and comments remover.',
    '',
    '    If no file name are given, jspp reads from the standard input.',
    '',
    '  Options:',
    '',
    '    -D, --set       add a variable for use in expressions (e.g. -D NAME=value)',
    '                    type: string - e.g. -D "MODULE=1"',
    '    --header1       text to insert before the top level file.',
    '                    type: string - default: ' + JSON.stringify(defaults.header1),
    '    --headers       text to insert before each included file.',
    '                    type: string - default: ' + JSON.stringify(defaults.headers),
    '    --indent        indentation to add before each line of the included files.',
    '                    The format matches the regex /^\\d+\\s*[ts]?/, e.g. "1t", ',
    '                    where \'t\' means tabs and \'s\' spaces, default is spaces.',
    '                    Each level adds indentation.',
    '                    type: string - default: ' + JSON.stringify(defaults.indent),
    '    --eol-type      normalize end of lines to "unix", "win", or "mac" style',
    '                    type: string - default: ' + JSON.stringify(defaults.eolType),
    '    --empty-lines   how much empty lines keep in the output (-1: keep all)',
    '                    type: number - default: ' + JSON.stringify(defaults.emptyLines),
    '    -C, --comments  treatment of the comments, one of:',
    '                    "all": keep all, "none": remove all, "filter": apply filter',
    '                    type: string - default: ' + JSON.stringify(defaults.comments),
    '    -F, --filter    keep comments matching filter. "all" to apply all filters,',
    '                    or one or more of:',
    '                    ' + Object.keys(Options.filters).join(', '),
    '    --custom-filter string for create a regex as custom filter to apply with',
    '                    regex.test(). must return true to keep the comment.',
    '                    type: string - e.g. --custom-filter "\\\\\* @module"',
    '    -V, --version   print version to stdout and exits.',
    '    -h, --help      display this message.',
    '',
    '  Tips:',
    '    Use "^n" in the header1 and headers option values to insert line feeds.',
    '    You can preprocess files other than JavaScript using --comments all.',
    '',
    '',
    '  Clone the jspreproc repository at https://github.com/aMarCruz/jspreproc.git',
    '  run `npm i && npm t`, and find examples of use in spec/app-spec.js',
    ''
  ]
  console.log(hlp.join('\n'))
}
