import * as helper from "./tools/helper";
const document = helper.getDocument("qwery.html");
import * as CSSselect from "../src";
import * as DomUtils from "domutils";
import type { AnyNode, Element } from "domhandler";
import { parseDOM } from "htmlparser2";

const location = { hash: "" };
const options = {
    pseudos: {
        target: (elem: Element) =>
            DomUtils.getAttributeValue(elem, "id") === location.hash.substr(1),
        humanoid: ":matches(li,ol):contains(human)",
    },
};

function selectAll(selector: string, context: AnyNode | AnyNode[] = document) {
    return CSSselect.selectAll<AnyNode, Element>(selector, context, options);
}

// ---

/*
 * Adapted from https://github.com/ded/qwery/blob/master/tests/tests.js
 */

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

const el = document.getElementById("attr-child-boosh");

const pseudos = document
    .getElementById("pseudos")
    .children.filter(DomUtils.isTag);

describe("qwery", () => {
    describe("Contexts", () => {
        it("should be able to pass optional context", () => {
            expect(selectAll(".a")).toHaveLength(3); // No context found 3 elements (.a)
            expect(selectAll(".a", selectAll("#boosh"))).toHaveLength(2); // Context found 2 elements (#boosh .a)
        });

        it("should be able to pass qwery result as context", () => {
            expect(selectAll(".a", selectAll("#boosh"))).toHaveLength(2); // Context found 2 elements(.a, #boosh)
            expect(selectAll("> .a", selectAll(".a"))).toHaveLength(1); // Context found 0 elements(.a, .a)
            expect(selectAll("> .a", selectAll(".b"))).toHaveLength(1); // Context found 1 elements(.a, .b)
            expect(selectAll("> .a", selectAll("#boosh .b"))).toHaveLength(1); // Context found 1 elements(.a, #boosh .b)
            expect(selectAll("> .b", selectAll("#boosh .b"))).toHaveLength(0); // Context found 0 elements(.b, #boosh .b)
        });

        it("should not return duplicates from combinators", () => {
            expect(selectAll("#boosh,#boosh")).toHaveLength(1); // Two booshes dont make a thing go right
            expect(selectAll("#boosh,.apples,#boosh")).toHaveLength(1); // Two booshes and an apple dont make a thing go right
        });

        it("byId sub-queries within context", () => {
            expect(selectAll("#booshTest", selectAll("#boosh"))).toHaveLength(
                1
            ); // Found "#id #id"
            expect(
                selectAll(".a.b #booshTest", selectAll("#boosh"))
            ).toHaveLength(1); // Found ".class.class #id"
            expect(
                selectAll(".a>#booshTest", selectAll("#boosh"))
            ).toHaveLength(1); // Found ".class>#id"
            expect(
                selectAll(">.a>#booshTest", selectAll("#boosh"))
            ).toHaveLength(1); // Found ">.class>#id"
            expect(selectAll("#boosh", selectAll("#booshTest"))).toHaveLength(
                0
            ); // Shouldn't find #boosh (ancestor) within #booshTest (descendent)
            expect(selectAll("#boosh", selectAll("#lonelyBoosh"))).toHaveLength(
                0
            ); // Shouldn't find #boosh within #lonelyBoosh (unrelated)
        });
    });

    describe("CSS 1", () => {
        it("get element by id", () => {
            const result = selectAll("#boosh");
            expect(result[0]).toBeTruthy(); // Found element with id=boosh
            expect(selectAll("h1")[0]).toBeTruthy(); // Found 1 h1
        });

        it("byId sub-queries", () => {
            expect(selectAll("#boosh #booshTest")).toHaveLength(1); // Found "#id #id"
            expect(selectAll(".a.b #booshTest")).toHaveLength(1); // Found ".class.class #id"
            expect(selectAll("#boosh>.a>#booshTest")).toHaveLength(1); // Found "#id>.class>#id"
            expect(selectAll(".a>#booshTest")).toHaveLength(1); // Found ".class>#id"
        });

        it("get elements by class", () => {
            expect(selectAll("#boosh .a")).toHaveLength(2); // Found two elements
            expect(selectAll("#boosh div.a")[0]).toBeTruthy(); // Found one element
            expect(selectAll("#boosh div")).toHaveLength(2); // Found two {div} elements
            expect(selectAll("#boosh span")[0]).toBeTruthy(); // Found one {span} element
            expect(selectAll("#boosh div div")[0]).toBeTruthy(); // Found a single div
            expect(selectAll("a.odd")).toHaveLength(1); // Found single a
        });

        it("combos", () => {
            expect(selectAll("#boosh div,#boosh span")).toHaveLength(3); // Found 2 divs and 1 span
        });

        it("class with dashes", () => {
            expect(selectAll(".class-with-dashes")).toHaveLength(1); // Found something
        });

        it("should ignore comment nodes", () => {
            expect(selectAll("#boosh *")).toHaveLength(4); // Found only 4 elements under #boosh
        });

        it("deep messy relationships", () => {
            /*
             * These are mostly characterised by a combination of tight relationships and loose relationships
             * on the right side of the query it's easy to find matches but they tighten up quickly as you
             * go to the left
             * they are useful for making sure the dom crawler doesn't stop short or over-extend as it works
             * up the tree the crawl needs to be comprehensive
             */
            expect(selectAll("div#fixtures > div a")).toHaveLength(5); // Found four results for "div#fixtures > div a"
            expect(
                selectAll(".direct-descend > .direct-descend .lvl2")
            ).toHaveLength(1); // Found one result for ".direct-descend > .direct-descend .lvl2"
            expect(
                selectAll(".direct-descend > .direct-descend div")
            ).toHaveLength(1); // Found one result for ".direct-descend > .direct-descend div"
            expect(
                selectAll(".direct-descend > .direct-descend div")
            ).toHaveLength(1); // Found one result for ".direct-descend > .direct-descend div"
            expect(selectAll("div#fixtures div ~ a div")).toHaveLength(0); // Found no results for odd query
            expect(
                selectAll(
                    ".direct-descend > .direct-descend > .direct-descend ~ .lvl2"
                )
            ).toHaveLength(0); // Found no results for another odd query
        });
    });

    describe("CSS 2", () => {
        it("get elements by attribute", () => {
            const wanted = selectAll("#boosh div[test]")[0];
            const expected = document.getElementById("booshTest");
            expect(wanted).toBe(expected); // Found attribute
            expect(selectAll("#boosh div[test=fg]")[0]).toBe(expected); // Found attribute with value
            expect(selectAll('em[rel~="copyright"]')).toHaveLength(1); // Found em[rel~="copyright"]
            expect(selectAll('em[nopass~="copyright"]')).toHaveLength(0); // Found em[nopass~="copyright"]
        });

        it("should not throw error by attribute selector", () => {
            expect(selectAll('[foo^="bar"]')).toHaveLength(1); // Found 1 element
        });

        it("crazy town", () => {
            const el = document.getElementById("attr-test3");
            expect(
                selectAll('div#attr-test3.found.you[title="whatup duders"]')[0]
            ).toBe(el); // Found the right element
        });
    });

    describe("attribute selectors", () => {
        /* CSS 2 SPEC */

        it("[attr]", () => {
            const expected = document.getElementById("attr-test-1");
            expect(selectAll("#attributes div[unique-test]")[0]).toBe(expected); // Found attribute with [attr]
        });

        it("[attr=val]", () => {
            const expected = document.getElementById("attr-test-2");
            expect(selectAll('#attributes div[test="two-foo"]')[0]).toBe(
                expected
            ); // Found attribute with =
            expect(selectAll("#attributes div[test='two-foo']")[0]).toBe(
                expected
            ); // Found attribute with =
            expect(selectAll("#attributes div[test=two-foo]")[0]).toBe(
                expected
            ); // Found attribute with =
        });

        it("[attr~=val]", () => {
            const expected = document.getElementById("attr-test-3");
            expect(selectAll("#attributes div[test~=three]")[0]).toBe(expected); // Found attribute with ~=
        });

        it("[attr|=val]", () => {
            const expected = document.getElementById("attr-test-2");
            expect(selectAll('#attributes div[test|="two-foo"]')[0]).toBe(
                expected
            ); // Found attribute with |=
            expect(selectAll("#attributes div[test|=two]")[0]).toBe(expected); // Found attribute with |=
        });

        it("[href=#x] special case", () => {
            const expected = document.getElementById("attr-test-4");
            expect(selectAll('#attributes a[href="#aname"]')[0]).toBe(expected); // Found attribute with href=#x
        });

        /* CSS 3 SPEC */

        it("[attr^=val]", () => {
            const expected = document.getElementById("attr-test-2");
            expect(selectAll("#attributes div[test^=two]")[0]).toBe(expected); // Found attribute with ^=
        });

        it("[attr$=val]", () => {
            const expected = document.getElementById("attr-test-2");
            expect(selectAll("#attributes div[test$=foo]")[0]).toBe(expected); // Found attribute with $=
        });

        it("[attr*=val]", () => {
            const expected = document.getElementById("attr-test-3");
            expect(selectAll("#attributes div[test*=hree]")[0]).toBe(expected); // Found attribute with *=
        });

        it("direct descendants", () => {
            expect(selectAll("#direct-descend > .direct-descend")).toHaveLength(
                2
            ); // Found two direct descendents
            expect(
                selectAll("#direct-descend > .direct-descend > .lvl2")
            ).toHaveLength(3); // Found three second-level direct descendents
        });

        it("sibling elements", () => {
            expect(
                selectAll("#sibling-selector ~ .sibling-selector")
            ).toHaveLength(2); // Found two siblings
            expect(
                selectAll("#sibling-selector ~ div.sibling-selector")
            ).toHaveLength(2); // Found two siblings
            expect(
                selectAll("#sibling-selector + div.sibling-selector")
            ).toHaveLength(1); // Found one sibling
            expect(
                selectAll("#sibling-selector + .sibling-selector")
            ).toHaveLength(1); // Found one sibling

            expect(selectAll(".parent .oldest ~ .sibling")).toHaveLength(4); // Found four younger siblings
            expect(selectAll(".parent .middle ~ .sibling")).toHaveLength(2); // Found two younger siblings
            expect(selectAll(".parent .middle ~ h4")).toHaveLength(1); // Found next sibling by tag
            expect(selectAll(".parent .middle ~ h4.younger")).toHaveLength(1); // Found next sibling by tag and class
            expect(selectAll(".parent .middle ~ h3")).toHaveLength(0); // An element can't be its own sibling
            expect(selectAll(".parent .middle ~ h2")).toHaveLength(0); // Didn't find an older sibling
            expect(selectAll(".parent .youngest ~ .sibling")).toHaveLength(0); // Found no younger siblings

            expect(selectAll(".parent .oldest + .sibling")).toHaveLength(1); // Found next sibling
            expect(selectAll(".parent .middle + .sibling")).toHaveLength(1); // Found next sibling
            expect(selectAll(".parent .middle + h4")).toHaveLength(1); // Found next sibling by tag
            expect(selectAll(".parent .middle + h3")).toHaveLength(0); // An element can't be its own sibling
            expect(selectAll(".parent .middle + h2")).toHaveLength(0); // Didn't find an older sibling
            expect(selectAll(".parent .youngest + .sibling")).toHaveLength(0); // Found no younger siblings
        });
    });

    describe("element-context queries", () => {
        it("relationship-first queries", () => {
            expect(
                selectAll("> .direct-descend", selectAll("#direct-descend"))
            ).toHaveLength(2); // Found two direct descendents using > first
            expect(
                selectAll("~ .sibling-selector", selectAll("#sibling-selector"))
            ).toHaveLength(2); // Found two siblings with ~ first
            expect(
                selectAll("+ .sibling-selector", selectAll("#sibling-selector"))
            ).toHaveLength(1); // Found one sibling with + first
            expect(
                selectAll("> .tokens a", selectAll(".idless")[0])
            ).toHaveLength(1); // Found one sibling from a root with no id
        });

        // Should be able to query on an element that hasn't been inserted into the dom
        it("detached fragments", () => {
            expect(selectAll(".a span", frag)).toHaveLength(1); // Should find child elements of fragment
            expect(selectAll("> div p em", frag)).toHaveLength(2); // Should find child elements of fragment, relationship first
        });

        it("byId sub-queries within detached fragment", () => {
            expect(selectAll("#emem", frag)).toHaveLength(1); // Found "#id" in fragment
            expect(selectAll(".d.i #emem", frag)).toHaveLength(1); // Found ".class.class #id" in fragment
            expect(selectAll(".d #oooo #emem", frag)).toHaveLength(1); // Found ".class #id #id" in fragment
            expect(selectAll("> div #oooo", frag)).toHaveLength(1); // Found "> .class #id" in fragment
            expect(selectAll("#oooo", selectAll("#emem", frag))).toHaveLength(
                0
            ); // Shouldn't find #oooo (ancestor) within #emem (descendent)
            expect(selectAll("#sep", selectAll("#emem", frag))).toHaveLength(0); // Shouldn't find #sep within #emem (unrelated)
        });

        it("exclude self in match", () => {
            expect(
                selectAll(".order-matters", selectAll("#order-matters")[0])
            ).toHaveLength(4); // Should not include self in element-context queries
        });

        // Because form's have .length
        it("forms can be used as contexts", () => {
            expect(selectAll("*", selectAll("form")[0])).toHaveLength(3); // Found 3 elements under &lt;form&gt;
        });
    });

    describe("tokenizer", () => {
        it("should not get weird tokens", () => {
            expect(selectAll('div .tokens[title="one"]')[0]).toBe(
                document.getElementById("token-one")
            ); // Found div .tokens[title="one"]
            expect(selectAll('div .tokens[title="one two"]')[0]).toBe(
                document.getElementById("token-two")
            ); // Found div .tokens[title="one two"]
            expect(selectAll('div .tokens[title="one two three #%"]')[0]).toBe(
                document.getElementById("token-three")
            ); // Found div .tokens[title="one two three #%"]
            expect(
                selectAll("div .tokens[title='one two three #%'] a")[0]
            ).toBe(document.getElementById("token-four")); // Found div .tokens[title=\'one two three #%\'] a
            expect(
                selectAll(
                    'div .tokens[title="one two three #%"] a[href$=foo] div'
                )[0]
            ).toBe(document.getElementById("token-five")); // Found div .tokens[title="one two three #%"] a[href=foo] div
        });
    });

    describe("interesting syntaxes", () => {
        it("should parse bad selectors", () => {
            expect(
                selectAll("#spaced-tokens    p    em    a").length
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
            const els = selectAll("#order-matters .order-matters") as Element[];
            expect(tag(els[0])).toBe("p"); // First element matched is a {p} tag
            expect(tag(els[1])).toBe("a"); // First element matched is a {a} tag
            expect(tag(els[2])).toBe("em"); // First element matched is a {em} tag
            expect(tag(els[3])).toBe("b"); // First element matched is a {b} tag
        });
    });

    describe("pseudo-selectors", () => {
        it(":contains", () => {
            expect(selectAll("li:contains(humans)")).toHaveLength(1); // Found by "element:contains(text)"
            expect(selectAll(":contains(humans)")).toHaveLength(5); // Found by ":contains(text)", including all ancestors
            // * Is an important case, can cause weird errors
            expect(selectAll("*:contains(humans)")).toHaveLength(5); // Found by "*:contains(text)", including all ancestors
            expect(selectAll("ol:contains(humans)")).toHaveLength(1); // Found by "ancestor:contains(text)"
        });

        it(":not", () => {
            expect(selectAll(".odd:not(div)")).toHaveLength(1); // Found one .odd :not an &lt;a&gt;
        });

        it(":first-child", () => {
            expect(selectAll("#pseudos div:first-child")[0]).toBe(pseudos[0]); // Found first child
            expect(selectAll("#pseudos div:first-child")).toHaveLength(1); // Found only 1
        });

        it(":last-child", () => {
            const all = DomUtils.getElementsByTagName("div", pseudos);
            expect(selectAll("#pseudos div:last-child")[0]).toBe(
                all[all.length - 1]
            ); // Found last child
            expect(selectAll("#pseudos div:last-child")).toHaveLength(1); // Found only 1
        });

        it('ol > li[attr="boosh"]:last-child', () => {
            const expected = document.getElementById("attr-child-boosh");
            expect(selectAll('ol > li[attr="boosh"]:last-child')).toHaveLength(
                1
            ); // Only 1 element found
            expect(selectAll('ol > li[attr="boosh"]:last-child')[0]).toBe(
                expected
            ); // Found correct element
        });

        it(":nth-child(odd|even|x)", () => {
            const second = DomUtils.getElementsByTagName("div", pseudos)[1];
            expect(selectAll("#pseudos :nth-child(odd)")).toHaveLength(4); // Found 4 odd elements
            expect(selectAll("#pseudos div:nth-child(odd)")).toHaveLength(3); // Found 3 odd elements with div tag
            expect(selectAll("#pseudos div:nth-child(even)")).toHaveLength(3); // Found 3 even elements with div tag
            expect(selectAll("#pseudos div:nth-child(2)")[0]).toBe(second); // Found 2nd nth-child of pseudos
        });

        it(":nth-child(expr)", () => {
            const fifth = DomUtils.getElementsByTagName("a", pseudos)[0];
            const sixth = DomUtils.getElementsByTagName("div", pseudos)[4];

            expect(selectAll("#pseudos :nth-child(3n+1)")).toHaveLength(3); // Found 3 elements
            expect(selectAll("#pseudos :nth-child(+3n-2)")).toHaveLength(3); // Found 3 elements'
            expect(selectAll("#pseudos :nth-child(-n+6)")).toHaveLength(6); // Found 6 elements
            expect(selectAll("#pseudos :nth-child(-n+5)")).toHaveLength(5); // Found 5 elements
            expect(selectAll("#pseudos :nth-child(3n+2)")[1]).toBe(fifth); // Second :nth-child(3n+2) is the fifth child
            expect(selectAll("#pseudos :nth-child(3n)")[1]).toBe(sixth); // Second :nth-child(3n) is the sixth child
        });

        it(":nth-last-child(odd|even|x)", () => {
            const second = DomUtils.getElementsByTagName("div", pseudos)[1];
            expect(selectAll("#pseudos :nth-last-child(odd)")).toHaveLength(4); // Found 4 odd elements
            expect(selectAll("#pseudos div:nth-last-child(odd)")).toHaveLength(
                3
            ); // Found 3 odd elements with div tag
            expect(selectAll("#pseudos div:nth-last-child(even)")).toHaveLength(
                3
            ); // Found 3 even elements with div tag
            expect(selectAll("#pseudos div:nth-last-child(6)")[0]).toBe(second); // 6th nth-last-child should be 2nd of 7 elements
        });

        it(":nth-last-child(expr)", () => {
            const third = DomUtils.getElementsByTagName("div", pseudos)[2];

            expect(selectAll("#pseudos :nth-last-child(3n+1)")).toHaveLength(3); // Found 3 elements
            expect(selectAll("#pseudos :nth-last-child(3n-2)")).toHaveLength(3); // Found 3 elements
            expect(selectAll("#pseudos :nth-last-child(-n+6)")).toHaveLength(6); // Found 6 elements
            expect(selectAll("#pseudos :nth-last-child(-n+5)")).toHaveLength(5); // Found 5 elements
            expect(selectAll("#pseudos :nth-last-child(3n+2)")[0]).toBe(third); // First :nth-last-child(3n+2) is the third child
        });

        it(":nth-of-type(expr)", () => {
            const a = DomUtils.getElementsByTagName("a", pseudos)[0];

            expect(selectAll("#pseudos div:nth-of-type(3n+1)")).toHaveLength(2); // Found 2 div elements
            expect(selectAll("#pseudos a:nth-of-type(3n+1)")).toHaveLength(1); // Found 1 a element
            expect(selectAll("#pseudos a:nth-of-type(3n+1)")[0]).toBe(a); // Found the right a element
            expect(selectAll("#pseudos a:nth-of-type(3n)")).toHaveLength(0); // No matches for every third a
            expect(selectAll("#pseudos a:nth-of-type(odd)")).toHaveLength(1); // Found the odd a
            expect(selectAll("#pseudos a:nth-of-type(1)")).toHaveLength(1); // Found the first a
        });

        it(":nth-last-of-type(expr)", () => {
            const second = DomUtils.getElementsByTagName("div", pseudos)[1];

            expect(
                selectAll("#pseudos div:nth-last-of-type(3n+1)")
            ).toHaveLength(2); // Found 2 div elements
            expect(selectAll("#pseudos a:nth-last-of-type(3n+1)")).toHaveLength(
                1
            ); // Found 1 a element
            expect(selectAll("#pseudos div:nth-last-of-type(5)")[0]).toBe(
                second
            ); // 5th nth-last-of-type should be 2nd of 7 elements
        });

        it(":first-of-type", () => {
            expect(selectAll("#pseudos a:first-of-type")[0]).toBe(
                DomUtils.getElementsByTagName("a", pseudos)[0]
            ); // Found first a element
            expect(selectAll("#pseudos a:first-of-type")).toHaveLength(1); // Found only 1
        });

        it(":last-of-type", () => {
            const all = DomUtils.getElementsByTagName("div", pseudos);
            expect(selectAll("#pseudos div:last-of-type")[0]).toBe(
                all[all.length - 1]
            ); // Found last div element
            expect(selectAll("#pseudos div:last-of-type")).toHaveLength(1); // Found only 1
        });

        it(":only-of-type", () => {
            expect(selectAll("#pseudos a:only-of-type")[0]).toBe(
                DomUtils.getElementsByTagName("a", pseudos)[0]
            ); // Found the only a element
            expect(selectAll("#pseudos a:first-of-type")).toHaveLength(1); // Found only 1
        });

        it(":target", () => {
            location.hash = "";
            expect(selectAll("#pseudos:target")).toHaveLength(0); // #pseudos is not the target
            location.hash = "#pseudos";
            expect(selectAll("#pseudos:target")).toHaveLength(1); // Now #pseudos is the target
            location.hash = "";
        });

        it("custom pseudos", () => {
            // :humanoid implemented just for testing purposes
            expect(selectAll(":humanoid")).toHaveLength(2); // Selected using custom pseudo
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
                CSSselect.is(selectAll("#token-four")[0], "div#fixtures>div a")
            ).toBeTruthy(); // Tag#id>tag tag where ambiguous middle tag requires backtracking
        });

        it("pseudos", () => {
            expect(CSSselect.is(el, "li:contains(hello)")).toBe(true); // Matching :contains(text)
            expect(CSSselect.is(el, "li:contains(human)")).toBe(false); // Non-matching :contains(text)
            expect(
                CSSselect.is(selectAll("#list>li")[2], ":humanoid", options)
            ).toBe(true); // Matching custom pseudo
            expect(
                CSSselect.is(selectAll("#list>li")[1], ":humanoid", options)
            ).toBe(false); // Non-matching custom pseudo
        });

        it("context", () => {
            expect(
                CSSselect.is(el, "li#attr-child-boosh[attr=boosh]", {
                    context: selectAll("#list")[0],
                })
            ).toBeTruthy(); // Context
            expect(
                CSSselect.is(el, "ol#list li#attr-child-boosh[attr=boosh]", {
                    context: selectAll("#boosh")[0],
                })
            ).toBeFalsy(); // Wrong context
        });
    });

    describe("selecting elements in other documents", () => {
        it("get element by id", () => {
            const result = selectAll("#hsoob", doc);
            expect(result[0]).toBeTruthy(); // Found element with id=hsoob
        });

        it("get elements by class", () => {
            expect(selectAll("#hsoob .a", doc)).toHaveLength(2); // Found two elements
            expect(selectAll("#hsoob div.a", doc)[0]).toBeTruthy(); // Found one element
            expect(selectAll("#hsoob div", doc)).toHaveLength(2); // Found two {div} elements
            expect(selectAll("#hsoob span", doc)[0]).toBeTruthy(); // Found one {span} element
            expect(selectAll("#hsoob div div", doc)[0]).toBeTruthy(); // Found a single div
            expect(selectAll("p.odd", doc)).toHaveLength(1); // Found single br
        });

        it("complex selectors", () => {
            expect(selectAll(".d ~ .sib", doc)).toHaveLength(2); // Found one ~ sibling
            expect(selectAll(".a .d + .sib", doc)).toHaveLength(1); // Found 2 + siblings
            expect(selectAll("#hsoob > div > .h", doc)).toHaveLength(1); // Found span using child selectors
            expect(selectAll('.a .d ~ .sib[test="f g"]', doc)).toHaveLength(1); // Found 1 ~ sibling with test attribute
        });

        it("byId sub-queries", () => {
            expect(selectAll("#hsoob #spanny", doc)).toHaveLength(1); // Found "#id #id" in frame
            expect(selectAll(".a #spanny", doc)).toHaveLength(1); // Found ".class #id" in frame
            expect(selectAll(".a #booshTest #spanny", doc)).toHaveLength(1); // Found ".class #id #id" in frame
            expect(selectAll("> #hsoob", doc)).toHaveLength(1); // Found "> #id" in frame
        });

        it("byId sub-queries within sub-context", () => {
            expect(selectAll("#spanny", selectAll("#hsoob", doc))).toHaveLength(
                1
            ); // Found "#id -> #id" in frame
            expect(
                selectAll(".a #spanny", selectAll("#hsoob", doc))
            ).toHaveLength(1); // Found ".class #id" in frame
            expect(
                selectAll(".a #booshTest #spanny", selectAll("#hsoob", doc))
            ).toHaveLength(1); // Found ".class #id #id" in frame
            expect(
                selectAll(".a > #booshTest", selectAll("#hsoob", doc))
            ).toHaveLength(1); // Found "> .class #id" in frame
            expect(
                selectAll("#booshTest", selectAll("#spanny", doc))
            ).toHaveLength(0); // Shouldn't find #booshTest (ancestor) within #spanny (descendent)
            expect(
                selectAll("#booshTest", selectAll("#lonelyHsoob", doc))
            ).toHaveLength(0); // Shouldn't find #booshTest within #lonelyHsoob (unrelated)
        });
    });
});
