var CSSselect = require(".."),
    makeDom = require("htmlparser2").parseDOM,
    bools = require("boolbase"),
    assert = require("assert");

var dom = makeDom("<div id=foo><p>foo</p></div>")[0];

describe("API", function() {
    describe("removes duplicates", function() {
        it("between identical trees", function() {
            var matches = CSSselect.selectAll("div", [dom, dom]);
            assert.equal(matches.length, 1, "Removes duplicate matches");
        });
        it("between a superset and subset", function() {
            var matches = CSSselect.selectAll("p", [dom, dom.children[0]]);
            assert.equal(matches.length, 1, "Removes duplicate matches");
        });
        it("betweeen a subset and superset", function() {
            var matches = CSSselect.selectAll("p", [dom.children[0], dom]);
            assert.equal(matches.length, 1, "Removes duplicate matches");
        });
    });

    describe("can be queried by function", function() {
        it("in `is`", function() {
            assert(
                CSSselect.is(dom, function(elem) {
                    return elem.attribs.id === "foo";
                })
            );
        });
        //probably more cases should be added here
    });

    describe("optimizes unsatisfiable and universally valid selectors", function() {
        it("in :not", function() {
            var func = CSSselect._compileUnsafe(":not(*)");
            assert.equal(func, bools.falseFunc);
            func = CSSselect._compileUnsafe(":not(:nth-child(-1n-1))");
            assert.equal(func, bools.trueFunc);
            func = CSSselect._compileUnsafe(":not(:not(:not(*)))");
            assert.equal(func, bools.falseFunc);
        });

        it("in :has", function() {
            var matches = CSSselect.selectAll(":has(*)", [dom]);
            assert.equal(matches.length, 1);
            assert.equal(matches[0], dom);
            var func = CSSselect._compileUnsafe(":has(:nth-child(-1n-1))");
            assert.equal(func, bools.falseFunc);
        });

        it("should skip unsatisfiable", function() {
            var func = CSSselect._compileUnsafe("* :not(*) foo");
            assert.equal(func, bools.falseFunc);
        });

        it("should promote universally valid", function() {
            var func = CSSselect._compileUnsafe("*, foo");
            assert.equal(func, bools.trueFunc);
        });
    });

    describe("should have a functional parent selector (<)", function() {
        it("should select the right element", function() {
            var matches = CSSselect.selectAll("p < div", [dom]);
            assert.equal(matches.length, 1);
            assert.equal(matches[0], dom);
        });
        it("should not select nodes without children", function() {
            var matches = CSSselect.selectAll("p < div", [dom]);
            assert.deepEqual(matches, CSSselect.selectAll("* < *", [dom]));
        });
    });
});
