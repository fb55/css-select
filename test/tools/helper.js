const fs = require("fs");
const path = require("path");
const htmlparser2 = require("htmlparser2");
const DomUtils = require("domutils");
const CSSselect = require("../../src");

function getDOMFromPath(path, options) {
    return htmlparser2.parseDOM(fs.readFileSync(path).toString(), options);
}

module.exports = {
    CSSselect,
    getFile(name, options) {
        return getDOMFromPath(path.join(__dirname, "docs", name), options);
    },
    getDOMFromPath,
    getDOM: htmlparser2.parseDOM,
    getDefaultDom() {
        return htmlparser2.parseDOM(
            "<elem id=foo><elem class='bar baz'><tag class='boom'> This is some simple text </tag></elem></elem>"
        );
    },
    getDocument(path) {
        const document = getDOMFromPath(path);

        document.getElementsByTagName = function (name) {
            return DomUtils.getElementsByTagName(name || "*", document);
        };
        document.getElementById = function (id) {
            return DomUtils.getElementById(id, document);
        };
        document.createTextNode = function (content) {
            return {
                type: "text",
                data: content,
            };
        };
        document.createElement = function (name) {
            return {
                type: "tag",
                name,
                children: [],
                attribs: {},
            };
        };
        document.body = DomUtils.getElementsByTagName(
            "body",
            document,
            true,
            1
        )[0];
        document.documentElement = document.filter(DomUtils.isTag)[0];

        return document;
    },
};
