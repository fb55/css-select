var DomUtils    = require("domutils"),
    isTag       = DomUtils.isTag,
    getParent   = DomUtils.getParent,
    getChildren = DomUtils.getChildren,
    getSiblings = DomUtils.getSiblings,
    getName     = DomUtils.getName,
    Pseudos     = require("./pseudos.js"),
    Attributes  = require("./attributes.js"),
    BaseFuncs   = require("./basefunctions.js"),
    rootFunc    = BaseFuncs.rootFunc,
    trueFunc    = BaseFuncs.trueFunc,
    falseFunc   = BaseFuncs.falseFunc;

/*
	all available rules
*/
module.exports = {
	__proto__: null,

	//tags
	tag: function(next, data){
		var name = data.name;
		return function(elem){
			return getName(elem) === name && next(elem);
		};
	},

	//traversal
	descendant: function(next){
		return function(elem){
			var found = false;

			while(!found && (elem = getParent(elem))){
				found = next(elem);
			}

			return found;
		};
	},
	parent: function(next){
		return function(elem){
			return getChildren(elem).some(next);
		};
	},
	child: function(next){
		return function(elem){
			var parent = getParent(elem);
			return parent && next(parent);
		};
	},
	sibling: function(next){
		return function(elem){
			var siblings = getSiblings(elem);

			for(var i = 0; i < siblings.length; i++){
				if(isTag(siblings[i])){
					if(siblings[i] === elem) break;
					if(next(siblings[i])) return true;
				}
			}

			return false;
		};
	},
	adjacent: function(next){
		return function(elem){
			var siblings = getSiblings(elem),
			    lastElement;

			for(var i = 0; i < siblings.length; i++){
				if(isTag(siblings[i])){
					if(siblings[i] === elem) break;
					lastElement = siblings[i];
				}
			}

			return !!lastElement && next(lastElement);
		};
	},
	universal: function(next){
		return next === rootFunc ? trueFunc : next;
	},

	//attributes
	attribute: Attributes.compile,

	//pseudos
	pseudo: Pseudos.compile
};