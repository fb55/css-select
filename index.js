var re_commas = /,\s*/g,
	re_whitespace = /\s+/,
	re_name = /^(?:[\w\-]|\\.)+/, //https://github.com/jquery/sizzle/blob/master/sizzle.js#L378 /^(?:[\w\u00c0-\uFFFF\-]|\\.)+/
	re_par = /\(.*?\)/,
	re_cleanSelector = / *([>~+]) */g,
	base = function(){ console.log("success"); return true; },
	filters = {
		not: function(next, select){
			var func = parse(select.trim());
			return function(elem){
				if(!func(elem)) return next(elem);
			}
		},
		root: function(next){
			return function(elem){
				if(!elem.parent) return next(elem);
			};
		},
		empty: function(next){
			return function(elem){
				if(!elem.children) return next(elem);
			};
		},
		"only-child": function(next){
			return function(elem){
				if(elem.parent && elem.parent.children.length === 1) return next(elem);
			};
		}/*,
		"nth-child": function(next, num){
			// TODO
			return next;
		}*/
	};

var parse = function(selector){
	if(re_commas.test(selector)){
		selector = selector.split(re_commas).map(parse);
		var num = selector.length;
		return function(element){
			for(var i = 0; i < num; i++){
				if(selector[i](element)) return true;
			}
		};
	}
	
	selector = selector.trim().replace(re_whitespace, " ").replace(re_cleanSelector, "$1")
	
	var result = base;
	
	while(selector !== "") result = walk(result);

	function getName(){
		var sub = selector.match(re_name)[0];
		selector = selector.substr(sub.length);
		return sub;
	}
	
	function walk(next){
		var firstChar = selector.charAt(0), sub, subselect, regex, bool;
		if(re_name.test(selector)){
			sub = getName();
			return function(elem){
				if(elem.name === sub) return next(elem);
			}
		}
		selector = selector.substr(1);
		if(firstChar === "*") return next;
		if(firstChar === "."){
			regex = new RegExp("(?:^|\\s)"+getName()+"(?:$|\\s)"); //same as [class~=xy]
			return function(elem){
				if(regex.test(elem.attribs["class"])) return next(elem);
			}
		}
		if(firstChar === "#"){
			sub = getName();
			return function(elem){
				if(elem.attribs["id"] === sub) return next(elem);
			}
		}
		if(firstChar === " "){
			return function(elem){
				for(var parent; parent = elem.parent;){
					if(next(parent)) return true;
				}
			};
		}
		if(firstChar === ">"){
			return function(elem){
				if(elem.parent) return next(elem.parent);
			}
		}
		if(firstChar === "+"){
			return function(elem){
				if(elem.parent && elem.parent.children){
					for(var i = 0, j = elem.parent.children.length; i < j; i++){
						if(elem === elem.parent.children[i]) continue;
						if(next(elem.parent.children[i])) return true;
					}
				}
			};
		}
		if(firstChar === "~"){
			return function(elem){
				if(!elem.parent || !elem.parent.children) return;
				var index = elem.parent.children.indexOf(elem);
				while(--index !== -1){
					if(next(elem.parent.children[index])) return true;
				}
			};
		}
		if(firstChar === ":"){
			if(selector.charAt(0) === ":"){
				//pseudo-element
				// TODO
			}
			sub = getName();
			if(selector.charAt(0) === "("){
				subselect = selector.substring(1, selector.indexOf(")", 2));
				selector = selector.substr(subselect.length + 2);
			}
			if(sub in filters) return filters[sub](next, subselect);
			else return next;
		}
		if(firstChar === "["){
			selector = selector.trimLeft();
			sub = getName();
			firstChar = selector.charAt(0);
			
			if(firstChar === " "){
				firstChar = selector.charAt(1);
				selector = selector.substr(2);
			}
			else selector = selector.substr(1);
			
			if(firstChar === "]"){
				return function(elem){
					if(sub in elem.attribs) return next(elem);
				};
			}
			
			subselect = selector.substr(0, selector.indexOf("]")).trim();
			selector = selector.substr(subselect.length + 1);
			
			if(subselect.substr(-2) === " i"){
				bool = true;
				subselect = subselect.slice(0, -2);
			}
			
			if(firstChar === "="){
				firstChar = subselect.charAt(0);
				if(firstChar === "\"" || firstChar === "'") subselect = subselect.slice(1, -1);
				return function(elem){
					if(elem.attribs[sub] === subselect) return next(elem);
				};
			}
			
			if(subselect.charAt(0) !== "="){
				//ignore it
				return next;
			}
			
			if(subselect.charAt(1) === "\"" || subselect.charAt(1) === "'"){
				subselect = subselect.slice(2, -1);
			} else {
				subselect = subselect.substr(1).trim();
			}
			
				 if(firstChar === "|") subselect = "^"+subselect+"(?:$|-)";
			else if(firstChar === "~") subselect = "(?:^|\\s)"+subselect+"(?:$|\\s)";
			else if(firstChar === "^") subselect = "^"+subselect;
			else if(firstChar === "$") subselect = subselect + "$";
			else if(firstChar === "*") /*subselect = subselect*/;
			else throw Error("op not supported: " + firstChar);
			
			if(bool) regex = new RegExp(subselect, "i");
			else regex = new RegExp(subselect);
			
			return function(elem){
				if(sub in elem.attribs && regex.test(elem.attribs[sub])) return next(elem);
			};
		}
		//if nothing was matched, throw an error (otherwise, the parser would enter a loop)
		throw Error("unmatched selector: " + firstChar + selector);
	}
	return result;
}

if(typeof module === "object") module.exports = parse;

/*
var t = parse("*#foo > elem[ class ~= bar i][class$=bAz i]:not([id*=2])")({
	name: "elem",
	attribs: {class:"bar baz"},
	parent: {
		name: "elem",
		attribs: {id: "foo"}
	}
});
console.log("result", !!t)
*/