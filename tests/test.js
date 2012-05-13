var CSSselect = require("../"),
	testString = "doo, *#foo > elem.bar[class$=bAz i]:not([ id *= \"2\" ]) tag",
	helper = require("./helper.js"),
	dom = helper.getDefaultDom();

console.log("result:", CSSselect.iterate(dom, testString).length);