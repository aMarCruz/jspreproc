#!/usr/bin/env node

var preproc = require('./lib/preproc'),
    options = require('./lib/options')

var argv = require('minimist')(process.argv.slice(2),
    {
      'alias':   {'define': 'D', 'comments': 'C', 'filter': 'F', 'version': 'V', 'help': 'h'},
      'string':  ['define', 'headers', 'eol-type', 'comments', 'filter'],
      'boolean': ['opt'],
      'default': {
        'headers':     options.headers,
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
  var filts = Object.keys(options._FILT).join(', ')

  console.log(
    '\nUsage: \033[1mjspp\033[0m [options] [file …]\n\n' +

    'Version: ' + require('./package.json').version + '\n\n' +

    'Concatenates one or more input files, outputting a single merged file.\n' +
    'Any include statements in the input files are expanded in-place to the\n' +
    'contents of the imported file. include statements for files already\n' +
    'included in a parent level are ignored (avoids recursion).\n\n' +

    'Valid names to define starts with one [$_A-Z] followed by one or more [_A-Z],\n' +
    'all uppercase, and are for use with #if-ifdef-ifndef-elif statements.\n' +
    'Predefined __FILE contains the relative name of the file being processed.\n\n' +

    'NOTE: There\'s a breaking change in v0.1.4-beta.1, following the C behavior,\n' +
    '      defined symbols are readonly now, you need undef first to change its\n' +
    '      value. The new, special keyword #set can do more than these defines.'
    )
  console.log([
    '-D, --define    add a define for use in expressions (e.g. -D NAME=value)',
    '                type: string',
    '--headers       text to insert before each file.',
    '                type: string - default: ' + JSON.stringify(options.headers),
    '--eol-type      normalize end of lines to "unix", "win", or "mac" style',
    '                type: string - default: ' + options.eolType,
    '--empty-lines   how much empty lines keep in the output (-1: keep all)',
    '                type: number - default: ' + options.emptyLines,
    '-C, --comments  treatment of comments, one of:',
    '                "all": keep all, "none": remove all, "filter": apply filter',
    '                type: string - default: ' + options.comments,
    '-F, --filter    keep comments matching filter. "all" to apply all filters, or',
    '                one or more of: ' + filts,
    '                type: string - default: [' + options.filter.join(', ') + ']',
    '-V, --version   output the version number.',
    '-h, --help      display this message'
    ].join('\n'))

  return 0
}
