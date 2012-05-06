var Parser = require("htmlparser2/lib/Parser.js"),
	Handler = require("htmlparser2/lib/DomHandler.js");

module.exports = {
	getDOM: function(data){
		var h = new Handler({refParent: true}),
			p = new Parser(h);
		
		p.write(data);
		p.end();
		
		return h.dom;
	},
	getDefaultDom: function(){
		return module.exports.getDOM(
			"<elem id=foo><elem class='bar baz'><tag class='boom'> This is some simple text </tag></elem></elem>"
		);
	},
	iterate: function(dom, func){
		var result = [];
		for(var i = 0, j = dom.length; i < j; i++){
			if(func(dom[i])) result.push(dom[i]);
			if(dom[i].children){
				Array.prototype.push.apply(result, module.exports.iterate(dom[i].children, func));
			}
		}
		return result;
	}
};