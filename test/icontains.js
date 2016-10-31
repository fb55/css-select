var CSSselect = require("../"),
	makeDom = require("htmlparser2").parseDOM,
	assert = require("assert");

var dom = makeDom("<div><p>In the end, it doesn't really Matter.</p><div>Indeed-that's a delicate matter.</div>");

describe("icontains", function(){
	describe("ignore case", function(){
		it("should match full string", function(){
			var matches = CSSselect.selectAll(":icontains(indeed-that's a delicate matter.)", dom);
			assert.equal(matches.length, 2);
			assert.deepEqual(matches, [dom[0], dom[0].children[1]]);
			matches = CSSselect.selectAll(":icontains(inDeeD-THAT's a DELICATE matteR.)", dom);
			assert.equal(matches.length, 2);
			assert.deepEqual(matches, [dom[0], dom[0].children[1]]);
		});

		it("should match substring", function(){
			var matches = CSSselect.selectAll(":icontains(indeed)", dom);
			assert.equal(matches.length, 2);
			assert.deepEqual(matches, [dom[0], dom[0].children[1]]);
			matches = CSSselect.selectAll(":icontains(inDeeD)", dom);
			assert.equal(matches.length, 2);
			assert.deepEqual(matches, [dom[0], dom[0].children[1]]);
		});

		it("should match specific element", function(){
			var matches = CSSselect.selectAll("p:icontains(matter)", dom);
			assert.equal(matches.length, 1);
			assert.deepEqual(matches, [dom[0].children[0]]);
			matches = CSSselect.selectAll("p:icontains(mATter)", dom);
			assert.equal(matches.length, 1);
			assert.deepEqual(matches, [dom[0].children[0]]);
		});

		it("should match multiple elements", function(){
			var matches = CSSselect.selectAll(":icontains(matter)", dom);
			assert.equal(matches.length, 3);
			assert.deepEqual(matches, [dom[0], dom[0].children[0],
				dom[0].children[1]]);
			matches = CSSselect.selectAll(":icontains(mATter)", dom);
			assert.equal(matches.length, 3);
			assert.deepEqual(matches, [dom[0], dom[0].children[0],
				dom[0].children[1]]);
		});

		it("should match empty string", function(){
			var matches = CSSselect.selectAll(":icontains()", dom);
			assert.equal(matches.length, 3);
			assert.deepEqual(matches, [dom[0], dom[0].children[0],
				dom[0].children[1]]);
		});

		it("should match quoted string", function(){
			var matches = CSSselect.selectAll(":icontains('')", dom);
			assert.equal(matches.length, 3);
			assert.deepEqual(matches, [dom[0], dom[0].children[0],
				dom[0].children[1]]);
			matches = CSSselect.selectAll("p:icontains('matter')", dom);
			assert.equal(matches.length, 1);
			assert.deepEqual(matches, [dom[0].children[0]]);
			matches = CSSselect.selectAll("p:icontains(\"matter\")", dom);
			assert.equal(matches.length, 1);
			assert.deepEqual(matches, [dom[0].children[0]]);
		});

		it("should match whitespace", function(){
			var matches = CSSselect.selectAll(":icontains( matter)", dom);
			assert.equal(matches.length, 3);
			assert.deepEqual(matches, [dom[0], dom[0].children[0],
				dom[0].children[1]]);
			matches = CSSselect.selectAll(":icontains( mATter)", dom);
			assert.equal(matches.length, 3);
			assert.deepEqual(matches, [dom[0], dom[0].children[0],
				dom[0].children[1]]);
		});
	});

	describe("no matches", function(){
		it("should not match", function(){
			var matches = CSSselect.selectAll("p:icontains(indeed)", dom);
			assert.equal(matches.length, 0);
		});

	});
});
