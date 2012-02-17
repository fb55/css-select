var parse = require("../"),
	testString = "doo, *#foo > elem.bar[class$=bAz i]:not([ id *= \"2\" ])",
	testDoc = require("./doc.json");

console.log("result:", !!parse(testString)(testDoc));

//TODO