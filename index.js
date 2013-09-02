"use strict";

module.exports = CSSselect;

var CSSwhat     = require("CSSwhat"),
    Rules       = require("./lib/general.js"),
    sortRules   = require("./lib/sort.js"),
    Pseudos     = require("./lib/pseudos.js"),
    DomUtils    = require("domutils"),
    findOne     = DomUtils.findOne,
    findAll     = DomUtils.findAll,
    getChildren = DomUtils.getChildren,
    BaseFuncs   = require("./lib/basefunctions.js"),
    rootFunc    = BaseFuncs.rootFunc,
    trueFunc    = BaseFuncs.trueFunc,
    falseFunc   = BaseFuncs.falseFunc;

//:not and :has have to compile the selectors
//doing this in lib/pseudos.js would lead to circular dependencies,
//so we add the selectors here

Pseudos.filters.not = function(next, select){
	var func = parse(select);

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

Pseudos.filters.has = function(next, selector){
	var func = parse(selector);

	if(func === rootFunc || func === trueFunc) return next;
	if(func === falseFunc) return falseFunc;

	return function proc(elem){
		return findOne(func, getChildren(elem)) !== null && next(elem);
	};
};



function parse(selector){
	var functions = CSSwhat(selector).map(function(arr){
		var func = rootFunc;
		arr = sortRules(arr);
		for(var i = 0, j = arr.length; i < j; i++){
			func = Rules[arr[i].type](func, arr[i]);
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
}

CSSselect.parse = parse;
CSSselect.filters = Pseudos.filters;
CSSselect.pseudos = Pseudos.pseudos;

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
