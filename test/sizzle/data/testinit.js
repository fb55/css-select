const assert = require("assert");
const helper = require("../../tools/helper");
const CSSselect = require("../../../src").default;
const path = require("path");
const docPath = path.join(__dirname, "index.html");
let document = null;

function loadDoc() {
    return (document = helper.getDocument(docPath));
}

module.exports = {
    q,
    t,
    loadDoc,
    createWithFriesXML,
};

/**
 * Returns an array of elements with the given IDs
 * @example q("main", "foo", "bar")
 * @result [<div id="main">, <span id="foo">, <input id="bar">]
 */
function q(...ids) {
    return ids.map((id) => document.getElementById(id));
}

/**
 * Asserts that a select matches the given IDs
 * @param {String} assertionName - Assertion name
 * @param {String} sizzleSelector - Sizzle selector
 * @param {String} expectedIds - Array of ids to construct what is expected
 * @example t("Check for something", "//[a]", ["foo", "baar"]);
 * @returns `true` iff the selector produces the expected elements.
 */
function t(assertionName, sizzleSelector, expectedIds) {
    const actual = CSSselect(sizzleSelector, document);
    const actualIds = actual.map((e) => e.attribs.id);

    assert.deepStrictEqual(
        actualIds,
        expectedIds,
        `${assertionName} (${sizzleSelector})`
    );
}

const xmlDoc = helper.getDOMFromPath(path.join(__dirname, "fries.xml"), {
    xmlMode: true,
});
const filtered = xmlDoc.filter((t) => t.type === "tag");
xmlDoc.lastChild = filtered[filtered.length - 1];

function createWithFriesXML() {
    return xmlDoc;
}
