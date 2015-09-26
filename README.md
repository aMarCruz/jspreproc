[![npm version](https://badge.fury.io/js/jspreproc.svg)](http://badge.fury.io/js/jspreproc)

# jspreproc
A tiny C-style source file preprocessor in JavaScript for JavaScript, with duplicate empty lines and comments remover.

## Install
```sh
npm install jspreproc
```
jspreproc is for node.js 10.x or above.

### Command-line
jspreproc name for command-line interface is `jspp`
```sh
jspp [options] file1 file2 ...
```
options | description
-------|------------
-D, --define  | add a define for use in expressions (e.g. -D NAME=value)<br>type: string
--headers     | text to insert before each file.<br> type: string - default: `'\n//// __FILE\n\n'`
--eol-type    | normalize end of lines to "unix", "win", or "mac" style<br> type: string - default: `unix`
--empty-lines | how much empty lines keep in the output (-1: keep all)<br> type: number - default: `1`
-C, --comments| treatment of comments, one of:<br> "all": keep all, "none": remove all, "filter": apply filter<br> type: string - default: `filter`
-F, --filter  | keep comments matching filter. "all" to apply all filters,<br>or one or more of: license, jsdoc, jslint, jshint, eslint<br> type: string - default: `[license]`
-V, --version | print version to stdout and exit.
-h, --help | display a short help
Example:
```sh
jspp -D DEBUG --filter jsdoc lib/myfile > tmp/myfile.js
```

### node.js
```js
var jspp = require('jspreproc')
var stream = jspp(files, options)
```
Parameter files can be an array, options is an object with the same options from command-line, but replace dashed options with camelCase properties: `eol-type` with `eolType`, and `empty-lines` with `emptyLines`.
jspp return value is a [`stream.PassThrough`](https://nodejs.org/api/stream.html#stream_class_stream_passthrough) instance.

Example:
```js
jspp('file1', {define:'NDEBUG', emptyLines: 0}).pipe(process.stdout)
```

## C-Style Preprocessor Keywords

jspreproc follows the C preprocessor style, with the same keywords, preceded by `//`

### Conditional Comments

Conditional Comments allows remove unused parts and build different versions of your application.

* Keep CC in their own line, with no other tokens (only single-line comment).
* CC keywords are case sensitive and must begin at the start of the comment.
* Only spaces and tabs are allowed between the CC parts.

```js
//#if expression
//#elif __expression__
```
If the expression evaluates to falsy, the block following the statement is removed.

```js
//#ifdef NAME
//#ifndef NAME
```
Test the existence of a defined symbol.
These are shorthands for `#if defined(NAME)` and `#if !defined(NAME)`.

```js
//#else
//#endif
```
Default block and closing statements.

### Defines

```js
//#define NAME value  // value defaults to 1
//#undef NAME
```
Once defined, the symbol is global to all files and their value can be changed at any time.
Valid names for defines are all uppercase, starts with one character in the range `[$_A-Z]`, followed by one or more of `[_A-Z]`, so minimum length is 2.

You can't use defined symbols as the value in a new definition, only literal primitive constant values (this is in TODO).
e.g. `#define FOO "1"` is ok, `#define BAR FOO` will generate error.

Unlike in C, redefining a symbol changes their value, does not generates error.

jspreproc does not supports function-like macros, nor macro expansion out of if-elif expressions.

### Includes

```js
//#include filename
//#include_once filename
```
This statements inserts the content of another file. `filename` can be an absolute file name, or relative to the current file. Default extension is `.js`.

You can include the same file multiple times in the current file, but the statement is ignored if the same file was processed or included in a preceding level (avoids recursion).
Use `include_once` to include only one copy by process.

## Examples

```js
//#if DEF == 1    // you can use single-line comments after the expression
  console.log('only preserved if DEF is 1')
//#endif
```
```js
//# if (DEF)      // you can insert spaces between `#` and the keyword
  //# if FOO      // ...but not between the `//` and `#`
  //# endif       // indented conditional comments are recognized
//# else
//#   if BAR
//#   endif
//# endif
```
```js
//#if defined(DEF1) || defined(DEF2)  // defined() is supported
  console.log('DEF 1 or 2 defined')
//#elif defined(DEF3)
  console.log('DEF 3 defined')
//#endif
```
```js
//#if DEBUG             // returns false if DEBUG is falsy or not defined
  console.log('info')
//#endif
```

**Defines**
```js
//#define FOO "one"
//#define BAR 2
//#define DEBUG         // DEBUG value is 1
//#define FOO (1+2)     // redefine FOO
```

**Includes**
```js
//#include myfile       // myfile.js in the same folder of current file
//#include_once ../myone
//#include myfile       // ok to insert again
//#include ../myone.js  // ignored
```

### Known Issues
process.stdout fails (so jspreproc too) on console emulators for Windows, e.g. [ConEmu](https://conemu.github.io/) and others, use clean Windows prompt or [MSYS](http://www.mingw.org/wiki/msys) with mintty.

### TODO
Support for using defined symbols in a new definition.

Docs and tests.

If you wish and have time, help me improving this page... English is not my best friend.
