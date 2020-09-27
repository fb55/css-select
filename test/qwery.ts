import expect from "expect.js";
import { DomUtils } from "htmlparser2";
import * as helper from "./tools/helper";
const document = helper.getDocument("qwery.html");
import * as CSSselect from "../src";
import type { Node, Element } from "domhandler";

const location = { hash: "" };
CSSselect.pseudos.target = (elem, { adapter }) =>
    adapter.getAttributeValue(elem, "id") === location.hash.substr(1);

const getElementsByTagName = (id: string, document: Node | Node[]) =>
    DomUtils.getElementsByTagName(id, document, true);
// ---

/*
	The following is taken from https://github.com/ded/qwery/blob/master/tests/tests.js
*/

CSSselect.pseudos.humanoid = (e) =>
    CSSselect.is(e, ":matches(li,ol):contains(human)");

const frag = helper.getDOM(
    '<root><div class="d i v">' +
        '<p id="oooo"><em></em><em id="emem"></em></p>' +
        "</div>" +
        '<p id="sep">' +
        '<div class="a"><span></span></div>' +
        "</p></root>"
);

const doc = helper.getDOM(
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

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const pseudos = DomUtils.getElementById("pseudos", document)!.children.filter(
    DomUtils.isTag
);

describe("qwery", () => {
    describe("Contexts", () => {
        it("should be able to pass optional context", () => {
            expect(CSSselect.selectAll(".a", document)).to.have.length(3); // no context found 3 elements (.a)
            expect(
                CSSselect.selectAll(
                    ".a",
                    CSSselect.selectAll("#boosh", document)
                )
            ).to.have.length(2); // context found 2 elements (#boosh .a)
        });

        it.skip("should be able to pass qwery result as context", () => {
            expect(
                CSSselect.selectAll(
                    ".a",
                    CSSselect.selectAll("#boosh", document)
                )
            ).to.have.length(2); // context found 2 elements(.a, #boosh)
            expect(
                CSSselect.selectAll(".a", CSSselect.selectAll(".a", document))
            ).to.be.empty(); // context found 0 elements(.a, .a)
            expect(
                CSSselect.selectAll(".a", CSSselect.selectAll(".b", document))
            ).to.have.length(1); // context found 1 elements(.a, .b)
            expect(
                CSSselect.selectAll(
                    ".a",
                    CSSselect.selectAll("#boosh .b", document)
                )
            ).to.have.length(1); // context found 1 elements(.a, #boosh .b)
            expect(
                CSSselect.selectAll(
                    ".b",
                    CSSselect.selectAll("#boosh .b", document)
                )
            ).to.be.empty(); // context found 0 elements(.b, #boosh .b)
        });

        it("should not return duplicates from combinators", () => {
            expect(
                CSSselect.selectAll("#boosh,#boosh", document)
            ).to.have.length(1); // two booshes dont make a thing go right
            expect(
                CSSselect.selectAll("#boosh,.apples,#boosh", document)
            ).to.have.length(1); // two booshes and an apple dont make a thing go right
        });

        it("byId sub-queries within context", () => {
            expect(
                CSSselect.selectAll(
                    "#booshTest",
                    CSSselect.selectAll("#boosh", document)
                )
            ).to.have.length(1); // found "#id #id"
            expect(
                CSSselect.selectAll(
                    ".a.b #booshTest",
                    CSSselect.selectAll("#boosh", document)
                )
            ).to.have.length(1); // found ".class.class #id"
            expect(
                CSSselect.selectAll(
                    ".a>#booshTest",
                    CSSselect.selectAll("#boosh", document)
                )
            ).to.have.length(1); // found ".class>#id"
            expect(
                CSSselect.selectAll(
                    ">.a>#booshTest",
                    CSSselect.selectAll("#boosh", document)
                )
            ).to.have.length(1); // found ">.class>#id"
            expect(
                CSSselect.selectAll(
                    "#boosh",
                    CSSselect.selectAll("#booshTest", document)
                ).length
            ).to.not.be.ok(); // shouldn't find #boosh (ancestor) within #booshTest (descendent)
            expect(
                CSSselect.selectAll(
                    "#boosh",
                    CSSselect.selectAll("#lonelyBoosh", document)
                ).length
            ).to.not.be.ok(); // shouldn't find #boosh within #lonelyBoosh (unrelated)
        });
    });

    describe("CSS 1", () => {
        it("get element by id", () => {
            const result = CSSselect.selectAll("#boosh", document);
            expect(result[0]).to.be.ok(); // found element with id=boosh
            expect(CSSselect.selectAll("h1", document)[0]).to.be.ok(); // found 1 h1
        });

        it("byId sub-queries", () => {
            expect(
                CSSselect.selectAll("#boosh #booshTest", document)
            ).to.have.length(1); // found "#id #id"
            expect(
                CSSselect.selectAll(".a.b #booshTest", document)
            ).to.have.length(1); // found ".class.class #id"
            expect(
                CSSselect.selectAll("#boosh>.a>#booshTest", document)
            ).to.have.length(1); // found "#id>.class>#id"
            expect(
                CSSselect.selectAll(".a>#booshTest", document)
            ).to.have.length(1); // found ".class>#id"
        });

        it("get elements by class", () => {
            expect(CSSselect.selectAll("#boosh .a", document)).to.have.length(
                2
            ); // found two elements
            expect(CSSselect.selectAll("#boosh div.a", document)[0]).to.be.ok(); // found one element
            expect(CSSselect.selectAll("#boosh div", document)).to.have.length(
                2
            ); // found two {div} elements
            expect(CSSselect.selectAll("#boosh span", document)[0]).to.be.ok(); // found one {span} element
            expect(
                CSSselect.selectAll("#boosh div div", document)[0]
            ).to.be.ok(); // found a single div
            expect(CSSselect.selectAll("a.odd", document)).to.have.length(1); // found single a
        });

        it("combos", () => {
            expect(
                CSSselect.selectAll("#boosh div,#boosh span", document)
            ).to.have.length(3); // found 2 divs and 1 span
        });

        it("class with dashes", () => {
            expect(
                CSSselect.selectAll(".class-with-dashes", document)
            ).to.have.length(1); // found something
        });

        it("should ignore comment nodes", () => {
            expect(CSSselect.selectAll("#boosh *", document)).to.have.length(4); // found only 4 elements under #boosh
        });

        it("deep messy relationships", () => {
            // these are mostly characterised by a combination of tight relationships and loose relationships
            // on the right side of the query it's easy to find matches but they tighten up quickly as you
            // go to the left
            // they are useful for making sure the dom crawler doesn't stop short or over-extend as it works
            // up the tree the crawl needs to be comprehensive
            expect(
                CSSselect.selectAll("div#fixtures > div a", document)
            ).to.have.length(5); // found four results for "div#fixtures > div a"
            expect(
                CSSselect.selectAll(
                    ".direct-descend > .direct-descend .lvl2",
                    document
                )
            ).to.have.length(1); // found one result for ".direct-descend > .direct-descend .lvl2"
            expect(
                CSSselect.selectAll(
                    ".direct-descend > .direct-descend div",
                    document
                )
            ).to.have.length(1); // found one result for ".direct-descend > .direct-descend div"
            expect(
                CSSselect.selectAll(
                    ".direct-descend > .direct-descend div",
                    document
                )
            ).to.have.length(1); // found one result for ".direct-descend > .direct-descend div"
            expect(
                CSSselect.selectAll("div#fixtures div ~ a div", document)
            ).to.be.empty(); // found no results for odd query
            expect(
                CSSselect.selectAll(
                    ".direct-descend > .direct-descend > .direct-descend ~ .lvl2",
                    document
                )
            ).to.be.empty(); // found no results for another odd query
        });
    });

    describe("CSS 2", () => {
        it("get elements by attribute", () => {
            const wanted = CSSselect.selectAll("#boosh div[test]", document)[0];
            const expected = DomUtils.getElementById("booshTest", document);
            expect(wanted).to.be(expected); // found attribute
            expect(
                CSSselect.selectAll("#boosh div[test=fg]", document)[0]
            ).to.be(expected); // found attribute with value
            expect(
                CSSselect.selectAll('em[rel~="copyright"]', document)
            ).to.have.length(1); // found em[rel~="copyright"]
            expect(
                CSSselect.selectAll('em[nopass~="copyright"]', document)
            ).to.be.empty(); // found em[nopass~="copyright"]
        });

        it("should not throw error by attribute selector", () => {
            expect(
                CSSselect.selectAll('[foo^="bar"]', document)
            ).to.have.length(1); // found 1 element
        });

        it("crazy town", () => {
            const el = DomUtils.getElementById("attr-test3", document);
            expect(
                CSSselect.selectAll(
                    'div#attr-test3.found.you[title="whatup duders"]',
                    document
                )[0]
            ).to.be(el); // found the right element
        });
    });

    describe("attribute selectors", () => {
        /* CSS 2 SPEC */

        it("[attr]", () => {
            const expected = DomUtils.getElementById("attr-test-1", document);
            expect(
                CSSselect.selectAll("#attributes div[unique-test]", document)[0]
            ).to.be(expected); // found attribute with [attr]
        });

        it("[attr=val]", () => {
            const expected = DomUtils.getElementById("attr-test-2", document);
            expect(
                CSSselect.selectAll(
                    '#attributes div[test="two-foo"]',
                    document
                )[0]
            ).to.be(expected); // found attribute with =
            expect(
                CSSselect.selectAll(
                    "#attributes div[test='two-foo']",
                    document
                )[0]
            ).to.be(expected); // found attribute with =
            expect(
                CSSselect.selectAll(
                    "#attributes div[test=two-foo]",
                    document
                )[0]
            ).to.be(expected); // found attribute with =
        });

        it("[attr~=val]", () => {
            const expected = DomUtils.getElementById("attr-test-3", document);
            expect(
                CSSselect.selectAll("#attributes div[test~=three]", document)[0]
            ).to.be(expected); // found attribute with ~=
        });

        it("[attr|=val]", () => {
            const expected = DomUtils.getElementById("attr-test-2", document);
            expect(
                CSSselect.selectAll(
                    '#attributes div[test|="two-foo"]',
                    document
                )[0]
            ).to.be(expected); // found attribute with |=
            expect(
                CSSselect.selectAll("#attributes div[test|=two]", document)[0]
            ).to.be(expected); // found attribute with |=
        });

        it("[href=#x] special case", () => {
            const expected = DomUtils.getElementById("attr-test-4", document);
            expect(
                CSSselect.selectAll('#attributes a[href="#aname"]', document)[0]
            ).to.be(expected); // found attribute with href=#x
        });

        /* CSS 3 SPEC */

        it("[attr^=val]", () => {
            const expected = DomUtils.getElementById("attr-test-2", document);
            expect(
                CSSselect.selectAll("#attributes div[test^=two]", document)[0]
            ).to.be(expected); // found attribute with ^=
        });

        it("[attr$=val]", () => {
            const expected = DomUtils.getElementById("attr-test-2", document);
            expect(
                CSSselect.selectAll("#attributes div[test$=foo]", document)[0]
            ).to.be(expected); // found attribute with $=
        });

        it("[attr*=val]", () => {
            const expected = DomUtils.getElementById("attr-test-3", document);
            expect(
                CSSselect.selectAll("#attributes div[test*=hree]", document)[0]
            ).to.be(expected); // found attribute with *=
        });

        it("direct descendants", () => {
            expect(
                CSSselect.selectAll(
                    "#direct-descend > .direct-descend",
                    document
                )
            ).to.have.length(2); // found two direct descendents
            expect(
                CSSselect.selectAll(
                    "#direct-descend > .direct-descend > .lvl2",
                    document
                )
            ).to.have.length(3); // found three second-level direct descendents
        });

        it("sibling elements", () => {
            expect(
                CSSselect.selectAll(
                    "#sibling-selector ~ .sibling-selector",
                    document
                )
            ).to.have.length(2); // found two siblings
            expect(
                CSSselect.selectAll(
                    "#sibling-selector ~ div.sibling-selector",
                    document
                )
            ).to.have.length(2); // found two siblings
            expect(
                CSSselect.selectAll(
                    "#sibling-selector + div.sibling-selector",
                    document
                )
            ).to.have.length(1); // found one sibling
            expect(
                CSSselect.selectAll(
                    "#sibling-selector + .sibling-selector",
                    document
                )
            ).to.have.length(1); // found one sibling

            expect(
                CSSselect.selectAll(".parent .oldest ~ .sibling", document)
            ).to.have.length(4); // found four younger siblings
            expect(
                CSSselect.selectAll(".parent .middle ~ .sibling", document)
            ).to.have.length(2); // found two younger siblings
            expect(
                CSSselect.selectAll(".parent .middle ~ h4", document)
            ).to.have.length(1); // found next sibling by tag
            expect(
                CSSselect.selectAll(".parent .middle ~ h4.younger", document)
            ).to.have.length(1); // found next sibling by tag and class
            expect(
                CSSselect.selectAll(".parent .middle ~ h3", document)
            ).to.be.empty(); // an element can't be its own sibling
            expect(
                CSSselect.selectAll(".parent .middle ~ h2", document)
            ).to.be.empty(); // didn't find an older sibling
            expect(
                CSSselect.selectAll(".parent .youngest ~ .sibling", document)
            ).to.be.empty(); // found no younger siblings

            expect(
                CSSselect.selectAll(".parent .oldest + .sibling", document)
            ).to.have.length(1); // found next sibling
            expect(
                CSSselect.selectAll(".parent .middle + .sibling", document)
            ).to.have.length(1); // found next sibling
            expect(
                CSSselect.selectAll(".parent .middle + h4", document)
            ).to.have.length(1); // found next sibling by tag
            expect(
                CSSselect.selectAll(".parent .middle + h3", document)
            ).to.be.empty(); // an element can't be its own sibling
            expect(
                CSSselect.selectAll(".parent .middle + h2", document)
            ).to.be.empty(); // didn't find an older sibling
            expect(
                CSSselect.selectAll(".parent .youngest + .sibling", document)
            ).to.be.empty(); // found no younger siblings
        });
    });

    describe("element-context queries", () => {
        it("relationship-first queries", () => {
            expect(
                CSSselect.selectAll(
                    "> .direct-descend",
                    CSSselect.selectAll("#direct-descend", document)
                )
            ).to.have.length(2); // found two direct descendents using > first
            expect(
                CSSselect.selectAll(
                    "~ .sibling-selector",
                    CSSselect.selectAll("#sibling-selector", document)
                )
            ).to.have.length(2); // found two siblings with ~ first
            expect(
                CSSselect.selectAll(
                    "+ .sibling-selector",
                    CSSselect.selectAll("#sibling-selector", document)
                )
            ).to.have.length(1); // found one sibling with + first
            expect(
                CSSselect.selectAll(
                    "> .tokens a",
                    CSSselect.selectAll(".idless", document)[0]
                )
            ).to.have.length(1); // found one sibling from a root with no id
        });

        // should be able to query on an element that hasn't been inserted into the dom
        it("detached fragments", () => {
            expect(CSSselect.selectAll(".a span", frag)).to.have.length(1); // should find child elements of fragment
            expect(CSSselect.selectAll("> div p em", frag)).to.have.length(2); // should find child elements of fragment, relationship first
        });

        it("byId sub-queries within detached fragment", () => {
            expect(CSSselect.selectAll("#emem", frag)).to.have.length(1); // found "#id" in fragment
            expect(CSSselect.selectAll(".d.i #emem", frag)).to.have.length(1); // found ".class.class #id" in fragment
            expect(CSSselect.selectAll(".d #oooo #emem", frag)).to.have.length(
                1
            ); // found ".class #id #id" in fragment
            expect(CSSselect.selectAll("> div #oooo", frag)).to.have.length(1); // found "> .class #id" in fragment
            expect(
                CSSselect.selectAll("#oooo", CSSselect.selectAll("#emem", frag))
                    .length
            ).to.not.be.ok(); // shouldn't find #oooo (ancestor) within #emem (descendent)
            expect(
                CSSselect.selectAll("#sep", CSSselect.selectAll("#emem", frag))
                    .length
            ).to.not.be.ok(); // shouldn't find #sep within #emem (unrelated)
        });

        it("exclude self in match", () => {
            expect(
                CSSselect.selectAll(
                    ".order-matters",
                    CSSselect.selectAll("#order-matters", document)[0]
                )
            ).to.have.length(4); // should not include self in element-context queries
        });

        // because form's have .length
        it("forms can be used as contexts", () => {
            expect(
                CSSselect.selectAll(
                    "*",
                    CSSselect.selectAll("form", document)[0]
                )
            ).to.have.length(3); // found 3 elements under &lt;form&gt;
        });
    });

    describe("tokenizer", () => {
        it("should not get weird tokens", () => {
            expect(
                CSSselect.selectAll('div .tokens[title="one"]', document)[0]
            ).to.be(DomUtils.getElementById("token-one", document)); // found div .tokens[title="one"]
            expect(
                CSSselect.selectAll('div .tokens[title="one two"]', document)[0]
            ).to.be(DomUtils.getElementById("token-two", document)); // found div .tokens[title="one two"]
            expect(
                CSSselect.selectAll(
                    'div .tokens[title="one two three #%"]',
                    document
                )[0]
            ).to.be(DomUtils.getElementById("token-three", document)); // found div .tokens[title="one two three #%"]
            expect(
                CSSselect.selectAll(
                    "div .tokens[title='one two three #%'] a",
                    document
                )[0]
            ).to.be(DomUtils.getElementById("token-four", document)); // found div .tokens[title=\'one two three #%\'] a
            expect(
                CSSselect.selectAll(
                    'div .tokens[title="one two three #%"] a[href$=foo] div',
                    document
                )[0]
            ).to.be(DomUtils.getElementById("token-five", document)); // found div .tokens[title="one two three #%"] a[href=foo] div
        });
    });

    describe("interesting syntaxes", () => {
        it("should parse bad selectors", () => {
            expect(
                CSSselect.selectAll("#spaced-tokens    p    em    a", document)
                    .length
            ).to.be.ok(); // found element with funny tokens
        });
    });

    describe("order matters", () => {
        // <div id="order-matters">
        //   <p class="order-matters"></p>
        //   <a class="order-matters">
        //     <em class="order-matters"></em><b class="order-matters"></b>
        //   </a>
        // </div>

        it("the order of elements return matters", () => {
            function tag(el: Element) {
                return el.name.toLowerCase();
            }
            const els = CSSselect.selectAll(
                "#order-matters .order-matters",
                document
            ) as Element[];
            expect(tag(els[0])).to.be("p"); // first element matched is a {p} tag
            expect(tag(els[1])).to.be("a"); // first element matched is a {a} tag
            expect(tag(els[2])).to.be("em"); // first element matched is a {em} tag
            expect(tag(els[3])).to.be("b"); // first element matched is a {b} tag
        });
    });

    describe("pseudo-selectors", () => {
        it(":contains", () => {
            expect(
                CSSselect.selectAll("li:contains(humans)", document)
            ).to.have.length(1); // found by "element:contains(text)"
            expect(
                CSSselect.selectAll(":contains(humans)", document)
            ).to.have.length(5); // found by ":contains(text)", including all ancestors
            // * is an important case, can cause weird errors
            expect(
                CSSselect.selectAll("*:contains(humans)", document)
            ).to.have.length(5); // found by "*:contains(text)", including all ancestors
            expect(
                CSSselect.selectAll("ol:contains(humans)", document)
            ).to.have.length(1); // found by "ancestor:contains(text)"
        });

        it(":not", () => {
            expect(
                CSSselect.selectAll(".odd:not(div)", document)
            ).to.have.length(1); // found one .odd :not an &lt;a&gt;
        });

        it(":first-child", () => {
            expect(
                CSSselect.selectAll("#pseudos div:first-child", document)[0]
            ).to.be(pseudos[0]); // found first child
            expect(
                CSSselect.selectAll("#pseudos div:first-child", document)
            ).to.have.length(1); // found only 1
        });

        it(":last-child", () => {
            const all = getElementsByTagName("div", pseudos);
            expect(
                CSSselect.selectAll("#pseudos div:last-child", document)[0]
            ).to.be(all[all.length - 1]); // found last child
            expect(
                CSSselect.selectAll("#pseudos div:last-child", document)
            ).to.have.length(1); // found only 1
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
            ).to.have.length(1); // only 1 element found
            expect(
                CSSselect.selectAll(
                    'ol > li[attr="boosh"]:last-child',
                    document
                )[0]
            ).to.be(expected); // found correct element
        });

        it(":nth-child(odd|even|x)", () => {
            const second = getElementsByTagName("div", pseudos)[1];
            expect(
                CSSselect.selectAll("#pseudos :nth-child(odd)", document)
            ).to.have.length(4); // found 4 odd elements
            expect(
                CSSselect.selectAll("#pseudos div:nth-child(odd)", document)
            ).to.have.length(3); // found 3 odd elements with div tag
            expect(
                CSSselect.selectAll("#pseudos div:nth-child(even)", document)
            ).to.have.length(3); // found 3 even elements with div tag
            expect(
                CSSselect.selectAll("#pseudos div:nth-child(2)", document)[0]
            ).to.be(second); // found 2nd nth-child of pseudos
        });

        it(":nth-child(expr)", () => {
            const fifth = getElementsByTagName("a", pseudos)[0];
            const sixth = getElementsByTagName("div", pseudos)[4];

            expect(
                CSSselect.selectAll("#pseudos :nth-child(3n+1)", document)
            ).to.have.length(3); // found 3 elements
            expect(
                CSSselect.selectAll("#pseudos :nth-child(+3n-2)", document)
            ).to.have.length(3); // found 3 elements'
            expect(
                CSSselect.selectAll("#pseudos :nth-child(-n+6)", document)
            ).to.have.length(6); // found 6 elements
            expect(
                CSSselect.selectAll("#pseudos :nth-child(-n+5)", document)
            ).to.have.length(5); // found 5 elements
            expect(
                CSSselect.selectAll("#pseudos :nth-child(3n+2)", document)[1]
            ).to.be(fifth); // second :nth-child(3n+2) is the fifth child
            expect(
                CSSselect.selectAll("#pseudos :nth-child(3n)", document)[1]
            ).to.be(sixth); // second :nth-child(3n) is the sixth child
        });

        it(":nth-last-child(odd|even|x)", () => {
            const second = getElementsByTagName("div", pseudos)[1];
            expect(
                CSSselect.selectAll("#pseudos :nth-last-child(odd)", document)
            ).to.have.length(4); // found 4 odd elements
            expect(
                CSSselect.selectAll(
                    "#pseudos div:nth-last-child(odd)",
                    document
                )
            ).to.have.length(3); // found 3 odd elements with div tag
            expect(
                CSSselect.selectAll(
                    "#pseudos div:nth-last-child(even)",
                    document
                )
            ).to.have.length(3); // found 3 even elements with div tag
            expect(
                CSSselect.selectAll(
                    "#pseudos div:nth-last-child(6)",
                    document
                )[0]
            ).to.be(second); // 6th nth-last-child should be 2nd of 7 elements
        });

        it(":nth-last-child(expr)", () => {
            const third = getElementsByTagName("div", pseudos)[2];

            expect(
                CSSselect.selectAll("#pseudos :nth-last-child(3n+1)", document)
            ).to.have.length(3); // found 3 elements
            expect(
                CSSselect.selectAll("#pseudos :nth-last-child(3n-2)", document)
            ).to.have.length(3); // found 3 elements
            expect(
                CSSselect.selectAll("#pseudos :nth-last-child(-n+6)", document)
            ).to.have.length(6); // found 6 elements
            expect(
                CSSselect.selectAll("#pseudos :nth-last-child(-n+5)", document)
            ).to.have.length(5); // found 5 elements
            expect(
                CSSselect.selectAll(
                    "#pseudos :nth-last-child(3n+2)",
                    document
                )[0]
            ).to.be(third); // first :nth-last-child(3n+2) is the third child
        });

        it(":nth-of-type(expr)", () => {
            const a = getElementsByTagName("a", pseudos)[0];

            expect(
                CSSselect.selectAll("#pseudos div:nth-of-type(3n+1)", document)
            ).to.have.length(2); // found 2 div elements
            expect(
                CSSselect.selectAll("#pseudos a:nth-of-type(3n+1)", document)
            ).to.have.length(1); // found 1 a element
            expect(
                CSSselect.selectAll("#pseudos a:nth-of-type(3n+1)", document)[0]
            ).to.be(a); // found the right a element
            expect(
                CSSselect.selectAll("#pseudos a:nth-of-type(3n)", document)
            ).to.be.empty(); // no matches for every third a
            expect(
                CSSselect.selectAll("#pseudos a:nth-of-type(odd)", document)
            ).to.have.length(1); // found the odd a
            expect(
                CSSselect.selectAll("#pseudos a:nth-of-type(1)", document)
            ).to.have.length(1); // found the first a
        });

        it(":nth-last-of-type(expr)", () => {
            const second = getElementsByTagName("div", pseudos)[1];

            expect(
                CSSselect.selectAll(
                    "#pseudos div:nth-last-of-type(3n+1)",
                    document
                )
            ).to.have.length(2); // found 2 div elements
            expect(
                CSSselect.selectAll(
                    "#pseudos a:nth-last-of-type(3n+1)",
                    document
                )
            ).to.have.length(1); // found 1 a element
            expect(
                CSSselect.selectAll(
                    "#pseudos div:nth-last-of-type(5)",
                    document
                )[0]
            ).to.be(second); // 5th nth-last-of-type should be 2nd of 7 elements
        });

        it(":first-of-type", () => {
            expect(
                CSSselect.selectAll("#pseudos a:first-of-type", document)[0]
            ).to.be(getElementsByTagName("a", pseudos)[0]); // found first a element
            expect(
                CSSselect.selectAll("#pseudos a:first-of-type", document)
            ).to.have.length(1); // found only 1
        });

        it(":last-of-type", () => {
            const all = getElementsByTagName("div", pseudos);
            expect(
                CSSselect.selectAll("#pseudos div:last-of-type", document)[0]
            ).to.be(all[all.length - 1]); // found last div element
            expect(
                CSSselect.selectAll("#pseudos div:last-of-type", document)
            ).to.have.length(1); // found only 1
        });

        it(":only-of-type", () => {
            expect(
                CSSselect.selectAll("#pseudos a:only-of-type", document)[0]
            ).to.be(getElementsByTagName("a", pseudos)[0]); // found the only a element
            expect(
                CSSselect.selectAll("#pseudos a:first-of-type", document)
            ).to.have.length(1); // found only 1
        });

        it(":target", () => {
            location.hash = "";
            expect(
                CSSselect.selectAll("#pseudos:target", document)
            ).to.be.empty(); // #pseudos is not the target
            location.hash = "#pseudos";
            expect(
                CSSselect.selectAll("#pseudos:target", document)
            ).to.have.length(1); // now #pseudos is the target
            location.hash = "";
        });

        it("custom pseudos", () => {
            // :humanoid implemented just for testing purposes
            expect(CSSselect.selectAll(":humanoid", document)).to.have.length(
                2
            ); // selected using custom pseudo
        });
    });

    describe("is()", () => {
        it("simple selectors", () => {
            expect(CSSselect.is(el, "li")).to.be.ok(); // tag
            expect(CSSselect.is(el, "*")).to.be.ok(); // wildcard
            expect(CSSselect.is(el, "#attr-child-boosh")).to.be.ok(); // #id
            expect(CSSselect.is(el, "[attr]")).to.be.ok(); // [attr]
            expect(CSSselect.is(el, "[attr=boosh]")).to.be.ok(); // [attr=val]
            expect(CSSselect.is(el, "div")).to.not.be.ok(); // wrong tag
            expect(CSSselect.is(el, "#foo")).to.not.be.ok(); // wrong #id
            expect(CSSselect.is(el, "[foo]")).to.not.be.ok(); // wrong [attr]
            expect(CSSselect.is(el, "[attr=foo]")).to.not.be.ok(); // wrong [attr=val]
        });

        it("selector sequences", () => {
            expect(
                CSSselect.is(el, "li#attr-child-boosh[attr=boosh]")
            ).to.be.ok(); // tag#id[attr=val]
            expect(
                CSSselect.is(el, "div#attr-child-boosh[attr=boosh]")
            ).to.not.be.ok(); // wrong tag#id[attr=val]
        });

        it("selector sequences combinators", () => {
            expect(CSSselect.is(el, "ol li")).to.be.ok(); // tag tag
            expect(CSSselect.is(el, "ol>li")).to.be.ok(); // tag>tag
            expect(CSSselect.is(el, "ol>li+li")).to.be.ok(); // tab>tag+tag
            expect(
                CSSselect.is(el, "ol#list li#attr-child-boosh[attr=boosh]")
            ).to.be.ok(); // tag#id tag#id[attr=val]
            expect(
                CSSselect.is(el, "ol#list>li#attr-child-boosh[attr=boosh]")
            ).to.not.be.ok(); // wrong tag#id>tag#id[attr=val]
            expect(
                CSSselect.is(el, "ol ol li#attr-child-boosh[attr=boosh]")
            ).to.be.ok(); // tag tag tag#id[attr=val]
            expect(
                CSSselect.is(
                    CSSselect.selectAll("#token-four", document)[0],
                    "div#fixtures>div a"
                )
            ).to.be.ok(); // tag#id>tag tag where ambiguous middle tag requires backtracking
        });

        it("pseudos", () => {
            // TODO: more tests!
            expect(CSSselect.is(el, "li:contains(hello)")).to.be.ok(); // matching :contains(text)
            expect(CSSselect.is(el, "li:contains(human)")).to.not.be.ok(); // non-matching :contains(text)
            expect(
                CSSselect.is(
                    CSSselect.selectAll("#list>li", document)[2],
                    ":humanoid"
                )
            ).to.be.ok(); // matching custom pseudo
            expect(
                CSSselect.is(
                    CSSselect.selectAll("#list>li", document)[1],
                    ":humanoid"
                )
            ).to.not.be.ok(); // non-matching custom pseudo
        });

        it("context", () => {
            expect(
                CSSselect.is(el, "li#attr-child-boosh[attr=boosh]", {
                    context: CSSselect.selectAll(
                        "#list",
                        document
                    )[0] as Element,
                })
            ).to.be.ok(); // context
            expect(
                CSSselect.is(el, "ol#list li#attr-child-boosh[attr=boosh]", {
                    context: CSSselect.selectAll(
                        "#boosh",
                        document
                    )[0] as Element,
                })
            ).to.not.be.ok(); // wrong context
        });
    });

    describe("selecting elements in other documents", () => {
        it("get element by id", () => {
            const result = CSSselect.selectAll("#hsoob", doc);
            expect(result[0]).to.be.ok(); // found element with id=hsoob
        });

        it("get elements by class", () => {
            expect(CSSselect.selectAll("#hsoob .a", doc)).to.have.length(2); // found two elements
            expect(CSSselect.selectAll("#hsoob div.a", doc)[0]).to.be.ok(); // found one element
            expect(CSSselect.selectAll("#hsoob div", doc)).to.have.length(2); // found two {div} elements
            expect(CSSselect.selectAll("#hsoob span", doc)[0]).to.be.ok(); // found one {span} element
            expect(CSSselect.selectAll("#hsoob div div", doc)[0]).to.be.ok(); // found a single div
            expect(CSSselect.selectAll("p.odd", doc)).to.have.length(1); // found single br
        });

        it("complex selectors", () => {
            expect(CSSselect.selectAll(".d ~ .sib", doc)).to.have.length(2); // found one ~ sibling
            expect(CSSselect.selectAll(".a .d + .sib", doc)).to.have.length(1); // found 2 + siblings
            expect(
                CSSselect.selectAll("#hsoob > div > .h", doc)
            ).to.have.length(1); // found span using child selectors
            expect(
                CSSselect.selectAll('.a .d ~ .sib[test="f g"]', doc)
            ).to.have.length(1); // found 1 ~ sibling with test attribute
        });

        it("byId sub-queries", () => {
            expect(CSSselect.selectAll("#hsoob #spanny", doc)).to.have.length(
                1
            ); // found "#id #id" in frame
            expect(CSSselect.selectAll(".a #spanny", doc)).to.have.length(1); // found ".class #id" in frame
            expect(
                CSSselect.selectAll(".a #booshTest #spanny", doc)
            ).to.have.length(1); // found ".class #id #id" in frame
            expect(CSSselect.selectAll("> #hsoob", doc)).to.have.length(1); // found "> #id" in frame
        });

        it("byId sub-queries within sub-context", () => {
            expect(
                CSSselect.selectAll(
                    "#spanny",
                    CSSselect.selectAll("#hsoob", doc)
                )
            ).to.have.length(1); // found "#id -> #id" in frame
            expect(
                CSSselect.selectAll(
                    ".a #spanny",
                    CSSselect.selectAll("#hsoob", doc)
                )
            ).to.have.length(1); // found ".class #id" in frame
            expect(
                CSSselect.selectAll(
                    ".a #booshTest #spanny",
                    CSSselect.selectAll("#hsoob", doc)
                )
            ).to.have.length(1); // found ".class #id #id" in frame
            expect(
                CSSselect.selectAll(
                    ".a > #booshTest",
                    CSSselect.selectAll("#hsoob", doc)
                )
            ).to.have.length(1); // found "> .class #id" in frame
            expect(
                CSSselect.selectAll(
                    "#booshTest",
                    CSSselect.selectAll("#spanny", doc)
                ).length
            ).to.not.be.ok(); // shouldn't find #booshTest (ancestor) within #spanny (descendent)
            expect(
                CSSselect.selectAll(
                    "#booshTest",
                    CSSselect.selectAll("#lonelyHsoob", doc)
                ).length
            ).to.not.be.ok(); // shouldn't find #booshTest within #lonelyHsoob (unrelated)
        });
    });
});
