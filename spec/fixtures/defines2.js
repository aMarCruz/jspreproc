//#define $_FOO 'foo'           // $_FOO is 'foo'
//#define $_BAR 'bar'           // $_BAR is 'bar'
//#define $_BAZ $_FOO + $_BAR   // replaces $_FOO and $_BAR, result is 'foo'+'bar'
                                // evaluates to '"foobar"' and store the value
console.log($_BAZ)              // outputs 'foobar'
console.log($_FOO)              // SyntaxError - foo is not defined
