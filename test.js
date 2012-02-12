var parse = require("./"),
    testString = 'doo, *#foo > elem.bar[class$=bAz i]:not([ id *= "2" ])',
    testDoc = {
        name: "elem",
        attribs: { class: "bar baz" },
        parent: {
            name: "elem",
            attribs: { id: "foo" }
        }
    };

console.log("result:", !!parse(testString)(testDoc));

try {
    console.log(
        "Parsing took:",
        require("ben")(1e5, function() {
            parse(testString);
        }) * 1e3
    );
    parse = parse(testString);
    console.log(
        "Executing took:",
        require("ben")(1e6, function() {
            parse(testDoc);
        }) * 1e3
    );
} catch (e) {}
