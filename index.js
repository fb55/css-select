"use strict";

module.exports = CSSselect;

var Pseudos       = require("./lib/pseudos.js"),
    DomUtils      = require("domutils"),
    findOne       = DomUtils.findOne,
    findAll       = DomUtils.findAll,
    getChildren   = DomUtils.getChildren,
    getSiblings   = DomUtils.getSiblings,
    removeSubsets = DomUtils.removeSubsets,
    falseFunc     = require("boolbase").falseFunc,
    compile       = require("./lib/compile.js"),
    compileUnsafe = compile.compileUnsafe,
    compileToken  = compile.compileToken;

function getSelectorFunc(searchFunc){
	return function select(query, elems, options){
		if(typeof query !== "function") query = compileUnsafe(query, options, elems);
		if (query.shouldTestNextSiblings) elems = appendNextSiblings((options && options.context) || elems);
		if(!Array.isArray(elems)) elems = getChildren(elems);
		else elems = removeSubsets(elems);
		return searchFunc(query, elems);
	};
}

function getNextSiblings(elem){
	var siblings = getSiblings(elem);
	if (!Array.isArray(siblings)) return [];
	siblings = siblings.slice(0);
	while (siblings.shift() !== elem);
	return siblings;
}

function appendNextSiblings(elems){
	// Order matters because jQuery seems to check the children before the siblings
	var newElems = elems.slice(0);
	for (var i = 0, len = elems.length; i < len; i++) {
		var nextSiblings = getNextSiblings(newElems[i]);
		newElems.push.apply(newElems, nextSiblings);
	}
	return newElems;
}

var selectAll = getSelectorFunc(function selectAll(query, elems){
	return (query === falseFunc || !elems || elems.length === 0) ? [] : findAll(query, elems);
});

var selectOne = getSelectorFunc(function selectOne(query, elems){
	return (query === falseFunc || !elems || elems.length === 0) ? null : findOne(query, elems);
});

function is(elem, query, options){
	return (typeof query === "function" ? query : compile(query, options))(elem);
}

/*
	the exported interface
*/
function CSSselect(query, elems, options){
	return selectAll(query, elems, options);
}

CSSselect.compile = compile;
CSSselect.filters = Pseudos.filters;
CSSselect.pseudos = Pseudos.pseudos;

CSSselect.selectAll = selectAll;
CSSselect.selectOne = selectOne;

CSSselect.is = is;

//legacy methods (might be removed)
CSSselect.parse = compile;
CSSselect.iterate = selectAll;

//hooks
CSSselect._compileUnsafe = compileUnsafe;
CSSselect._compileToken = compileToken;
