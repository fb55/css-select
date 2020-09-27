/**
 * The NWMatcher Test Suite.
 * Adapted from https://github.com/dperini/nwmatcher/blob/master/test/scotch/test.js
 * (c) 2007-2013 Diego Perini (http://www.iport.it)
 *
 * See the LICENSE file for additional information.
 */

import * as DomUtils from "domutils";
import * as helper from "./tools/helper";
import assert from "assert";
import decircularize from "./decircularize";
const document = helper.getDocument("nwmatcher.html");
import * as CSSselect from "../src";
import type { Node, Element } from "domhandler";

// Prototype's `$` function
function getById(...args: string[]): Element | Element[] {
    if (args.some((arg) => typeof arg !== "string")) throw new Error();
    const elements = args.map((id) =>
        DomUtils.getElementById(id, document)
    ) as Element[];
    return elements.length === 1 ? elements[0] : elements;
}

// NWMatcher methods
const select = (query: string, doc: Node[] | Node = document): Node[] =>
    CSSselect.selectAll(query, typeof doc === "string" ? select(doc) : doc);
const match = CSSselect.is;

function assertEquivalent(
    v1: Node | Node[],
    v2: Node | Node[],
    message?: string
) {
    return assert.deepStrictEqual(
        decircularize(v1),
        decircularize(v2),
        message
    );
}

