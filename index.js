;(function(global){

//functions that make porting the library to another DOM easy
function isElement(elem){
	return elem.type === "tag" || elem.type === "style" || elem.type === "script";
}
function getSiblings(elem){
	var parent = getParent(elem);
	return parent && getChildren(parent);
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
var re_whitespace = /\s+/,
    re_name = /^(?:[\w\-]|\\.)+/,
    re_cleanSelector = / ?([>~+]) ?/g,
    re_nthElement = /^([+\-]?\d*n)?\s*([+\-])?\s*(\d)?$/;

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
	//first- and last-child methods return as soon as they find another element
	//nth-child could be used, but this way it's faster
	"first-child": function(next){
		return function(elem){
			var siblings = getSiblings(elem);
			if(!siblings) return;

			for(var i = 0, j = siblings.length; i < j; i++){
				if(siblings[i] === elem) return next(elem);
				if(isElement(siblings[i])) return;
			}
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
		if(func === false) return function(){ return false; };

		return function(elem){
			if(func(getIndex(elem))) return next(elem);
		};
	},
	"nth-last-child": function(next, rule){
		var func = getNCheck(rule);
		if(func === null) return next;
		if(func === false) return function(){ return false; };

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
		if(func === false) return function(){ return false; };

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
	}
	//to consider: :target, :checked, :enabled, :disabled
};

//helper methods

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
		a = formula[1] ? parseInt(formula[1], 10) || 1 : 0;
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

var parse = function(selector){
	var p = new Parser(selector);
	return p.getFunc();
};

var Parser = function(selector){
	this._selector = selector;

	this._clean();
	this._parse();
};

Parser.prototype  ={
	func: function(){ return true; },
	getFunc: function(){
		return this.func;
	},
	_clean: function(selector){
		this._selector = this._selector
			.trim()
			.replace(re_whitespace, " ")
			.replace(re_cleanSelector, "$1");
	},
	_getName: function(){
		var sub = this._selector.match(re_name)[0];
		this._selector = this._selector.substr(sub.length);
		return sub;
	},
	_processClass: function(){
		this._matchElement("class", this._getName(), false);
	},
	_matchElement: function(name, value, ignoreCase){
		this._buildRe(name, "(?:^|\\s)" + value + "(?:$|\\s)", ignoreCase);
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
			var siblings = getSiblings(elem);
			if(!siblings) return;
			for(var i = 0, j = siblings.length; i < j; i++){
				if(elem === siblings[i]) continue;
				if(isElement(siblings[i]) && next(siblings[i])) return true;
			}
		};
	},
	_matchExact: function(name, value, ignoreCase){
		if(ignoreCase){
			this._buildRe(name, "^"+value+"$", true);
			return;
		}
		var next = this.func;
		this.func = function(elem){
			if(hasAttrib(elem, name) && getAttributeValue(elem, name) === value) return next(elem);
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
	_processColon: function(){
		//if(selector.charAt(0) === ":"){} //TODO pseudo-element
		var name = this._getName(),
			subselect = "";
	
		if(this._selector.charAt(0) === "("){
			subselect = this._selector.substr(1, this._selector.indexOf(")", 2)-1);
			this._selector = this._selector.substr(subselect.length + 2);
		}
		if(name in filters) this.func = filters[name](this.func, subselect);
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
				case "*": continue;
				case "#": this._processId(); break;
				case "+": this._processPlus(); break;
				case ".": this._processClass(); break;
				case " ": this._processSpace(); break;
				case "~": this._processTilde(); break;
				case ":": this._processColon(); break;
				case ">": this._processArrow(); break;
				case "[": this._processBracket(); break;
				//otherwise, the parser needs to throw or it would enter an infinite loop
				default: throw Error("Unmatched selector:" + firstChar + this._selector);
			}
		}
	}
};

Parser.prototype._processBracket = function(){
	var next = this.func;

	if(this._selector.charAt(0) === " ") this._selector = this._selector.substr(1);

	var name = this._getName(),
		action = this._selector.charAt(0);

	if(action === " "){
		action = this._selector.charAt(1);
		this._selector = this._selector.substr(2);
	}
	else this._selector = this._selector.substr(1);

	if(action === "]"){
		return function(elem){
			if(hasAttrib(elem, name)) return next(elem);
		};
	}

	var value = this._selector.substr(0, this._selector.indexOf("]"));
	this._selector = this._selector.substr(value.length + 1);

	value = value.trim();

	if(action !== "="){
		if(value.charAt(0) !== "=") return;
		if(value.charAt(1) === " ") value = value.substr(2);
		else value = value.substr(1);
	} else {
		if(value.charAt(1) === " ") value = value.substr(1);
	}

	var i = value.substr(-2) === " i";
	if(i) value = value.slice(0, -2);

	if(value.charAt(0) === "\"") value = value.substr(1, value.indexOf("\"", 1));
	if(value.charAt(0) === "\'") value = value.substr(1, value.indexOf("\'", 1));

	switch(action){
		case "=": return this._matchExact(name, value, i);
		case "~": return this._matchElement(name, value, i);
		case "*": return this._buildRe(name, value, i);
		case "$": return this._buildRe(name, value + "$", i);
		case "^": return this._buildRe(name, "^" + value, i);
		case "|": return this._buildRe(name, "^" + value + "(?:$|-)", i);
		default: return; // ignore it
	}
};

var CSSselect = function(selector){
	var parts = selector.split(",").map(parse),
		num = parts.length;

	if(num === 1) return parts[0];
	return function(elem){
		for(var i = 0; i < num; i++){
			if(parts[i](elem)) return true;
		}
	};
};

CSSselect.parse = CSSselect;
CSSselect.filters = filters;
CSSselect.iterate = function(elems, query){
	if(typeof query === "string") query = CSSselect(query);
	return iterate(elems, query);
};

function iterate(elems, query){
	var result = [];
	for(var i = 0, j = elems.length; i < j; i++){
		if(!isElement(elems[i])) continue;
		if(query(elems[i])) result.push(elems[i]);
		if(getChildren(elems[i])) Array.prototype.push.apply(
			result,
			iterate(getChildren(elems[i]), query)
		);
	}
	return result;
};

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