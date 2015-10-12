[![License][license-image]][license-url]
[![Build Status][build-image]][build-url]
[![Coverity Scan Build Status][coverity-image]][coverity-url]
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
  if (!str) return str

  //#if DEBUG
  var fn = _cache[str]

  if (data && data._debug_) {
    if (!fn) fn = _create(str, 1)
    data._debug_ = 0
    var rs = typeof riot === 'undefined' ?
      '(riot undefined)' : JSON.stringify(riot.settings)
    console.error('--- DEBUG' +     // eslint-disable-line no-console
      '\n riot.settings: ' + rs + '\n data: ' + JSON.stringify(data))
  }
  else if (!fn)
    fn = _create(str)
  return fn.call(data, GLOBAL, logErr)
  //#endif

  // The expressions in the template were replaced with markers pointing to
  // functions in _cache.
  // Alone expressions, returns raw values, templates returns str with the
  // markers replaced with a string (empty for falsy values, except zero).
  // Shorthand list are evaluated by shList() and returns text, too.

  return (_cache[str] || (_cache[str] = _create(str))).call(data, GLOBAL, logErr)  // eslint-disable-line no-unreachable
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

Me too, so I write _**jspreproc**_, a tiny C-style source file preprocessor in JavaScript for JavaScript, with duplicate empty lines and comments remover.

**IMPORTANT:**
  
From version 0.2.1-beta.1 the location of jspp.js is the bin folder, and there's a new file jspp.cmd for Windows users can run jspp from the root folder of jspreproc, useful in local installations.

From version 0.2.0-beta.5 the default indentation for included files is none.

Version 0.2.0-beta is an important update, it has corrections to the implementation of the returned stream and the program logic. This allows for asynchronous use and freedom in handling errors with `stream.on("error")` code.

## Install

You can install jspreproc with npm globally to use as the CLI tool, or locally for your project.  
jspreproc works in node.js 0.10.0 or above (tested in Windows 7/8, cmd and bash shells).

### node.js

```sh
npm install jspreproc
```
```js
var jspp = require('jspreproc')
var stream = jspp(files, options)
```

Parameter files can be an array, options is an object with the same options from command-line, but replace dashed options with camelCase properties: `eol-type` with `eolType`, and `empty-lines` with `emptyLines`.  
jspp return value is a [`stream.PassThrough`](https://nodejs.org/api/stream.html#stream_class_stream_passthrough) instance.

There is a package for bower, too.

### Command-line

```sh
npm -g install jspreproc
```
jspreproc name for command-line interface is `jspp`
```sh
jspp [options] file1 file2 ...
```

## Documentation

Read the [CHANGELOG](CHANGELOG.md) for recent additions and fixes, and the [OPTIONS](doc/OPTIONS.md) and [SYNTAX](doc/SYNTAX.md) guides in the `doc` folder (WIP).


**_Tip:_**

Clone the [jspreproc repository](from http://github.com/aMarCruz/jspreproc) and run `npm i && npm t`. You will find more usage examples in spec/app-spec.js

### Known Issues
process.stdout fails (so jspreproc too) on console emulators for Windows, e.g. [ConEmu](https://conemu.github.io/) and others, use clean Windows prompt or [MSYS](http://www.mingw.org/wiki/msys) with mintty.

### TODOs

- Better docs and tests
- Read configuration values from the file system.

If you wish and have time, help me improving this page... English is not my best friend.

---

[![Code Climate][climate-image]][climate-url]

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
