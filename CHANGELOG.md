# Changelog for jspreproc

#### Version 0.2.5 - 2015-12-02
- Fix: a regex after the `return` keyword is mistaken for a division operator
- Enhancement: Most parser error messages include the source file name.

#### Version 0.2.4 - 2015-10-28
- Enhancement: Experimental #indent directive (will be #pragma indent)

#### Version 0.2.3 - 2015-10-20
- Fixes a bug replacing text that looks like jspp vars in quoted strings and regexes
- Don't enclose headers in quotes, this is already a javascript string
- First release with 100% coverage (by istanbul)
- Makefile & travis.yml rewrite

#### Version 0.2.2 - 2015-10-16
- First release with 98% coverage (by istanbul)
- Updated readme and documentation
- Fixed changelog

#### Version 0.2.2 beta 1 - 2015-10-15
- Deprecated #define and #undef in favor of #set and #unset
- More refactorization of tests
- Enhancement: support for Date objects

#### Version 0.2.1 beta 3 - 2015-10-14
- Many fixes and refactorization of tests
- Preparation for coverage reports
- Enhancement: Added the istanbul filter

#### Version 0.2.1 beta 2 - 2015-10-11
- Fix to the options module

#### Version 0.2.1 beta 1 - 2015-10-11
- Revision of package.json
- Changed the location of jspp.js to the bin folder
- New jspp.cmd for Windows user, local installation
- Fix: missing doc folder
- Fix: `npm test` is generating error

#### Version 0.2.0 beta 6 - 2015-10-11
Major code refactorization and more tests!
- Fix: Code is mixed in the same line with files not ending with EOL
- Fix: some escaped characters are not preserved
- Fix: empty lines counter working almost perfect :)
- Changed behavior: default indentation for included files is none

#### Version 0.2.0 beta 5 - 2015-10-10
- Fix: substitution for '^' not working in headers

#### Version 0.2.0 beta 4 - 2015-10-10
- Minor fix to README.md

#### Version 0.2.0 beta 3 - 2015-10-10
- Fix: input stream (pipe) generates TypeError
- Changes to documentation, I can take no much time on this

#### Version 0.2.0 beta 1 - 2015-10-09
Important upgrade:
Corrections to the implementation of the stream returned and the program logic. This allows for asynchronous use and freedom in handling errors.
- Fix: probable memory leaks
- Fix: custom filters are active without using the --filter option
- Fix: error catching in tests working now

#### Version 0.1.5 beta 4 - 2015-10-08 (unpublished)
- Enhancement: added --custom-filters for command-line, customFilters for API
- Fix? error catching in tests
- Fix: character '^' not replaced in headers

#### Version 0.1.5 beta 3 - 2015-10-07
- Fix: detection of keyword in correct place doesn't works sometimes
- Enhancement: added detection of unclosed blocks

#### Version 0.1.5 beta 2 - 2015-10-01
- Fix: regex for defines not trimming names
- Fix: empty lines counter is even more precise

#### Version 0.1.5 beta 1 - 2015-10-01
- Fix: empty lines counter is more precise now
- Fix: process.on calling multiple times
- Enhancement: code refactorization, more debug-friendly
- Enhancement: use `^n` in the `header1` and `headers` values to insert line feeds
- Enhancement: more clear output with the `-h` option
- Added custom filters in TODO
- More tests
- Updated readme

#### Version 0.1.4 beta 4 - 2015-09-29
- jasmine directory changed to spec
- format with eslint rules

#### Version 0.1.4 beta 3 - 2015-09-29
- Fix: `path.isAbsolute` does not exists in node 0.10, removed.

#### Version 0.1.4 beta 2 - 2015-09-28
- Enhancement: `header1` option, for setting the header of the top level file.
- Enhancement: `indent` option, adds indentation to included files.
- Fix: Incorrect value for `__FILE` - Delay evaluation if expression contains `__FILE`

#### Version 0.1.4 beta 1 - 2015-09-28
- First tests with Jasmine (http://jasmine.github.io/)
- Defines can include other defines, with immediate evaluation
- Use of the prefix '$_' for replacement of defined symbols in the entire file.
- Added "jscs" to comment filters (http://jscs.info/)
- Added "titles" to comment filters, for markdown titles ('#' markers only)
- Fix: "jsdocs" filter for comments renamed to "jsdoc"
- Updated README

#### Version 0.1.3 beta 3 - 2015-09-25
- Updated README
- Fix: "jsdocs" filter for comments renamed to "jsdoc"

#### Version 0.1.3 beta 2 - 2015-09-24
- Fix: include_once is lost with further includes

#### Version 0.1.3 beta 1 - 2015-09-24
- Updated readme file
- Minor improvement to main regex.

#### Version 0.1.3 beta 0 - 2015-09-24
First public release almost ready for production.
- Fix: filename is restored returning from an included file.

#### Version 0.1.2 - 2015-09-24
- Fix: include_once ignore already included files with the "include" keyword.
- Fix: separator normalization in __FILE
- Set minimist as dependency

#### Version 0.1.1 - 2015-09-23
First public release
- Support for (almost) full C-like preprocessor keywords.
- Comment filters for linters

#### Version 0.1.0-beta - 2015-08-21
- Added very basic conditional compilation
