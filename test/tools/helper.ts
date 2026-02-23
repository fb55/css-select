import assert from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";
import { type Document, Element, Text } from "domhandler";
import * as DomUtils from "domutils";
import { type ParserOptions, parseDocument } from "htmlparser2";

export function getDocumentFromPath(
    file: string,
    options?: ParserOptions,
): Document {
    const filePath = path.join(__dirname, "..", "fixtures", file);
    return parseDocument(readFileSync(filePath, "utf8"), options);
}

export interface SimpleDocument extends Document {
    getElementById(id: string): Element;
    createTextNode(content: string): Text;
    createElement(name: string): Element;
    body: Element;
    documentElement: Element;
}

export function getDocument(file: string): SimpleDocument {
    const document = getDocumentFromPath(file) as SimpleDocument;

    document.getElementById = (id: string) => {
        const element = DomUtils.getElementById(id, document.children);
        if (!element) {
            throw new Error(`Did not find element with ID ${id}`);
        }
        return element;
    };
    document.createTextNode = (content: string) => new Text(content);
    document.createElement = (name: string) =>
        new Element(name.toLowerCase(), {});
    [document.body] = DomUtils.getElementsByTagName("body", document, true, 1);
    const documentElement = document.children.find(DomUtils.isTag);

    assert.ok(documentElement, "Did not find document element");
    document.documentElement = documentElement;

    return document;
}
