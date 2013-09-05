var fs = require("fs"),
    path = require("path"),
    htmlparser2 = require("htmlparser2"),
    DomUtils = htmlparser2.DomUtils,
    CSSselect = require("../../");

function getFile(path) {
    return htmlparser2.parseDOM(fs.readFileSync(path).toString());
}

module.exports = {
    CSSselect: CSSselect,
    getFile: function(name) {
        return getFile(path.join(__dirname, "docs", name));
    },
    getDOM: htmlparser2.parseDOM,
    getDefaultDom: function() {
        return htmlparser2.parseDOM(
            "<elem id=foo><elem class='bar baz'><tag class='boom'> This is some simple text </tag></elem></elem>"
        );
    },
    getDocument: function(path) {
        var document = getFile(path);

        document.getElementsByTagName = function(name) {
            return DomUtils.getElementsByTagName("*", document);
        };
        document.getElementById = function(id) {
            return DomUtils.getElementById(id, document);
        };
        document.body = DomUtils.getElementsByTagName("body", document, true, 1)[0];

        return document;
    }
};
