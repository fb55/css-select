var parse = require("../"),
    ben = require("ben"),
    testString = 'doo, *#foo > elem.bar[class$=bAz i]:not([ id *= "2" ])',
    testDoc = require("./doc.json");

console.log(
    "Parsing took:",
    ben(1e5, function() {
        parse(testString);
    }) * 1e3
);
parse = parse(testString);
console.log(
    "Executing took:",
    ben(1e6, function() {
        parse(testDoc);
    }) * 1e3
);
