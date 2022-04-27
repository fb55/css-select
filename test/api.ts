import * as CSSselect from "../src";
import { parseDOM, parseDocument } from "htmlparser2";
import boolbase from "boolbase";
import * as DomUtils from "domutils";
import type { AnyNode, Element } from "domhandler";
import { SelectorType, AttributeAction } from "css-what";
import type { Adapter } from "../src/types.js";

const [dom] = parseDOM("<div id=foo><p>foo</p></div>") as Element[];
const [xmlDom] = parseDOM("<DiV id=foo><P>foo</P></DiV>", {
    xmlMode: true,
}) as Element[];

const notYet = "not yet supported by css-select";

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

    describe("can be queried with more than a selector", () => {
        it("function in `is`", () => {
            expect(
                CSSselect.is(dom, (elem) => elem.attribs["id"] === "foo")
            ).toBe(true);
        });

        it("parsed selector in `is`", () => {
            expect(
                CSSselect.is(dom, [
                    [
                        {
                            type: SelectorType.Attribute,
                            action: AttributeAction.Equals,
                            ignoreCase: false,
                            name: "id",
                            namespace: null,
                            value: "foo",
                        },
                    ],
                ])
            ).toBe(true);
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

        it("should accept document root nodes", () => {
            const doc = parseDocument("<div id=foo><p>foo</p></div>");
            expect(CSSselect.selectAll(":contains(foo)", doc)).toHaveLength(2);
        });

        it("should support scoped selections relative to the root (#709)", () => {
            const doc = parseDocument(`
                <div class="parent">
                    <div class="one"><p class="p1"></p></div>
                    <div class="two"><p class="p2"></p></div>
                    <div class="three"><p class="p3"></p></div>
                </div>`);

            const two = CSSselect.selectOne(".two", doc);
            expect(
                CSSselect.selectOne(".parent .two .p2", two, {
                    relativeSelector: false,
                })
            ).toMatchObject({
                attribs: { class: "p2" },
            });
            expect(
                CSSselect.selectOne(".parent .two .p3", two, {
                    relativeSelector: false,
                })
            ).toBeNull();
        });
    });

    describe("errors", () => {
        it("should throw with a pseudo-element", () => {
            expect(() => CSSselect.compile("::after")).toThrow("not supported");
        });

        it("should throw an error if encountering a traversal-first selector with relative selectors disabled", () =>
            expect(() =>
                CSSselect.compile("> p", { relativeSelector: false })
            ).toThrow(
                "Relative selectors are not allowed when the `relativeSelector` option is disabled"
            ));

        it("should throw with a column combinator", () => {
            expect(() => CSSselect.compile("foo || bar")).toThrow(notYet);
        });

        it("should throw with attribute namespace", () => {
            expect(() => CSSselect.compile("[foo|bar]")).toThrow(notYet);
            expect(() => CSSselect.compile("[|bar]")).not.toThrow();
            expect(() => CSSselect.compile("[*|bar]")).toThrow(notYet);
        });

        it("should throw with tag namespace", () => {
            expect(() => CSSselect.compile("foo|bar")).toThrow(notYet);
            expect(() => CSSselect.compile("|bar")).toThrow(notYet);
            expect(() => CSSselect.compile("*|bar")).toThrow(notYet);
        });

        it("should throw with universal selector", () => {
            expect(() => CSSselect.compile("foo|*")).toThrow(notYet);
            expect(() => CSSselect.compile("|*")).toThrow(notYet);
            expect(() => CSSselect.compile("*|*")).not.toThrow();
        });

        it("should throw if parameter is supplied for pseudo", () => {
            expect(() => CSSselect.compile(":any-link(test)")).toThrow(
                "doesn't have any arguments"
            );

            expect(() => CSSselect.compile(":only-child(test)")).toThrow(
                "doesn't have any arguments"
            );
        });

        it("should throw if no parameter is supplied for pseudo", () => {
            CSSselect.pseudos["foovalue"] = (elem, { adapter }, subselect) =>
                adapter.getAttributeValue(elem, "foo") === subselect;

            expect(() => CSSselect.compile(":foovalue")).toThrow(
                "requires an argument"
            );

            delete CSSselect.pseudos["foovalue"];
        });

        it("should throw if parameter is supplied for user-provided pseudo", () =>
            expect(() =>
                CSSselect.compile(":foovalue(boo)", {
                    pseudos: { foovalue: "tag" },
                })
            ).toThrow("doesn't have any arguments"));

        it("should throw if no parameter is supplied for user-provided pseudo", () =>
            expect(() =>
                CSSselect.compile(":foovalue", {
                    pseudos: {
                        foovalue(_el, data) {
                            return data != null;
                        },
                    },
                })
            ).toThrow("requires an argument"));
    });

    describe("unsatisfiable and universally valid selectors", () => {
        it("in :not", () => {
            expect(CSSselect._compileUnsafe(":not(*)")).toBe(
                boolbase.falseFunc
            );
            expect(CSSselect._compileUnsafe(":not(:nth-child(-1n-1))")).toBe(
                boolbase.trueFunc
            );
            expect(CSSselect._compileUnsafe(":not(:not(:not(*)))")).toBe(
                boolbase.falseFunc
            );
        });

        it("in :has", () => {
            const matches = CSSselect.selectAll(":has(*)", [dom]);
            expect(matches).toHaveLength(1);
            expect(matches[0]).toBe(dom);

            expect(CSSselect._compileUnsafe(":has(:nth-child(-1n-1))")).toBe(
                boolbase.falseFunc
            );

            const matches2 = CSSselect.selectAll(
                "p:has(+ *)",
                parseDOM("<p><p>")
            );
            expect(matches2).toHaveLength(1);
            expect(matches2[0]).toHaveProperty("tagName", "p");
        });

        it("in :is", () => {
            expect(CSSselect._compileUnsafe(":is(*)")).toBe(boolbase.trueFunc);
            expect(CSSselect._compileUnsafe(":is(:nth-child(-1n-1))")).toBe(
                boolbase.falseFunc
            );
            expect(CSSselect._compileUnsafe(":is(:not(:not(*)))")).toBe(
                boolbase.trueFunc
            );
            expect(CSSselect._compileUnsafe(":is(*, :scope)")).toBe(
                boolbase.trueFunc
            );
        });

        it("should skip unsatisfiable", () =>
            expect(CSSselect._compileUnsafe("* :not(*) foo")).toBe(
                boolbase.falseFunc
            ));

        it("should promote universally valid", () =>
            expect(CSSselect._compileUnsafe("*, foo")).toBe(boolbase.trueFunc));
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

        it("should support traversals", () => {
            let matches = CSSselect.selectAll(":matches(div p)", [dom]);
            expect(matches).toHaveLength(1);
            expect(matches[0].name).toBe("p");

            matches = CSSselect.selectAll(":matches(div > p)", [dom]);
            expect(matches).toHaveLength(1);
            expect(matches[0].name).toBe("p");

            matches = CSSselect.selectAll(":matches(p < div)", [dom]);
            expect(matches).toHaveLength(1);
            expect(matches[0].name).toBe("div");

            matches = CSSselect.selectAll(":matches(> p)", [dom]);
            expect(matches).toHaveLength(1);
            expect(matches[0].name).toBe("p");

            matches = CSSselect.selectAll("div:has(:is(:scope p))", [dom]);
            expect(matches).toHaveLength(1);
            expect(matches[0].name).toBe("div");

            const [multiLevelDom] = parseDOM("<a><b><c><d>") as Element[];
            matches = CSSselect.selectAll(":is(* c)", multiLevelDom);
            expect(matches).toHaveLength(1);
            expect(matches[0].name).toBe("c");
        });

        it("should support alias :is", () => {
            let matches = CSSselect.selectAll(":is(p, div)", [dom]);
            expect(matches).toHaveLength(2);
            matches = CSSselect.selectAll(":is(div, :not(div))", [dom]);
            expect(matches).toHaveLength(2);
            matches = CSSselect.selectAll(
                ":is(boo, baa, tag, div, foo, bar, baz)",
                [dom]
            );
            expect(matches).toHaveLength(1);
            expect(matches[0]).toBe(dom);
        });

        it("should support alias :where", () => {
            let matches = CSSselect.selectAll(":where(p, div)", [dom]);
            expect(matches).toHaveLength(2);
            matches = CSSselect.selectAll(":where(div, :not(div))", [dom]);
            expect(matches).toHaveLength(2);
            matches = CSSselect.selectAll(
                ":where(boo, baa, tag, div, foo, bar, baz)",
                [dom]
            );
            expect(matches).toHaveLength(1);
            expect(matches[0]).toBe(dom);
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
            let match = CSSselect.selectOne(boolbase.falseFunc, {
                get length() {
                    throw new Error("Did not take shortcut");
                },
            });
            expect(match).toBeNull();
            match = CSSselect.selectOne("*", []);
            expect(match).toBeNull();
        });
        it("should properly handle root elements", () => {
            expect(CSSselect.selectOne("div:root", [dom])).toBe(dom);
            expect(CSSselect.selectOne("* > div", [dom])).toBeNull();
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

        it("should not crash when siblings repeat", () => {
            const dom = parseDOM(`<div></div>`.repeat(51)) as Element[];

            expect(
                CSSselect.selectAll("+div", dom, { context: dom })
            ).toHaveLength(50);
        });

        it("should cache results by default", () => {
            const [dom] = parseDOM(
                '<div id="foo"><p>bar</p></div>'
            ) as Element[];
            const query = CSSselect.compile("#bar p");

            expect(CSSselect.selectAll(query, [dom])).toHaveLength(0);
            dom.attribs["id"] = "bar";
            // The query should be cached and the changed attribute should be ignored.
            expect(CSSselect.selectAll(query, [dom])).toHaveLength(0);
        });

        it("should skip cacheing results if asked to", () => {
            const [dom] = parseDOM(
                '<div id="foo"><p>bar</p></div>'
            ) as Element[];
            const query = CSSselect.compile("#bar p", { cacheResults: false });

            expect(CSSselect.selectAll(query, [dom])).toHaveLength(0);
            dom.attribs["id"] = "bar";
            // The query should not be cached, the changed attribute should be picked up.
            expect(CSSselect.selectAll(query, [dom])).toHaveLength(1);
        });

        it("should pass options to sub-selectors", () => {
            expect(
                CSSselect.selectAll("div:is(DiV#FOO):not([ID]):foo", [dom], {
                    xmlMode: true,
                    lowerCaseTags: true,
                    quirksMode: true,
                    pseudos: { foo: "#fOO" },
                })
            ).toHaveLength(1);
        });
    });

    describe("optional adapter methods", () => {
        it("should support prevElementSibling", () => {
            const adapter: Adapter<AnyNode, Element> = { ...DomUtils };
            delete adapter.prevElementSibling;

            const dom = parseDOM(
                `${"<p>foo".repeat(10)}<div>bar</div>`
            ) as Element[];

            expect(
                CSSselect.selectAll("p + div", dom, { adapter })
            ).toStrictEqual(CSSselect.selectAll("p + div", dom));
        });

        it("should support isHovered", () => {
            const dom = parseDOM(`${"<p>foo".repeat(10)}`) as Element[];

            const adapter = {
                ...DomUtils,
                isHovered: (el: Element) => el === dom[dom.length - 1],
            };

            const selection = CSSselect.selectAll("p:hover", dom, { adapter });
            expect(selection).toHaveLength(1);
            expect(selection[0]).toBe(dom[dom.length - 1]);
        });

        it("should not match any elements if `isHovered` is not defined", () => {
            const dom = parseDOM(`${"<p>foo".repeat(10)}`);
            expect(CSSselect.selectAll("p:hover", dom)).toHaveLength(0);
        });
    });
});
