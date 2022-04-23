import fs from "fs";
import path from "path";
import { parseDocument, ParserOptions } from "htmlparser2";
import * as DomUtils from "domutils";
import { Text, Element, Document } from "domhandler";

export function getDocumentFromPath(
    file: string,
    options?: ParserOptions
): Document {
    const filePath = path.join(__dirname, "..", "fixtures", file);
    return parseDocument(fs.readFileSync(filePath, "utf8"), options);
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
        const el = DomUtils.getElementById(id, document.children);
        if (!el) throw new Error(`Did not find element with ID ${id}`);
        return el;
    };
    document.createTextNode = (content: string) => new Text(content);
    document.createElement = (name: string) =>
        new Element(name.toLowerCase(), {});
    [document.body] = DomUtils.getElementsByTagName("body", document, true, 1);
    [document.documentElement] = document.children.filter(DomUtils.isTag);

    return document;
}