// The tests...
describe("NWMatcher", () => {
    describe("Basic Selectors", () => {
        it("*", () => {
            // Universal selector
            const results = [];
            const nodes = document.getElementsByTagName("*");
            let index = 0;
            const { length } = nodes;
            let node;
            // Collect all element nodes, excluding comments (IE)
            for (; index < length; index++) {
                if ((node = nodes[index]).tagName !== "!") {
                    results[results.length] = node;
                }
            }
            assertEquivalent(
                select("*"),
                results,
                "Comment nodes should be ignored."
            );
        });

        it("E", () => {
            // Type selector
            const nodes = document.getElementsByTagName("li");
            assertEquivalent(select("li"), nodes);
            assert.strictEqual(
                select("strong", getById("fixtures"))[0],
                getById("strong")
            );
            assertEquivalent(select("nonexistent"), []);
        });

        it("#id", () => {
            // ID selector
            assert.strictEqual(select("#fixtures")[0], getById("fixtures"));
            assertEquivalent(select("nonexistent"), []);
            assert.strictEqual(
                select("#troubleForm")[0],
                getById("troubleForm")
            );
        });

        it(".class", () => {
            // Class selector
            assertEquivalent(
                select(".first"),
                getById("p", "link_1", "item_1")
            );
            assertEquivalent(select(".second"), []);
        });

        it("E#id", () => {
            assert.strictEqual(select("strong#strong")[0], getById("strong"));
            assertEquivalent(select("p#strong"), []);
        });

        it("E.class", () => {
            const secondLink = getById("link_2");
            assertEquivalent(select("a.internal"), getById("link_1", "link_2"));
            assert.strictEqual(select("a.internal.highlight")[0], secondLink);
            assert.strictEqual(select("a.highlight.internal")[0], secondLink);
            assertEquivalent(select("a.highlight.internal.nonexistent"), []);
        });

        it("#id.class", () => {
            const secondLink = getById("link_2");
            assert.strictEqual(select("#link_2.internal")[0], secondLink);
            assert.strictEqual(select(".internal#link_2")[0], secondLink);
            assert.strictEqual(
                select("#link_2.internal.highlight")[0],
                secondLink
            );
            assertEquivalent(select("#link_2.internal.nonexistent"), []);
        });

        it("E#id.class", () => {
            const secondLink = getById("link_2");
            assert.strictEqual(select("a#link_2.internal")[0], secondLink);
            assert.strictEqual(select("a.internal#link_2")[0], secondLink);
            assert.strictEqual(select("li#item_1.first")[0], getById("item_1"));
            assertEquivalent(select("li#item_1.nonexistent"), []);
            assertEquivalent(select("li#item_1.first.nonexistent"), []);
        });
    });

    describe("Attribute Selectors", () => {
        it("[foo]", () => {
            assertEquivalent(
                select("[href]", document.body),
                select("a[href]", document.body)
            );
            assertEquivalent(
                select("[class~=internal]"),
                select('a[class~="internal"]')
            );
            assertEquivalent(select("[id]"), select("*[id]"));
            assertEquivalent(
                select("[type=radio]"),
                getById("checked_radio", "unchecked_radio")
            );
            assertEquivalent(
                select("[type=checkbox]"),
                select("*[type=checkbox]")
            );
            assertEquivalent(
                select("[title]"),
                getById("with_title", "commaParent")
            );
            assertEquivalent(
                select("#troubleForm [type=radio]"),
                select("#troubleForm *[type=radio]")
            );
            assertEquivalent(
                select("#troubleForm [type]"),
                select("#troubleForm *[type]")
            );
        });

        it("E[foo]", () => {
            assertEquivalent(
                select("h1[class]"),
                select("#fixtures h1"),
                "h1[class]"
            );
            assertEquivalent(
                select("h1[CLASS]"),
                select("#fixtures h1"),
                "h1[CLASS]"
            );
            assert.strictEqual(
                select("li#item_3[class]")[0],
                getById("item_3"),
                "li#item_3[class]"
            );
            assertEquivalent(
                select('#troubleForm2 input[name="brackets[5][]"]'),
                getById("chk_1", "chk_2")
            );
            // Brackets in attribute value
            assert.strictEqual(
                select('#troubleForm2 input[name="brackets[5][]"]:checked')[0],
                getById("chk_1")
            );
            // Space in attribute value
            assert.strictEqual(
                select('cite[title="hello world!"]')[0],
                getById("with_title")
            );
            // Namespaced attributes
            //  assertEquivalent(select('[xml:lang]'), [document.documentElement, getById("item_3")]);
            //  assertEquivalent(select('*[xml:lang]'), [document.documentElement, getById("item_3")]);
        });

        it('E[foo="bar"]', () => {
            assertEquivalent(
                select('a[href="#"]'),
                getById("link_1", "link_2", "link_3")
            );
            // assert.throws(() => select("a[href=#]"));
            assert.strictEqual(
                select(
                    '#troubleForm2 input[name="brackets[5][]"][value="2"]'
                )[0],
                getById("chk_2")
            );
        });

        it('E[foo~="bar"]', () => {
            assertEquivalent(
                select('a[class~="internal"]'),
                getById("link_1", "link_2"),
                'a[class~="internal"]'
            );
            assertEquivalent(
                select("a[class~=internal]"),
                getById("link_1", "link_2"),
                "a[class~=internal]"
            );
            assert.strictEqual(
                select('a[class~=external][href="#"]')[0],
                getById("link_3"),
                'a[class~=external][href="#"]'
            );
        });

        it.skip('E[foo|="en"]', () => {
            assert.strictEqual(
                select('*[xml:lang|="es"]')[0],
                getById("item_3")
            );
            assert.strictEqual(
                select('*[xml:lang|="ES"]')[0],
                getById("item_3")
            );
        });

        it('E[foo^="bar"]', () => {
            assertEquivalent(
                select("div[class^=bro]"),
                getById("father", "uncle"),
                "matching beginning of string"
            );
            assertEquivalent(
                select('#level1 *[id^="level2_"]'),
                getById("level2_1", "level2_2", "level2_3")
            );
            assertEquivalent(
                select("#level1 *[id^=level2_]"),
                getById("level2_1", "level2_2", "level2_3")
            );
        });

        it('E[foo$="bar"]', () => {
            assertEquivalent(
                select("div[class$=men]"),
                getById("father", "uncle"),
                "matching end of string"
            );
            assertEquivalent(
                select('#level1 *[id$="_1"]'),
                getById("level2_1", "level3_1")
            );
            assertEquivalent(
                select("#level1 *[id$=_1]"),
                getById("level2_1", "level3_1")
            );
        });

        it('E[foo*="bar"]', () => {
            assertEquivalent(
                select('div[class*="ers m"]'),
                getById("father", "uncle"),
                "matching substring"
            );
            assertEquivalent(
                select('#level1 *[id*="2"]'),
                getById("level2_1", "level3_2", "level2_2", "level2_3")
            );
            // assert.throws(() => select("#level1 *[id*=2]"));
        });
    });

    describe("Structural pseudo-classes", () => {
        it("E:first-child", () => {
            assert.strictEqual(
                select("#level1>*:first-child")[0],
                getById("level2_1")
            );
            assertEquivalent(
                select("#level1 *:first-child"),
                getById("level2_1", "level3_1", "level_only_child")
            );
            assertEquivalent(select("#level1>div:first-child"), []);
            assertEquivalent(
                select("#level1 span:first-child"),
                getById("level2_1", "level3_1")
            );
            assertEquivalent(select("#level1:first-child"), []);
        });

        it("E:last-child", () => {
            assert.strictEqual(
                select("#level1>*:last-child")[0],
                getById("level2_3")
            );
            assertEquivalent(
                select("#level1 *:last-child"),
                getById("level3_2", "level_only_child", "level2_3")
            );
            assert.strictEqual(
                select("#level1>div:last-child")[0],
                getById("level2_3")
            );
            assert.strictEqual(
                select("#level1 div:last-child")[0],
                getById("level2_3")
            );
            assertEquivalent(select("#level1>span:last-child"), []);
        });

        it("E:nth-child(n)", () => {
            assert.strictEqual(
                select("#p *:nth-child(3)")[0],
                getById("link_2")
            );
            assert.strictEqual(
                select("#p a:nth-child(3)")[0],
                getById("link_2"),
                "nth-child"
            );
            assertEquivalent(
                select("#list > li:nth-child(n+2)"),
                getById("item_2", "item_3")
            );
            assertEquivalent(
                select("#list > li:nth-child(-n+2)"),
                getById("item_1", "item_2")
            );
        });

        it("E:nth-of-type(n)", () => {
            assert.strictEqual(
                select("#p a:nth-of-type(2)")[0],
                getById("link_2"),
                "nth-of-type"
            );
            assert.strictEqual(
                select("#p a:nth-of-type(1)")[0],
                getById("link_1"),
                "nth-of-type"
            );
        });

        it("E:nth-last-of-type(n)", () => {
            assert.strictEqual(
                select("#p a:nth-last-of-type(1)")[0],
                getById("link_2"),
                "nth-last-of-type"
            );
        });

        it("E:first-of-type", () => {
            assert.strictEqual(
                select("#p a:first-of-type")[0],
                getById("link_1"),
                "first-of-type"
            );
        });

        it("E:last-of-type", () => {
            assert.strictEqual(
                select("#p a:last-of-type")[0],
                getById("link_2"),
                "last-of-type"
            );
        });

        it("E:only-child", () => {
            assert.strictEqual(
                select("#level1 *:only-child")[0],
                getById("level_only_child")
            );
            // Shouldn't return anything
            assertEquivalent(select("#level1>*:only-child"), []);
            assertEquivalent(select("#level1:only-child"), []);
            assertEquivalent(
                select("#level2_2 :only-child:not(:last-child)"),
                []
            );
            assertEquivalent(
                select("#level2_2 :only-child:not(:first-child)"),
                []
            );
        });

        it("E:empty", () => {
            (getById("level3_1") as Element).children = [];

            assert.strictEqual(
                select("#level3_1:empty")[0],
                getById("level3_1"),
                "IE forced empty content!"
            );

            // Shouldn't return anything
            assertEquivalent(select("span:empty > *"), []);
        });
    });

    describe(":not", () => {
        it("E:not(s)", () => {
            // Negation pseudo-class
            assertEquivalent(select('a:not([href="#"])'), []);
            assertEquivalent(select("div.brothers:not(.brothers)"), []);
            assertEquivalent(
                select('a[class~=external]:not([href="#"])'),
                [],
                'a[class~=external][href!="#"]'
            );
            assert.strictEqual(
                select("#p a:not(:first-of-type)")[0],
                getById("link_2"),
                "first-of-type"
            );
            assert.strictEqual(
                select("#p a:not(:last-of-type)")[0],
                getById("link_1"),
                "last-of-type"
            );
            assert.strictEqual(
                select("#p a:not(:nth-of-type(1))")[0],
                getById("link_2"),
                "nth-of-type"
            );
            assert.strictEqual(
                select("#p a:not(:nth-last-of-type(1))")[0],
                getById("link_1"),
                "nth-last-of-type"
            );
            assert.strictEqual(
                select("#p a:not([rel~=nofollow])")[0],
                getById("link_2"),
                "attribute 1"
            );
            assert.strictEqual(
                select("#p a:not([rel^=external])")[0],
                getById("link_2"),
                "attribute 2"
            );
            assert.strictEqual(
                select("#p a:not([rel$=nofollow])")[0],
                getById("link_2"),
                "attribute 3"
            );
            assert.strictEqual(
                select('#p a:not([rel$="nofollow"]) > em')[0],
                getById("em"),
                "attribute 4"
            );
            assert.strictEqual(
                select("#list li:not(#item_1):not(#item_3)")[0],
                getById("item_2"),
                "adjacent :not clauses"
            );
            assert.strictEqual(
                select("#grandfather > div:not(#uncle) #son")[0],
                getById("son")
            );
            assert.strictEqual(
                select('#p a:not([rel$="nofollow"]) em')[0],
                getById("em"),
                "attribute 4 + all descendants"
            );
            assert.strictEqual(
                select('#p a:not([rel$="nofollow"])>em')[0],
                getById("em"),
                "attribute 4 (without whitespace)"
            );
        });
    });

    describe("UI element states pseudo-classes", () => {
        it("E:disabled", () => {
            assert.strictEqual(
                select("#troubleForm > p > *:disabled")[0],
                getById("disabled_text_field")
            );
        });

        it("E:checked", () => {
            assertEquivalent(
                select("#troubleForm *:checked"),
                getById("checked_box", "checked_radio")
            );
        });
    });

    describe("Combinators", () => {
        it("E F", () => {
            // Descendant
            assertEquivalent(
                select("#fixtures a *"),
                getById("em2", "em", "span")
            );
            assert.strictEqual(select("div#fixtures p")[0], getById("p"));
        });

        it("E + F", () => {
            // Adjacent sibling
            assert.strictEqual(
                select("div.brothers + div.brothers")[0],
                getById("uncle")
            );
            assert.strictEqual(
                select("div.brothers + div")[0],
                getById("uncle")
            );
            assert.strictEqual(
                select("#level2_1+span")[0],
                getById("level2_2")
            );
            assert.strictEqual(
                select("#level2_1 + span")[0],
                getById("level2_2")
            );
            assert.strictEqual(select("#level2_1 + *")[0], getById("level2_2"));
            assertEquivalent(select("#level2_2 + span"), []);
            assert.strictEqual(
                select("#level3_1 + span")[0],
                getById("level3_2")
            );
            assert.strictEqual(select("#level3_1 + *")[0], getById("level3_2"));
            assertEquivalent(select("#level3_2 + *"), []);
            assertEquivalent(select("#level3_1 + em"), []);

            assert.strictEqual(
                select("+ div.brothers", select("div.brothers"))[0],
                getById("uncle")
            );
            assert.strictEqual(
                select("+ div", select("div.brothers"))[0],
                getById("uncle")
            );
            assert.strictEqual(
                select("+span", select("#level2_1"))[0],
                getById("level2_2")
            );
            assert.strictEqual(
                select("+ span", select("#level2_1"))[0],
                getById("level2_2")
            );
            assert.strictEqual(
                select("+ *", select("#level2_1"))[0],
                getById("level2_2")
            );
            assertEquivalent(select("+ span", select("#level2_2")), []);
            assert.strictEqual(
                select("+ span", select("#level3_1"))[0],
                getById("level3_2")
            );
            assert.strictEqual(
                select("+ *", select("#level3_1"))[0],
                getById("level3_2")
            );
            assertEquivalent(select("+ *", select("#level3_2")), []);
            assertEquivalent(select("+ em", select("#level3_1")), []);
        });

        it("E > F", () => {
            // Child
            assertEquivalent(
                select("p.first > a"),
                getById("link_1", "link_2")
            );
            assertEquivalent(
                select("div#grandfather > div"),
                getById("father", "uncle")
            );
            assertEquivalent(
                select("#level1>span"),
                getById("level2_1", "level2_2")
            );
            assertEquivalent(
                select("#level1 > span"),
                getById("level2_1", "level2_2")
            );
            assertEquivalent(
                select("#level2_1 > *"),
                getById("level3_1", "level3_2")
            );
            assertEquivalent(select("div > #nonexistent"), []);

            assertEquivalent(
                select("> a", select("p.first")),
                getById("link_1", "link_2")
            );
            assertEquivalent(
                select("> div", select("div#grandfather")),
                getById("father", "uncle")
            );
            assertEquivalent(
                select(">span", select("#level1")),
                getById("level2_1", "level2_2")
            );
            assertEquivalent(
                select("> span", select("#level1")),
                getById("level2_1", "level2_2")
            );
            assertEquivalent(
                select("> *", select("#level2_1")),
                getById("level3_1", "level3_2")
            );
            assertEquivalent(select("> #nonexistent", select("div")), []);
        });

        it("E ~ F", () => {
            // General sibling
            assert.strictEqual(select("h1 ~ ul")[0], getById("list"));
            assertEquivalent(select("#level2_2 ~ span"), []);
            assertEquivalent(select("#level3_2 ~ *"), []);
            assertEquivalent(select("#level3_1 ~ em"), []);
            assertEquivalent(select("div ~ #level3_2"), []);
            assertEquivalent(select("div ~ #level2_3"), []);
            assert.strictEqual(
                select("#level2_1 ~ span")[0],
                getById("level2_2")
            );
            assertEquivalent(
                select("#level2_1 ~ *"),
                getById("level2_2", "level2_3")
            );
            assert.strictEqual(
                select("#level3_1 ~ #level3_2")[0],
                getById("level3_2")
            );
            assert.strictEqual(
                select("span ~ #level3_2")[0],
                getById("level3_2")
            );

            assert.strictEqual(
                select("~ ul", select("h1"))[0],
                getById("list")
            );
            assertEquivalent(select("~ span", select("#level2_2")), []);
            assertEquivalent(select("~ *", select("#level3_2")), []);
            assertEquivalent(select("~ em", select("#level3_1")), []);
            assertEquivalent(select("~ #level3_2", select("div")), []);
            assertEquivalent(select("~ #level2_3", select("div")), []);
            assert.strictEqual(
                select("~ span", select("#level2_1"))[0],
                getById("level2_2")
            );
            assertEquivalent(
                select("~ *", select("#level2_1")),
                getById("level2_2", "level2_3")
            );
            assert.strictEqual(
                select("~ #level3_2", select("#level3_1"))[0],
                getById("level3_2")
            );
            assert.strictEqual(
                select("~ #level3_2", select("span"))[0],
                getById("level3_2")
            );
        });
    });

    describe("Diverse", () => {
        it("NW.Dom.match", () => {
            const element = getById("dupL1");
            // Assertions
            assert.ok(match(element, "span"));
            assert.ok(match(element, "span#dupL1"));
            assert.ok(match(element, "div > span"), "child combinator");
            assert.ok(
                match(element, "#dupContainer span"),
                "descendant combinator"
            );
            assert.ok(match(element, "#dupL1"), "ID only");
            assert.ok(match(element, "span.span_foo"), "class name 1");
            assert.ok(match(element, "span.span_bar"), "class name 2");
            assert.ok(
                match(element, "span:first-child"),
                "first-child pseudoclass"
            );
            // Refutations
            assert.ok(!match(element, "span.span_wtf"), "bogus class name");
            assert.ok(!match(element, "#dupL2"), "different ID");
            assert.ok(!match(element, "div"), "different tag name");
            assert.ok(!match(element, "span span"), "different ancestry");
            assert.ok(!match(element, "span > span"), "different parent");
            assert.ok(
                !match(element, "span:nth-child(5)"),
                "different pseudoclass"
            );
            // Misc.
            assert.ok(!match(getById("link_2"), "a[rel^=external]"));
            assert.ok(match(getById("link_1"), "a[rel^=external]"));
            assert.ok(match(getById("link_1"), 'a[rel^="external"]'));
            assert.ok(match(getById("link_1"), "a[rel^='external']"));
        });

        it("Equivalent Selectors", () => {
            assertEquivalent(
                select("div.brothers"),
                select("div[class~=brothers]")
            );
            assertEquivalent(
                select("div.brothers"),
                select("div[class~=brothers].brothers")
            );
            assertEquivalent(
                select("div:not(.brothers)"),
                select("div:not([class~=brothers])")
            );
            assertEquivalent(select("li ~ li"), select("li:not(:first-child)"));
            assertEquivalent(select("ul > li"), select("ul > li:nth-child(n)"));
            assertEquivalent(
                select("ul > li:nth-child(even)"),
                select("ul > li:nth-child(2n)")
            );
            assertEquivalent(
                select("ul > li:nth-child(odd)"),
                select("ul > li:nth-child(2n+1)")
            );
            assertEquivalent(
                select("ul > li:first-child"),
                select("ul > li:nth-child(1)")
            );
            assertEquivalent(
                select("ul > li:last-child"),
                select("ul > li:nth-last-child(1)")
            );
            /* Opera 10 does not accept values > 128 as a parameter to :nth-child
			See <http://operawiki.info/ArtificialLimits> */
            assertEquivalent(
                select("ul > li:nth-child(n-128)"),
                select("ul > li")
            );
            assertEquivalent(select("ul>li"), select("ul > li"));
            assertEquivalent(
                select('#p a:not([rel$="nofollow"])>em'),
                select('#p a:not([rel$="nofollow"]) > em')
            );
        });

        it("Multiple Selectors", () => {
            // The next two assertions should return document-ordered lists of matching elements --Diego Perini
            //  assertEquivalent(select('#list, .first,*[xml:lang="es-us"] , #troubleForm'), getById('p', 'link_1', 'list', 'item_1', 'item_3', 'troubleForm'));
            //  assertEquivalent(select('#list, .first, *[xml:lang="es-us"], #troubleForm'), getById('p', 'link_1', 'list', 'item_1', 'item_3', 'troubleForm'));
            assertEquivalent(
                select(
                    'form[title*="commas,"], input[value="#commaOne,#commaTwo"]'
                ),
                getById("commaParent", "commaChild")
            );
            assertEquivalent(
                select(
                    'form[title*="commas,"], input[value="#commaOne,#commaTwo"]'
                ),
                getById("commaParent", "commaChild")
            );
        });
    });
});
