import * as CSSselect from "../src";
import { parseDOM } from "htmlparser2";
import { trueFunc, falseFunc } from "boolbase";
import type { Element } from "domhandler";

const [dom] = parseDOM("<div id=foo><p>foo</p></div>") as Element[];
const [xmlDom] = parseDOM("<DiV id=foo><P>foo</P></DiV>", {
    xmlMode: true,
}) as Element[];

describe("API", () => {
    describe("removes duplicates", () => {
        it("between identical trees", () => {
            expect(CSSselect.selectAll("div", [dom, dom])).toHaveLength(1);
        });
        it("between a superset and subset", () => {
            expect(
                CSSselect.selectAll("p", [dom, dom.children[0]])
            ).toHaveLength(1);
        });
        it("betweeen a subset and superset", () => {
            expect(
                CSSselect.selectAll("p", [dom.children[0], dom])
            ).toHaveLength(1);
        });
    });

    describe("can be queried by function", () => {
        it("in `is`", () => {
            expect(CSSselect.is(dom, (elem) => elem.attribs.id === "foo")).toBe(
                true
            );
        });
        // Probably more cases should be added here
    });

    describe("selectAll", () => {
        it("should query array elements directly when they have no parents", () => {
            const divs = [dom];
            expect(CSSselect.selectAll("div", divs)).toStrictEqual(divs);
        });
        it("should query array elements directly when they have parents", () => {
            const ps = CSSselect.selectAll("p", [dom]);
            expect(CSSselect.selectAll("p", ps)).toStrictEqual(ps);
        });
        it("should support pseudos led by a traversal (#111)", () => {
            const [dom] = parseDOM(
                '<div><div class="foo">a</div><div class="bar">b</div></div>'
            ) as Element[];
            const a = CSSselect.selectAll(".foo:has(+.bar)", dom);
            expect(a).toHaveLength(1);
            expect(a[0]).toStrictEqual(dom.children[0]);
        });
    });

    describe("unsatisfiable and universally valid selectors", () => {
        it("in :not", () => {
            let func = CSSselect._compileUnsafe(":not(*)");
            expect(func).toBe(falseFunc);
            func = CSSselect._compileUnsafe(":not(:nth-child(-1n-1))");
            expect(func).toBe(trueFunc);
            func = CSSselect._compileUnsafe(":not(:not(:not(*)))");
            expect(func).toBe(falseFunc);
        });

        it("in :has", () => {
            const matches = CSSselect.selectAll(":has(*)", [dom]);
            expect(matches).toHaveLength(1);
            expect(matches[0]).toBe(dom);
            const func = CSSselect._compileUnsafe(":has(:nth-child(-1n-1))");
            expect(func).toBe(falseFunc);
        });

        it("should skip unsatisfiable", () => {
            const func = CSSselect._compileUnsafe("* :not(*) foo");
            expect(func).toBe(falseFunc);
        });

        it("should promote universally valid", () => {
            const func = CSSselect._compileUnsafe("*, foo");
            expect(func).toBe(trueFunc);
        });
    });

    describe(":matches", () => {
        it("should select multiple elements", () => {
            let matches = CSSselect.selectAll(":matches(p, div)", [dom]);
            expect(matches).toHaveLength(2);
            matches = CSSselect.selectAll(":matches(div, :not(div))", [dom]);
            expect(matches).toHaveLength(2);
            matches = CSSselect.selectAll(
                ":matches(boo, baa, tag, div, foo, bar, baz)",
                [dom]
            );
            expect(matches).toHaveLength(1);
            expect(matches[0]).toBe(dom);
        });

        it("should strip quotes", () => {
            let matches = CSSselect.selectAll(":matches('p, div')", [dom]);
            expect(matches).toHaveLength(2);
            matches = CSSselect.selectAll(':matches("p, div")', [dom]);
            expect(matches).toHaveLength(2);
        });
    });

    describe("parent selector (<)", () => {
        it("should select the right element", () => {
            const matches = CSSselect.selectAll("p < div", [dom]);
            expect(matches).toHaveLength(1);
            expect(matches[0]).toBe(dom);
        });
        it("should not select nodes without children", () => {
            const matches = CSSselect.selectAll("p < div", [dom]);
            expect(matches).toStrictEqual(CSSselect.selectAll("* < *", [dom]));
        });
    });

    describe("selectOne", () => {
        it("should select elements in traversal order", () => {
            expect(CSSselect.selectOne("p", [dom])).toBe(dom.children[0]);
            expect(CSSselect.selectOne(":contains(foo)", [dom])).toBe(dom);
        });
        it("should take shortcuts when applicable", () => {
            let match = CSSselect.selectOne(falseFunc, {
                get length() {
                    throw new Error("Did not take shortcut");
                },
            });
            expect(match).toBeNull();
            match = CSSselect.selectOne("*", []);
            expect(match).toBeNull();
        });
    });

    describe("options", () => {
        const opts = { xmlMode: true };
        it("should recognize xmlMode in :has and :not", () => {
            expect(CSSselect.is(xmlDom, "DiV:has(P)", opts)).toBe(true);
            expect(CSSselect.is(xmlDom, "DiV:not(div)", opts)).toBe(true);
            expect(
                CSSselect.is(xmlDom.children[0], "DiV:has(P) :not(p)", opts)
            ).toBe(true);
        });

        it("should be strict", () => {
            const opts = { strict: true };
            expect(() => CSSselect.compile(":checkbox", opts)).toThrow(Error);
            expect(() => CSSselect.compile("[attr=val i]", opts)).toThrow(
                Error
            );
            expect(() => CSSselect.compile("[attr!=val]", opts)).toThrow(Error);
            expect(() => CSSselect.compile("[attr!=val i]", opts)).toThrow(
                Error
            );
            expect(() => CSSselect.compile("foo < bar", opts)).toThrow(Error);
            expect(() => CSSselect.compile(":not(:parent)", opts)).toThrow(
                Error
            );
            expect(() => CSSselect.compile(":not(a > b)", opts)).toThrow(Error);
            expect(() => CSSselect.compile(":not(a, b)", opts)).toThrow(Error);
        });

        it("should recognize contexts", () => {
            const div = CSSselect.selectAll("div", [dom]);
            const p = CSSselect.selectAll("p", [dom]);

            expect(CSSselect.selectOne("div", div, { context: div })).toBe(
                div[0]
            );
            expect(CSSselect.selectOne("div", div, { context: p })).toBe(null);
            expect(
                CSSselect.selectAll("p", div, { context: div })
            ).toStrictEqual(p);
        });

        it("should cache results by default", () => {
            const [dom] = parseDOM(
                '<div id="foo"><p>bar</p></div>'
            ) as Element[];
            const query = CSSselect.compile("#bar p");

            expect(CSSselect.selectAll(query, [dom])).toHaveLength(0);
            dom.attribs.id = "bar";
            // The query should be cached and the changed attribute should be ignored.
            expect(CSSselect.selectAll(query, [dom])).toHaveLength(0);
        });

        it("should skip cacheing results if asked to", () => {
            const [dom] = parseDOM(
                '<div id="foo"><p>bar</p></div>'
            ) as Element[];
            const query = CSSselect.compile("#bar p", { cacheResults: false });

            expect(CSSselect.selectAll(query, [dom])).toHaveLength(0);
            dom.attribs.id = "bar";
            // The query should not be cached, the changed attribute should be picked up.
            expect(CSSselect.selectAll(query, [dom])).toHaveLength(1);
        });
    });
});
