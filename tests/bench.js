var CSSselect = require("../"),
	ben = require("ben"),
	testString = "doo, *#foo > elem.bar[class$=bAz i]:not([ id *= \"2\" ])",
	helper = require("./helper.js"),
	dom = helper.getDefaultDom();

console.log("Parsing took:", ben(1e5, function(){CSSselect(testString);})*1e3);
testString = parse(testString);
console.log("Executing took:", ben(1e6, function(){CSSselect.iterate(dom, testString);})*1e3);