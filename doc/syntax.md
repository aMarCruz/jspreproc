# Syntax Guide

jspreproc follows the C preprocessor style, with almost all the same keywords, preceded by `//`  
However, there are some differences.

## C-Style Preprocessor Keywords

Differences from the C preprocessor:

- jspreproc does not supports function-like macros or macro-substitution on the source files, out of expressions<sub>(1)</sub>
- Escaped characters remains literals, e.g. the `\n` sequence not generate end of line, it is written to the output as the string "\n"
- Redefining a symbol changes their value, does not generates error. This is why `#define` is deprecated in favor of `#set`
- The evaluation of expressions by `#set/#if/#endif` is through a Function instance, so the result is the same from a JavaScript expression, in the global scope.

<sup>(1)</sup> See [Defines](#defines) for some exceptions.  

For jspreproc recognize the directives, keep them in its own line, with no other tokens except single-line comments following the directive. Only spaces and tabs are allowed before the starting `//#`, and between this and the keyword.

jspreproc keywords are case sensitive.

So, this is valid:
```js
//#  if FOO
  //#if FOO
```

But this is incorrect:
```js
//  #if FOO             // <-- invalid separation between "//" and "#"
//#If FOO               // <-- case-sensitive "If" is not "if"
```

If the sequence of directives are malformed, as the unclosed blocks in the above examples, jspreproc emits an error event on the output stream.

## Variable Symbols

These are similar to C preprocessor `#define`'s, but its behavior is the same as JavaScript variables.

**`//#set SYMBOL`**  
**`//#set SYMBOL [=] expression`**

The sign `=` before the expression is optional, default value for expression is 1.  
Once defined, the symbol is global to all files and its value can be changed at any time.

Valid names are all uppercase, starts with one character in the range `[$_A-Z]`, followed by one or more of `[0-9_A-Z]`, so minimum length is 2.

`__FILE` is the only predefined symbol, contains the relative name of the file being processed.

You can use existing symbols in a new definition. First, any symbols (`__FILE` inclusive) are replaced with its current value, or zero for nonexistent symbols. Last, the expression is evaluated and its result assigned.

jspreproc supports, in experimental fashion, macro-expansion in the source file for names beginning with `$_`, followed by one or more characters in `[0-9_A-Z]`, so their minimum length is 3. The replacement is a literal substitution with `String.prototype.replace` and the raw value of the symbol at the time of replacement.

This is an example of the process:

```js
//#set $_FOO 'fo'+'o'         // $_FOO is evaluated to 'foo'
//#set $_BAR "bar"            // $_BAR is evaluated to 'bar'
//#set $_BAZ $_FOO + $_BAR    // evaluates to 'foobar'
//#unset $_FOO                // dees not affect $_BAZ
//#set $_BAR "?"              // $_BAZ remains the same
console.log($_BAZ)            // outputs "foobar"
```

**`//#unset SYMBOL`**

Removes a previously defined symbol.

## Conditional Comments (CC)

Conditional Comments allows remove unused parts and build different versions of your application.

**`//#if expression`**  
**`//#elif expression`**

If the expression evaluates to falsy, the block following the statement is removed.  
jspreproc supports the function `defined(SYMBOL)`, wich returns 1 if `SYMBOL` was defined, even when this has the `undefined` _value_ :)

**`//#ifdef SYMBOL`**  
**`//#ifndef SYMBOL`**

Test the existence of a defined symbol.  
These are shorthands for `#if defined(SYMBOL)` and `#if !defined(SYMBOL)`.

**`//#else`**  
**`//#endif`**

These are the default block and closing statement keywords.

### Includes

**`//#include filename`**  
**`//#include_once filename`**

These statements inserts the content of another file. `filename` can be an absolute file name, or relative to the current file. Default extension is `.js`.

You can include the same file multiple times in the current file, but the statement is ignored if the same file was processed or included in a preceding level (avoids recursion).

jspreproc does not cache the file, it is readed from the file system and preprocessed before each insertion.

Use `include_once` to limit the inclussion to one copy by _mainstream_.

## Examples

```js
//#if DEF == 1          // you can use single-line comments after the expression
  console.log('only preserved if DEF is 1')
//#endif
```

```js
//# if (DEF)            // you can insert spaces between `#` and the keyword
  //# if FOO            // ...but not between the `//` and `#`
  //# endif             // indented conditional comments are recognized
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
//#if DEBUG             // 0 if DEBUG is not defined
  console.log('info')
//#endif
```

Some variable assignments

```js
//#set FOO = "one"      // you can use the equal sign
//#set DEBUG            // DEBUG value is 1
//#set THREE (1+2)      // THREE value is 3
//#set TODAY new Date() // Date instances are preserved
//#set REGEX /^$/       // so RegExp
//#set TRUE  !0         // and boolean
```

Using variable symbols in the source code

```js
//#set $_NAME = 1       // must begin with '$_'
var foo = $_NAME + 1    // foo = 2

//#set $_NAME 'foo'     // change defined value
var bar = $_NAME        // bar = "foo"

//#set $_NAME 'foo'+'bar'   // concatenation
var baz = $_NAME            // baz = "foobar"

//#set $_NAME /^a/          // define a regex
var a = $_NAME.test('a')    // a = /^a/.test('a')

//#unset $_NAME         // delete $_NAME
var x = $_NAME          // SyntaxError
```

Effects of immediate evaluation

```js
//#set $_FOO 'foo'          // value defaults to 1
//#set $_BAR NAME + 'bar'   // OTHER value is 'foobar'
//#set $_FOO 'baz'
console.log('%s %s', $_FOO, $_BAR)  // prints 'baz foobar'
//#unset $_FOO
console.log('%s %s', $_FOO, $_BAR)  // SyntaxError
```

```js
// Next assignment sets FILE to the name of the *current* file
//#set FILE '__FILE'

// From now on, although the file being processed change, the value of
// FILE remains the same. You need reassign FILE to update their value.
```

**Fail safe #define**

Even without run jspreproc on file2.js, next code will work:

```js
// file1.js
//#define $_NAME 1
```

```js
// file2.js
//#include file1

//#ifndef $_NAME
var $_NAME = 1;
//#endif

console.log($_NAME);    // prints '1'
```

Including files

```js
//#include myfile           // myfile.js in the same folder of current file
//#include_once ../myone    // one copy only
//#include myfile           // ok to insert again
//#include ../myone.js      // ignored
```

Quotes are optional, except if the filename include spaces

```js
//#include "file1"
//#include 'file2'
//#include "other file"     // quotes are required
```
