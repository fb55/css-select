"use strict";

module.exports = CSSselect;

var DomUtils       = require("domutils"),
	falseFunc      = require("boolbase").falseFunc,
	compileFactory = require("./lib/compile.js"),
	browserAdapter = require("./browser-adapter"),
	defaultCompile = compileFactory(DomUtils);

function getAdapter(options){
	if(options && options.adapter) return options.adapter;

	return DomUtils;
}

function getSelectorFunc(searchFunc){
	return function select(query, elems, options){
		var adapter = getAdapter(options),
			compile,
			compileUnsafe;

		if(adapter === DomUtils){
			compile = defaultCompile;
		} else {
			compile = compileFactory(adapter);
		}

		compileUnsafe = compile.compileUnsafe;

		if(typeof query !== "function") query = compileUnsafe(query, options, elems);
		if(query.shouldTestNextSiblings) elems = appendNextSiblings((options && options.context) || elems, adapter);
		if(!Array.isArray(elems)) elems = adapter.getChildren(elems);
		else elems = adapter.removeSubsets(elems);
		return searchFunc(query, elems, adapter);
	};
}

function getNextSiblings(elem, adapter){
	var siblings = adapter.getSiblings(elem);
	if(!Array.isArray(siblings)) return [];
	siblings = siblings.slice(0);
	while(siblings.shift() !== elem);
	return siblings;
}

function appendNextSiblings(elems, adapter){
	// Order matters because jQuery seems to check the children before the siblings
	if(!Array.isArray(elems)) elems = [elems];
	var newElems = elems.slice(0);

	for(var i = 0, len = elems.length; i < len; i++){
		var nextSiblings = getNextSiblings(newElems[i], adapter);
		newElems.push.apply(newElems, nextSiblings);
	}
	return newElems;
}

var selectAll = getSelectorFunc(function selectAll(query, elems, adapter){
	return (query === falseFunc || !elems || elems.length === 0) ? [] : adapter.findAll(query, elems);
});

var selectOne = getSelectorFunc(function selectOne(query, elems, adapter){
	return (query === falseFunc || !elems || elems.length === 0) ? null : adapter.findOne(query, elems);
});

function is(elem, query, options){
	var adapter = getAdapter(options),
		compile;

	if(adapter === DomUtils){
		compile = defaultCompile;
	} else {
		compile = compileFactory(adapter);
	}

	return (typeof query === "function" ? query : compile(query, options))(elem);
}

/*
	the exported interface
*/
function CSSselect(query, elems, options){
	return selectAll(query, elems, options);
}

CSSselect.compile = defaultCompile;
CSSselect.filters = defaultCompile.Pseudos.filters;
CSSselect.pseudos = defaultCompile.Pseudos.pseudos;

CSSselect.selectAll = selectAll;
CSSselect.selectOne = selectOne;

CSSselect.is = is;

CSSselect.adapters = {
	default: DomUtils,
	browser: browserAdapter
};

//legacy methods (might be removed)
CSSselect.parse = defaultCompile;
CSSselect.iterate = selectAll;

//hooks
CSSselect._compileUnsafe = defaultCompile.compileUnsafe;
CSSselect._compileToken = defaultCompile.compileToken;
