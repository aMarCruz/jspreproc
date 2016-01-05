beforeEach(function () {

  jasmine.addMatchers({

    // simple string comparator, mainly for easy visualization of eols
    toHasLinesLike: function (util) {

      function printable(str) {
        return ('' + str).replace(/\n/g, '\\n').replace(/\r/g, '\\r')
      }
      function compare(actual, expected) {
        var pass = actual === expected
        return {
          pass: pass,
          message: util.buildFailureMessage(
            'toHasLinesLike', pass, printable(actual), printable(expected))
        }
      }

      return {compare: compare}
    },

    // actual has to be an Error instance, and contain the expected string
    toErrorContain: function (/*util*/) {

      function compare(actual, expected) {
        return {
          pass: actual instanceof Error && ('' + actual).indexOf(expected) >= 0
        }
      }

      return {compare: compare}
    }

  })

})
