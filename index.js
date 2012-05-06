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
	contains: function(next, select){
		var func = parse(select),
			proc = function(elem){
				var children = getChildren(elem);
				for(var i = 0, j = children.length; i < j; i++){
					if(!isElement(children[i])) continue;
					if(func(children[i])) return true;
					if(getChildren(children[i]) && proc(children[i])) return true;
				}
			};
	
		return function proc(elem){
			if(getChildren(elem) && proc(elem)) return next(elem);
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
			for(var i = 0, j = children.length; i < j; i++){
				if(isElement(children[i])) return;
			}
			return next(elem);
		};
	},
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
			for(var i = siblings.length; i >= 0; i--){
				if(siblings[i] === elem) return next(elem);
				if(isElement(siblings[i])) return;
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
			for(var i = siblings.length; i >= 0; i--){
				if(siblings[i] === elem) return next(elem);
				if(getName(siblings[i]) === getName(elem)) return;
			}
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
	"nth-child": function(next, num){
		var pos = parseNth(num);
		if(!pos) return next; //wrong syntax -> ignored
	
		var a = pos[0],
			b = pos[1];
	
		if(b === 0 && a <= 0) return function(){ return false; }; //shortcut
	
		if(a >= -1 && a <= 1) return function(elem){
			var pos = getIndex(elem) + 1;
			if(pos === 0) return;
			if(pos-b === 0) return next(elem);
		};
		if(a >= 0) return function(elem){
			var pos = getIndex(elem) + 1;
			if(pos === 0) return;
		};
		return function(elem){
			var pos = getIndex(elem) + 1;
			if(pos === 0) return;
			pos -= b;
			for(var n = 0; (a*n) <= b; n++){
				if(pos === a*n) return next(elem);
			}
		};
	}
};

//helper methods
function getIndex(elem){
	var siblings = getSiblings(elem);
	if(!siblings) return -1;
	var count = 0;
	for(var i = 0, j = siblings.length; i < j; i++){
		if(siblings[i] === elem) return count;
		if(isElement(siblings[i])) count++;
	}
	return -1;
}
function parseNth(formula){
	formula = formula.trim().toLowerCase();
	if(formula === "even") return [2, 0];
	if(formula === "odd")	return [2, 1];

	var parts = formula.match(re_nthElement);
	if(!parts) return null;
	return [
		parts[1] && parseInt(parts[1], 10) || 0,
		parts[3] ? (parts[2] && parts[2] === "-" ? -1 : 1) * parseInt(parts[3], 10) : 0
	];
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