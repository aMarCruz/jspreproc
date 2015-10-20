## Options

This guide includes command-line syntax, the equivalent property name of the options object passed to the jspreproc module, the basic type of the value, the default value, and a short example for the command line interface.

The processed file(s) goes to the standard output. You can redirect this output to a file in the common form:

```sh
jspp -D RELEASE --empty-lines 0 lib/file1.js lib/file2.js > dist/app.js
```

---

### -D, --define (deprecated)

Due to the very different behavior of the `#define` directive of jspreproc and the C preprocessor, this keyword is replaced by `#set` and, for consistency, `#undef` is replaced with `#unset`.

`#define` and `--define` will be recognized in all 0.2.x versions, and from 0.3.0 will be removed. Perhaps in the future it is implemented with a similar behavior to the C preprocessor.


### --set

Creates or modifies a jspreproc variable whose value can be used in conditional expressions or for replacement on the source.

syntax | property | type | default | example
-------|----------|------|---------|---------
--set &lt;_NAME_[=_value_]> | set (object) | string (list) | -- | `--set "MODULE=one"`

Valid names begins with one dollar sign, underscore, or ASCII _uppercase_ alphabetic character (`$`, `_`, `A-Z`), followed by one or more underscores or uppercase alphanumeric characters (`_`, `A-Z`, `0-9`).

If the name begins with `$_`, followed by one or more valid characters, you can use the name for replacing text in the source, too. The replacement is performed with the literal value of the variable at the time of replacement.
 

### --header1

Text to insert before the _top level_ file.  

syntax | property | type | default | example
-------|----------|------|---------|---------
--header1 &lt;_string_> | header1 | string | `""` | `--header1 "// @module foo\\n"`

As seen in the example, you can use special JavaScript characters like `\n`, `\t`, and so, but can specify an end of line with a caret, too (e.g. `"// @module foo^"`). In the output, the caret is replaced with a end of line (as configured by the `--eol-type` option). Use two carets to output a literal one.  

The output of the header is generated with the same engine as the defined symbols but, unlike string values for `#set`, don't enclose the header value in quotes, jspreproc stores this as string.


### --headers

Text to insert before each _included_ file.

syntax | property | type | default | example
-------|----------|------|---------|---------
--headers &lt;_string_> | headers | string | `\n// __FILE\n\n` | `--headers "/* __FILE */^"`

The behavior of this option is the same of `--header1`


### --indent

syntax | property | type | default | example
-------|----------|------|---------|---------
--indent &lt;_string_> | indent | string | `""` | `--indent 2s` or `indent 2`

Indentation to add before each line on the included files.  
The format matches the regex `/$\d+[ts]?/`, one or more digits followed by one `t` means tabs and `s` spaces, default is spaces.  
Each level adds indentation.


### --eol-type

Performs end of line (EOL) normalization.

syntax | property | type | default | example
-------|----------|------|---------|---------
--eol-type &lt;unix&#x7C;win&#x7C;mac> | eolType | string | `"unix"` | `--eol-type win`

Converts all EOLs to Unix, Windows, or Mac style. Must Windows editors has no problems handling the default unix `\n` terminator.

**Note:** This normalization is required and can not be disabled.


### --empty-lines

Specifies how many consecutive empty lines are preserved in the output.

syntax | property | type | default | example
-------|----------|------|---------|---------
--empty-lines &lt;_number_> | emptyLines | number | `1` | `--empty-lines 0`

There's no range check for this option/property, only type coercion to integer. Value `0` removes and `-1` preserves all the blank lines, except lines from _conditional comments_, that are removed always.


### -C, --comments

Treatment of the comments, both single and multiline.

syntax | property | type | default | example
-------|----------|------|---------|---------
--comments &lt;all &#x7C; none &#x7C; filter> | comments | string | `"filter"` | `-C none`

Accepted options are `"all"` for keep all comments, `"none"` for remove all, and `"filter"` for apply the filters defined by the `--filter` option. Again, _conditional comments_ are always removed.

**Tip:** There's no "single" or "multi" option for remove one of both comment types, but you can do that by creating a _custom filter_. See the [`--custom-filter`](#--custom-filter) option for an example. 


### -F, --filter

Keep comments matching the specified filter.

syntax | property | type | default | example
-------|----------|------|---------|---------
--filter &lt;_filter-name_ &#x7C; all> | filter | string/<br>array | `"license"` | `-F jsdoc,eslint`

`filter-name` can specify one filter, or a list of filters separated with commas as in the example (no spaces please) or with multiple `--filter`options. With the API, you can pass with the `filter` property an array of strings too, with one filter name per element.

Predefined jspreproc filters and their regexes are:

- `license` : `/@license\b/`  
   The default and non-removable filter keeps comments with the word "@license" inside.
- [`titles`][titles] : `/^\/(\/\s*|\*[*\s]*)#{1,}/`  
   For markdown titles ala [docco](jashkenas.github.io/docco/ "DOCCO page"), e.g. `// ##`, but multiline too.
- [`jsdoc`][jsdoc]   : `/^\/\*\*[^@]*@[A-Za-z]/`
- [`jslint`][jslint] : `/^\/[*\/](?:jslint|global|property)\b/`
- [`jshint`][jshint] : `/^\/[*\/]\s*(?:jshint|globals|exported)\s/`
- [`eslint`][eslint] : `/^\/[*\/]\s*(?:eslint(?:\s|-[ed])|global\s)/`
- [`jscs`][jscs]     : `/^\/[*\/]\s*jscs:[ed]/`
- [`istanbul`][istanbul] : `/^\/[*\/]\s*istanbul\s/`
- `all` : Enables _**all**_ the filters and yes, this is the easy and slower way.

[titles]: http://daringfireball.net/projects/markdown/ "John Gruber Markdown"
[jsdoc]:  http://usejsdoc.org/ "@use JSDoc"
[jslint]: http://www.jslint.com/ "Douglas Crockford JSLint"
[jshint]: http://jshint.com/ "JSHint site"
[eslint]: http://eslint.org/ "The pluggable linting utility for JavaScript and JSX"
[jscs]:   http://jscs.info/ "JSCS - JavaScript Code Style"
[istanbul]: https://gotwarlost.github.io/istanbul/ "a JS code coverage tool written in JS"


### --custom-filter

Creates a custom comments filter. 

syntax | property | type | default | example
-------|----------|------|---------|---------
--custom-filter &lt;_regex-string_> | customFilter | string | (none) | (see bellow)

With this option, you instruct to jspreproc for create a regex as a custom filter to apply with `regex.test()` on comments, i.e. the regex must returns `true` to keep the comment.

Custom filters are anonymous and always enabled; you don't need use the --filter option with these.

Common case for custom filters is preserve few comments with special text, but you can use this feature for preserving comments by type as in this examples:

- `"^//"` or `/^\/\//` : preserves single-line comments.
- `"^/**"` or `/^\/\*\*/` : keep multiline, comments blocks starting with two (or more) asterisk characters.
- `"\n *[ \t]@module"` or `/\n\ \*[ \t]@module/` : preserves comment blocks with any line starting with " \*" followed by one space or tab and the string "module". 


### -V, --version

Print the jspreproc version number to standard output and exits.  


### **-h, --help**

Display a short help.
