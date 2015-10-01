# Changelog for jspreproc

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
