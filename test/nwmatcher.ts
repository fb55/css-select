/**
 * The NWMatcher Test Suite.
 * Adapted from https://github.com/dperini/nwmatcher/blob/master/test/scotch/test.js
 * (c) 2007-2013 Diego Perini (http://www.iport.it)
 *
 * See the LICENSE file for additional information.
 */

import * as DomUtils from "domutils";
import * as helper from "./tools/helper";
import * as CSSselect from "../src";
import type { Node, Element } from "domhandler";

const document = helper.getDocument("nwmatcher.html");

// Prototype's `$` function
function getByIds(...args: string[]): Element[] {
    return args.map((id) => getById(id));
}

function getById(id: string): Element {
    const elem = DomUtils.getElementById(id, document);
    if (!elem) throw new Error(`Did not find element with ID ${id}`);
    return elem;
}

// NWMatcher methods
const select = (query: string, doc: Node[] | Node = document): Node[] =>
    CSSselect.selectAll(query, doc);

describe("NWMatcher", () => {
    describe("Basic Selectors", () => {
        it("*", () => {
            // Universal selector
            const results = DomUtils.getElementsByTagName("*", document);
            // Comment nodes should be ignored.
            expect(select("*")).toStrictEqual(results);
        });

        it("E", () => {
            // Type selector
            const nodes = DomUtils.getElementsByTagName("li", document);
            expect(select("li")).toStrictEqual(nodes);
            expect(select("strong", getById("fixtures"))[0]).toBe(
                getById("strong")
            );
            expect(select("nonexistent")).toHaveLength(0);
        });

        it("#id", () => {
            // ID selector
            expect(select("#fixtures")[0]).toBe(getById("fixtures"));
            expect(select("nonexistent")).toHaveLength(0);
            expect(select("#troubleForm")[0]).toBe(getById("troubleForm"));
        });

        it(".class", () => {
            // Class selector
            expect(select(".first")).toStrictEqual(
                getByIds("p", "link_1", "item_1")
            );
            expect(select(".second")).toHaveLength(0);
        });

        it("E#id", () => {
            expect(select("strong#strong")[0]).toBe(getById("strong"));
            expect(select("p#strong")).toHaveLength(0);
        });

        it("E.class", () => {
            const secondLink = getById("link_2");
            expect(select("a.internal")).toStrictEqual(
                getByIds("link_1", "link_2")
            );
            expect(select("a.internal.highlight")[0]).toBe(secondLink);
            expect(select("a.highlight.internal")[0]).toBe(secondLink);
            expect(select("a.highlight.internal.nonexistent")).toStrictEqual(
                []
            );
        });

        it("#id.class", () => {
            const secondLink = getById("link_2");
            expect(select("#link_2.internal")[0]).toBe(secondLink);
            expect(select(".internal#link_2")[0]).toBe(secondLink);
            expect(select("#link_2.internal.highlight")[0]).toBe(secondLink);
            expect(select("#link_2.internal.nonexistent")).toHaveLength(0);
        });

        it("E#id.class", () => {
            const secondLink = getById("link_2");
            expect(select("a#link_2.internal")[0]).toBe(secondLink);
            expect(select("a.internal#link_2")[0]).toBe(secondLink);
            expect(select("li#item_1.first")[0]).toBe(getById("item_1"));
            expect(select("li#item_1.nonexistent")).toHaveLength(0);
            expect(select("li#item_1.first.nonexistent")).toHaveLength(0);
        });
    });

    describe("Attribute Selectors", () => {
        it("[foo]", () => {
            expect(select("[href]", document.body)).toStrictEqual(
                select("a[href]", document.body)
            );
            expect(select("[class~=internal]")).toStrictEqual(
                select('a[class~="internal"]')
            );
            expect(select("[id]")).toStrictEqual(select("*[id]"));
            expect(select("[type=radio]")).toStrictEqual(
                getByIds("checked_radio", "unchecked_radio")
            );
            expect(select("[type=checkbox]")).toStrictEqual(
                select("*[type=checkbox]")
            );
            expect(select("[title]")).toStrictEqual(
                getByIds("with_title", "commaParent")
            );
            expect(select("#troubleForm [type=radio]")).toStrictEqual(
                select("#troubleForm *[type=radio]")
            );
            expect(select("#troubleForm [type]")).toStrictEqual(
                select("#troubleForm *[type]")
            );
        });

        it("E[foo]", () => {
            expect(select("h1[class]")).toStrictEqual(select("#fixtures h1"));
            expect(select("h1[CLASS]")).toStrictEqual(select("#fixtures h1"));
            expect(select("li#item_3[class]")[0]).toBe(getById("item_3"));
            expect(
                select('#troubleForm2 input[name="brackets[5][]"]')
            ).toStrictEqual(getByIds("chk_1", "chk_2"));
            // Brackets in attribute value
            expect(
                select('#troubleForm2 input[name="brackets[5][]"]:checked')[0]
            ).toBe(getById("chk_1"));
            // Space in attribute value
            expect(select('cite[title="hello world!"]')[0]).toBe(
                getById("with_title")
            );
        });

        it.skip("E[foo] with namespaced attributes", () => {
            expect(select("[xml:lang]")).toStrictEqual([
                document.documentElement,
                getById("item_3"),
            ]);
            expect(select("*[xml:lang]")).toStrictEqual([
                document.documentElement,
                getById("item_3"),
            ]);
        });

        it('E[foo="bar"]', () => {
            expect(select('a[href="#"]')).toStrictEqual(
                getByIds("link_1", "link_2", "link_3")
            );
            expect(
                select(
                    '#troubleForm2 input[name="brackets[5][]"][value="2"]'
                )[0]
            ).toBe(getById("chk_2"));
        });

        it('E[foo~="bar"]', () => {
            expect(select('a[class~="internal"]')).toStrictEqual(
                getByIds("link_1", "link_2")
            );
            expect(select("a[class~=internal]")).toStrictEqual(
                getByIds("link_1", "link_2")
            );
            expect(select('a[class~=external][href="#"]')[0]).toBe(
                getById("link_3")
            );
        });

        it.skip('E[foo|="en"]', () => {
            expect(select('*[xml:lang|="es"]')[0]).toBe(getById("item_3"));
            expect(select('*[xml:lang|="ES"]')[0]).toBe(getById("item_3"));
        });

        it('E[foo^="bar"]', () => {
            // Matching beginning of string
            expect(select("div[class^=bro]")).toStrictEqual(
                getByIds("father", "uncle")
            );
            expect(select('#level1 *[id^="level2_"]')).toStrictEqual(
                getByIds("level2_1", "level2_2", "level2_3")
            );
            expect(select("#level1 *[id^=level2_]")).toStrictEqual(
                getByIds("level2_1", "level2_2", "level2_3")
            );
        });

        it('E[foo$="bar"]', () => {
            // Matching end of string
            expect(select("div[class$=men]")).toStrictEqual(
                getByIds("father", "uncle")
            );
            expect(select('#level1 *[id$="_1"]')).toStrictEqual(
                getByIds("level2_1", "level3_1")
            );
            expect(select("#level1 *[id$=_1]")).toStrictEqual(
                getByIds("level2_1", "level3_1")
            );
        });

        it('E[foo*="bar"]', () => {
            // Matching substring
            expect(select('div[class*="ers m"]')).toStrictEqual(
                getByIds("father", "uncle")
            );
            expect(select('#level1 *[id*="2"]')).toStrictEqual(
                getByIds("level2_1", "level3_2", "level2_2", "level2_3")
            );
        });
    });

    describe("Structural pseudo-classes", () => {
        it("E:first-child", () => {
            expect(select("#level1>*:first-child")[0]).toBe(
                getById("level2_1")
            );
            expect(select("#level1 *:first-child")).toStrictEqual(
                getByIds("level2_1", "level3_1", "level_only_child")
            );
            expect(select("#level1>div:first-child")).toHaveLength(0);
            expect(select("#level1 span:first-child")).toStrictEqual(
                getByIds("level2_1", "level3_1")
            );
            expect(select("#level1:first-child")).toHaveLength(0);
        });

        it("E:last-child", () => {
            expect(select("#level1>*:last-child")[0]).toBe(getById("level2_3"));
            expect(select("#level1 *:last-child")).toStrictEqual(
                getByIds("level3_2", "level_only_child", "level2_3")
            );
            expect(select("#level1>div:last-child")[0]).toBe(
                getById("level2_3")
            );
            expect(select("#level1 div:last-child")[0]).toBe(
                getById("level2_3")
            );
            expect(select("#level1>span:last-child")).toHaveLength(0);
        });

        it("E:nth-child(n)", () => {
            expect(select("#p *:nth-child(3)")[0]).toBe(getById("link_2"));
            expect(select("#p a:nth-child(3)")[0]).toBe(getById("link_2"));
            expect(select("#list > li:nth-child(n+2)")).toStrictEqual(
                getByIds("item_2", "item_3")
            );
            expect(select("#list > li:nth-child(-n+2)")).toStrictEqual(
                getByIds("item_1", "item_2")
            );
        });

        it("E:nth-of-type(n)", () => {
            expect(select("#p a:nth-of-type(2)")[0]).toBe(getById("link_2"));
            expect(select("#p a:nth-of-type(1)")[0]).toBe(getById("link_1"));
        });

        it("E:nth-last-of-type(n)", () => {
            expect(select("#p a:nth-last-of-type(1)")[0]).toBe(
                getById("link_2")
            );
        });

        it("E:first-of-type", () => {
            expect(select("#p a:first-of-type")[0]).toBe(getById("link_1"));
        });

        it("E:last-of-type", () => {
            expect(select("#p a:last-of-type")[0]).toBe(getById("link_2"));
        });

        it("E:only-child", () => {
            expect(select("#level1 *:only-child")[0]).toBe(
                getById("level_only_child")
            );
            // Shouldn't return anything
            expect(select("#level1>*:only-child")).toHaveLength(0);
            expect(select("#level1:only-child")).toHaveLength(0);
            expect(
                select("#level2_2 :only-child:not(:last-child)")
            ).toHaveLength(0);
            expect(
                select("#level2_2 :only-child:not(:first-child)")
            ).toHaveLength(0);
        });

        it("E:empty", () => {
            (getById("level3_1") as Element).children = [];

            // IE forced empty content!
            expect(select("#level3_1:empty")[0]).toBe(getById("level3_1"));

            // Shouldn't return anything
            expect(select("span:empty > *")).toHaveLength(0);
        });
    });

    describe(":not", () => {
        it("E:not(s)", () => {
            // Negation pseudo-class
            expect(select('a:not([href="#"])')).toHaveLength(0);
            expect(select("div.brothers:not(.brothers)")).toHaveLength(0);
            expect(select('a[class~=external]:not([href="#"])')).toStrictEqual(
                []
            );
            expect(select("#p a:not(:first-of-type)")[0]).toBe(
                getById("link_2")
            );
            expect(select("#p a:not(:last-of-type)")[0]).toBe(
                getById("link_1")
            );
            expect(select("#p a:not(:nth-of-type(1))")[0]).toBe(
                getById("link_2")
            );
            expect(select("#p a:not(:nth-last-of-type(1))")[0]).toBe(
                getById("link_1")
            );
            expect(select("#p a:not([rel~=nofollow])")[0]).toBe(
                getById("link_2")
            );
            expect(select("#p a:not([rel^=external])")[0]).toBe(
                getById("link_2")
            );
            expect(select("#p a:not([rel$=nofollow])")[0]).toBe(
                getById("link_2")
            );
            expect(select('#p a:not([rel$="nofollow"]) > em')[0]).toBe(
                getById("em")
            );
            expect(select("#list li:not(#item_1):not(#item_3)")[0]).toBe(
                getById("item_2")
            );
            expect(select("#grandfather > div:not(#uncle) #son")[0]).toBe(
                getById("son")
            );
            expect(select('#p a:not([rel$="nofollow"]) em')[0]).toBe(
                getById("em")
            );
            expect(select('#p a:not([rel$="nofollow"])>em')[0]).toBe(
                getById("em")
            );
        });
    });

    describe("UI element states pseudo-classes", () => {
        it("E:disabled", () => {
            expect(select("#troubleForm > p > *:disabled")[0]).toBe(
                getById("disabled_text_field")
            );
        });

        it("E:checked", () => {
            expect(select("#troubleForm *:checked")).toStrictEqual(
                getByIds("checked_box", "checked_radio")
            );
        });
    });

    describe("Combinators", () => {
        it("E F", () => {
            // Descendant
            expect(select("#fixtures a *")).toStrictEqual(
                getByIds("em2", "em", "span")
            );
            expect(select("div#fixtures p")[0]).toBe(getById("p"));
        });

        it("E + F", () => {
            // Adjacent sibling
            expect(select("div.brothers + div.brothers")[0]).toBe(
                getById("uncle")
            );
            expect(select("div.brothers + div")[0]).toBe(getById("uncle"));
            expect(select("#level2_1+span")[0]).toBe(getById("level2_2"));
            expect(select("#level2_1 + span")[0]).toBe(getById("level2_2"));
            expect(select("#level2_1 + *")[0]).toBe(getById("level2_2"));
            expect(select("#level2_2 + span")).toHaveLength(0);
            expect(select("#level3_1 + span")[0]).toBe(getById("level3_2"));
            expect(select("#level3_1 + *")[0]).toBe(getById("level3_2"));
            expect(select("#level3_2 + *")).toHaveLength(0);
            expect(select("#level3_1 + em")).toHaveLength(0);

            expect(select("+ div.brothers", select("div.brothers"))[0]).toBe(
                getById("uncle")
            );
            expect(select("+ div", select("div.brothers"))[0]).toBe(
                getById("uncle")
            );
            expect(select("+span", select("#level2_1"))[0]).toBe(
                getById("level2_2")
            );
            expect(select("+ span", select("#level2_1"))[0]).toBe(
                getById("level2_2")
            );
            expect(select("+ *", select("#level2_1"))[0]).toBe(
                getById("level2_2")
            );
            expect(select("+ span", select("#level2_2"))).toHaveLength(0);
            expect(select("+ span", select("#level3_1"))[0]).toBe(
                getById("level3_2")
            );
            expect(select("+ *", select("#level3_1"))[0]).toBe(
                getById("level3_2")
            );
            expect(select("+ *", select("#level3_2"))).toHaveLength(0);
            expect(select("+ em", select("#level3_1"))).toHaveLength(0);
        });

        it("E > F", () => {
            // Child
            expect(select("p.first > a")).toStrictEqual(
                getByIds("link_1", "link_2")
            );
            expect(select("div#grandfather > div")).toStrictEqual(
                getByIds("father", "uncle")
            );
            expect(select("#level1>span")).toStrictEqual(
                getByIds("level2_1", "level2_2")
            );
            expect(select("#level1 > span")).toStrictEqual(
                getByIds("level2_1", "level2_2")
            );
            expect(select("#level2_1 > *")).toStrictEqual(
                getByIds("level3_1", "level3_2")
            );
            expect(select("div > #nonexistent")).toHaveLength(0);

            expect(select("> a", select("p.first"))).toStrictEqual(
                getByIds("link_1", "link_2")
            );
            expect(select("> div", select("div#grandfather"))).toStrictEqual(
                getByIds("father", "uncle")
            );
            expect(select(">span", select("#level1"))).toStrictEqual(
                getByIds("level2_1", "level2_2")
            );
            expect(select("> span", select("#level1"))).toStrictEqual(
                getByIds("level2_1", "level2_2")
            );
            expect(select("> *", select("#level2_1"))).toStrictEqual(
                getByIds("level3_1", "level3_2")
            );
            expect(select("> #nonexistent", select("div"))).toHaveLength(0);
        });

        it("E ~ F", () => {
            // General sibling
            expect(select("h1 ~ ul")[0]).toBe(getById("list"));
            expect(select("#level2_2 ~ span")).toHaveLength(0);
            expect(select("#level3_2 ~ *")).toHaveLength(0);
            expect(select("#level3_1 ~ em")).toHaveLength(0);
            expect(select("div ~ #level3_2")).toHaveLength(0);
            expect(select("div ~ #level2_3")).toHaveLength(0);
            expect(select("#level2_1 ~ span")[0]).toBe(getById("level2_2"));
            expect(select("#level2_1 ~ *")).toStrictEqual(
                getByIds("level2_2", "level2_3")
            );
            expect(select("#level3_1 ~ #level3_2")[0]).toBe(
                getById("level3_2")
            );
            expect(select("span ~ #level3_2")[0]).toBe(getById("level3_2"));

            expect(select("~ ul", select("h1"))[0]).toBe(getById("list"));
            expect(select("~ span", select("#level2_2"))).toHaveLength(0);
            expect(select("~ *", select("#level3_2"))).toHaveLength(0);
            expect(select("~ em", select("#level3_1"))).toHaveLength(0);
            expect(select("~ #level3_2", select("div"))).toHaveLength(0);
            expect(select("~ #level2_3", select("div"))).toHaveLength(0);
            expect(select("~ span", select("#level2_1"))[0]).toBe(
                getById("level2_2")
            );
            expect(select("~ *", select("#level2_1"))).toStrictEqual(
                getByIds("level2_2", "level2_3")
            );
            expect(select("~ #level3_2", select("#level3_1"))[0]).toBe(
                getById("level3_2")
            );
            expect(select("~ #level3_2", select("span"))[0]).toBe(
                getById("level3_2")
            );
        });
    });

    describe("Diverse", () => {
        it("NW.Dom.match", () => {
            const element = getById("dupL1");
            // Assertions
            expect(CSSselect.is(element, "span")).toBe(true);
            expect(CSSselect.is(element, "span#dupL1")).toBe(true);
            // Child combinator
            expect(CSSselect.is(element, "div > span")).toBe(true);
            // Descendant combinator
            expect(CSSselect.is(element, "#dupContainer span")).toBe(true);
            // ID only
            expect(CSSselect.is(element, "#dupL1")).toBe(true);
            // Class name 1
            expect(CSSselect.is(element, "span.span_foo")).toBe(true);
            // Class name 2
            expect(CSSselect.is(element, "span.span_bar")).toBe(true);
            // First-child pseudoclass
            expect(CSSselect.is(element, "span:first-child")).toBe(true);
            // Refutations

            // Bogus class name
            expect(CSSselect.is(element, "span.span_wtf")).toBe(false);
            // Different ID
            expect(CSSselect.is(element, "#dupL2")).toBe(false);
            // Different tag name
            expect(CSSselect.is(element, "div")).toBe(false);
            // Different ancestry
            expect(CSSselect.is(element, "span span")).toBe(false);
            // Different parent
            expect(CSSselect.is(element, "span > span")).toBe(false);
            // Different pseudoclass
            expect(CSSselect.is(element, "span:nth-child(5)")).toBe(false);
            // Misc.
            expect(CSSselect.is(getById("link_2"), "a[rel^=external]")).toBe(
                false
            );
            expect(CSSselect.is(getById("link_1"), "a[rel^=external]")).toBe(
                true
            );
            expect(CSSselect.is(getById("link_1"), 'a[rel^="external"]')).toBe(
                true
            );
            expect(CSSselect.is(getById("link_1"), "a[rel^='external']")).toBe(
                true
            );
        });

        it("Equivalent Selectors", () => {
            expect(select("div.brothers")).toStrictEqual(
                select("div[class~=brothers]")
            );
            expect(select("div.brothers")).toStrictEqual(
                select("div[class~=brothers].brothers")
            );
            expect(select("div:not(.brothers)")).toStrictEqual(
                select("div:not([class~=brothers])")
            );
            expect(select("li ~ li")).toStrictEqual(
                select("li:not(:first-child)")
            );
            expect(select("ul > li")).toStrictEqual(
                select("ul > li:nth-child(n)")
            );
            expect(select("ul > li:nth-child(even)")).toStrictEqual(
                select("ul > li:nth-child(2n)")
            );
            expect(select("ul > li:nth-child(odd)")).toStrictEqual(
                select("ul > li:nth-child(2n+1)")
            );
            expect(select("ul > li:first-child")).toStrictEqual(
                select("ul > li:nth-child(1)")
            );
            expect(select("ul > li:last-child")).toStrictEqual(
                select("ul > li:nth-last-child(1)")
            );
            /*
             * Opera 10 does not accept values > 128 as a parameter to :nth-child
             * See <http://operawiki.info/ArtificialLimits>
             */
            expect(select("ul > li:nth-child(n-128)")).toStrictEqual(
                select("ul > li")
            );
            expect(select("ul>li")).toStrictEqual(select("ul > li"));
            expect(select('#p a:not([rel$="nofollow"])>em')).toStrictEqual(
                select('#p a:not([rel$="nofollow"]) > em')
            );
        });

        it.skip("Multiple Selectors with lang", () => {
            // The next two assertions should return document-ordered lists of matching elements --Diego Perini
            expect(
                select('#list, .first,*[xml:lang="es-us"] , #troubleForm')
            ).toStrictEqual(
                getByIds(
                    "p",
                    "link_1",
                    "list",
                    "item_1",
                    "item_3",
                    "troubleForm"
                )
            );
            expect(
                select('#list, .first, *[xml:lang="es-us"], #troubleForm')
            ).toStrictEqual(
                getByIds(
                    "p",
                    "link_1",
                    "list",
                    "item_1",
                    "item_3",
                    "troubleForm"
                )
            );
        });

        it("Multiple Selectors", () => {
            expect(
                select(
                    'form[title*="commas,"], input[value="#commaOne,#commaTwo"]'
                )
            ).toStrictEqual(getByIds("commaParent", "commaChild"));
            expect(
                select(
                    'form[title*="commas,"], input[value="#commaOne,#commaTwo"]'
                )
            ).toStrictEqual(getByIds("commaParent", "commaChild"));
        });
    });
});
