var parse = require("./");

var t = parse("doo, *#foo > elem.bar[class$=bAz i]:not([ id *= \"2\" ])")({
	name: "elem",
	attribs: {class:"bar baz"},
	parent: {
		name: "elem",
		attribs: {id: "foo"}
	}
});
console.log("result:", !!t)