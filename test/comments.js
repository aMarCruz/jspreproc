
/**
  @author: amarcruz
  comment preserved with comments is "all", or "filter" with the "jsdoc"
  filter enabled.
*/

// this comment is removed when comments option is not "all"
/*
  ...and this
*/

//@license: MIT - preserved when the comments option is "all" or "filter"

/*#
  This comment is preserved when comments option is "all" or "filter"
*/
console.log('with #')     //# keep when comments is "all" or "filter"

//#ifdef INC
//#include include1
//#endif

//#if 1
console.log('jslint')     //jslint keep this comment with the jslint filter
console.log('jshint')     // jshint keep this comment with the jshint filter
console.log('eslint')     // eslint keep with the eslint filter
//#endif