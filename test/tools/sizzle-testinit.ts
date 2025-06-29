import type { Document, Element, Node } from "domhandler";
import { expect } from "vitest";
import { selectAll as CSSselect } from "../../src/index.js";
import * as helper from "./helper.js";

let document = helper.getDocument("sizzle.html");

export function loadDoc(): helper.SimpleDocument {
    document = helper.getDocument("sizzle.html");
    return document;
}

/**
 * Returns an array of elements with the given IDs
 * @example q("main", "foo", "bar")
 * @result [<div id="main">, <span id="foo">, <input id="bar">]
 */
export function q(...ids: string[]): Element[] {
    return ids.map((id) => document.getElementById(id));
}

/**
 * Asserts that a select matches the given IDs
 * @param selector - Selector
 * @param expectedIds - Array of ids to construct what is expected
 * @param context - Root of the current search.
 * @example t("Check for something", "//[a]", ["foo", "baar"]);
 * @returns `true` iff the selector produces the expected elements.
 */
export function t(
    selector: string,
    expectedIds: string[],
    context: Node[] | Node | null = document,
): void {
    const actual = CSSselect(selector, context) as Element[];
    const actualIds = actual.map((e) => e.attribs["id"]);

    // Should not contain falsy values
    expect(actualIds).toStrictEqual(expectedIds);
}

const xmlDoc = helper.getDocumentFromPath("fries.xml", {
    xmlMode: true,
});

export function createWithFriesXML(): Document {
    return xmlDoc;
}
