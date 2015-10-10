## C-Style Preprocessor Keywords

jspreproc follows the C preprocessor style, with the same keywords, preceded by `//`

### Conditional Comments

Conditional Comments allows remove unused parts and build different versions of your application.

* Keep CC in their own line, with no other tokens (only single-line comment).
* CC keywords are case sensitive and must begin at the start of the comment.
* Only spaces and tabs are allowed between the CC parts.

**`//#if expression`**  
**`//#elif expression`**

If the expression evaluates to falsy, the block following the statement is removed.

**`//#ifdef SYMBOL`**  
**`//#ifndef SYMBOL`**

Test the existence of a defined symbol.  
These are shorthands for `#if defined(SYMBOL)` and `#if !defined(SYMBOL)`.

**`//#else`**  
**`//#endif`**

Default block and closing statements.

### Defines

**`//#define SYMBOL`**  
**`//#define SYMBOL expression`**  
**`//#undef SYMBOL`**

Default value for new symbols is 1. In expressions, undefined symbols are replaced with 0.

Once defined, the symbol is global to all files and their value can be changed at any time.
Valid names for defines are all uppercase, starts with one character in the range `[$_A-Z]`, followed by one or more of `[0-9_A-Z]`, so minimum length is 2.

You can use defined symbols in a new definition. The symbols in the expression are replaced with their values and then the expression in immediately evaluated to a literal constant value and it is assigned to the symbol.
This behavior includes predefined symbol `__FILE`, which is replaced by the file name at the time of the evaluation.

This is an example of the process:

```js
//#define $_FOO 'fo'+'o'        // $_FOO is evaluated to 'foo'
//#define $_BAR "bar"           // $_BAR is evaluated to 'bar'
//#define $_BAZ $_FOO + $_BAR   // replaces $_FOO and $_BAR, and the result...
                                //   'foo'+'bar' is evaluates to 'foobar'
console.log($_BAZ)              // outputs foobar
```

Unlike the C preprocessor behavior, redefining a symbol changes their value, does not generates error.

**NOTE:**
jspreproc does not supports function-like macros, nor macro expansion out of `#if-elif` expressions, except for symbols beginning with '`$_`' followed by one or more characters in `[0-9_A-Z]`, that can be used for replacement in the file being processed (new in 0.1.4-beta).

### Includes

**`//#include filename`**  
**`//#include_once filename`**

These statements inserts the content of another file. `filename` can be an absolute file name, or relative to the current file. Default extension is `.js`.

You can include the same file multiple times in the current file, but the statement is ignored if the same file was processed or included in a preceding level (avoids recursion).

jspreproc does not cache the file, it is readed from the file system and preprocessed before each insertion.

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

Using const-like symbols in the source code:

```js
//#define $_NAME 1              // must begin with '$_'
var foo = $_NAME + 1            // foo is 2

//#define $_NAME 'foo'          // change defined value
var bar = $_NAME                // bar is 'foo'

//#define $_NAME 'foo' + 'bar'  // concatenation
var baz = $_NAME                // baz is 'foobar'

//#define $_NAME /^a/           // define a regex
var a = $_NAME.test('a')        // a is true

//#undef $_NAME                 // delete $_NAME
var x = $_NAME                  // SyntaxError
```

Effects of immediate evaluation:

```js
//#define $_FOO 'foo'           // value defaults to 1
//#define $_BAR NAME + 'bar'    // OTHER value is 'foobar'
//#define $_FOO 'baz'
console.log('%s %s', $_FOO, $_BAR) // prints 'baz foobar'
//#undef $_FOO
console.log('%s %s', $_FOO, $_BAR) // SyntaxError
```
```js
// Next define sets FILE to the name of the *current* file
//#define FILE '__FILE'

// From now on, although the file being processed change, the value of
// FILE remains the same. You need redefine FILE to update their value.
```

**Fail safe #define**  
Even without run jspreproc in file2.js, next code will work:

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

**Includes**

```js
//#include myfile       // myfile.js in the same folder of current file
//#include_once ../myone
//#include myfile       // ok to insert again
//#include ../myone.js  // ignored
```
