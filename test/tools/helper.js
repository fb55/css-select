const fs = require("fs");
const path = require("path");
const htmlparser2 = require("htmlparser2");
const { DomUtils } = htmlparser2;
const CSSselect = require("../../");

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

        document.getElementsByTagName = (name = "*") =>
            DomUtils.getElementsByTagName(name, document);
        document.getElementById = (id) => DomUtils.getElementById(id, document);
        document.createTextNode = (content) => ({
            type: "text",
            data: content,
        });
        document.createElement = (name) => ({
            type: "tag",
            name,
            children: [],
            attribs: {},
        });
        [document.body] = DomUtils.getElementsByTagName(
            "body",
            document,
            true,
            1
        );
        [document.documentElement] = document.filter(DomUtils.isTag);

        return document;
    },
};
