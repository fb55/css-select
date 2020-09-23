const CSSselect = require("../src");
const makeDom = require("htmlparser2").parseDOM;
const bools = require("boolbase");
const assert = require("assert");

const [dom] = makeDom("<div id=foo><p>foo</p></div>");
const [xmlDom] = makeDom("<DiV id=foo><P>foo</P></DiV>", { xmlMode: true });

describe("API", () => {
    describe("removes duplicates", () => {
        it("between identical trees", () => {
            const matches = CSSselect.selectAll("div", [dom, dom]);
            assert.strictEqual(matches.length, 1, "Removes duplicate matches");
        });
        it("between a superset and subset", () => {
            const matches = CSSselect.selectAll("p", [dom, dom.children[0]]);
            assert.strictEqual(matches.length, 1, "Removes duplicate matches");
        });
        it("betweeen a subset and superset", () => {
            const matches = CSSselect.selectAll("p", [dom.children[0], dom]);
            assert.strictEqual(matches.length, 1, "Removes duplicate matches");
        });
    });

    describe("can be queried by function", () => {
        it("in `is`", () => {
            assert(CSSselect.is(dom, (elem) => elem.attribs.id === "foo"));
        });
        // Probably more cases should be added here
    });

    describe("selectAll", () => {
        it("should query array elements directly when they have no parents", () => {
            const divs = [dom];
            assert.deepEqual(CSSselect.selectAll("div", divs), divs);
        });
        it("should query array elements directly when they have parents", () => {
            const ps = CSSselect.selectAll("p", [dom]);
            assert.deepEqual(CSSselect.selectAll("p", ps), ps);
        });
    });

    describe("unsatisfiable and universally valid selectors", () => {
        it("in :not", () => {
            let func = CSSselect._compileUnsafe(":not(*)");
            assert.strictEqual(func, bools.falseFunc);
            func = CSSselect._compileUnsafe(":not(:nth-child(-1n-1))");
            assert.strictEqual(func, bools.trueFunc);
            func = CSSselect._compileUnsafe(":not(:not(:not(*)))");
            assert.strictEqual(func, bools.falseFunc);
        });

        it("in :has", () => {
            const matches = CSSselect.selectAll(":has(*)", [dom]);
            assert.strictEqual(matches.length, 1);
            assert.strictEqual(matches[0], dom);
            const func = CSSselect._compileUnsafe(":has(:nth-child(-1n-1))");
            assert.strictEqual(func, bools.falseFunc);
        });

        it("should skip unsatisfiable", () => {
            const func = CSSselect._compileUnsafe("* :not(*) foo");
            assert.strictEqual(func, bools.falseFunc);
        });

        it("should promote universally valid", () => {
            const func = CSSselect._compileUnsafe("*, foo");
            assert.strictEqual(func, bools.trueFunc);
        });
    });

    describe(":matches", () => {
        it("should select multiple elements", () => {
            let matches = CSSselect.selectAll(":matches(p, div)", [dom]);
            assert.strictEqual(matches.length, 2);
            matches = CSSselect.selectAll(":matches(div, :not(div))", [dom]);
            assert.strictEqual(matches.length, 2);
            matches = CSSselect.selectAll(
                ":matches(boo, baa, tag, div, foo, bar, baz)",
                [dom]
            );
            assert.strictEqual(matches.length, 1);
            assert.strictEqual(matches[0], dom);
        });

        it("should strip quotes", () => {
            let matches = CSSselect.selectAll(":matches('p, div')", [dom]);
            assert.strictEqual(matches.length, 2);
            matches = CSSselect.selectAll(':matches("p, div")', [dom]);
            assert.strictEqual(matches.length, 2);
        });
    });

    describe("parent selector (<)", () => {
        it("should select the right element", () => {
            const matches = CSSselect.selectAll("p < div", [dom]);
            assert.strictEqual(matches.length, 1);
            assert.strictEqual(matches[0], dom);
        });
        it("should not select nodes without children", () => {
            const matches = CSSselect.selectAll("p < div", [dom]);
            assert.deepStrictEqual(
                matches,
                CSSselect.selectAll("* < *", [dom])
            );
        });
    });

    describe("selectOne", () => {
        it("should select elements in traversal order", () => {
            let match = CSSselect.selectOne("p", [dom]);
            assert.strictEqual(match, dom.children[0]);
            match = CSSselect.selectOne(":contains(foo)", [dom]);
            assert.strictEqual(match, dom);
        });
        it("should take shortcuts when applicable", () => {
            // TODO this is currently only visible in coverage reports
            let match = CSSselect.selectOne(bools.falseFunc, [dom]);
            assert.strictEqual(match, null);
            match = CSSselect.selectOne("*", []);
            assert.strictEqual(match, null);
        });
    });

    describe("options", () => {
        const opts = { xmlMode: true };
        it("should recognize xmlMode in :has and :not", () => {
            assert(CSSselect.is(xmlDom, "DiV:has(P)", opts));
            assert(CSSselect.is(xmlDom, "DiV:not(div)", opts));
            assert(
                CSSselect.is(xmlDom.children[0], "DiV:has(P) :not(p)", opts)
            );
        });

        it("should be strict", () => {
            const opts = { strict: true };
            assert.throws(() => CSSselect.compile(":checkbox", opts), Error);
            assert.throws(() => CSSselect.compile("[attr=val i]", opts), Error);
            assert.throws(() => CSSselect.compile("[attr!=val]", opts), Error);
            assert.throws(
                () => CSSselect.compile("[attr!=val i]", opts),
                Error
            );
            assert.throws(() => CSSselect.compile("foo < bar", opts), Error);
            assert.throws(
                () => CSSselect.compile(":not(:parent)", opts),
                Error
            );
            assert.throws(() => CSSselect.compile(":not(a > b)", opts), Error);
            assert.throws(() => CSSselect.compile(":not(a, b)", opts), Error);
        });

        it("should recognize contexts", () => {
            const div = CSSselect.selectAll("div", [dom]);
            const p = CSSselect.selectAll("p", [dom]);

            assert.strictEqual(
                CSSselect.selectOne("div", div, { context: div }),
                div[0]
            );
            assert.strictEqual(
                CSSselect.selectOne("div", div, { context: p }),
                null
            );
            assert.deepStrictEqual(
                CSSselect.selectAll("p", div, { context: div }),
                p
            );
        });
    });
});
