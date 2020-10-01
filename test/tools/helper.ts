import fs from "fs";
import path from "path";
import { parseDOM, ParserOptions, ElementType } from "htmlparser2";
import * as DomUtils from "domutils";
import { DataNode, Element, Node } from "domhandler";

export function getDOMFromPath(file: string, options?: ParserOptions): Node[] {
    const filePath = path.join(__dirname, "..", "fixtures", file);
    return parseDOM(fs.readFileSync(filePath, "utf8"), options);
}

export interface SimpleDocument extends Array<Node> {
    getElementById(id: string): Element;
    createTextNode(content: string): DataNode;
    createElement(name: string): Element;
    body: Element;
    documentElement: Element;
}

export function getDocument(file: string): SimpleDocument {
    const document = getDOMFromPath(file) as SimpleDocument;

    document.getElementById = (id: string) =>
        DomUtils.getElementById(id, document) as Element;
    document.createTextNode = (content: string) =>
        new DataNode(ElementType.Text, content);
    document.createElement = (name: string) =>
        new Element(name.toLocaleLowerCase(), {});
    [document.body] = DomUtils.getElementsByTagName("body", document, true, 1);
    [document.documentElement] = document.filter(DomUtils.isTag);

    return document;
}
