var CSSselect = require(".."),
    makeDom = require("htmlparser2").parseDOM,
    bools = require("boolbase"),
    assert = require("assert");

var dom = makeDom("<div id=foo><p></p></div>")[0];

describe("API", function(){
	describe("removes duplicates", function(){
		it("between identical trees", function(){
			var matches = CSSselect.selectAll("div", [dom, dom]);
			assert.equal(matches.length, 1, "Removes duplicate matches");
		});
		it("between a superset and subset", function(){
			var matches = CSSselect.selectAll("p", [dom, dom.children[0]]);
			assert.equal(matches.length, 1, "Removes duplicate matches");
		});
		it("betweeen a subset and superset", function(){
			var matches = CSSselect.selectAll("p", [dom.children[0], dom]);
			assert.equal(matches.length, 1, "Removes duplicate matches");
		});
	});
});
