"use strict";

module.exports = CSSselect;

var CSSwhat   = require("CSSwhat"),
    DomUtils  = require("domutils"),
    isElement = DomUtils.isTag,
    getText   = DomUtils.getText,
    findOne   = DomUtils.findOne,
    findAll   = DomUtils.findAll,
    getParent = DomUtils.getParent,
    hasAttrib = DomUtils.hasAttrib,
    getName   = DomUtils.getName,
    getChildren = DomUtils.getChildren,
    getAttributeValue = DomUtils.getAttributeValue,
    getNCheck = require("./lib/nth-check.js"),
    baseFuncs = require("./lib/basefunctions.js"),
    rootFunc  = baseFuncs.rootFunc,
    trueFunc  = baseFuncs.trueFunc,
    falseFunc = baseFuncs.falseFunc;


/*
	pseudo selectors
	
	---
	
	they are available in two forms:
	* filters called when the selector 
	  is compiled and return a function
	  that needs to return next()
	* pseudos get called on execution
	  they need to return a boolean
*/
var filters = {
	not: function(next, select){
		var func = parse(select);

		if(func === falseFunc){
			if(next === rootFunc) return trueFunc;
			else return next;
		}
		if(func === trueFunc) return falseFunc;
		if(func === rootFunc) return falseFunc;

		return function(elem){
			if(!func(elem)) return next(elem);
		};
	},
	contains: function(next, text){
		if(
			(text.charAt(0) === "\"" || text.charAt(0) === "'") &&
			text.charAt(0) === text.substr(-1)
		){
			text = text.slice(1, -1);
		}
		return function(elem){
			if(getText(elem).indexOf(text) >= 0) return next(elem);
		};
	},
	has: function(next, selector){
		var func = parse(selector);

		if(func === rootFunc || func === trueFunc) return next;
		if(func === falseFunc) return falseFunc;

		return function proc(elem){
			if(findOne(func, getChildren(elem)) !== null) return next(elem);
		};
	},
	root: function(next){
		return function(elem){
			if(!getParent(elem)) return next(elem);
		};
	},
	empty: function(next){
		return function(elem){
			var children = getChildren(elem);
			if(!children || children.length === 0) return next(elem);
		};
	},
	parent: function(next){ //:parent is the inverse of :empty
		return function(elem){
			var children = getChildren(elem);
			if(children && children.length !== 0) return next(elem);
		};
	},

	//location specific methods
	//first- and last-child methods return as soon as they find another element
	"first-child": function(next){
		return function(elem){
			if(getFirstElement(getSiblings(elem)) === elem) return next(elem);
		};
	},
	"last-child": function(next){
		return function(elem){
			var siblings = getSiblings(elem);
			if(!siblings) return;

			for(var i = siblings.length-1; i >= 0; i--){
				if(siblings[i] === elem) return next(elem);
				if(isElement(siblings[i])) return;
			}
		};
	},
	"first-of-type": function(next){
		return function(elem){
			var siblings = getSiblings(elem);
			if(!siblings) return;

			for(var i = 0, j = siblings.length; i < j; i++){
				if(siblings[i] === elem) return next(elem);
				if(getName(siblings[i]) === getName(elem)) return;
			}
		};
	},
	"last-of-type": function(next){
		return function(elem){
			var siblings = getSiblings(elem);
			if(!siblings) return;

			for(var i = siblings.length-1; i >= 0; i--){
				if(siblings[i] === elem) return next(elem);
				if(getName(siblings[i]) === getName(elem)) return;
			}
		};
	},
	"only-of-type": function(next){
		return function(elem){
			var siblings = getSiblings(elem);
			if(!siblings) return;

			for(var i = 0, j = siblings.length; i < j; i++){
				if(siblings[i] === elem) continue;
				if(getName(siblings[i]) === getName(elem)) return;
			}

			return next(elem);
		};
	},
	"only-child": function(next){
		return function(elem){
			var siblings = getSiblings(elem);
			if(!siblings) return;
			if(siblings.length === 1) return next(elem);

			for(var i = 0, j = siblings.length; i < j; i++){
				if(isElement(siblings[i]) && siblings[i] !== elem) return;
			}

			return next(elem);
		};
	},
	"nth-child": function(next, rule){
		var func = getNCheck(rule);

		if(func === falseFunc) return func;
		if(func === trueFunc){
			if(next === rootFunc) return func;
			else return next;
		}

		return function(elem){
			if(func(getIndex(elem))) return next(elem);
		};
	},
	"nth-last-child": function(next, rule){
		var func = getNCheck(rule);

		if(func === falseFunc) return func;
		if(func === trueFunc){
			if(next === rootFunc) return func;
			else return next;
		}

		return function(elem){
			var siblings = getSiblings(elem);
			if(!siblings) return;

			for(var pos = 0, i = siblings.length - 1; i >= 0; i--){
				if(siblings[i] === elem){
					if(func(pos)) return next(elem);
					return;
				}
				if(isElement(siblings[i])) pos++;
			}
		};
	},
	"nth-of-type": function(next, rule){
		var func = getNCheck(rule);

		if(func === falseFunc) return func;
		if(func === trueFunc){
			if(next === rootFunc) return func;
			else return next;
		}

		return function(elem){
			var siblings = getSiblings(elem);
			if(!siblings) return;

			for(var pos = 0, i = 0, j = siblings.length; i < j; i++){
				if(siblings[i] === elem){
					if(func(pos)) return next(elem);
					return;
				}
				if(getName(siblings[i]) === getName(elem)) pos++;
			}
		};
	},
	"nth-last-of-type": function(next, rule){
		var func = getNCheck(rule);

		if(func === falseFunc) return func;
		if(func === trueFunc){
			if(next === rootFunc) return func;
			else return next;
		}

		return function(elem){
			var siblings = getSiblings(elem);
			if(!siblings) return;
			for(var pos = 0, i = siblings.length-1; i >= 0; i--){
				if(siblings[i] === elem){
					if(func(pos)) return next(elem);
					return;
				}
				if(getName(siblings[i]) === getName(elem)) pos++;
			}
		};
	},
	
	//forms
	//to consider: :target, :enabled
	selected: function(next){
		return function(elem){
			if(hasAttrib(elem, "selected")) return next(elem);
			//the first <option> in a <select> is also selected
			//TODO this only works for direct descendents
			if(getName(getParent(elem)) !== "option") return;
			if(getFirstElement(getSiblings(elem)) === elem) return next(elem);
		};
	},
	disabled: function(next){
		return function(elem){
			if(hasAttrib(elem, "disabled")) return next(elem);
		};
	},
	enabled: function(next){
		return function(elem){
			if(!hasAttrib(elem, "disabled")) return next(elem);
		};
	},
	checked: function(next){
		return function(elem){
			if(hasAttrib(elem, "checked")) return next(elem);
		};
	},
	
	//jQuery extensions
	header: function(next){
		return function(elem){
			var name = getName(elem);
			if(
				name === "h1" ||
				name === "h2" ||
				name === "h3" ||
				name === "h4" ||
				name === "h5" ||
				name === "h6"
			) return next(elem);
		};
	},
	button: function(next){
		return function(elem){
			if(
				getName(elem) === "button" ||
				getName(elem) === "input" &&
				hasAttrib(elem, "type") &&
				getAttributeValue(elem, "type") === "button"
			) return next(elem);
		};
	},
	input: function(next){
		return function(elem){
			var name = getName(elem);
			if(
				name === "input" ||
				name === "textarea" ||
				name === "select" ||
				name === "button"
			) return next(elem);
		};
	},
	text: function(next){
		return function(elem){
			if(getName(elem) !== "input") return;
			if(
				!hasAttrib(elem, "type") ||
				getAttributeValue(elem, "type") === "text"
			) return next(elem);
		};
	},
	checkbox: getAttribFunc("type", "checkbox"),
	file: getAttribFunc("type", "file"),
	password: getAttribFunc("type", "password"),
	radio: getAttribFunc("type", "radio"),
	reset: getAttribFunc("type", "reset"),
	image: getAttribFunc("type", "image"),
	submit: getAttribFunc("type", "submit")
};

