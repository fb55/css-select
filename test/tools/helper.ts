import fs from "fs";
import path from "path";
import * as htmlparser2 from "htmlparser2";
import * as DomUtils from "domutils";
import { DataNode, Element, Node } from "domhandler";

export function getDOMFromPath(
    file: string,
    options?: htmlparser2.ParserOptions
): Node[] {
    const filePath = path.join(__dirname, "..", "fixtures", file);
    return htmlparser2.parseDOM(fs.readFileSync(filePath, "utf8"), options);
}

export function getFile(
    name: string,
    options?: htmlparser2.ParserOptions
): Node[] {
    return getDOMFromPath(path.join(__dirname, "docs", name), options);
}

export const getDOM = htmlparser2.parseDOM;

export interface SimpleDocument extends Array<Node> {
    getElementsByTagName(name: string): Element[];
    getElementById(id: string): Element;
    createTextNode(content: string): DataNode;
    createElement(name: string): Element;
    body: Element;
    documentElement: Element;
}

export function getDocument(file: string): SimpleDocument {
    const document = getDOMFromPath(file) as SimpleDocument;

    document.getElementsByTagName = (name = "*") =>
        DomUtils.getElementsByTagName(name, document, true);
    document.getElementById = (id: string) =>
        DomUtils.getElementById(id, document) as Element;
    document.createTextNode = (content: string) =>
        new DataNode(htmlparser2.ElementType.Text, content);
    document.createElement = (name: string) =>
        new Element(name.toLocaleLowerCase(), {});
    [document.body] = DomUtils.getElementsByTagName("body", document, true, 1);
    [document.documentElement] = document.filter(DomUtils.isTag);

    return document;
}
