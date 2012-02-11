var t = parse("*#foo > elem[ class ~= bar i][class$=bAz i]:not([id*=2])")({
	name: "elem",
	attribs: {class:"bar baz"},
	parent: {
		name: "elem",
		attribs: {id: "foo"}
	}
});
console.log("result:", !!t)