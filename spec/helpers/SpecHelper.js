beforeEach(function () {

  jasmine.addMatchers({

    // simple string comparator, mainly for easy visualization of eols
    toHasLinesLike: function (util) {

      function printable(str) {
        return typeof str !== 'string' ?
          str : (str && str.replace(/\n/g, '\\n').replace(/\r/g, '\\r'))
      }
      function compare(actual, expected) {
        expected = printable(expected)
        actual   = printable(actual)
        return {pass: actual === expected}
      }

      return {compare: compare}
    },

    // actual has to be an Error instance, and contain the expected string
    toErrorContain: function (util) {

      function compare(actual, expected) {
        return {
          pass: actual instanceof Error && ('' + actual).indexOf(expected) >= 0
        }
      }

      return {compare: compare}
    }

  })

})
