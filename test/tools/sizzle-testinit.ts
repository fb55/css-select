import type { Document, Element, Node } from "domhandler";
import { expect } from "vitest";
import { selectAll as CSSselect } from "../../src/index.js";
import * as helper from "./helper.js";

let document = helper.getDocument("sizzle.html");

export function loadDocument(): helper.SimpleDocument {
    document = helper.getDocument("sizzle.html");
    return document;
}

/**
 * Returns an array of elements with the given IDs
 * @param ids Element IDs to resolve in the test fixture.
 * @example q("main", "foo", "bar")
 * @returns Elements with IDs matching the provided order.
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
    const actualIds = actual.map((element) => element.attribs["id"]);

    // Should not contain falsy values
    expect(actualIds).toStrictEqual(expectedIds);
}

const xmlDocument = helper.getDocumentFromPath("fries.xml", {
    xmlMode: true,
});

export function createWithFriesXML(): Document {
    return xmlDocument;
}