//while filters are precompiled, pseudos get called when they are needed
var pseudos = {};

//helper methods

function getSiblings(elem){
	return getParent(elem) && getChildren(getParent(elem));
}
/*
	finds the position of an element among its siblings
*/
function getIndex(elem){
	var siblings = getSiblings(elem);
	if(!siblings) return -1;
	for(var count = 0, i = 0, j = siblings.length; i < j; i++){
		if(siblings[i] === elem) return count;
		if(isElement(siblings[i])) count++;
	}
	return -1;
}

function getFirstElement(elems){
	if(!elems) return;
	for(var i = 0, j = elems.length; i < j; i++){
		if(isElement(elems[i])) return elems[i];
	}
}

function getAttribFunc(name, value){
	return function(next){
		return checkAttrib(next, name, value);
	};
}

function checkAttrib(next, name, value){
	return function(elem){
		if(hasAttrib(elem, name) && getAttributeValue(elem, name) === value){
			return next(elem);
		}
	};
}

/*
	all available rules
*/
var generalRules = {
	__proto__: null,

	//tags
	tag: function(next, data){
		var name = data.name;
		return function(elem){
			if(getName(elem) === name) return next(elem);
		};
	},

	//traversal
	descendant: function(next){
		return function(elem){
			while(elem = getParent(elem)){
				if(next(elem)) return true;
			}
		};
	},
	parent: function(next){
		return function(elem){
			var childs = getChildren(elem);
			for(var i = 0; i < childs.length; i++){
				if(next(childs[i])) return true;
			}
		}
	},
	child: function(next){
		return function(elem){
			var parent = getParent(elem);
			if(parent) return next(parent);
		};
	},
	sibling: function(next){
		return function(elem){
			var siblings = getSiblings(elem);
			if(!siblings) return;
			for(var i = 0, j = siblings.length; i < j; i++){
				if(!isElement(siblings[i])) continue;
				if(siblings[i] === elem) return;
				if(next(siblings[i])) return true;
			}
		};
	},
	adjacent: function(next){
		return function(elem){
			var siblings = getSiblings(elem),
			    lastElement;
			
			if(!siblings) return;
			for(var i = 0, j = siblings.length; i < j; i++){
				if(isElement(siblings[i])){
					if(siblings[i] === elem){
						if(lastElement) return next(lastElement);
						return;
					}
					lastElement = siblings[i];
				}
			}
		};
	},
	universal: function(next){
		if(next === rootFunc) return trueFunc;
		return next;
	},

	//attributes
	attribute: function(next, data){
		if(data.ignoreCase){
			return noCaseAttributeRules[data.action](next, data.name, data.value, data.ignoreCase);
		} else {
			return attributeRules[data.action](next, data.name, data.value, data.ignoreCase);
		}
	},

	//pseudos
	pseudo: function(next, data){
		var name = data.name,
			subselect = data.data;

		if(name in filters) return filters[name](next, subselect);
		else if(name in pseudos){
			return function(elem){
				if(pseudos[name](elem, subselect)) return next(elem);
			};
		} else {
			throw new SyntaxError("unmatched pseudo-class: " + name);
		}
	}
};

