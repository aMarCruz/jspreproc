#!/usr/bin/env node
/* eslint no-console: 0 */

var preproc = require('./lib/preproc'),
    options = require('./lib/options')

var argv = require('minimist')(process.argv.slice(2),
    {
      'alias':   {'define': 'D', 'comments': 'C', 'filter': 'F', 'version': 'V', 'help': 'h'},
      'string':  ['define', 'header1', 'headers', 'indent', 'eol-type', 'comments', 'filter'],
      'boolean': ['opt'],
      'default': {
        'header1':     options.header1,
        'headers':     options.headers,
        'indent':      options.indent,
        'eol-type':    options.eolType,
        'empty-lines': options.emptyLines,
        'comments':    options.comments
      },
      'unknown': function (opt) {
        if (opt[0] === '-' && opt !== '--empty-lines') {
          console.error('warning: unknown option "%s"', opt)
          return false
        }
      }
    })

if (argv.V) return showVersion()
if (argv.h) return showHelp()

Object.keys(argv).forEach(function (k) {
  if (~k.indexOf('-')) {
    var s = k.replace(/-[^\-]/, function (c) { return c[1].toUpperCase() })
    argv[s] = argv[k]
    delete argv[k]
  }
})
if (argv.opt) return showOpts(argv)

preproc(argv._, argv).pipe(process.stdout)

/*
 * Wait for the stdout buffer to drain.
 * The CLI object should *not* call process.exit() directly. It should only return
 * exit codes. This allows other programs to use the CLI object and still control
 * when the program exits.
 */
process.on('exit', function (code) {
  process.exit(code | 0)
})

function showOpts(argv) {
  console.dir(argv._)
  console.dir(options.merge(argv))
  return 1
}

/*
 * Send version to the output and exit
 */
function showVersion() {
  process.stdout.write(require('./package.json').version)
  return 0
}

/*
 * Displays version and usage
 */
function showHelp() {
  console.log([
    '',
    'Usage: \033[1mjspp\033[0m [options] [file …]' +
    '',
    'Version: ' + require('./package.json').version,
    '',
    'Concatenates one or more input files, outputting a single merged file.',
    'Any include statements in the input files are expanded in-place to the',
    'contents of the imported file. include statements for files already',
    'included in a parent level are ignored (avoids recursion).',
    '',
    'Valid names to define starts with one [$_A-Z] followed by one or more [_A-Z],',
    'all uppercase, and are for use with #if-ifdef-ifndef-elif statements.',
    'Predefined __FILE contains the relative name of the file being processed.',
    ''
  ].join('\n'))
  console.log([
    '-D, --define    add a define for use in expressions (e.g. -D NAME=value)',
    '                type: string',
    '--header1       text to insert before the top level file.',
    '                type: string - default: ' + JSON.stringify(options.header1),
    '--headers       text to insert before each file.',
    '                type: string - default: ' + JSON.stringify(options.headers),
    '--indent        indentation to add before each line of included files.',
    '                The format matches the regex /^\\d+\s*[ts]/ (e.g. \'1t\'),',
    '                where \'t\' means tabs and \'s\' spaces, default is spaces.',
    '                Each level adds indentation.',
    '                type: string - default: ' + JSON.stringify(options.indent),
    '--eol-type      normalize end of lines to unix, win, or mac style',
    '                type: string - default: ' + JSON.stringify(options.eolType),
    '--empty-lines   how much empty lines keep in the output (-1: keep all)',
    '                type: number - default: ' + JSON.stringify(options.emptyLines),
    '-C, --comments  treatment of comments, one of:',
    '                all: keep all, none: remove all, filter: apply filter',
    '                type: string - default: ' + JSON.stringify(options.comments),
    '-F, --filter    keep comments matching filter. "all" to apply all filters,',
    '                or one or more of:',
    '                ' + Object.keys(options._FILT).join(', '),
    '                type: string - default: ["' + options.filter.join("', '") + '"]',
    '-V, --version   print version to stdout and exits.',
    '-h, --help      display this message.'
  ].join('\n'))

  return 0
}
