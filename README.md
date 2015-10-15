[![License][license-image]][license-url]
[![Build Status][build-image]][build-url]
[![npm Version][npm-image]][npm-url]
[![Downloads by Month][npm-dm-image]][npm-url]

# jspreproc

**Do you have this?**

```js
/**
 * The exposed tmpl function returns the template value from the cache, render with data.
 * @param   {string} str  - Expression or template with zero or more expressions
 * @param   {Object} data - For setting the context
 * @returns {*} Raw expression value or template to render
 * @private
 */
function _tmpl(str, data) {
  if (!str) return str  // catch falsy values here

  //#if DEBUG
  if (data && data._debug_) {
    data._debug_ = 0
    if (!_cache[str]) {
      _cache[str] = _create(str, 1)
      var rs = typeof riot === 'undefined' ?
        '(riot undefined)' : JSON.stringify(riot.settings)
      console.log('--- DEBUG' +
        '\n riot.settings: ' + rs + '\n data: ' + JSON.stringify(data))
      return _cache[str].call(data, logErr)
    }
  }
  //#endif

  // At this point, the expressions must have been parsed, it only remains to construct
  // the function (if it is not in the cache) and call it to replace expressions with
  // their values. data (`this`) is a Tag instance, logErr is the error handler.

  return (_cache[str] || (_cache[str] = _create(str))).call(data, logErr)  // eslint-disable-line no-unreachable
}
// end of _tmpl
```

**And want this?**

```js
function _tmpl(str, data) {
  if (!str) return str
  return (_cache[str] || (_cache[str] = _create(str))).call(data, GLOBAL, logErr)
}
```

Me too. This is why **jspreproc**, a tiny C-style source file preprocessor in JavaScript for JavaScript, with duplicate empty lines and comments remover.

Featuring many of the C preprocessor characteristics through JavaScript comments, jspreproc can be used in any source with a JavaScript-like syntax, even `C#` files with some limitations.

**IMPORTANT:**

This is work in progress, so please update jspreproc constantly, I hope that the first stable version does not take too long.
  
From version 0.2.1-beta.1 the location of jspp.js is the bin folder, and there's a new file jspp.cmd for Windows users can run jspp from the root folder of jspreproc, useful in local installations.

From version 0.2.0-beta.5 there's no default indentation for included files.

Version 0.2.0-beta is an important update, it has corrections to the implementation of the returned stream and the program logic. This allows for asynchronous use and freedom in handling errors with `stream.on("error")` code.

## Install

You can install jspreproc with npm globally to use as the CLI tool, or locally for your project.  
jspreproc works in node.js 0.10.0 or above (tested in Windows 7/8, cmd and bash shells).

### Command-line

```sh
npm -g install jspreproc
```
jspreproc name for command-line interface is `jspp`
```sh
jspp [options] file1 file2 ...
```

Multiple files are concatenated into one, as if it had passed a file with multiple `#include` directives, one for each of the files listed.

If you don't list files, jspreproc reads from the standard input.  
The output is written to standard output of the system, so it can be redirected.

Learn about the [options](doc/OPTIONS.md) in the documentation. 

### node.js

```sh
npm install jspreproc
```
```js
var jspp = require('jspreproc')
var stream = jspp(files, options)
```

Parameter `files` can be an file name, an array of file names, or an instance of a readable stream. Options is an object with the same options from command-line, but replace dashed options with camelCase properties: `eol-type` with `eolType`, and `empty-lines` with `emptyLines`.

jspp return value is a [`stream.PassThrough`](https://nodejs.org/api/stream.html#stream_class_stream_passthrough) instance.

There is a package for bower, too.

## Documentation

Read the [CHANGELOG](CHANGELOG.md) for recent additions and fixes, and the [OPTIONS](doc/OPTIONS.md) and [SYNTAX](doc/SYNTAX.md) guides in the `doc` folder (WIP).


**_Tip:_**

Clone the [jspreproc repository](from http://github.com/aMarCruz/jspreproc) and run `npm i && npm t`. You will find more usage examples in spec/app-spec.js

### Third-party tools & libraries

The following third-party tools and libraries are used by this project:

#### For regular use (dependencies installed by npm)

- [minimist][] by [substack][], for parsing argument options from the command line

#### Development and code quality (devDependencies)

- [Jasmine][] by [Pivotal Labs][pivotal-labs], my favorite testing framework, does not rely on other frameworks
- [jasmine-spec-reporter][spec-reporter] by [Bastien Caudan][Caudan], pretty console spec reporter for jasmine
- [istanbul][] by [Krishnan Anantheswaran][Anantheswaran], for generating coverage information

I'd like to thank all.

[minimist]: https://github.com/substack/minimist "parse argument options"
[substack]: http://substack.net/
[jasmine]:  http://jasmine.github.io/ "Jasmine, Behavior-Driven JavaScript"
[spec-reporter]: https://github.com/bcaudan/jasmine-spec-reporter
[istanbul]: https://gotwarlost.github.io/istanbul/ "a JS code coverage tool written in JS"
[Zakas]:    http://nczonline.net/
[Caudan]:   https://github.com/bcaudan
[Anantheswaran]: https://github.com/gotwarlost
[git4win]:       https://git-for-windows.github.io/ "The awesome Git SCM"
[code-climate]:  https://codeclimate.com/ "A better experience for creating software" 
[coverity-scan]: https://scan.coverity.com/
[pivotal-labs]:  https://www.pivotaltracker.com/

### Known Issues
process.stdout fails (so jspreproc too) on console emulators for Windows, e.g. [ConEmu](https://conemu.github.io/) and others, use clean Windows prompt or [MSYS](http://www.mingw.org/wiki/msys) with mintty.

### TODOs

Maybe some day...

- 100% coverage (almost done)
- Configuration from the file system. `.jspreproc.json`?
- jspreproc reconfiguration through comments
- `#emit`? for generating output of expression values
- Better documentation

_Please note: the documentation is very much a work in progress. Contributions are welcome._

---

[![Coverity Scan Build Status][coverity-image]][coverity-url]
[![Code Climate][climate-image]][climate-url]
[![Dependencies][depend-image]][depend-url]
[![Development Dependencies][devdep-image]][devdep-url]

[npm-image]:     https://badge.fury.io/js/jspreproc.svg
[npm-dm-image]:  https://img.shields.io/npm/dm/jspreproc.svg
[npm-url]:       https://www.npmjs.com/package/jspreproc
[build-image]:   https://travis-ci.org/aMarCruz/jspreproc.svg?branch=master
[build-url]:     https://travis-ci.org/aMarCruz/jspreproc
[climate-image]: https://codeclimate.com/github/aMarCruz/jspreproc/badges/gpa.svg
[climate-url]:   https://codeclimate.com/github/aMarCruz/jspreproc
[coverity-image]: https://img.shields.io/coverity/scan/6621.svg
[coverity-url]:   https://scan.coverity.com/projects/amarcruz-jspreproc 
[depend-image]:  https://david-dm.org/aMarCruz/jspreproc.svg
[depend-url]:    https://david-dm.org/aMarCruz/jspreproc
[devdep-image]:  https://david-dm.org/aMarCruz/jspreproc/dev-status.svg
[devdep-url]:    https://david-dm.org/aMarCruz/jspreproc#info=devDependencies
[license-image]: https://img.shields.io/npm/l/express.svg?style=flat-square
[license-url]:   https://github.com/aMarCruz/jspreproc/blob/master/LICENSE