/*
	attribute selectors
*/
var reChars = /[-[\]{}()*+?.,\\^$|#\s]/g; //https://github.com/slevithan/XRegExp/blob/master/src/xregexp.js#L469
function escapeRe(str){
	return str.replace(reChars, "\\$&");
}

function wrapReRule(pre, post){
	return function(next, name, value, ignoreCase){
		var regex = new RegExp(pre + escapeRe(value) + post, ignoreCase ? "i" : "");

		return function(elem){
			if(hasAttrib(elem, name) && regex.test(getAttributeValue(elem, name))) return next(elem);
		};
	};
}

var noCaseAttributeRules = {
	__proto__: null,
	exists: function(next, name){
		return function(elem){
			if(hasAttrib(elem, name)) return next(elem);
		};
	},
	element: wrapReRule("(?:^|\\s)", "(?:$|\\s)"),
	equals: wrapReRule("^", "$"),
	hyphen: wrapReRule("^", "(?:$|-)"),
	start: wrapReRule("^", ""),
	end: wrapReRule("", "$"),
	any: wrapReRule("", ""),
	not: wrapReRule("^(?!^", "$)")
};

var attributeRules = {
	__proto__: null,
	equals: checkAttrib,
	exists: noCaseAttributeRules.exists,
	hyphen: noCaseAttributeRules.hyphen,
	element: noCaseAttributeRules.element,
	start: function(next, name, value){
		var len = value.length;

		return function(elem){
			if(
				hasAttrib(elem, name) &&
			    getAttributeValue(elem, name).substr(0, len) === value
			) return next(elem);
		};
	},
	end: function(next, name, value){
		var len = -value.length;

		return function(elem){
			if(
				hasAttrib(elem, name) &&
			    getAttributeValue(elem, name).substr(len) === value
			) return next(elem);
		};
	},
	any: function(next, name, value){
		return function(elem){
			if(
				hasAttrib(elem, name) &&
			    getAttributeValue(elem, name).indexOf(value) >= 0
			) return next(elem);
		};
	},
	not: function(next, name, value){
		if(value === ""){
			return function(elem){
				if(hasAttrib(elem, name) && getAttributeValue(elem, name) !== "") return next(elem);
			};
		}

		return function(elem){
			if(!hasAttrib(elem, name) || getAttributeValue(elem, name) !== value){
				return next(elem);
			}
		};
	}
};

/*
	sort the parts of the passed selector,
	as there is potential for optimization
*/
var procedure = {
	__proto__: null,
	universal: 5, //should be last so that it can be ignored
	tag: 3, //very quick test
	attribute: 1, //can be faster than class
	pseudo: 0, //can be pretty expensive (especially :has)

	//everything else shouldn't be moved
	descendant: -1,
	child: -1,
	sibling: -1,
	adjacent: -1
};

function sortByProcedure(arr){
	//TODO optimize, sort individual attribute selectors
	var parts = [],
		last = 0,
		end = false;
	for(var i = 0, j = arr.length-1; i <= j; i++){
		if(procedure[arr[i].type] === -1 || (end = i === j)){
			if(end) i++;
			parts = parts.concat(arr.slice(last, i).sort(function(a, b){
				return procedure[a.type] - procedure[b.type];
			}));
			if(!end) last = parts.push(arr[i]);
		}
	}
	return parts;
}

function parse(selector){
	var functions = CSSwhat(selector).map(function(arr){
		var func = rootFunc;
		arr = sortByProcedure(arr);
		for(var i = 0, j = arr.length; i < j; i++){
			func = generalRules[arr[i].type](func, arr[i]);
			if(func === falseFunc) return func;
		}
		return func;
	}).filter(function(func){
		return func !== rootFunc && func !== falseFunc;
	});

	var num = functions.length;

	if(num === 0) return falseFunc;
	if(num === 1) return functions[0];

	if(functions.indexOf(trueFunc) >= 0) return trueFunc;

	return function(elem){
		for(var i = 0; i < num; i++){
			if(functions[i](elem)) return true;
		}
		return false;
	};
}

/*
	the exported interface
*/
function CSSselect(query, elems){
	if(typeof query !== "function") query = parse(query);
	if(arguments.length === 1) return query;
	return CSSselect.iterate(query, elems);
};

CSSselect.parse = parse;
CSSselect.filters = filters;
CSSselect.pseudos = pseudos;

CSSselect.iterate = function(query, elems){
	if(typeof query !== "function") query = parse(query);
	if(query === falseFunc) return [];
	if(!Array.isArray(elems)) elems = getChildren(elems);
	return findAll(query, elems);
};

CSSselect.is = function(elem, query){
	if(typeof query !== "function") query = parse(query);
	return query(elem);
};
