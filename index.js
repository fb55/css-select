;(function(global){
"use strict";

//functions that make porting the library to another DOM easy
function isElement(elem){
	return elem.type === "tag" || elem.type === "style" || elem.type === "script";
}
function getChildren(elem){
	return elem.children;
}
function getParent(elem){
	return elem.parent;
}
function getAttributeValue(elem, name){
	return elem.attribs[name];
}
function hasAttrib(elem, name){
	return elem.attribs && name in elem.attribs;
}
function getName(elem){
	return elem.name;
}
function getText(elem){
	var text = "",
		childs = getChildren(elem);

	if(!childs) return text;

	for(var i = 0, j = childs.length; i < j; i++){
		if(isElement(childs[i])) text += getText(childs[i]);
		else text += childs[i].data;
	}

	return text;
}

//regexps
var re_name = /^(?:[\w\-\u00c0-\uFFFF]|\\.)+/,
    re_cleanSelector = /\s*([>~+])\s*/g,
    re_nthElement = /^([+\-]?\d*n)?\s*([+\-])?\s*(\d)?$/,
    re_attr = /^\s*((?:[\w\u00c0-\uFFFF\-]|\\.)+)\s*(?:(\S?)=\s*(?:(['"])(.*?)\3|(#?(?:[\w\u00c0-\uFFFF\-]|\\.)*)|)|)\s*(i)?\]/; //https://github.com/jquery/sizzle/blob/master/sizzle.js#L374

//filters
var filters = {
	not: function(next, select){
		var func = parse(select);
		return function(elem){
			if(!func(elem)) return next(elem);
		};
	},
	contains: function(next, text){
		return function(elem){
			if(getText(elem).indexOf(text) !== -1) return next(elem);
		};
	},
	has: function(next, select){
		var func = parse(select),
			proc = function(elem){
				var children = getChildren(elem);
				if(!children) return;
				for(var i = 0, j = children.length; i < j; i++){
					if(!isElement(children[i])) continue;
					if(func(children[i])) return true;
					if(proc(children[i])) return true;
				}
			};

		return function proc(elem){
			if(proc(elem)) return next(elem);
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
	//first- and last-child methods return as soon as they find another element
	//nth-[last-]child could be used, but this way it's faster
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
		if(func === null) return next;
		if(func === false) return falseFunc;

		return function(elem){
			if(func(getIndex(elem))) return next(elem);
		};
	},
	"nth-last-child": function(next, rule){
		var func = getNCheck(rule);
		if(func === null) return next;
		if(func === false) return falseFunc;

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
		if(func === null) return next;
		if(func === false) return falseFunc;

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
		if(func === null) return next;
		if(func === false) return function(){ return false; };

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
	checkbox: function(next){
		return checkAttrib(next, "type", "checkbox");
	},
	file: function(next){
		return checkAttrib(next, "type", "file");
	},
	image: function(next){
		return checkAttrib(next, "type", "image");
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
	password: function(next){
		return checkAttrib(next, "type", "password");
	},
	radio: function(next){
		return checkAttrib(next, "type", "radio");
	},
	reset: function(next){
		return checkAttrib(next, "type", "reset");
	},
	submit: function(next){
		return checkAttrib(next, "type", "submit");
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
	selected: function(next){
		return function(elem){
			if(hasAttrib(elem, "selected")) return next(elem);
			//the first <option> in a <select> is also selected
			//TODO this only works for direct descendents
			if(getName(getParent(elem)) !== "option") return;
			if(getFirstElement(getSiblings(elem)) === elem) return next(elem);
		};
	}
	//to consider: :target, :checked, :enabled, :disabled
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

function unescapeCSS(str){
	//based on http://mathiasbynens.be/notes/css-escapes
	//TODO support short sequences (/\\\d{1,5} /)
	return str.replace(/\\(\d{6}|.)/g, function(m, s){
		if(isNaN(s)) return s;
		return String.fromCharCode(parseInt(s, 10));
	})
}

function escapeRe(str){
	//https://github.com/slevithan/XRegExp/blob/master/src/xregexp.js#L469
	return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

/*
	returns a function that checks if an elements index matches the given rule
	highly optimized to return the fastest solution
*/
function getNCheck(formula){
	var a, b;

	//parse the formula
	//b is lowered by 1 as the rule uses index 1 as the start
	formula = formula.trim().toLowerCase();
	if(formula === "even"){
		a = 2;
		b = -1;
	} else if(formula === "odd"){
		a = 2;
		b = 0;
	}
	else {
		formula = formula.match(re_nthElement);
		if(!formula) return null; //rule couldn't be parsed
		if(formula[1]){
			a = parseInt(formula[1], 10);
			if(!a){
				if(formula[1].charAt(0) === "-") a = -1;
				else a = 1;
			}
		} else a = 0;
		if(formula[3]) b = parseInt((formula[2] || "") + formula[3], 10) - 1;
		else b = -1;
	}

	//when b <= 0, a*n won't be possible for any matches when a < 0
	//besides, the specification says that no element is matched when a and b are 0
	if(b < 0 && a <= 0) return false;

	//when b <= 0 and a === 1, they match any element
	if(b < 0 && a === 1) return null;

	//when a is in the range -1..1, it matches any element (so only b is checked)
	if(a ===-1) return function(pos){ return pos - b <= 0; };
	if(a === 1) return function(pos){ return pos - b >= 0; };
	if(a === 0) return function(pos){ return pos === b; };

	//when a > 0, modulo can be used to check if there is a match
	//TODO: needs to be checked
	if(a > 1) return function(pos){
		return pos >= 0 && (pos -= b) >= 0 && (pos % a) === 0;
	};

	a *= -1; //make a positive
	return function(pos){
		return pos >= 0 && (pos -= b) >= 0 && (pos % a) === 0 && pos/a < b;
	};
}

function checkAttrib(next, name, value){
	return function(elem){
		if(hasAttrib(elem, name) && getAttributeValue(elem, name) === value){
			return next(elem);
		}
	};
}

function rootFunc(){
	return true;
}

function falseFunc(){
	return false;
}

function parse(selector){
	var p = new Parser(selector);
	return p.getFunc();
}

var Parser = function(selector){
	this._selector = selector + "";
	this._functions = [];
	this.func = rootFunc;

	this._clean();
	this._parse();
};

Parser.prototype = {
	getFunc: function(){
		var functions = this._functions.concat(this.func);
		functions = functions.filter(function(func){
			return func !== rootFunc && func !== falseFunc;
		});
		var num = functions.length;

		if(num === 0) return falseFunc;
		if(num === 1) return functions[0];

		return function(elem){
			for(var i = 0; i < num; i++){
				if(functions[i](elem)) return true;
			}
			return false;
		};
	},
	_clean: function(selector){
		this._selector = this._selector
			.trim()
			.replace(re_cleanSelector, "$1");
	},
	_getName: function(){
		var sub = this._selector.match(re_name)[0];
		this._selector = this._selector.substr(sub.length);
		return unescapeCSS(sub);
	},
	_processComma: function(){
		this._functions.push(this.func);
		this.func = rootFunc;
	},
	_processClass: function(){
		this._matchElement("class", this._getName(), false);
	},
	_matchElement: function(name, value, ignoreCase){
		this._buildRe(name, "(?:^|\\s)" + escapeRe(value) + "(?:$|\\s)", ignoreCase);
	},
	_processId: function(){
		this._matchExact("id", this._getName(), false);
	},
	_processSpace: function(){
		var next = this.func;

		this.func = function(elem){
			while(elem = getParent(elem)){
				if(next(elem)) return true;
			}
		};
	},
	_processTag: function(){
		var next = this.func, name = this._getName().toLowerCase();
		this.func = function(elem){
			if(getName(elem) === name) return next(elem);
		};
	},
	_processArrow: function(){
		var next = this.func;

		this.func = function(elem){
			var parent = getParent(elem);
			if(parent) return next(parent);
		};
	},
	_processPlus: function(){
		var next = this.func;

		this.func = function(elem){
			var index = getIndex(elem),
				siblings = getSiblings(elem);

			while(index-- > 0 && !isElement(siblings[index]));
			if(index >= 0) return next(siblings[index]);
		};
	},
	_matchExact: function(name, value, i){
		if(i) return this._buildRe(name, "^" + escapeRe(value) + "$", i); //TODO
		this.func = checkAttrib(this.func, name, value);
	},
	_matchEnd: function(name, value, i){
		if(i) return this._buildRe(name, escapeRe(value) + "$", i); //TODO

		var next = this.func,
		    len = -value.length;

		this.func = function(elem){
			if(
				hasAttrib(elem, name) &&
			    getAttributeValue(elem, name).substr(len) === value
			) return next(elem);
		};
	},
	_matchStart: function(name, value, i){
		if(i) return this._buildRe(name, "^" + escapeRe(value), i); //TODO

		var next = this.func,
		    len = value.length;

		this.func = function(elem){
			if(
				hasAttrib(elem, name) &&
			    getAttributeValue(elem, name).substr(0, len) === value
			) return next(elem);
		};
	},
	_matchAny: function(name, value, i){
		if(i) return this._buildRe(name, escapeRe(value), i); //TODO

		var next = this.func;

		this.func = function(elem){
			if(
				hasAttrib(elem, name) &&
			    getAttributeValue(elem, name).indexOf(value) >= 0
			) return next(elem);
		};
	},
	_matchNot: function(name, value, i){
		var next = this.func;

		if(value === ""){
			this.func = function(elem){
				if(hasAttrib(elem, name) && getAttributeValue(elem, name) !== "") return next(elem);
			};
		}

		if(i) return this._buildRe(name, "^(?!^" + escapeRe(value) + "$)", i); //TODO

		this.func = function(elem){
			if(!hasAttrib(elem, name) || getAttributeValue(elem, name) !== value){
				return next(elem);
			}
		};
	},
	_buildRe: function(name, value, ignoreCase){
		var next = this.func,
			regex = new RegExp(value, ignoreCase ? "i" : "");

		this.func = function(elem){
			if(hasAttrib(elem, name) && regex.test(getAttributeValue(elem, name))) return next(elem);
		};
	},
	_processTilde: function(){
		var next = this.func;

		this.func = function(elem){
			var index = getIndex(elem),
				siblings = getSiblings(elem);
			while(--index >= 0){
				if(next(siblings[index])) return true;
			}
		};
	},
	_processAsterix: function(){
		if(this.func === rootFunc) this.func = function(){ return true; };
	},
	_processColon: function(){
		//if(this._selector.charAt(0) === ":"){} //TODO pseudo-element
		var name = this._getName(),
			subselect = "";

		if(this._selector.charAt(0) === "("){
			for(var pos = 1, counter = 1; counter > 0 && pos < this._selector.length; pos++){
				if(this._selector.charAt(pos) === "(") counter++;
				else if(this._selector.charAt(pos) === ")") counter--;
			}
			subselect = this._selector.substr(1, pos - 2);
			this._selector = this._selector.substr(pos);
		}
		if(name in filters) this.func = filters[name](this.func, subselect);
		else if(name in pseudos){
			var next = this.func;
			this.func = function(elem){
				if(pseudos[name](elem)) return next(elem);
			};
		}
	}
};

Parser.prototype._parse = function(){
	var firstChar;
	while(this._selector !== ""){
		if(re_name.test(this._selector)){
			this._processTag();
		} else {
			firstChar = this._selector.charAt(0);
			this._selector = this._selector.substr(1);
			switch(firstChar){
				case "#": this._processId(); break;
				case "+": this._processPlus(); break;
				case ".": this._processClass(); break;
				case "~": this._processTilde(); break;
				case ":": this._processColon(); break;
				case ">": this._processArrow(); break;
				case ",": this._processComma(); break;
				case "[": this._processBracket(); break;
				case "*": this._processAsterix(); break;
				//otherwise, the parser needs to throw or it would enter an infinite loop
				default: {
					if(/^\s$/.test(firstChar)){
						this._processSpace();
						this._selector = this._selector.trimLeft();
					}
					else throw new Error("Unmatched selector:" + firstChar + this._selector);
				}
			}
		}
	}
};

Parser.prototype._processBracket = function(){
	var next = this.func;

	var match = this._selector.match(re_attr);
	this._selector = this._selector.substr(match[0].length);

	var name = match[1],
	    action = match[2],
	    value = match[4] || match[5] || "",
	    i = !!match[6];

	if(typeof action !== "string"){
		this.func = function(elem){
			if(hasAttrib(elem, name)) return next(elem);
		};
		return;
	}

	if(i) value = value.toLowerCase();
	value = unescapeCSS(value);

	switch(action){
		case  "": return this._matchExact(name, value, i);
		case "~": return this._matchElement(name, value, i);
		case "*": return this._matchAny(name, value, i);
		case "$": return this._matchEnd(name, value, i);
		case "^": return this._matchStart(name, value, i);
		case "|": return this._buildRe(name, "^" + escapeRe(value) + "(?:$|-)", i);
		case "!": return this._matchNot(name, value, i);
		default:  throw new Error("unrecognized operator: " + action);
	}
};

var CSSselect = function(query, elems){
	if(typeof query !== "function") query = parse(query);
	if(arguments.length === 1) return query;
	return iterate(query, elems);
};
CSSselect.parse = parse;
CSSselect.filters = filters;
CSSselect.pseudos = pseudos;
CSSselect.iterate = function(query, elems){
	if(typeof query !== "function") query = parse(query);
	if(!Array.isArray(elems)) elems = [elems];
	return iterate(query, elems);
};
CSSselect.is = function(elem, query){
	if(typeof query !== "function") query = parse(query);
	return query(elem);
};

function iterate(query, elems){
	var result = [];
	for(var i = 0, j = elems.length; i < j; i++){
		if(!isElement(elems[i])) continue;
		if(query(elems[i])) result.push(elems[i]);
		if(getChildren(elems[i])) result = result.concat(iterate(query, getChildren(elems[i])));
	}
	return result;
}

if(typeof module !== "undefined" && "exports" in module){
	module.exports = CSSselect;
} else {
	if(typeof define === "function" && define.amd){
		define("CSSselect", function(){
			return CSSselect;
		});
	}
	global.CSSselect = CSSselect;
}

})(typeof window === "object" ? window : this);