import * as helper from "./tools/helper";
const document = helper.getDocument("qwery.html");
import * as CSSselect from "../src";
import * as DomUtils from "domutils";
import type { Element } from "domhandler";
import { parseDOM } from "htmlparser2";

const location = { hash: "" };
CSSselect.pseudos.target = (elem, { adapter }) =>
    adapter.getAttributeValue(elem, "id") === location.hash.substr(1);

// ---

/*
 * Adapted from https://github.com/ded/qwery/blob/master/tests/tests.js
 */

CSSselect.pseudos.humanoid = (e) =>
    CSSselect.is(e, ":matches(li,ol):contains(human)");

const frag = parseDOM(
    '<root><div class="d i v">' +
        '<p id="oooo"><em></em><em id="emem"></em></p>' +
        "</div>" +
        '<p id="sep">' +
        '<div class="a"><span></span></div>' +
        "</p></root>"
);

const doc = parseDOM(
    '<root><div id="hsoob">' +
        '<div class="a b">' +
        '<div class="d e sib" test="fg" id="booshTest"><p><span id="spanny"></span></p></div>' +
        '<em nopass="copyrighters" rel="copyright booshrs" test="f g" class="sib"></em>' +
        '<span class="h i a sib"></span>' +
        "</div>" +
        '<p class="odd"></p>' +
        "</div>" +
        '<div id="lonelyHsoob"></div></root>'
);

const el = DomUtils.getElementById("attr-child-boosh", document);

if (!el) throw new Error("Couldn't find element");

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const pseudos = DomUtils.getElementById("pseudos", document)!.children.filter(
    DomUtils.isTag
);

