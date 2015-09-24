# jspreproc
A JavaScript source file preprocessor in pure JavaScript, with duplicate empty lines and comments remover.

Build different versions of a library.

## Install
```bash
npm install jspreproc
```

### Command-line
```bash
jspp [options] file1 file2 ...
```
option | description
-------|------------
-D,<br>--define  | add a define for use in expressions (e.g. -D NAME=value)<br>type: string
--headers     | text to insert before each file.<br> type: string - default: `'\n//// __FILE\n\n'`
--eol-type    | normalize end of lines to "unix", "win", or "mac" style<br> type: string - default: `unix`
--empty-lines | how much empty lines keep in the output (-1: keep all)<br> type: number - default: `1`
-C,<br>--comments| treatment of comments, one of:<br> "all": keep all, "none": remove all, "filter": apply filter<br> type: string - default: `filter`
-F,<br>--filter  | keep comments matching filter. "all" to apply all filters, or<br> one or more of: license, jsdocs, jslint, jshint, eslint<br> type: string - default: `[license]`
-v,<br>--version | print version to stdout.
-h,<br>--help | display a short help
Example:
```
jspp -D DEBUG --filter jsdoc lib/myfile > tmp/myfile.js
```

### node.js
```js
var jspp = require('jspreproc')
var stream = jspp(files, options)
```
Parameter files can be an array, options is an object with the same options from command-line, but replace `eol-type` with `eolType`, and `empty-lines` with `emptyLines`. e.g.
```js
jspp('file1', { emptyLines: 0 }).pipe(process.stdout)
```
the return value of jspp() is a `stream.PassThrough` instance.

## Conditional Comments (CC)

Conditional Comments allows remove unused parts of your application.

* Keep CC in their own line, with no other tokens (only single-line comment).
* CC keywords are case sensitive and must begin at the start of the comment.
* Only spaces and tabs are allowed between the CC parts.

### Keywords

CC follows the C preprocessor style, with the same keywords, preceded by `//`

```js
//#if expression
//#elif __expression__

```
If the expression evaluates to falsy value, code following the statement is removed.

```js
//#ifdef NAME
//#ifndef NAME

```
Test the existence of a defined name.
These are a shorthands for `#if defined(NAME)` and `#if !defined(NAME)`.

```js
//#else
```

```js
//#endif
```
Closes a conditional block.

```js
//#define NAME value  // value defaults to 1
//#undef NAME
```
DEFINEs are global to all processed files.
Valid names for defines are all uppercase, starts with one [$_A-Z] character, followed by one or more [_A-Z], so minimum length is 2.
`__FILE` is the only predefined value. This is the name of the current file, relative to the current working directory, with separators in unix style (`/`).
You can't use nested defines in values.

```js
//#include filename
//#include_once filename
```
This statements includes the content of another file. `filename` can be an absolute name, or relative to the current file. Default extension is `.js`
You can include the same file multiple times in the current file, but the statement is ignored if the same file was processed or included in a higher level (avoids recursion).
Use `include_once` to include only one copy by process.

## Examples

```js
//#if DEF == 1
  console.log('only preserved if DEF is 1')
//#endif
```
```js
//# if (DEF)      // can have spaces between `#` and the keyword
  //# if FOO      // ...but not between the `//` and `#`
  //# endif
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
//#if DEBUG         // returns false if DEBUG is falsy or not defined
  console.log('info')
//#endif
```
#### Defines
```js
//#define FOO 1
//#define BAR 2
//#define DEBUG      // DEBUG value is 1
//#define FOO (1+2)  // redefine FOO
```
#### Includes
```js
//#include myfile    // myfile.js in the same folder of current file
//#include_once ../myone
//#include myfile    // ok to insert again
//#include ../myone  // ignored
```
### END
If you have time, please help me improving this page... English is not my best friend.
