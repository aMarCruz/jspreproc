[![Build Status][build-image]][build-url]
[![Test Coverage][coverage-image]][coverage-url]
[![npm Version][npm-image]][npm-url]
[![Downloads by Month][npm-dm-image]][npm-url]
[![License][license-image]][license-url]

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
      _cache[str] = _create(str, 1)  // request debug output
      var rs = typeof riot === 'undefined' ?
        '(riot undefined)' : JSON.stringify(riot.settings)
      console.log('--- DEBUG' +
        '\n riot.settings: ' + rs + '\n data: ' + JSON.stringify(data))
    }
  }
  //#endif

  // At this point, the expressions must have been parsed, it only remains to construct
  // the function (if it is not in the cache) and call it to replace expressions with
  // their values. data (`this`) is a Tag instance, logErr is the error handler.

  return (_cache[str] || (_cache[str] = _create(str))).call(data, logErr)
}
// end of _tmpl
```

**And want this?**

```js
function _tmpl(str, data) {
  if (!str) return str
  return (_cache[str] || (_cache[str] = _create(str))).call(data, logErr)
}
```

Me too. This is why **jspreproc**, a tiny, C-Style source file preprocessor in JavaScript for JavaScript, with duplicate empty lines and comments remover.

Featuring many of the C preprocessor characteristics through JavaScript comments, jspreproc can be used in any source with a JavaScript-like syntax, even `C#` files with some limitations.

**Important:**

From version 0.2.1-beta.1 the location of jspp.js is the bin folder.

This is work in progress, so please update jspreproc constantly, I hope the first stable version does not take too long.
  

## Install

You can install jspreproc with npm globally to use as the CLI tool, or locally for your project.  
jspreproc works in node.js 0.10.0 or above (tested in Windows 7/8, cmd and sh shells).

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
The result is written to the standard output, so it can be redirected.

Find more about the [options](https://github.com/aMarCruz/jspreproc/blob/master/doc/options.md) in the documentation.

### node.js

```sh
npm install jspreproc
```
```js
var jspp = require('jspreproc')
var stream = jspp(files, options)
```

Parameter `files` can be an file name, an array of file names, or an instance of a readable stream. Options is an object with the same options from command-line.  
jspp return value is a [`stream.PassThrough`](https://nodejs.org/api/stream.html#stream_class_stream_passthrough) instance.

You can read about this [API](doc/API.md) in the documentation.

There is a package for bower, too.

## Documentation

This is a short example of basic syntax in files prepared for jspreproc:

```js
//#include globals.inc
//#set DEBUG = 1

//#ifdef DEBUG
console.log(result)
//#endif
```

Find more in the [Syntax guide](https://github.com/aMarCruz/jspreproc/blob/master/doc/syntax.md).

Read the [CHANGELOG](https://github.com/aMarCruz/jspreproc/blob/master/CHANGELOG.md) for recent additions and fixes.  
You can see jspreproc operation in [the tests](https://github.com/aMarCruz/jspreproc/blob/master/spec/app-spec.js).

_Please note: the documentation is very much a work in progress. Contributions are welcome._

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

### TODO

Maybe some day...

- [x] ~~100% coverage (almost done)~~
- [ ] Configuration from the file system. `.jspreproc.json`?
- [ ] jspreproc reconfiguration through comments
- [ ] `#emit`? for generating output of expression values
- [ ] Better documentation

---

[![Coverity Scan Build Status][coverity-image]][coverity-url]
[![Code Climate][climate-image]][climate-url]
[![Dependencies][depend-image]][depend-url]
[![Development Dependencies][devdep-image]][devdep-url]

[build-image]:    https://img.shields.io/travis/aMarCruz/jspreproc.svg
[build-url]:      https://travis-ci.org/aMarCruz/jspreproc
[npm-image]:      https://img.shields.io/npm/v/jspreproc.svg
[npm-dm-image]:   https://img.shields.io/npm/dm/jspreproc.svg
[npm-url]:        https://www.npmjs.com/package/jspreproc
[license-image]:  https://img.shields.io/npm/l/express.svg
[license-url]:    https://github.com/aMarCruz/jspreproc/blob/master/LICENSE
[coverage-image]: https://img.shields.io/codeclimate/coverage/github/aMarCruz/jspreproc.svg
[coverage-url]:   https://codeclimate.com/github/aMarCruz/jspreproc/coverage

[coverity-image]: https://scan.coverity.com/projects/6621/badge.svg?flat=1
[coverity-url]:   https://scan.coverity.com/projects/amarcruz-jspreproc 
[climate-image]:  https://codeclimate.com/github/aMarCruz/jspreproc/badges/gpa.svg
[climate-url]:    https://codeclimate.com/github/aMarCruz/jspreproc
[depend-image]:   https://david-dm.org/aMarCruz/jspreproc.svg
[depend-url]:     https://david-dm.org/aMarCruz/jspreproc
[devdep-image]:   https://david-dm.org/aMarCruz/jspreproc/dev-status.svg
[devdep-url]:     https://david-dm.org/aMarCruz/jspreproc#info=devDependencies