describe("qwery", () => {
    describe("Contexts", () => {
        it("should be able to pass optional context", () => {
            expect(CSSselect.selectAll(".a", document)).toHaveLength(3); // No context found 3 elements (.a)
            expect(
                CSSselect.selectAll(
                    ".a",
                    CSSselect.selectAll("#boosh", document)
                )
            ).toHaveLength(2); // Context found 2 elements (#boosh .a)
        });

        it.skip("should be able to pass qwery result as context", () => {
            expect(
                CSSselect.selectAll(
                    ".a",
                    CSSselect.selectAll("#boosh", document)
                )
            ).toHaveLength(2); // Context found 2 elements(.a, #boosh)
            expect(
                CSSselect.selectAll(".a", CSSselect.selectAll(".a", document))
            ).toHaveLength(0); // Context found 0 elements(.a, .a)
            expect(
                CSSselect.selectAll(".a", CSSselect.selectAll(".b", document))
            ).toHaveLength(1); // Context found 1 elements(.a, .b)
            expect(
                CSSselect.selectAll(
                    ".a",
                    CSSselect.selectAll("#boosh .b", document)
                )
            ).toHaveLength(1); // Context found 1 elements(.a, #boosh .b)
            expect(
                CSSselect.selectAll(
                    ".b",
                    CSSselect.selectAll("#boosh .b", document)
                )
            ).toHaveLength(0); // Context found 0 elements(.b, #boosh .b)
        });

        it("should not return duplicates from combinators", () => {
            expect(CSSselect.selectAll("#boosh,#boosh", document)).toHaveLength(
                1
            ); // Two booshes dont make a thing go right
            expect(
                CSSselect.selectAll("#boosh,.apples,#boosh", document)
            ).toHaveLength(1); // Two booshes and an apple dont make a thing go right
        });

        it("byId sub-queries within context", () => {
            expect(
                CSSselect.selectAll(
                    "#booshTest",
                    CSSselect.selectAll("#boosh", document)
                )
            ).toHaveLength(1); // Found "#id #id"
            expect(
                CSSselect.selectAll(
                    ".a.b #booshTest",
                    CSSselect.selectAll("#boosh", document)
                )
            ).toHaveLength(1); // Found ".class.class #id"
            expect(
                CSSselect.selectAll(
                    ".a>#booshTest",
                    CSSselect.selectAll("#boosh", document)
                )
            ).toHaveLength(1); // Found ".class>#id"
            expect(
                CSSselect.selectAll(
                    ">.a>#booshTest",
                    CSSselect.selectAll("#boosh", document)
                )
            ).toHaveLength(1); // Found ">.class>#id"
            expect(
                CSSselect.selectAll(
                    "#boosh",
                    CSSselect.selectAll("#booshTest", document)
                )
            ).toHaveLength(0); // Shouldn't find #boosh (ancestor) within #booshTest (descendent)
            expect(
                CSSselect.selectAll(
                    "#boosh",
                    CSSselect.selectAll("#lonelyBoosh", document)
                )
            ).toHaveLength(0); // Shouldn't find #boosh within #lonelyBoosh (unrelated)
        });
    });

    describe("CSS 1", () => {
        it("get element by id", () => {
            const result = CSSselect.selectAll("#boosh", document);
            expect(result[0]).toBeTruthy(); // Found element with id=boosh
            expect(CSSselect.selectAll("h1", document)[0]).toBeTruthy(); // Found 1 h1
        });

        it("byId sub-queries", () => {
            expect(
                CSSselect.selectAll("#boosh #booshTest", document)
            ).toHaveLength(1); // Found "#id #id"
            expect(
                CSSselect.selectAll(".a.b #booshTest", document)
            ).toHaveLength(1); // Found ".class.class #id"
            expect(
                CSSselect.selectAll("#boosh>.a>#booshTest", document)
            ).toHaveLength(1); // Found "#id>.class>#id"
            expect(CSSselect.selectAll(".a>#booshTest", document)).toHaveLength(
                1
            ); // Found ".class>#id"
        });

        it("get elements by class", () => {
            expect(CSSselect.selectAll("#boosh .a", document)).toHaveLength(2); // Found two elements
            expect(
                CSSselect.selectAll("#boosh div.a", document)[0]
            ).toBeTruthy(); // Found one element
            expect(CSSselect.selectAll("#boosh div", document)).toHaveLength(2); // Found two {div} elements
            expect(
                CSSselect.selectAll("#boosh span", document)[0]
            ).toBeTruthy(); // Found one {span} element
            expect(
                CSSselect.selectAll("#boosh div div", document)[0]
            ).toBeTruthy(); // Found a single div
            expect(CSSselect.selectAll("a.odd", document)).toHaveLength(1); // Found single a
        });

        it("combos", () => {
            expect(
                CSSselect.selectAll("#boosh div,#boosh span", document)
            ).toHaveLength(3); // Found 2 divs and 1 span
        });

        it("class with dashes", () => {
            expect(
                CSSselect.selectAll(".class-with-dashes", document)
            ).toHaveLength(1); // Found something
        });

        it("should ignore comment nodes", () => {
            expect(CSSselect.selectAll("#boosh *", document)).toHaveLength(4); // Found only 4 elements under #boosh
        });

        it("deep messy relationships", () => {
            /*
             * These are mostly characterised by a combination of tight relationships and loose relationships
             * on the right side of the query it's easy to find matches but they tighten up quickly as you
             * go to the left
             * they are useful for making sure the dom crawler doesn't stop short or over-extend as it works
             * up the tree the crawl needs to be comprehensive
             */
            expect(
                CSSselect.selectAll("div#fixtures > div a", document)
            ).toHaveLength(5); // Found four results for "div#fixtures > div a"
            expect(
                CSSselect.selectAll(
                    ".direct-descend > .direct-descend .lvl2",
                    document
                )
            ).toHaveLength(1); // Found one result for ".direct-descend > .direct-descend .lvl2"
            expect(
                CSSselect.selectAll(
                    ".direct-descend > .direct-descend div",
                    document
                )
            ).toHaveLength(1); // Found one result for ".direct-descend > .direct-descend div"
            expect(
                CSSselect.selectAll(
                    ".direct-descend > .direct-descend div",
                    document
                )
            ).toHaveLength(1); // Found one result for ".direct-descend > .direct-descend div"
            expect(
                CSSselect.selectAll("div#fixtures div ~ a div", document)
            ).toHaveLength(0); // Found no results for odd query
            expect(
                CSSselect.selectAll(
                    ".direct-descend > .direct-descend > .direct-descend ~ .lvl2",
                    document
                )
            ).toHaveLength(0); // Found no results for another odd query
        });
    });

    describe("CSS 2", () => {
        it("get elements by attribute", () => {
            const wanted = CSSselect.selectAll("#boosh div[test]", document)[0];
            const expected = DomUtils.getElementById("booshTest", document);
            expect(wanted).toBe(expected); // Found attribute
            expect(
                CSSselect.selectAll("#boosh div[test=fg]", document)[0]
            ).toBe(expected); // Found attribute with value
            expect(
                CSSselect.selectAll('em[rel~="copyright"]', document)
            ).toHaveLength(1); // Found em[rel~="copyright"]
            expect(
                CSSselect.selectAll('em[nopass~="copyright"]', document)
            ).toHaveLength(0); // Found em[nopass~="copyright"]
        });

        it("should not throw error by attribute selector", () => {
            expect(CSSselect.selectAll('[foo^="bar"]', document)).toHaveLength(
                1
            ); // Found 1 element
        });

        it("crazy town", () => {
            const el = DomUtils.getElementById("attr-test3", document);
            expect(
                CSSselect.selectAll(
                    'div#attr-test3.found.you[title="whatup duders"]',
                    document
                )[0]
            ).toBe(el); // Found the right element
        });
    });

    describe("attribute selectors", () => {
        /* CSS 2 SPEC */

        it("[attr]", () => {
            const expected = DomUtils.getElementById("attr-test-1", document);
            expect(
                CSSselect.selectAll("#attributes div[unique-test]", document)[0]
            ).toBe(expected); // Found attribute with [attr]
        });

        it("[attr=val]", () => {
            const expected = DomUtils.getElementById("attr-test-2", document);
            expect(
                CSSselect.selectAll(
                    '#attributes div[test="two-foo"]',
                    document
                )[0]
            ).toBe(expected); // Found attribute with =
            expect(
                CSSselect.selectAll(
                    "#attributes div[test='two-foo']",
                    document
                )[0]
            ).toBe(expected); // Found attribute with =
            expect(
                CSSselect.selectAll(
                    "#attributes div[test=two-foo]",
                    document
                )[0]
            ).toBe(expected); // Found attribute with =
        });

        it("[attr~=val]", () => {
            const expected = DomUtils.getElementById("attr-test-3", document);
            expect(
                CSSselect.selectAll("#attributes div[test~=three]", document)[0]
            ).toBe(expected); // Found attribute with ~=
        });

        it("[attr|=val]", () => {
            const expected = DomUtils.getElementById("attr-test-2", document);
            expect(
                CSSselect.selectAll(
                    '#attributes div[test|="two-foo"]',
                    document
                )[0]
            ).toBe(expected); // Found attribute with |=
            expect(
                CSSselect.selectAll("#attributes div[test|=two]", document)[0]
            ).toBe(expected); // Found attribute with |=
        });

        it("[href=#x] special case", () => {
            const expected = DomUtils.getElementById("attr-test-4", document);
            expect(
                CSSselect.selectAll('#attributes a[href="#aname"]', document)[0]
            ).toBe(expected); // Found attribute with href=#x
        });

        /* CSS 3 SPEC */

        it("[attr^=val]", () => {
            const expected = DomUtils.getElementById("attr-test-2", document);
            expect(
                CSSselect.selectAll("#attributes div[test^=two]", document)[0]
            ).toBe(expected); // Found attribute with ^=
        });

        it("[attr$=val]", () => {
            const expected = DomUtils.getElementById("attr-test-2", document);
            expect(
                CSSselect.selectAll("#attributes div[test$=foo]", document)[0]
            ).toBe(expected); // Found attribute with $=
        });

        it("[attr*=val]", () => {
            const expected = DomUtils.getElementById("attr-test-3", document);
            expect(
                CSSselect.selectAll("#attributes div[test*=hree]", document)[0]
            ).toBe(expected); // Found attribute with *=
        });

        it("direct descendants", () => {
            expect(
                CSSselect.selectAll(
                    "#direct-descend > .direct-descend",
                    document
                )
            ).toHaveLength(2); // Found two direct descendents
            expect(
                CSSselect.selectAll(
                    "#direct-descend > .direct-descend > .lvl2",
                    document
                )
            ).toHaveLength(3); // Found three second-level direct descendents
        });

        it("sibling elements", () => {
            expect(
                CSSselect.selectAll(
                    "#sibling-selector ~ .sibling-selector",
                    document
                )
            ).toHaveLength(2); // Found two siblings
            expect(
                CSSselect.selectAll(
                    "#sibling-selector ~ div.sibling-selector",
                    document
                )
            ).toHaveLength(2); // Found two siblings
            expect(
                CSSselect.selectAll(
                    "#sibling-selector + div.sibling-selector",
                    document
                )
            ).toHaveLength(1); // Found one sibling
            expect(
                CSSselect.selectAll(
                    "#sibling-selector + .sibling-selector",
                    document
                )
            ).toHaveLength(1); // Found one sibling

            expect(
                CSSselect.selectAll(".parent .oldest ~ .sibling", document)
            ).toHaveLength(4); // Found four younger siblings
            expect(
                CSSselect.selectAll(".parent .middle ~ .sibling", document)
            ).toHaveLength(2); // Found two younger siblings
            expect(
                CSSselect.selectAll(".parent .middle ~ h4", document)
            ).toHaveLength(1); // Found next sibling by tag
            expect(
                CSSselect.selectAll(".parent .middle ~ h4.younger", document)
            ).toHaveLength(1); // Found next sibling by tag and class
            expect(
                CSSselect.selectAll(".parent .middle ~ h3", document)
            ).toHaveLength(0); // An element can't be its own sibling
            expect(
                CSSselect.selectAll(".parent .middle ~ h2", document)
            ).toHaveLength(0); // Didn't find an older sibling
            expect(
                CSSselect.selectAll(".parent .youngest ~ .sibling", document)
            ).toHaveLength(0); // Found no younger siblings

            expect(
                CSSselect.selectAll(".parent .oldest + .sibling", document)
            ).toHaveLength(1); // Found next sibling
            expect(
                CSSselect.selectAll(".parent .middle + .sibling", document)
            ).toHaveLength(1); // Found next sibling
            expect(
                CSSselect.selectAll(".parent .middle + h4", document)
            ).toHaveLength(1); // Found next sibling by tag
            expect(
                CSSselect.selectAll(".parent .middle + h3", document)
            ).toHaveLength(0); // An element can't be its own sibling
            expect(
                CSSselect.selectAll(".parent .middle + h2", document)
            ).toHaveLength(0); // Didn't find an older sibling
            expect(
                CSSselect.selectAll(".parent .youngest + .sibling", document)
            ).toHaveLength(0); // Found no younger siblings
        });
    });

    describe("element-context queries", () => {
        it("relationship-first queries", () => {
            expect(
                CSSselect.selectAll(
                    "> .direct-descend",
                    CSSselect.selectAll("#direct-descend", document)
                )
            ).toHaveLength(2); // Found two direct descendents using > first
            expect(
                CSSselect.selectAll(
                    "~ .sibling-selector",
                    CSSselect.selectAll("#sibling-selector", document)
                )
            ).toHaveLength(2); // Found two siblings with ~ first
            expect(
                CSSselect.selectAll(
                    "+ .sibling-selector",
                    CSSselect.selectAll("#sibling-selector", document)
                )
            ).toHaveLength(1); // Found one sibling with + first
            expect(
                CSSselect.selectAll(
                    "> .tokens a",
                    CSSselect.selectAll(".idless", document)[0]
                )
            ).toHaveLength(1); // Found one sibling from a root with no id
        });

        // Should be able to query on an element that hasn't been inserted into the dom
        it("detached fragments", () => {
            expect(CSSselect.selectAll(".a span", frag)).toHaveLength(1); // Should find child elements of fragment
            expect(CSSselect.selectAll("> div p em", frag)).toHaveLength(2); // Should find child elements of fragment, relationship first
        });

        it("byId sub-queries within detached fragment", () => {
            expect(CSSselect.selectAll("#emem", frag)).toHaveLength(1); // Found "#id" in fragment
            expect(CSSselect.selectAll(".d.i #emem", frag)).toHaveLength(1); // Found ".class.class #id" in fragment
            expect(CSSselect.selectAll(".d #oooo #emem", frag)).toHaveLength(1); // Found ".class #id #id" in fragment
            expect(CSSselect.selectAll("> div #oooo", frag)).toHaveLength(1); // Found "> .class #id" in fragment
            expect(
                CSSselect.selectAll("#oooo", CSSselect.selectAll("#emem", frag))
            ).toHaveLength(0); // Shouldn't find #oooo (ancestor) within #emem (descendent)
            expect(
                CSSselect.selectAll("#sep", CSSselect.selectAll("#emem", frag))
            ).toHaveLength(0); // Shouldn't find #sep within #emem (unrelated)
        });

        it("exclude self in match", () => {
            expect(
                CSSselect.selectAll(
                    ".order-matters",
                    CSSselect.selectAll("#order-matters", document)[0]
                )
            ).toHaveLength(4); // Should not include self in element-context queries
        });

        // Because form's have .length
        it("forms can be used as contexts", () => {
            expect(
                CSSselect.selectAll(
                    "*",
                    CSSselect.selectAll("form", document)[0]
                )
            ).toHaveLength(3); // Found 3 elements under &lt;form&gt;
        });
    });

    describe("tokenizer", () => {
        it("should not get weird tokens", () => {
            expect(
                CSSselect.selectAll('div .tokens[title="one"]', document)[0]
            ).toBe(DomUtils.getElementById("token-one", document)); // Found div .tokens[title="one"]
            expect(
                CSSselect.selectAll('div .tokens[title="one two"]', document)[0]
            ).toBe(DomUtils.getElementById("token-two", document)); // Found div .tokens[title="one two"]
            expect(
                CSSselect.selectAll(
                    'div .tokens[title="one two three #%"]',
                    document
                )[0]
            ).toBe(DomUtils.getElementById("token-three", document)); // Found div .tokens[title="one two three #%"]
            expect(
                CSSselect.selectAll(
                    "div .tokens[title='one two three #%'] a",
                    document
                )[0]
            ).toBe(DomUtils.getElementById("token-four", document)); // Found div .tokens[title=\'one two three #%\'] a
            expect(
                CSSselect.selectAll(
                    'div .tokens[title="one two three #%"] a[href$=foo] div',
                    document
                )[0]
            ).toBe(DomUtils.getElementById("token-five", document)); // Found div .tokens[title="one two three #%"] a[href=foo] div
        });
    });

    describe("interesting syntaxes", () => {
        it("should parse bad selectors", () => {
            expect(
                CSSselect.selectAll("#spaced-tokens    p    em    a", document)
                    .length
            ).toBeTruthy(); // Found element with funny tokens
        });
    });

    describe("order matters", () => {
        /*
         * <div id="order-matters">
         *   <p class="order-matters"></p>
         *   <a class="order-matters">
         *     <em class="order-matters"></em><b class="order-matters"></b>
         *   </a>
         * </div>
         */

        it("the order of elements return matters", () => {
            function tag(el: Element) {
                return el.name.toLowerCase();
            }
            const els = CSSselect.selectAll(
                "#order-matters .order-matters",
                document
            ) as Element[];
            expect(tag(els[0])).toBe("p"); // First element matched is a {p} tag
            expect(tag(els[1])).toBe("a"); // First element matched is a {a} tag
            expect(tag(els[2])).toBe("em"); // First element matched is a {em} tag
            expect(tag(els[3])).toBe("b"); // First element matched is a {b} tag
        });
    });

    describe("pseudo-selectors", () => {
        it(":contains", () => {
            expect(
                CSSselect.selectAll("li:contains(humans)", document)
            ).toHaveLength(1); // Found by "element:contains(text)"
            expect(
                CSSselect.selectAll(":contains(humans)", document)
            ).toHaveLength(5); // Found by ":contains(text)", including all ancestors
            // * Is an important case, can cause weird errors
            expect(
                CSSselect.selectAll("*:contains(humans)", document)
            ).toHaveLength(5); // Found by "*:contains(text)", including all ancestors
            expect(
                CSSselect.selectAll("ol:contains(humans)", document)
            ).toHaveLength(1); // Found by "ancestor:contains(text)"
        });

        it(":not", () => {
            expect(CSSselect.selectAll(".odd:not(div)", document)).toHaveLength(
                1
            ); // Found one .odd :not an &lt;a&gt;
        });

        it(":first-child", () => {
            expect(
                CSSselect.selectAll("#pseudos div:first-child", document)[0]
            ).toBe(pseudos[0]); // Found first child
            expect(
                CSSselect.selectAll("#pseudos div:first-child", document)
            ).toHaveLength(1); // Found only 1
        });

        it(":last-child", () => {
            const all = DomUtils.getElementsByTagName("div", pseudos);
            expect(
                CSSselect.selectAll("#pseudos div:last-child", document)[0]
            ).toBe(all[all.length - 1]); // Found last child
            expect(
                CSSselect.selectAll("#pseudos div:last-child", document)
            ).toHaveLength(1); // Found only 1
        });

        it('ol > li[attr="boosh"]:last-child', () => {
            const expected = DomUtils.getElementById(
                "attr-child-boosh",
                document
            );
            expect(
                CSSselect.selectAll(
                    'ol > li[attr="boosh"]:last-child',
                    document
                )
            ).toHaveLength(1); // Only 1 element found
            expect(
                CSSselect.selectAll(
                    'ol > li[attr="boosh"]:last-child',
                    document
                )[0]
            ).toBe(expected); // Found correct element
        });

        it(":nth-child(odd|even|x)", () => {
            const second = DomUtils.getElementsByTagName("div", pseudos)[1];
            expect(
                CSSselect.selectAll("#pseudos :nth-child(odd)", document)
            ).toHaveLength(4); // Found 4 odd elements
            expect(
                CSSselect.selectAll("#pseudos div:nth-child(odd)", document)
            ).toHaveLength(3); // Found 3 odd elements with div tag
            expect(
                CSSselect.selectAll("#pseudos div:nth-child(even)", document)
            ).toHaveLength(3); // Found 3 even elements with div tag
            expect(
                CSSselect.selectAll("#pseudos div:nth-child(2)", document)[0]
            ).toBe(second); // Found 2nd nth-child of pseudos
        });

        it(":nth-child(expr)", () => {
            const fifth = DomUtils.getElementsByTagName("a", pseudos)[0];
            const sixth = DomUtils.getElementsByTagName("div", pseudos)[4];

            expect(
                CSSselect.selectAll("#pseudos :nth-child(3n+1)", document)
            ).toHaveLength(3); // Found 3 elements
            expect(
                CSSselect.selectAll("#pseudos :nth-child(+3n-2)", document)
            ).toHaveLength(3); // Found 3 elements'
            expect(
                CSSselect.selectAll("#pseudos :nth-child(-n+6)", document)
            ).toHaveLength(6); // Found 6 elements
            expect(
                CSSselect.selectAll("#pseudos :nth-child(-n+5)", document)
            ).toHaveLength(5); // Found 5 elements
            expect(
                CSSselect.selectAll("#pseudos :nth-child(3n+2)", document)[1]
            ).toBe(fifth); // Second :nth-child(3n+2) is the fifth child
            expect(
                CSSselect.selectAll("#pseudos :nth-child(3n)", document)[1]
            ).toBe(sixth); // Second :nth-child(3n) is the sixth child
        });

        it(":nth-last-child(odd|even|x)", () => {
            const second = DomUtils.getElementsByTagName("div", pseudos)[1];
            expect(
                CSSselect.selectAll("#pseudos :nth-last-child(odd)", document)
            ).toHaveLength(4); // Found 4 odd elements
            expect(
                CSSselect.selectAll(
                    "#pseudos div:nth-last-child(odd)",
                    document
                )
            ).toHaveLength(3); // Found 3 odd elements with div tag
            expect(
                CSSselect.selectAll(
                    "#pseudos div:nth-last-child(even)",
                    document
                )
            ).toHaveLength(3); // Found 3 even elements with div tag
            expect(
                CSSselect.selectAll(
                    "#pseudos div:nth-last-child(6)",
                    document
                )[0]
            ).toBe(second); // 6th nth-last-child should be 2nd of 7 elements
        });

        it(":nth-last-child(expr)", () => {
            const third = DomUtils.getElementsByTagName("div", pseudos)[2];

            expect(
                CSSselect.selectAll("#pseudos :nth-last-child(3n+1)", document)
            ).toHaveLength(3); // Found 3 elements
            expect(
                CSSselect.selectAll("#pseudos :nth-last-child(3n-2)", document)
            ).toHaveLength(3); // Found 3 elements
            expect(
                CSSselect.selectAll("#pseudos :nth-last-child(-n+6)", document)
            ).toHaveLength(6); // Found 6 elements
            expect(
                CSSselect.selectAll("#pseudos :nth-last-child(-n+5)", document)
            ).toHaveLength(5); // Found 5 elements
            expect(
                CSSselect.selectAll(
                    "#pseudos :nth-last-child(3n+2)",
                    document
                )[0]
            ).toBe(third); // First :nth-last-child(3n+2) is the third child
        });

        it(":nth-of-type(expr)", () => {
            const a = DomUtils.getElementsByTagName("a", pseudos)[0];

            expect(
                CSSselect.selectAll("#pseudos div:nth-of-type(3n+1)", document)
            ).toHaveLength(2); // Found 2 div elements
            expect(
                CSSselect.selectAll("#pseudos a:nth-of-type(3n+1)", document)
            ).toHaveLength(1); // Found 1 a element
            expect(
                CSSselect.selectAll("#pseudos a:nth-of-type(3n+1)", document)[0]
            ).toBe(a); // Found the right a element
            expect(
                CSSselect.selectAll("#pseudos a:nth-of-type(3n)", document)
            ).toHaveLength(0); // No matches for every third a
            expect(
                CSSselect.selectAll("#pseudos a:nth-of-type(odd)", document)
            ).toHaveLength(1); // Found the odd a
            expect(
                CSSselect.selectAll("#pseudos a:nth-of-type(1)", document)
            ).toHaveLength(1); // Found the first a
        });

        it(":nth-last-of-type(expr)", () => {
            const second = DomUtils.getElementsByTagName("div", pseudos)[1];

            expect(
                CSSselect.selectAll(
                    "#pseudos div:nth-last-of-type(3n+1)",
                    document
                )
            ).toHaveLength(2); // Found 2 div elements
            expect(
                CSSselect.selectAll(
                    "#pseudos a:nth-last-of-type(3n+1)",
                    document
                )
            ).toHaveLength(1); // Found 1 a element
            expect(
                CSSselect.selectAll(
                    "#pseudos div:nth-last-of-type(5)",
                    document
                )[0]
            ).toBe(second); // 5th nth-last-of-type should be 2nd of 7 elements
        });

        it(":first-of-type", () => {
            expect(
                CSSselect.selectAll("#pseudos a:first-of-type", document)[0]
            ).toBe(DomUtils.getElementsByTagName("a", pseudos)[0]); // Found first a element
            expect(
                CSSselect.selectAll("#pseudos a:first-of-type", document)
            ).toHaveLength(1); // Found only 1
        });

        it(":last-of-type", () => {
            const all = DomUtils.getElementsByTagName("div", pseudos);
            expect(
                CSSselect.selectAll("#pseudos div:last-of-type", document)[0]
            ).toBe(all[all.length - 1]); // Found last div element
            expect(
                CSSselect.selectAll("#pseudos div:last-of-type", document)
            ).toHaveLength(1); // Found only 1
        });

        it(":only-of-type", () => {
            expect(
                CSSselect.selectAll("#pseudos a:only-of-type", document)[0]
            ).toBe(DomUtils.getElementsByTagName("a", pseudos)[0]); // Found the only a element
            expect(
                CSSselect.selectAll("#pseudos a:first-of-type", document)
            ).toHaveLength(1); // Found only 1
        });

        it(":target", () => {
            location.hash = "";
            expect(
                CSSselect.selectAll("#pseudos:target", document)
            ).toHaveLength(0); // #pseudos is not the target
            location.hash = "#pseudos";
            expect(
                CSSselect.selectAll("#pseudos:target", document)
            ).toHaveLength(1); // Now #pseudos is the target
            location.hash = "";
        });

        it("custom pseudos", () => {
            // :humanoid implemented just for testing purposes
            expect(CSSselect.selectAll(":humanoid", document)).toHaveLength(2); // Selected using custom pseudo
        });
    });

    describe("is()", () => {
        it("simple selectors", () => {
            expect(CSSselect.is(el, "li")).toBeTruthy(); // Tag
            expect(CSSselect.is(el, "*")).toBeTruthy(); // Wildcard
            expect(CSSselect.is(el, "#attr-child-boosh")).toBeTruthy(); // #id
            expect(CSSselect.is(el, "[attr]")).toBeTruthy(); // [attr]
            expect(CSSselect.is(el, "[attr=boosh]")).toBeTruthy(); // [attr=val]
            expect(CSSselect.is(el, "div")).toBeFalsy(); // Wrong tag
            expect(CSSselect.is(el, "#foo")).toBeFalsy(); // Wrong #id
            expect(CSSselect.is(el, "[foo]")).toBeFalsy(); // Wrong [attr]
            expect(CSSselect.is(el, "[attr=foo]")).toBeFalsy(); // Wrong [attr=val]
        });

        it("selector sequences", () => {
            expect(
                CSSselect.is(el, "li#attr-child-boosh[attr=boosh]")
            ).toBeTruthy(); // Tag#id[attr=val]
            expect(
                CSSselect.is(el, "div#attr-child-boosh[attr=boosh]")
            ).toBeFalsy(); // Wrong tag#id[attr=val]
        });

        it("selector sequences combinators", () => {
            expect(CSSselect.is(el, "ol li")).toBeTruthy(); // Tag tag
            expect(CSSselect.is(el, "ol>li")).toBeTruthy(); // Tag>tag
            expect(CSSselect.is(el, "ol>li+li")).toBeTruthy(); // Tab>tag+tag
            expect(
                CSSselect.is(el, "ol#list li#attr-child-boosh[attr=boosh]")
            ).toBeTruthy(); // Tag#id tag#id[attr=val]
            expect(
                CSSselect.is(el, "ol#list>li#attr-child-boosh[attr=boosh]")
            ).toBeFalsy(); // Wrong tag#id>tag#id[attr=val]
            expect(
                CSSselect.is(el, "ol ol li#attr-child-boosh[attr=boosh]")
            ).toBeTruthy(); // Tag tag tag#id[attr=val]
            expect(
                CSSselect.is(
                    CSSselect.selectAll("#token-four", document)[0],
                    "div#fixtures>div a"
                )
            ).toBeTruthy(); // Tag#id>tag tag where ambiguous middle tag requires backtracking
        });

        it("pseudos", () => {
            expect(CSSselect.is(el, "li:contains(hello)")).toBe(true); // Matching :contains(text)
            expect(CSSselect.is(el, "li:contains(human)")).toBe(false); // Non-matching :contains(text)
            expect(
                CSSselect.is(
                    CSSselect.selectAll("#list>li", document)[2],
                    ":humanoid"
                )
            ).toBe(true); // Matching custom pseudo
            expect(
                CSSselect.is(
                    CSSselect.selectAll("#list>li", document)[1],
                    ":humanoid"
                )
            ).toBe(false); // Non-matching custom pseudo
        });

        it("context", () => {
            expect(
                CSSselect.is(el, "li#attr-child-boosh[attr=boosh]", {
                    context: CSSselect.selectAll(
                        "#list",
                        document
                    )[0] as Element,
                })
            ).toBeTruthy(); // Context
            expect(
                CSSselect.is(el, "ol#list li#attr-child-boosh[attr=boosh]", {
                    context: CSSselect.selectAll(
                        "#boosh",
                        document
                    )[0] as Element,
                })
            ).toBeFalsy(); // Wrong context
        });
    });

    describe("selecting elements in other documents", () => {
        it("get element by id", () => {
            const result = CSSselect.selectAll("#hsoob", doc);
            expect(result[0]).toBeTruthy(); // Found element with id=hsoob
        });

        it("get elements by class", () => {
            expect(CSSselect.selectAll("#hsoob .a", doc)).toHaveLength(2); // Found two elements
            expect(CSSselect.selectAll("#hsoob div.a", doc)[0]).toBeTruthy(); // Found one element
            expect(CSSselect.selectAll("#hsoob div", doc)).toHaveLength(2); // Found two {div} elements
            expect(CSSselect.selectAll("#hsoob span", doc)[0]).toBeTruthy(); // Found one {span} element
            expect(CSSselect.selectAll("#hsoob div div", doc)[0]).toBeTruthy(); // Found a single div
            expect(CSSselect.selectAll("p.odd", doc)).toHaveLength(1); // Found single br
        });

        it("complex selectors", () => {
            expect(CSSselect.selectAll(".d ~ .sib", doc)).toHaveLength(2); // Found one ~ sibling
            expect(CSSselect.selectAll(".a .d + .sib", doc)).toHaveLength(1); // Found 2 + siblings
            expect(CSSselect.selectAll("#hsoob > div > .h", doc)).toHaveLength(
                1
            ); // Found span using child selectors
            expect(
                CSSselect.selectAll('.a .d ~ .sib[test="f g"]', doc)
            ).toHaveLength(1); // Found 1 ~ sibling with test attribute
        });

        it("byId sub-queries", () => {
            expect(CSSselect.selectAll("#hsoob #spanny", doc)).toHaveLength(1); // Found "#id #id" in frame
            expect(CSSselect.selectAll(".a #spanny", doc)).toHaveLength(1); // Found ".class #id" in frame
            expect(
                CSSselect.selectAll(".a #booshTest #spanny", doc)
            ).toHaveLength(1); // Found ".class #id #id" in frame
            expect(CSSselect.selectAll("> #hsoob", doc)).toHaveLength(1); // Found "> #id" in frame
        });

        it("byId sub-queries within sub-context", () => {
            expect(
                CSSselect.selectAll(
                    "#spanny",
                    CSSselect.selectAll("#hsoob", doc)
                )
            ).toHaveLength(1); // Found "#id -> #id" in frame
            expect(
                CSSselect.selectAll(
                    ".a #spanny",
                    CSSselect.selectAll("#hsoob", doc)
                )
            ).toHaveLength(1); // Found ".class #id" in frame
            expect(
                CSSselect.selectAll(
                    ".a #booshTest #spanny",
                    CSSselect.selectAll("#hsoob", doc)
                )
            ).toHaveLength(1); // Found ".class #id #id" in frame
            expect(
                CSSselect.selectAll(
                    ".a > #booshTest",
                    CSSselect.selectAll("#hsoob", doc)
                )
            ).toHaveLength(1); // Found "> .class #id" in frame
            expect(
                CSSselect.selectAll(
                    "#booshTest",
                    CSSselect.selectAll("#spanny", doc)
                )
            ).toHaveLength(0); // Shouldn't find #booshTest (ancestor) within #spanny (descendent)
            expect(
                CSSselect.selectAll(
                    "#booshTest",
                    CSSselect.selectAll("#lonelyHsoob", doc)
                )
            ).toHaveLength(0); // Shouldn't find #booshTest within #lonelyHsoob (unrelated)
        });
    });
});
