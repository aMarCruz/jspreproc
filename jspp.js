#!/usr/bin/env node
/* eslint no-console: 0 */

var preproc = require('./lib/preproc'),
    Options = require('./lib/options'),
    defopts = Options.prototype.defaults

var argv = require('minimist')(process.argv.slice(2),
    {
      'alias':   {'define': 'D', 'comments': 'C', 'filter': 'F', 'version': 'V', 'help': 'h'},
      'string':  ['define', 'header1', 'headers', 'indent', 'eol-type', 'comments', 'filter'],
      'boolean': ['showme'],
      'default': {
        'header1':     defopts.header1,
        'headers':     defopts.headers,
        'indent':      defopts.indent,
        'eol-type':    defopts.eolType,
        'empty-lines': defopts.emptyLines,
        'comments':    defopts.comments
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
if (argv.showme) return showOpts(argv)

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
  var opt = new Options(argv)
  console.dir(argv._)
  console.dir(opt)
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
    '  Usage: \033[1mjspp\033[0m [options] [file...]',
    '',
    '    Tiny C-style source file preprocessor for JavaScript, with duplicate',
    '    empty lines and comments remover.',
    '',
    '    If no file name are given, jspp reads from the standard input.',
    ''
  ].join('\n'))
  console.log([
    '  Options:',
    '',
    '    -D, --define    add a define for use in expressions (e.g. -D NAME=value)',
    '                    type: string',
    '    --header1       text to insert before the top level file.',
    '                    type: string - default: ' + JSON.stringify(defopts.header1),
    '    --headers       text to insert before each file.',
    '                    type: string - default: ' + JSON.stringify(defopts.headers),
    '    --indent        indentation to add before each line of included files.',
    '                    The format matches the regex /^\\d+\s*[ts]/ (e.g. \'1t\'),',
    '                    where \'t\' means tabs and \'s\' spaces, default is spaces.',
    '                    Each level adds indentation.',
    '                    type: string - default: ' + JSON.stringify(defopts.indent),
    '    --eol-type      normalize end of lines to unix, win, or mac style',
    '                    type: string - default: ' + JSON.stringify(defopts.eolType),
    '    --empty-lines   how much empty lines keep in the output (-1: keep all)',
    '                    type: number - default: ' + JSON.stringify(defopts.emptyLines),
    '    -C, --comments  treatment of comments, one of:',
    '                    all: keep all, none: remove all, filter: apply filter',
    '                    type: string - default: ' + JSON.stringify(defopts.comments),
    '    -F, --filter    keep comments matching filter. "all" to apply all filters,',
    '                    or one or more of:',
    '                    ' + Object.keys(Options.prototype.filters).join(', '),
    '                    type: string - default: ["' + defopts.filter.join("', '") + '"]',
    '    -V, --version   print version to stdout and exits.',
    '    -h, --help      display this message.',
    '',
    '  Tip: use "^n" in the header1 and headers values to insert line feeds.',
    ''
  ].join('\n'))

  return 0
}
