var DomUtils  = require("domutils"),
    hasAttrib = DomUtils.hasAttrib,
    getAttributeValue = DomUtils.getAttributeValue,
    falseFunc = require("./basefunctions.js").falseFunc;

/*
	attribute selectors
*/
var reChars = /[-[\]{}()*+?.,\\^$|#\s]/g; //https://github.com/slevithan/XRegExp/blob/master/src/xregexp.js#L469
function escapeRe(str){
	return str.replace(reChars, "\\$&");
}

function wrapReRule(pre, post, valueTester){
	return function(next, data){
		var name = data.name,
		    value = data.value;

		if(!valueTester.test(value)){
			return falseFunc;
		}

		var regex = new RegExp(pre + escapeRe(data.value) + post, data.ignoreCase ? "i" : "");

		return function(elem){
			var attr = getAttributeValue(elem, name);
			return attr != null && regex.test(attr) && next(elem);
		};
	};
}

var attributeRules = {
	__proto__: null,
	equals: function(next, data){
		var name  = data.name,
		    value = data.value;

		return function(elem){
			return getAttributeValue(elem, name) === value && next(elem);
		};
	},
	hyphen: wrapReRule("^", "(?:$|-)", /^/),
	element: wrapReRule("(?:^|\\s)", "(?:$|\\s)", /^(?!\s).*/),
	exists: function(next, data){
		var name = data.name;
		return function(elem){
			return hasAttrib(elem, name) && next(elem);
		};
	},
	start: function(next, data){
		var name  = data.name,
		    value = data.value,
		    len = value.length;

		if(len === 0){
			return falseFunc;
		}

		return function(elem){
			var attr = getAttributeValue(elem, name);
			return attr != null && attr.substr(0, len) === value && next(elem);
		};
	},
	end: function(next, data){
		var name  = data.name,
		    value = data.value,
		    len   = -value.length;

		if(len === 0){
			return falseFunc;
		}

		return function(elem){
			var attr = getAttributeValue(elem, name);
			return attr != null && attr.substr(len) === value && next(elem);
		};
	},
	any: function(next, data){
		var name  = data.name,
		    value = data.value;

		if(value === ""){
			return falseFunc;
		}

		return function(elem){
			var attr = getAttributeValue(elem, name);
			return attr != null && attr.indexOf(value) >= 0 && next(elem);
		};
	},
	not: function(next, data){
		var name  = data.name,
		    value = data.value;

		if(value === ""){
			return function(elem){
				return getAttributeValue(elem, name) != null && next(elem);
			};
		} else if(data.ignoreCase){
			value = value.toLowerCase();

			return function(elem){
				var attr = getAttributeValue(elem, name);
				return attr != null && attr.toLowerCase() !== value && next(elem);
			};
		} else {
			return function(elem){
				return getAttributeValue(elem, name) !== value && next(elem);
			};
		}
	}
};

var noCaseAttributeRules = {
	__proto__: attributeRules,
	equals: function(next, data){
		var name = data.name,
		    value = data.value.toLowerCase();

		return function(elem){
			var attr = getAttributeValue(elem, name);
			return attr != null && attr.toLowerCase() === value && next(elem);
		};
	},
	start: function(next, data){
		var name = data.name,
		    value = data.value.toLowerCase(),
		    len = value.length;

		if(len === 0){
			return falseFunc;
		}

		return function(elem){
			var attr = getAttributeValue(elem, name);
			return attr != null && attr.substr(0, len).toLowerCase() === value && next(elem);
		};
	},
	end: function(next, data){
		var name = data.name,
		    value = data.value.toLowerCase(),
		    len = -value.length;

		if(len === 0){
			return falseFunc;
		}

		return function(elem){
			var attr = getAttributeValue(elem, name);
			return attr != null && attr.substr(len).toLowerCase() === value && next(elem);
		};
	},
	any: wrapReRule("", "", /./)
};

module.exports = {
	compile: function(next, data){
		var map = data.ignoreCase ? noCaseAttributeRules : attributeRules;
		return map[data.action](next, data);
	},
	rules: attributeRules,
	noCaseRules: noCaseAttributeRules
};
