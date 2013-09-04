/*
	compiles a selector to an executable function
*/

module.exports = compile;

var parse       = require("CSSwhat"),
    Rules       = require("./general.js"),
    sortRules   = require("./sort.js"),
    BaseFuncs   = require("./basefunctions.js"),
    rootFunc    = BaseFuncs.rootFunc,
    trueFunc    = BaseFuncs.trueFunc,
    falseFunc   = BaseFuncs.falseFunc;

function compile(selector){
	var functions = parse(selector).map(function(arr){
		return sortRules(arr).reduce(function(func, rule){
			if(func === falseFunc) return func;
			return Rules[rule.type](func, rule);
		}, rootFunc);
	}).filter(function(func){
		return func !== rootFunc && func !== falseFunc;
	});

	if(functions.length === 0) return falseFunc;

	return functions.reduce(function(a, b){
		if(a === trueFunc) return a;
		if(b === trueFunc) return b;
		return function(elem){
			return a(elem) || b(elem);
		};
	});
}

//:not and :has have to compile selectors
//doing this in lib/pseudos.js would lead to circular dependencies,
//so we add them here

var filters     = require("./pseudos.js").filters,
    DomUtils    = require("domutils"),
    findOne     = DomUtils.findOne,
    getChildren = DomUtils.getChildren;

filters.not = function(next, select){
	var func = compile(select);

	if(func === falseFunc){
		return next === rootFunc ? trueFunc : next;
	}
	if(func === trueFunc || func === rootFunc){
		return falseFunc;
	}

	return function(elem){
		return !func(elem) && next(elem);
	};
};

filters.has = function(next, selector){
	var func = compile(selector);

	if(func === rootFunc || func === trueFunc) return next;
	if(func === falseFunc) return falseFunc;

	return function proc(elem){
		return findOne(func, getChildren(elem)) !== null && next(elem);
	};
};
