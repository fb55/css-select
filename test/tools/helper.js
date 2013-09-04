var htmlparser2 = require("htmlparser2"),
    CSSselect = require("../../");

module.exports = {
	CSSselect: CSSselect,
	getFile: function(name){
		return htmlparser2.parseDOM(
			require("fs").readFileSync(__dirname + "/docs/" + name).toString()
		);
	},
	getDOM: htmlparser2.parseDOM,
	getDefaultDom: function(){
		return htmlparser2.parseDOM(
			"<elem id=foo><elem class='bar baz'><tag class='boom'> This is some simple text </tag></elem></elem>"
		);
	}
};