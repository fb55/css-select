import * as DomUtils from "domutils";
import * as CSSselect from "../src";
import type { Element, AnyNode, ParentNode, ChildNode } from "domhandler";
import { q, t, createWithFriesXML, loadDoc } from "./tools/sizzle-testinit";
import { parseDocument, parseDOM } from "htmlparser2";
let document = loadDoc();

describe("Sizzle", () => {
    beforeEach(() => {
        document = loadDoc();
    });

    it("element", () => {
        expect.assertions(37);

        // Empty selector returns an empty array
        expect(CSSselect.selectAll("", document)).toHaveLength(0);
        // Text element as context fails silently
        expect(
            CSSselect.selectAll("div", document.createTextNode(""))
        ).toStrictEqual([]);
        const form = document.getElementById("form");
        // Empty string passed to matchesSelector does not match
        expect(CSSselect.is(form, "")).toBe(false);
        // Empty selector returns an empty array
        expect(CSSselect.selectAll(" ", document)).toHaveLength(0);
        // Empty selector returns an empty array
        expect(CSSselect.selectAll("\t", document)).toHaveLength(0);

        // Select all
        expect(CSSselect.selectAll("*", document).length >= 30).toBe(true);
        const all = CSSselect.selectAll("*", document);
        const good = all.every((el: AnyNode) => el.nodeType !== 8);
        // Select all elements, no comment nodes
        expect(good).toBe(true);
        // Element Selector
        t("html", ["html"]);
        // Element Selector
        t("body", ["body"]);
        // Element Selector
        t("#qunit-fixture p", ["firstp", "ap", "sndp", "en", "sap", "first"]);

        // Leading space
        t(" #qunit-fixture p", ["firstp", "ap", "sndp", "en", "sap", "first"]);
        // Leading tab
        t("\t#qunit-fixture p", ["firstp", "ap", "sndp", "en", "sap", "first"]);
        // Leading carriage return
        t("\r#qunit-fixture p", ["firstp", "ap", "sndp", "en", "sap", "first"]);
        // Leading line feed
        t("\n#qunit-fixture p", ["firstp", "ap", "sndp", "en", "sap", "first"]);
        // Leading form feed
        t("\f#qunit-fixture p", ["firstp", "ap", "sndp", "en", "sap", "first"]);
        // Trailing space
        t("#qunit-fixture p ", ["firstp", "ap", "sndp", "en", "sap", "first"]);
        // Trailing tab
        t("#qunit-fixture p\t", ["firstp", "ap", "sndp", "en", "sap", "first"]);
        // Trailing carriage return
        t("#qunit-fixture p\r", ["firstp", "ap", "sndp", "en", "sap", "first"]);
        // Trailing line feed
        t("#qunit-fixture p\n", ["firstp", "ap", "sndp", "en", "sap", "first"]);
        // Trailing form feed
        t("#qunit-fixture p\f", ["firstp", "ap", "sndp", "en", "sap", "first"]);

        // Parent Element
        t("dl ol", ["empty", "listWithTabIndex"]);
        // Parent Element (non-space descendant combinator)
        t("dl\tol", ["empty", "listWithTabIndex"]);
        const obj1 = document.getElementById("object1");
        // Object/param as context
        expect(CSSselect.selectAll("param", obj1)).toHaveLength(2);

        // Finding selects with a context.
        t(
            "select",
            ["select1", "select2", "select3", "select4", "select5"],
            form
        );

        /*
         * Check for unique-ness and sort order
         * Check for duplicates: p, div p
         */
        expect(CSSselect.selectAll("p, div p", document)).toStrictEqual(
            CSSselect.selectAll("p", document)
        );

        // Checking sort order
        t("h2, h1", ["qunit-header", "qunit-banner", "qunit-userAgent"]);
        // Checking sort order
        t("#qunit-fixture p, #qunit-fixture p a", [
            "firstp",
            "simon1",
            "ap",
            "google",
            "groups",
            "anchor1",
            "mark",
            "sndp",
            "en",
            "yahoo",
            "sap",
            "anchor2",
            "simon",
            "first",
        ]);

        // Test Conflict ID
        const lengthtest = document.getElementById("lengthtest");
        // Finding element with id of ID.
        t("#idTest", ["idTest"], lengthtest);
        // Finding element with id of ID.
        t("[name='id']", ["idTest"], lengthtest);
        // Finding elements with id of ID.
        t("input[id='idTest']", ["idTest"], lengthtest);

        const siblingTest = document.getElementById("siblingTest");
        // Element-rooted QSA does not select based on document context
        t("div em", [], siblingTest);
        // Element-rooted QSA does not select based on document context
        t("div em, div em, div em:not(div em)", [], siblingTest);
        // Escaped commas do not get treated with an id in element-rooted QSA
        t("div em, em\\,", [], siblingTest);

        const iframe = document.getElementById("iframe");
        iframe.children = parseDOM("<body><p id='foo'>bar</p></body>");
        iframe.children.forEach((e) => {
            e.parent = iframe;
        });
        // Other document as context
        expect(CSSselect.selectAll("p:contains(bar)", iframe)).toStrictEqual([
            DomUtils.getElementById("foo", iframe.children),
        ]);
        iframe.children = [];

        let markup = "";
        for (let i = 0; i < 100; i++) {
            markup = `<div>${markup}</div>`;
        }
        const [html] = parseDOM(markup);
        DomUtils.appendChild(document.body, html);
        // No stack or performance problems with large amounts of descendents
        expect(
            CSSselect.selectAll("body div div div", document).length
        ).toBeTruthy();
        // No stack or performance problems with large amounts of descendents
        expect(
            CSSselect.selectAll("body>div div div", document).length
        ).toBeTruthy();
        DomUtils.removeElement(html);

        // Real use case would be using .watch in browsers with window.watch (see Issue #157)
        const elem = document.createElement("toString");
        elem.attribs["id"] = "toString";
        DomUtils.appendChild(q("qunit-fixture")[0], elem);
        // Element name matches Object.prototype property
        t("tostring#toString", ["toString"]);
        DomUtils.removeElement(elem);
    });

    it("XML Document Selectors", () => {
        let xml = createWithFriesXML();
        expect.assertions(11);

        // Element Selector with underscore
        expect(CSSselect.selectAll("foo_bar", xml)).toHaveLength(1);
        // Class selector
        expect(CSSselect.selectAll(".component", xml)).toHaveLength(1);
        // Attribute selector for class
        expect(CSSselect.selectAll("[class*=component]", xml)).toHaveLength(1);
        // Attribute selector with name
        expect(CSSselect.selectAll("property[name=prop2]", xml)).toHaveLength(
            1
        );
        // Attribute selector with name
        expect(CSSselect.selectAll("[name=prop2]", xml)).toHaveLength(1);
        // Attribute selector with ID
        expect(CSSselect.selectAll("#seite1", xml)).toHaveLength(1);
        // Attribute selector with ID
        expect(CSSselect.selectAll("component#seite1", xml)).toHaveLength(1);
        // Attribute selector filter with ID
        expect(
            CSSselect.selectAll("component", xml).filter((node) =>
                CSSselect.is(node, "#seite1")
            )
        ).toHaveLength(1);
        // Descendent selector and dir caching
        expect(CSSselect.selectAll("meta property thing", xml)).toHaveLength(2);
        // Check for namespaced element
        expect(
            CSSselect.is(
                xml.children.filter((t) => t.type === "tag").pop(),
                "soap\\:Envelope",
                {
                    xmlMode: true,
                }
            )
        ).toBe(true);

        xml = parseDocument(
            "<?xml version='1.0' encoding='UTF-8'?><root><elem id='1'/></root>",
            {
                xmlMode: true,
            }
        );
        // Non-qSA path correctly handles numeric ids (jQuery #14142)
        expect(CSSselect.selectAll("elem:not(:has(*))", xml)).toHaveLength(1);
    });

    it("broken", () => {
        expect.assertions(26);

        const broken = (selector: string) =>
            expect(() => CSSselect.compile(selector)).toThrow(Error);

        broken("[");
        broken("(");
        broken("{");
        broken("()");
        broken("<>");
        broken("{}");
        broken(",");
        broken(",a");
        broken("a,");
        // Hangs on IE 9 if regular expression is inefficient
        broken("[id=012345678901234567890123456789");
        // Doesn't exist
        broken(":visble");
        broken(":nth-child");
        /*
         * Sigh again. IE 9 thinks this is also a real selector
         * Not super critical that we fix this case
         */
        broken(":nth-child(-)");
        /*
         * Sigh. WebKit thinks this is a real selector in qSA
         * They've already fixed this and it'll be coming into
         * Current browsers soon. Currently, Safari 5.0 still has this problem
         */
        broken(":nth-child(asdf)");
        broken(":nth-child(2n+-0)");
        broken(":nth-child(2+0)");
        broken(":nth-child(- 1n)");
        broken(":nth-child(-1 n)");
        broken(":first-child(n)");
        broken(":last-child(n)");
        broken(":only-child(n)");
        broken(":nth-last-last-child(1)");
        broken(":first-last-child");
        broken(":last-last-child");
        broken(":only-last-child");

        // Make sure attribute value quoting works correctly. See: #6093
        parseDOM(
            "<input type='hidden' value='2' name='foo.baz' id='attrbad1'/><input type='hidden' value='2' name='foo[baz]' id='attrbad2'/>"
        ).forEach((node) =>
            DomUtils.appendChild(document.getElementById("form"), node)
        );

        // Shouldn't be matching those inner brackets
        broken("input[name=foo[baz]]");
    });

    it("id", () => {
        expect.assertions(34);

        // ID Selector
        t("#body", ["body"]);
        // ID Selector w/ Element
        t("body#body", ["body"]);
        // ID Selector w/ Element
        t("ul#first", []);
        // ID selector with existing ID descendant
        t("#firstp #simon1", ["simon1"]);
        // ID selector with non-existant descendant
        t("#firstp #foobar", []);
        // ID selector using UTF8
        t("#台北Táiběi", ["台北Táiběi"]);
        // Multiple ID selectors using UTF8
        t("#台北Táiběi, #台北", ["台北Táiběi", "台北"]);
        // Descendant ID selector using UTF8
        t("div #台北", ["台北"]);
        // Child ID selector using UTF8
        t("form > #台北", ["台北"]);

        // Escaped ID
        t("#foo\\:bar", ["foo:bar"]);
        // Escaped ID with descendent
        t("#foo\\:bar span:not(:input)", ["foo_descendent"]);
        // Escaped ID
        t("#test\\.foo\\[5\\]bar", ["test.foo[5]bar"]);
        // Descendant escaped ID
        t("div #foo\\:bar", ["foo:bar"]);
        // Descendant escaped ID
        t("div #test\\.foo\\[5\\]bar", ["test.foo[5]bar"]);
        // Child escaped ID
        t("form > #foo\\:bar", ["foo:bar"]);
        // Child escaped ID
        t("form > #test\\.foo\\[5\\]bar", ["test.foo[5]bar"]);

        const [fiddle] = parseDOM(
            "<div id='fiddle\\Foo'><span id='fiddleSpan'></span></div>"
        );
        DomUtils.appendChild(document.getElementById("qunit-fixture"), fiddle);
        // Escaped ID as context
        t(
            "> span",
            ["fiddleSpan"],
            CSSselect.selectOne("#fiddle\\\\Foo", document)
        );

        DomUtils.removeElement(fiddle);

        // ID Selector, child ID present
        t("#form > #radio1", ["radio1"]); // Bug #267
        // ID Selector, not an ancestor ID
        t("#form #first", []);
        // ID Selector, not a child ID
        t("#form > #option1a", []);

        // All Children of ID
        t("#foo > *", ["sndp", "en", "sap"]);
        // All Children of ID with no children
        t("#firstUL > *", []);

        // ID selector with same value for a name attribute
        expect(
            (
                CSSselect.selectOne<AnyNode, ParentNode>(
                    "#tName1",
                    document
                ) as Element
            ).attribs["id"]
        ).toBe("tName1");
        // ID selector non-existing but name attribute on an A tag
        t("#tName2", []);
        // Leading ID selector non-existing but name attribute on an A tag
        t("#tName2 span", []);
        // Leading ID selector existing, retrieving the child
        t("#tName1 span", ["tName1-span"]);
        // Ending with ID
        expect(
            (
                CSSselect.selectOne<AnyNode, ParentNode>(
                    "div > div #tName1",
                    document
                ) as Element
            ).attribs["id"]
        ).toBe(
            (CSSselect.selectOne("#tName1-span", document)?.parent as Element)
                .attribs["id"]
        );

        parseDOM("<a id='backslash\\foo'></a>").forEach((node) =>
            DomUtils.appendChild(document.getElementById("form"), node)
        );
        // ID Selector contains backslash
        t("#backslash\\\\foo", ["backslash\\foo"]);

        // ID Selector on Form with an input that has a name of 'id'
        t("#lengthtest", ["lengthtest"]);

        // ID selector with non-existant ancestor
        t("#asdfasdf #foobar", []); // Bug #986

        // ID selector within the context of another element
        t("div#form", [], document.body);

        // Underscore ID
        t("#types_all", ["types_all"]);
        // Dash ID
        t("#qunit-fixture", ["qunit-fixture"]);

        // ID with weird characters in it
        t("#name\\+value", ["name+value"]);
    });

    it("class", () => {
        expect.assertions(27);

        // Class Selector
        t(".blog", ["mark", "simon"]);
        // Class Selector
        t(".GROUPS", ["groups"]);
        // Class Selector
        t(".blog.link", ["simon"]);
        // Class Selector w/ Element
        t("a.blog", ["mark", "simon"]);
        // Parent Class Selector
        t("p .blog", ["mark", "simon"]);

        // Class selector using UTF8
        t(".台北Táiběi", ["utf8class1"]);
        // Class selector using UTF8
        t(".台北", ["utf8class1", "utf8class2"]);
        // Class selector using UTF8
        t(".台北Táiběi.台北", ["utf8class1"]);
        // Class selector using UTF8
        t(".台北Táiběi, .台北", ["utf8class1", "utf8class2"]);
        // Descendant class selector using UTF8
        t("div .台北Táiběi", ["utf8class1"]);
        // Child class selector using UTF8
        t("form > .台北Táiběi", ["utf8class1"]);

        // Escaped Class
        t(".foo\\:bar", ["foo:bar"]);
        // Escaped Class
        t(".test\\.foo\\[5\\]bar", ["test.foo[5]bar"]);
        // Descendant escaped Class
        t("div .foo\\:bar", ["foo:bar"]);
        // Descendant escaped Class
        t("div .test\\.foo\\[5\\]bar", ["test.foo[5]bar"]);
        // Child escaped Class
        t("form > .foo\\:bar", ["foo:bar"]);
        // Child escaped Class
        t("form > .test\\.foo\\[5\\]bar", ["test.foo[5]bar"]);

        const div = document.createElement("div");
        div.children = parseDOM(
            "<div class='test e'></div><div class='test'></div>"
        );
        div.children.forEach((e) => {
            e.parent = div;
        });
        // Finding a second class.
        expect(CSSselect.selectAll(".e", div)).toStrictEqual([div.children[0]]);

        const lastChild = div.children[div.children.length - 1] as Element;
        lastChild.attribs["class"] = "e";

        // Finding a modified class.
        expect(CSSselect.selectAll(".e", div)).toStrictEqual([
            div.children[0],
            lastChild,
        ]);

        // .null does not match an element with no class
        expect(CSSselect.is(div, ".null")).toBe(false);
        // .null does not match an element with no class
        expect(CSSselect.is(div.children[0], ".null div")).toBe(false);
        div.attribs["class"] = "null";
        // .null matches element with class 'null'
        expect(CSSselect.is(div, ".null")).toBe(true);
        // Caching system respects DOM changes
        expect(CSSselect.is(div.children[0], ".null div")).toBe(true);
        // Testing class on document doesn't error
        expect(CSSselect.is(document, ".foo")).toBe(false);
        lastChild.attribs["class"] += " hasOwnProperty toString";
        // Testing class on global object doesn't error
        expect(CSSselect.is(global, ".foo")).toBe(false);
        // Classes match Object.prototype properties
        expect(
            CSSselect.selectAll(".e.hasOwnProperty.toString", div)
        ).toStrictEqual([lastChild]);

        const [div2] = parseDOM(
            "<div><svg width='200' height='250' version='1.1' xmlns='http://www.w3.org/2000/svg'><rect x='10' y='10' width='30' height='30' class='foo'></rect></svg></div>"
        );
        // Class selector against SVG
        expect(CSSselect.selectAll(".foo", div2)).toHaveLength(1);
    });

    it("name", () => {
        expect.assertions(13);

        // Name selector
        t("input[name=action]", ["text1"]);
        // Name selector with single quotes
        t("input[name='action']", ["text1"]);
        // Name selector with double quotes
        t('input[name="action"]', ["text1"]);

        // Name selector non-input
        t("[name=example]", ["name-is-example"]);
        // Name selector non-input
        t("[name=div]", ["name-is-div"]);
        // Name selector non-input
        t("*[name=iframe]", ["iframe"]);

        // Name selector for grouped input
        t("input[name='types[]']", ["types_all", "types_anime", "types_movie"]);

        const form1 = document.getElementById("form");
        // Name selector within the context of another element
        t("input[name=action]", ["text1"], form1);
        // Name selector for grouped form element within the context of another element
        t("input[name='foo[bar]']", ["hidden2"], form1);

        const [form2] = parseDOM("<form><input name='id'/></form>");
        DomUtils.appendChild(document.body, form2);

        // Make sure that rooted queries on forms (with possible expandos) work.
        expect(CSSselect.selectAll("input", form2)).toHaveLength(1);

        DomUtils.removeElement(form2);

        // Find elements that have similar IDs
        t("[name=tName1]", ["tName1ID"]);
        // Find elements that have similar IDs
        t("[name=tName2]", ["tName2ID"]);
        // Find elements that have similar IDs
        t("#tName2ID", ["tName2ID"]);
    });

    it("multiple", () => {
        expect.assertions(6);

        // Comma Support
        t("h2, #qunit-fixture p", [
            "qunit-banner",
            "qunit-userAgent",
            "firstp",
            "ap",
            "sndp",
            "en",
            "sap",
            "first",
        ]);
        // Comma Support
        t("h2 , #qunit-fixture p", [
            "qunit-banner",
            "qunit-userAgent",
            "firstp",
            "ap",
            "sndp",
            "en",
            "sap",
            "first",
        ]);
        // Comma Support
        t("h2 , #qunit-fixture p", [
            "qunit-banner",
            "qunit-userAgent",
            "firstp",
            "ap",
            "sndp",
            "en",
            "sap",
            "first",
        ]);
        // Comma Support
        t("h2,#qunit-fixture p", [
            "qunit-banner",
            "qunit-userAgent",
            "firstp",
            "ap",
            "sndp",
            "en",
            "sap",
            "first",
        ]);
        // Comma Support
        t("h2,#qunit-fixture p ", [
            "qunit-banner",
            "qunit-userAgent",
            "firstp",
            "ap",
            "sndp",
            "en",
            "sap",
            "first",
        ]);
        // Comma Support
        t("h2\t,\r#qunit-fixture p\n", [
            "qunit-banner",
            "qunit-userAgent",
            "firstp",
            "ap",
            "sndp",
            "en",
            "sap",
            "first",
        ]);
    });

    it("child and adjacent", () => {
        expect.assertions(38);

        // Child
        t("p > a", ["simon1", "google", "groups", "mark", "yahoo", "simon"]);
        // Child
        t("p> a", ["simon1", "google", "groups", "mark", "yahoo", "simon"]);
        // Child
        t("p >a", ["simon1", "google", "groups", "mark", "yahoo", "simon"]);
        // Child
        t("p>a", ["simon1", "google", "groups", "mark", "yahoo", "simon"]);
        // Child w/ Class
        t("p > a.blog", ["mark", "simon"]);
        // All Children
        t("code > *", ["anchor1", "anchor2"]);
        // All Grandchildren
        t("p > * > *", ["anchor1", "anchor2"]);
        // Adjacent
        t("#qunit-fixture a + a", ["groups", "tName2ID"]);
        // Adjacent
        t("#qunit-fixture a +a", ["groups", "tName2ID"]);
        // Adjacent
        t("#qunit-fixture a+ a", ["groups", "tName2ID"]);
        // Adjacent
        t("#qunit-fixture a+a", ["groups", "tName2ID"]);
        // Adjacent
        t("p + p", ["ap", "en", "sap"]);
        // Adjacent
        t("p#firstp + p", ["ap"]);
        // Adjacent
        t("p[lang=en] + p", ["sap"]);
        // Adjacent
        t("a.GROUPS + code + a", ["mark"]);
        // Comma, Child, and Adjacent
        t("#qunit-fixture a + a, code > a", [
            "groups",
            "anchor1",
            "anchor2",
            "tName2ID",
        ]);
        // Element Preceded By
        t("#qunit-fixture p ~ div", [
            "foo",
            "nothiddendiv",
            "moretests",
            "tabindex-tests",
            "liveHandlerOrder",
            "siblingTest",
        ]);
        // Element Preceded By
        t("#first ~ div", [
            "moretests",
            "tabindex-tests",
            "liveHandlerOrder",
            "siblingTest",
        ]);
        // Element Preceded By
        t("#groups ~ a", ["mark"]);
        // Element Preceded By
        t("#length ~ input", ["idTest"]);
        // Element Preceded By
        t("#siblingfirst ~ em", ["siblingnext", "siblingthird"]);
        // Element Preceded By (multiple)
        t("#siblingTest em ~ em ~ em ~ span", ["siblingspan"]);
        // Element Preceded By, Containing
        t("#liveHandlerOrder ~ div em:contains('1')", ["siblingfirst"]);

        const siblingFirst = document.getElementById("siblingfirst");

        // Element Preceded By with a context.
        t("~ em", ["siblingnext", "siblingthird"], siblingFirst);
        // Element Directly Preceded By with a context.
        t("+ em", ["siblingnext"], siblingFirst);

        const en = document.getElementById("en");
        // Compound selector with context, beginning with sibling test.
        t("+ p, a", ["yahoo", "sap"], en);
        // Compound selector with context, containing sibling test.
        t("a, + p", ["yahoo", "sap"], en);

        // Multiple combinators selects all levels
        t("#siblingTest em *", [
            "siblingchild",
            "siblinggrandchild",
            "siblinggreatgrandchild",
        ]);
        // Multiple combinators selects all levels
        t("#siblingTest > em *", [
            "siblingchild",
            "siblinggrandchild",
            "siblinggreatgrandchild",
        ]);
        // Multiple sibling combinators doesn't miss general siblings
        t("#siblingTest > em:first-child + em ~ span", ["siblingspan"]);
        // Combinators are not skipped when mixing general and specific
        t("#siblingTest > em:contains('x') + em ~ span", []);

        // Parent div for next test is found via ID (#8310)
        expect(CSSselect.selectAll("#listWithTabIndex", document)).toHaveLength(
            1
        );
        // Make sure the temporary id assigned by sizzle is cleared out (#8310)
        expect(CSSselect.selectAll("#__sizzle__", document)).toHaveLength(0);
        // Parent div for previous test is still found via ID (#8310)
        expect(CSSselect.selectAll("#listWithTabIndex", document)).toHaveLength(
            1
        );

        // Verify deep class selector
        t("div.blah > p > a", []);

        // No element deep selector
        t("div.foo > span > a", []);

        // Non-existant ancestors
        t(".fototab > .thumbnails > a", []);
        // Child of scope
        t(
            ":scope > label",
            ["scopeTest--child"],
            CSSselect.selectOne("#scopeTest", document)
        );
    });

    it("attributes", () => {
        expect.assertions(77);

        // Attribute Exists
        t("#qunit-fixture a[title]", ["google"]);
        // Attribute Exists (case-insensitive)
        t("#qunit-fixture a[TITLE]", ["google"]);
        // Attribute Exists
        t("#qunit-fixture *[title]", ["google"]);
        // Attribute Exists
        t("#qunit-fixture [title]", ["google"]);
        // Attribute Exists
        t("#qunit-fixture a[ title ]", ["google"]);

        // Boolean attribute exists
        t("#select2 option[selected]", ["option2d"]);
        // Boolean attribute equals
        t("#select2 option[selected='selected']", ["option2d"]);

        // Attribute Equals
        t("#qunit-fixture a[rel='bookmark']", ["simon1"]);
        // Attribute Equals
        t("#qunit-fixture a[rel='bookmark']", ["simon1"]);
        // Attribute Equals
        t("#qunit-fixture a[rel=bookmark]", ["simon1"]);
        // Attribute Equals
        t("#qunit-fixture a[href='http://www.google.com/']", ["google"]);
        // Attribute Equals
        t("#qunit-fixture a[ rel = 'bookmark' ]", ["simon1"]);
        // Attribute Equals Number
        t("#qunit-fixture option[value=1]", [
            "option1b",
            "option2b",
            "option3b",
            "option4b",
            "option5c",
        ]);
        // Attribute Equals Number
        t("#qunit-fixture li[tabIndex=-1]", ["foodWithNegativeTabIndex"]);

        document.getElementById("anchor2").attribs["href"] = "#2";
        // `href` Attribute
        t("p a[href^=#]", ["anchor2"]);
        t("p a[href*=#]", ["simon1", "anchor2"]);

        // `for` Attribute
        t("form label[for]", ["label-for"]);
        // `for` Attribute in form
        t("#form [for=action]", ["label-for"]);

        // Attribute containing []
        t("input[name^='foo[']", ["hidden2"]);
        // Attribute containing []
        t("input[name^='foo[bar]']", ["hidden2"]);
        // Attribute containing []
        t("input[name*='[bar]']", ["hidden2"]);
        // Attribute containing []
        t("input[name$='bar]']", ["hidden2"]);
        // Attribute containing []
        t("input[name$='[bar]']", ["hidden2"]);
        // Attribute containing []
        t("input[name$='foo[bar]']", ["hidden2"]);
        // Attribute containing []
        t("input[name*='foo[bar]']", ["hidden2"]);

        // Without context, single-quoted attribute containing ','
        t("input[data-comma='0,1']", ["el12087"], document);
        // Without context, double-quoted attribute containing ','
        t('input[data-comma="0,1"]', ["el12087"]);
        // With context, single-quoted attribute containing ','
        t(
            "input[data-comma='0,1']",
            ["el12087"],
            document.getElementById("t12087")
        );
        // With context, double-quoted attribute containing ','
        t(
            'input[data-comma="0,1"]',
            ["el12087"],
            document.getElementById("t12087")
        );

        // Multiple Attribute Equals
        t("#form input[type='radio'], #form input[type='hidden']", [
            "radio1",
            "radio2",
            "hidden1",
        ]);
        // Multiple Attribute Equals
        t("#form input[type='radio'], #form input[type=\"hidden\"]", [
            "radio1",
            "radio2",
            "hidden1",
        ]);
        // Multiple Attribute Equals
        t("#form input[type='radio'], #form input[type=hidden]", [
            "radio1",
            "radio2",
            "hidden1",
        ]);

        // Attribute selector using UTF8
        t("span[lang=中文]", ["台北"]);

        // Attribute Begins With
        t("a[href ^= 'http://www']", ["google", "yahoo"]);
        // Attribute Ends With
        t("a[href $= 'org/']", ["mark"]);
        // Attribute Contains
        t("a[href *= 'google']", ["google", "groups"]);
        // Attribute Is Not Equal
        t("#ap a[hreflang!='en']", ["google", "groups", "anchor1"]);

        const opt = document.getElementById("option1a");
        opt.attribs["test"] = "";

        // Attribute Is Not Equal Matches
        expect(CSSselect.is(opt, "[id*=option1][type!=checkbox]")).toBe(true);
        // Attribute With No Quotes Contains Matches
        expect(CSSselect.is(opt, "[id*=option1]")).toBe(true);
        // Attribute With No Quotes No Content Matches
        expect(CSSselect.is(opt, "[test=]")).toBe(true);
        // Attribute with empty string value does not match startsWith selector (^=)
        expect(CSSselect.is(opt, "[test^='']")).toBe(false);
        // Attribute With No Quotes Equals Matches
        expect(CSSselect.is(opt, "[id=option1a]")).toBe(true);
        // Attribute With No Quotes Href Contains Matches
        expect(
            CSSselect.is(document.getElementById("simon1"), "a[href*=#]")
        ).toBe(true);

        // Empty values
        t("#select1 option[value='']", ["option1a"]);
        // Empty values
        t("#select1 option[value!='']", ["option1b", "option1c", "option1d"]);

        // Select options via :selected
        t("#select1 option:selected", ["option1a"]);
        // Select options via :selected
        t("#select2 option:selected", ["option2d"]);
        // Select options via :selected
        t("#select3 option:selected", ["option3b", "option3c"]);
        // Select options via :selected
        t("select[name='select2'] option:selected", ["option2d"]);

        // Grouped Form Elements
        t("input[name='foo[bar]']", ["hidden2"]);

        const input = document.getElementById("text1");
        input.attribs["title"] = "Don't click me";

        // Quote within attribute value does not mess up tokenizer
        expect(CSSselect.is(input, 'input[title="Don\'t click me"]')).toBe(
            true
        );

        // See jQuery #12303
        input.attribs["data-pos"] = ":first";
        // POS within attribute value is treated as an attribute value
        expect(CSSselect.is(input, "input[data-pos=\\:first]")).toBe(true);
        // POS within attribute value is treated as an attribute value
        expect(CSSselect.is(input, "input[data-pos=':first']")).toBe(true);
        // POS within attribute value after pseudo is treated as an attribute value
        expect(CSSselect.is(input, ":input[data-pos=':first']")).toBe(true);
        delete input.attribs["data-pos"];

        /*
         * Make sure attribute value quoting works correctly. See jQuery #6093; #6428; #13894
         * Use seeded results to bypass querySelectorAll optimizations
         */
        const attrbad = [
            ...parseDOM(
                "<input type='hidden' id='attrbad_space' name='foo bar'/>" +
                    "<input type='hidden' id='attrbad_dot' value='2' name='foo.baz'/>" +
                    "<input type='hidden' id='attrbad_brackets' value='2' name='foo[baz]'/>" +
                    "<input type='hidden' id='attrbad_injection' data-attr='foo_baz&#39;]'/>" +
                    "<input type='hidden' id='attrbad_quote' data-attr='&#39;'/>" +
                    "<input type='hidden' id='attrbad_backslash' data-attr='&#92;'/>" +
                    "<input type='hidden' id='attrbad_backslash_quote' data-attr='&#92;&#39;'/>" +
                    "<input type='hidden' id='attrbad_backslash_backslash' data-attr='&#92;&#92;'/>" +
                    "<input type='hidden' id='attrbad_unicode' data-attr='&#x4e00;'/>",
                { decodeEntities: true }
            ),
        ] as Element[];
        attrbad.forEach((attr) =>
            DomUtils.appendChild(document.getElementById("qunit-fixture"), attr)
        );

        // Underscores don't need escaping
        t("input[id=types_all]", ["types_all"]);

        // Escaped space
        t("input[name=foo\\ bar]", ["attrbad_space"]);
        // Escaped dot
        t("input[name=foo\\.baz]", ["attrbad_dot"]);
        // Escaped brackets
        t("input[name=foo\\[baz\\]]", ["attrbad_brackets"]);

        // Escaped quote + right bracket
        t("input[data-attr='foo_baz\\']']", ["attrbad_injection"]);

        // Quoted quote
        t("input[data-attr='\\'']", ["attrbad_quote"]);
        // Quoted backslash
        t("input[data-attr='\\\\']", ["attrbad_backslash"]);
        // Quoted backslash quote
        t("input[data-attr='\\\\\\'']", ["attrbad_backslash_quote"]);
        // Quoted backslash backslash
        t("input[data-attr='\\\\\\\\']", ["attrbad_backslash_backslash"]);

        // Quoted backslash backslash (numeric escape)
        t("input[data-attr='\\5C\\\\']", ["attrbad_backslash_backslash"]);
        // Quoted backslash backslash (numeric escape with trailing space)
        t("input[data-attr='\\5C \\\\']", ["attrbad_backslash_backslash"]);
        // Quoted backslash backslash (numeric escape with trailing tab)
        t("input[data-attr='\\5C\t\\\\']", ["attrbad_backslash_backslash"]);
        // Long numeric escape (BMP)
        t("input[data-attr='\\04e00']", ["attrbad_unicode"]);

        document.getElementById("attrbad_unicode").attribs["data-attr"] =
            "\uD834\uDF06A";
        /*
         * It was too much code to fix Safari 5.x Supplemental Plane crashes (see ba5f09fa404379a87370ec905ffa47f8ac40aaa3)
         * Long numeric escape (non-BMP)
         */
        t("input[data-attr='\\01D306A']", ["attrbad_unicode"]);

        attrbad.forEach((attr) => DomUtils.removeElement(attr));

        // `input[type=text]`
        t("#form input[type=text]", ["text1", "text2", "hidden2", "name"]);
        // `input[type=search]`
        t("#form input[type=search]", ["search"]);
        // `script[src]` (jQuery #13777)
        t("#moretests script[src]", ["script-src"]);

        // #3279
        const div = document.createElement("div");
        div.children = parseDOM("<div id='foo' xml:test='something'></div>");

        // Finding by attribute with escaped characters.
        expect(CSSselect.selectAll("[xml\\:test]", div)).toStrictEqual([
            div.children[0],
        ]);

        const foo = document.getElementById("foo");
        // Object.prototype property "constructor" (negative)',
        t("[constructor]", []);
        // Gecko Object.prototype property "watch" (negative)',
        t("[watch]", []);
        foo.attribs["constructor"] = "foo";
        foo.attribs["watch"] = "bar";
        // Object.prototype property "constructor"',
        t("[constructor='foo']", ["foo"]);
        // Gecko Object.prototype property "watch"',
        t("[watch='bar']", ["foo"]);

        // Value attribute is retrieved correctly
        t("input[value=Test]", ["text1", "text2"]);
    });

    it("pseudo - (parent|empty)", () => {
        expect.assertions(3);
        // Empty
        t("ul:empty", ["firstUL"]);
        // Empty with comment node
        t("ol:empty", ["empty"]);
        // Is A Parent
        t("#qunit-fixture p:parent", [
            "firstp",
            "ap",
            "sndp",
            "en",
            "sap",
            "first",
        ]);
    });

    it("pseudo - (first|last|only)-(child|of-type)", () => {
        expect.assertions(12);

        // First Child
        t("p:first-child", ["firstp", "sndp"]);
        // First Child (leading id)
        t("#qunit-fixture p:first-child", ["firstp", "sndp"]);
        // First Child (leading class)
        t(".nothiddendiv div:first-child", ["nothiddendivchild"]);
        // First Child (case-insensitive)
        t("#qunit-fixture p:FIRST-CHILD", ["firstp", "sndp"]);

        // Last Child
        t("p:last-child", ["sap"]);
        // Last Child (leading id)
        t("#qunit-fixture a:last-child", [
            "simon1",
            "anchor1",
            "mark",
            "yahoo",
            "anchor2",
            "simon",
            "liveLink1",
            "liveLink2",
        ]);

        // Only Child
        t("#qunit-fixture a:only-child", [
            "simon1",
            "anchor1",
            "yahoo",
            "anchor2",
            "liveLink1",
            "liveLink2",
        ]);

        // First-of-type
        t("#qunit-fixture > p:first-of-type", ["firstp"]);
        // Last-of-type
        t("#qunit-fixture > p:last-of-type", ["first"]);
        // Only-of-type
        t("#qunit-fixture > :only-of-type", [
            "name+value",
            "firstUL",
            "empty",
            "floatTest",
            "iframe",
            "table",
        ]);

        // Verify that the child position isn't being cached improperly
        const secondChildren: AnyNode[] = CSSselect.selectAll(
            "p:nth-child(2)",
            document
        );
        const newNodes = secondChildren.map((child) => {
            const [node] = parseDOM("<div></div>");
            DomUtils.prepend(child as ChildNode, node);
            return node;
        });

        // No longer second child
        t("p:nth-child(2)", []);

        newNodes.forEach((node) => DomUtils.removeElement(node));

        // Restored second child
        t("p:nth-child(2)", ["ap", "en"]);
    });

    it("pseudo - nth-child", () => {
        expect.assertions(29);

        // Nth-child
        t("p:nth-child(1)", ["firstp", "sndp"]);
        // Nth-child (with whitespace)
        t("p:nth-child( 1 )", ["firstp", "sndp"]);
        // Nth-child (case-insensitive)
        t("#select1 option:NTH-child(3)", ["option1c"]);
        // Not nth-child
        t("#qunit-fixture p:not(:nth-child(1))", ["ap", "en", "sap", "first"]);

        // Nth-child(2)
        t("#qunit-fixture form#form > *:nth-child(2)", ["text1"]);
        // Nth-child(2)
        t("#qunit-fixture form#form > :nth-child(2)", ["text1"]);

        // Nth-child(-1)
        t("#select1 option:nth-child(-1)", []);
        // Nth-child(3)
        t("#select1 option:nth-child(3)", ["option1c"]);

        // "Nth-child(0n+3)"
        t("#select1 option:nth-child(0n+3)", ["option1c"]);

        // Nth-child(1n+0)
        t("#select1 option:nth-child(1n+0)", [
            "option1a",
            "option1b",
            "option1c",
            "option1d",
        ]);
        // Nth-child(1n)
        t("#select1 option:nth-child(1n)", [
            "option1a",
            "option1b",
            "option1c",
            "option1d",
        ]);
        // Nth-child(n)
        t("#select1 option:nth-child(n)", [
            "option1a",
            "option1b",
            "option1c",
            "option1d",
        ]);
        // Nth-child(even)
        t("#select1 option:nth-child(even)", ["option1b", "option1d"]);
        // Nth-child(odd)
        t("#select1 option:nth-child(odd)", ["option1a", "option1c"]);
        // Nth-child(2n)
        t("#select1 option:nth-child(2n)", ["option1b", "option1d"]);
        // Nth-child(2n+1)
        t("#select1 option:nth-child(2n+1)", ["option1a", "option1c"]);
        // Nth-child(2n + 1)
        t("#select1 option:nth-child(2n + 1)", ["option1a", "option1c"]);
        // Nth-child(+2n + 1)
        t("#select1 option:nth-child(+2n + 1)", ["option1a", "option1c"]);
        // Nth-child(3n)
        t("#select1 option:nth-child(3n)", ["option1c"]);
        // Nth-child(3n+1)
        t("#select1 option:nth-child(3n+1)", ["option1a", "option1d"]);
        // Nth-child(3n+2)
        t("#select1 option:nth-child(3n+2)", ["option1b"]);
        // Nth-child(3n+3)
        t("#select1 option:nth-child(3n+3)", ["option1c"]);
        // Nth-child(3n-1)
        t("#select1 option:nth-child(3n-1)", ["option1b"]);
        // Nth-child(3n-2)
        t("#select1 option:nth-child(3n-2)", ["option1a", "option1d"]);
        // Nth-child(3n-3)
        t("#select1 option:nth-child(3n-3)", ["option1c"]);
        // Nth-child(3n+0)
        t("#select1 option:nth-child(3n+0)", ["option1c"]);
        // Nth-child(-1n+3)
        t("#select1 option:nth-child(-1n+3)", [
            "option1a",
            "option1b",
            "option1c",
        ]);
        // Nth-child(-n+3)
        t("#select1 option:nth-child(-n+3)", [
            "option1a",
            "option1b",
            "option1c",
        ]);
        // Nth-child(-1n + 3)
        t("#select1 option:nth-child(-1n + 3)", [
            "option1a",
            "option1b",
            "option1c",
        ]);
    });

    it("pseudo - nth-last-child", () => {
        expect.assertions(29);

        // Nth-last-child
        t("form:nth-last-child(5)", ["testForm"]);
        // Nth-last-child (with whitespace)
        t("form:nth-last-child( 5 )", ["testForm"]);
        // Nth-last-child (case-insensitive)
        t("#select1 option:NTH-last-child(3)", ["option1b"]);
        // Not nth-last-child
        t("#qunit-fixture p:not(:nth-last-child(1))", [
            "firstp",
            "ap",
            "sndp",
            "en",
            "first",
        ]);

        // Nth-last-child(-1)
        t("#select1 option:nth-last-child(-1)", []);
        // Nth-last-child(3)
        t("#select1 :nth-last-child(3)", ["option1b"]);
        // Nth-last-child(3)
        t("#select1 *:nth-last-child(3)", ["option1b"]);
        // Nth-last-child(3)
        t("#select1 option:nth-last-child(3)", ["option1b"]);

        // Nth-last-child(0n+3)
        t("#select1 option:nth-last-child(0n+3)", ["option1b"]);

        // Nth-last-child(1n+0)
        t("#select1 option:nth-last-child(1n+0)", [
            "option1a",
            "option1b",
            "option1c",
            "option1d",
        ]);
        // Nth-last-child(1n)
        t("#select1 option:nth-last-child(1n)", [
            "option1a",
            "option1b",
            "option1c",
            "option1d",
        ]);
        // Nth-last-child(n)
        t("#select1 option:nth-last-child(n)", [
            "option1a",
            "option1b",
            "option1c",
            "option1d",
        ]);
        // Nth-last-child(even)
        t("#select1 option:nth-last-child(even)", ["option1a", "option1c"]);
        // Nth-last-child(odd)
        t("#select1 option:nth-last-child(odd)", ["option1b", "option1d"]);
        // Nth-last-child(2n)
        t("#select1 option:nth-last-child(2n)", ["option1a", "option1c"]);
        // Nth-last-child(2n+1)
        t("#select1 option:nth-last-child(2n+1)", ["option1b", "option1d"]);
        // Nth-last-child(2n + 1)
        t("#select1 option:nth-last-child(2n + 1)", ["option1b", "option1d"]);
        // Nth-last-child(+2n + 1)
        t("#select1 option:nth-last-child(+2n + 1)", ["option1b", "option1d"]);
        // Nth-last-child(3n)
        t("#select1 option:nth-last-child(3n)", ["option1b"]);
        // Nth-last-child(3n+1)
        t("#select1 option:nth-last-child(3n+1)", ["option1a", "option1d"]);
        // Nth-last-child(3n+2)
        t("#select1 option:nth-last-child(3n+2)", ["option1c"]);
        // Nth-last-child(3n+3)
        t("#select1 option:nth-last-child(3n+3)", ["option1b"]);
        // Nth-last-child(3n-1)
        t("#select1 option:nth-last-child(3n-1)", ["option1c"]);
        // Nth-last-child(3n-2)
        t("#select1 option:nth-last-child(3n-2)", ["option1a", "option1d"]);
        // Nth-last-child(3n-3)
        t("#select1 option:nth-last-child(3n-3)", ["option1b"]);
        // Nth-last-child(3n+0)
        t("#select1 option:nth-last-child(3n+0)", ["option1b"]);
        // Nth-last-child(-1n+3)
        t("#select1 option:nth-last-child(-1n+3)", [
            "option1b",
            "option1c",
            "option1d",
        ]);
        // Nth-last-child(-n+3)
        t("#select1 option:nth-last-child(-n+3)", [
            "option1b",
            "option1c",
            "option1d",
        ]);
        // Nth-last-child(-1n + 3)
        t("#select1 option:nth-last-child(-1n + 3)", [
            "option1b",
            "option1c",
            "option1d",
        ]);
    });

    it("pseudo - nth-of-type", () => {
        expect.assertions(9);
        // Nth-of-type(-1)
        t(":nth-of-type(-1)", []);
        // Nth-of-type(3)
        t("#ap :nth-of-type(3)", ["mark"]);
        // Nth-of-type(n)
        t("#ap :nth-of-type(n)", [
            "google",
            "groups",
            "code1",
            "anchor1",
            "mark",
        ]);
        // Nth-of-type(0n+3)
        t("#ap :nth-of-type(0n+3)", ["mark"]);
        // Nth-of-type(2n)
        t("#ap :nth-of-type(2n)", ["groups"]);
        // Nth-of-type(even)
        t("#ap :nth-of-type(even)", ["groups"]);
        // Nth-of-type(2n+1)
        t("#ap :nth-of-type(2n+1)", ["google", "code1", "anchor1", "mark"]);
        // Nth-of-type(odd)
        t("#ap :nth-of-type(odd)", ["google", "code1", "anchor1", "mark"]);
        // Nth-of-type(-n+2)
        t("#qunit-fixture > :nth-of-type(-n+2)", [
            "firstp",
            "ap",
            "foo",
            "nothiddendiv",
            "name+value",
            "firstUL",
            "empty",
            "form",
            "floatTest",
            "iframe",
            "lengthtest",
            "table",
        ]);
    });

    it("pseudo - nth-last-of-type", () => {
        expect.assertions(9);
        // Nth-last-of-type(-1)
        t(":nth-last-of-type(-1)", []);
        // Nth-last-of-type(3)
        t("#ap :nth-last-of-type(3)", ["google"]);
        // Nth-last-of-type(n)
        t("#ap :nth-last-of-type(n)", [
            "google",
            "groups",
            "code1",
            "anchor1",
            "mark",
        ]);
        // Nth-last-of-type(0n+3)
        t("#ap :nth-last-of-type(0n+3)", ["google"]);
        // Nth-last-of-type(2n)
        t("#ap :nth-last-of-type(2n)", ["groups"]);
        // Nth-last-of-type(even)
        t("#ap :nth-last-of-type(even)", ["groups"]);
        // Nth-last-of-type(2n+1)
        t("#ap :nth-last-of-type(2n+1)", [
            "google",
            "code1",
            "anchor1",
            "mark",
        ]);
        // Nth-last-of-type(odd)
        t("#ap :nth-last-of-type(odd)", ["google", "code1", "anchor1", "mark"]);
        // Nth-last-of-type(-n+2)
        t("#qunit-fixture > :nth-last-of-type(-n+2)", [
            "ap",
            "name+value",
            "first",
            "firstUL",
            "empty",
            "floatTest",
            "iframe",
            "table",
            "name-tests",
            "testForm",
            "liveHandlerOrder",
            "siblingTest",
        ]);
    });

    it("pseudo - has", () => {
        expect.assertions(3);

        // Basic test
        t("p:has(a)", ["firstp", "ap", "en", "sap"]);
        // Basic test (irrelevant whitespace)
        t("p:has( a )", ["firstp", "ap", "en", "sap"]);
        // Nested with overlapping candidates
        t("#qunit-fixture div:has(div:has(div:not([id])))", [
            "moretests",
            "t2037",
        ]);
    });

    it("pseudo - misc", () => {
        expect.assertions(31);

        // Headers
        t(":header", ["qunit-header", "qunit-banner", "qunit-userAgent"]);
        // Headers(case-insensitive)
        t(":Header", ["qunit-header", "qunit-banner", "qunit-userAgent"]);
        // Multiple matches with the same context (cache check)
        t("#form select:has(option:first-child:contains('o'))", [
            "select1",
            "select2",
            "select3",
            "select4",
        ]);

        // All not grandparents
        expect(
            CSSselect.selectAll("#qunit-fixture :not(:has(:has(*)))", document)
                .length
        ).toBeTruthy();

        const select = document.getElementById("select1");
        // Has Option Matches
        expect(CSSselect.is(select, ":has(option)")).toBe(true);

        // Empty string contains
        expect(
            CSSselect.selectAll("a:contains('')", document).length
        ).toBeTruthy();
        // Text Contains
        t("a:contains(Google)", ["google", "groups"]);
        // Text Contains
        t("a:contains(Google Groups)", ["groups"]);

        // Text Contains
        t("a:contains('Google Groups (Link)')", ["groups"]);
        // Text Contains
        t('a:contains("(Link)")', ["groups"]);
        // Text Contains
        t("a:contains(Google Groups (Link))", ["groups"]);
        // Text Contains
        t("a:contains((Link))", ["groups"]);

        const tmp = document.createElement("div");
        tmp.attribs["id"] = "tmp_input";
        DomUtils.appendChild(document.body, tmp);

        for (const type of ["button", "submit", "reset"]) {
            const els = parseDOM(
                "<input id='input_%' type='%'/><button id='button_%' type='%'>test</button>".replace(
                    /%/g,
                    type
                )
            ).slice(0); // Create a copy of the array, so that `appendChild` doesn't remove the elements.

            for (const el of els) {
                DomUtils.appendChild(tmp, el);
            }

            // Input Buttons :${type}
            t(`#tmp_input :${type}`, [`input_${type}`, `button_${type}`]);

            // Input Matches :${type}
            expect(CSSselect.is(els[0], `:${type}`)).toBe(true);
            // Button Matches :${type}
            expect(CSSselect.is(els[1], `:${type}`)).toBe(true);
        }

        DomUtils.removeElement(tmp);

        // Caching system tolerates recursive selection
        t(
            "[id='select1'] *:not(:last-child), [id='select2'] *:not(:last-child)",
            [
                "option1a",
                "option1b",
                "option1c",
                "option2a",
                "option2b",
                "option2c",
            ],
            document.getElementById("qunit-fixture")
        );

        /*
         * Tokenization edge cases
         */
        // Sequential pseudos
        t("#qunit-fixture p:has(:contains(mark)):has(code)", ["ap"]);
        t(
            "#qunit-fixture p:has(:contains(mark)):has(code):contains(This link)",
            ["ap"]
        );

        // Pseudo argument containing ')'
        t("p:has(>a.GROUPS[src!=')'])", ["ap"]);
        t("p:has(>a.GROUPS[src!=')'])", ["ap"]);
        // Pseudo followed by token containing ')'
        t('p:contains(id="foo")[id!=\\)]', ["sndp"]);
        t("p:contains(id=\"foo\")[id!=')']", ["sndp"]);

        // Multi-pseudo
        t("#ap:has(*), #ap:has(*)", ["ap"]);
        // Multi-pseudo with leading nonexistent id
        t("#nonexistent:has(*), #ap:has(*)", ["ap"]);

        // Tokenization stressor
        t(
            "a[class*=blog]:not(:has(*, :contains(!)), :contains(!)), br:contains(]), p:contains(]), :not(:empty):not(:parent)",
            ["ap", "mark", "yahoo", "simon"]
        );
    });

    it("pseudo - :not", () => {
        expect.assertions(32);

        // Not
        t("a.blog:not(.link)", ["mark"]);

        // Not - multiple
        t("#form option:not(:contains(Nothing),#option1b,:selected)", [
            "option1c",
            "option1d",
            "option2b",
            "option2c",
            "option3d",
            "option3e",
            "option4e",
            "option5b",
            "option5c",
        ]);
        // Not - recursive
        t("#form option:not(:not(:selected))[id^='option3']", [
            "option3b",
            "option3c",
        ]);

        // :not() failing interior
        t("#qunit-fixture p:not(.foo)", [
            "firstp",
            "ap",
            "sndp",
            "en",
            "sap",
            "first",
        ]);
        // :not() failing interior
        t("#qunit-fixture p:not(div.foo)", [
            "firstp",
            "ap",
            "sndp",
            "en",
            "sap",
            "first",
        ]);
        // :not() failing interior
        t("#qunit-fixture p:not(p.foo)", [
            "firstp",
            "ap",
            "sndp",
            "en",
            "sap",
            "first",
        ]);
        // :not() failing interior
        t("#qunit-fixture p:not(#blargh)", [
            "firstp",
            "ap",
            "sndp",
            "en",
            "sap",
            "first",
        ]);
        // :not() failing interior
        t("#qunit-fixture p:not(div#blargh)", [
            "firstp",
            "ap",
            "sndp",
            "en",
            "sap",
            "first",
        ]);
        // :not() failing interior
        t("#qunit-fixture p:not(p#blargh)", [
            "firstp",
            "ap",
            "sndp",
            "en",
            "sap",
            "first",
        ]);

        // :not Multiple
        t("#qunit-fixture p:not(a)", [
            "firstp",
            "ap",
            "sndp",
            "en",
            "sap",
            "first",
        ]);
        // :not Multiple
        t("#qunit-fixture p:not( a )", [
            "firstp",
            "ap",
            "sndp",
            "en",
            "sap",
            "first",
        ]);
        // :not Multiple
        t("#qunit-fixture p:not( p )", []);
        // :not Multiple
        t("#qunit-fixture p:not(a, b)", [
            "firstp",
            "ap",
            "sndp",
            "en",
            "sap",
            "first",
        ]);
        // :not Multiple
        t("#qunit-fixture p:not(a, b, div)", [
            "firstp",
            "ap",
            "sndp",
            "en",
            "sap",
            "first",
        ]);
        // :not Multiple
        t("p:not(p)", []);
        // :not Multiple
        t("p:not(a,p)", []);
        // :not Multiple
        t("p:not(p,a)", []);
        // :not Multiple
        t("p:not(a,p,b)", []);
        // :not Multiple
        t(":input:not(:image,:input,:submit)", []);
        // :not Multiple
        t("#qunit-fixture p:not(:has(a), :nth-child(1))", ["first"]);

        // No element not selector
        t(".container div:not(.excluded) div", []);

        // :not() Existing attribute
        t("#form select:not([multiple])", ["select1", "select2", "select5"]);
        // :not() Equals attribute
        t("#form select:not([name=select1])", [
            "select2",
            "select3",
            "select4",
            "select5",
        ]);
        // :not() Equals quoted attribute
        t("#form select:not([name='select1'])", [
            "select2",
            "select3",
            "select4",
            "select5",
        ]);

        // :not() Multiple Class
        t("#foo a:not(.blog)", ["yahoo", "anchor2"]);
        // :not() Multiple Class
        t("#foo a:not(.link)", ["yahoo", "anchor2"]);
        // :not() Multiple Class
        t("#foo a:not(.blog.link)", ["yahoo", "anchor2"]);

        // :not chaining (compound)
        t("#qunit-fixture div[id]:not(:has(div, span)):not(:has(*))", [
            "nothiddendivchild",
            "divWithNoTabIndex",
        ]);
        // :not chaining (with attribute)
        t("#qunit-fixture form[id]:not([action$='formaction']):not(:button)", [
            "lengthtest",
            "name-tests",
            "testForm",
        ]);
        // :not chaining (colon in attribute)
        t("#qunit-fixture form[id]:not([action='form:action']):not(:button)", [
            "form",
            "lengthtest",
            "name-tests",
            "testForm",
        ]);
        // :not chaining (colon in attribute and nested chaining)
        t(
            "#qunit-fixture form[id]:not([action='form:action']:button):not(:input)",
            ["form", "lengthtest", "name-tests", "testForm"]
        );
        // :not chaining
        t(
            "#form select:not(.select1):contains(Nothing) > option:not(option)",
            []
        );
    });

    it("pseudo - form", () => {
        expect.assertions(10);

        const extraTexts = [
            ...parseDOM(
                '<input id="impliedText"/><input id="capitalText" type="TEXT">'
            ),
        ];

        extraTexts.forEach((text) =>
            DomUtils.appendChild(document.getElementById("form"), text)
        );

        // Form element :input
        t("#form :input", [
            "text1",
            "text2",
            "radio1",
            "radio2",
            "check1",
            "check2",
            "hidden1",
            "hidden2",
            "name",
            "search",
            "button",
            "area1",
            "select1",
            "select2",
            "select3",
            "select4",
            "select5",
            "impliedText",
            "capitalText",
        ]);
        // Form element :radio
        t("#form :radio", ["radio1", "radio2"]);
        // Form element :checkbox
        t("#form :checkbox", ["check1", "check2"]);
        // Form element :text
        t("#form :text", [
            "text1",
            "text2",
            "hidden2",
            "name",
            "impliedText",
            "capitalText",
        ]);
        // Form element :radio:checked
        t("#form :radio:checked", ["radio2"]);
        // Form element :checkbox:checked
        t("#form :checkbox:checked", ["check1"]);
        // Form element :radio:checked, :checkbox:checked
        t("#form :radio:checked, #form :checkbox:checked", [
            "radio2",
            "check1",
        ]);

        // Selected Option Element
        t("#form option:selected", [
            "option1a",
            "option2d",
            "option3b",
            "option3c",
            "option4b",
            "option4c",
            "option4d",
            "option5a",
        ]);
        // Selected Option Element are also :checked
        t("#form option:checked", [
            "option1a",
            "option2d",
            "option3b",
            "option3c",
            "option4b",
            "option4c",
            "option4d",
            "option5a",
        ]);
        // Hidden inputs should be treated as enabled. See QSA test.
        t("#hidden1:enabled", ["hidden1"]);

        extraTexts.forEach((text) => DomUtils.removeElement(text));
    });

    it("pseudo - :root", () => {
        expect.assertions(1);
        // :root selector
        expect(CSSselect.selectOne(":root", document)).toBe(
            document.documentElement
        );
    });

    it("caching", () => {
        expect.assertions(1);
        CSSselect.selectAll(":not(code)", document.getElementById("ap"));
        // Reusing selector with new context
        t(
            ":not(code)",
            ["sndp", "en", "yahoo", "sap", "anchor2", "simon"],
            document.getElementById("foo")
        );
    });

    it("more specific selector should find less elements", () => {
        // Same selector, but with an attribute filter added
        expect(
            CSSselect.selectAll("#qunit-fixture div div", document).length
        ).toBeGreaterThanOrEqual(
            CSSselect.selectAll("#qunit-fixture div div[id]", document).length
        );
    });
});
