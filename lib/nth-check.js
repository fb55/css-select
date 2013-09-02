var BaseFuncs = require("./basefunctions.js"),
    trueFunc  = BaseFuncs.trueFunc,
    falseFunc = BaseFuncs.falseFunc;

module.exports = nthCheck;
module.exports.parse = parse;

//following http://www.w3.org/TR/css3-selectors/#nth-child-pseudo

//[ ['-'|'+']? INTEGER? {N} [ S* ['-'|'+'] S* INTEGER ]?
var re_nthElement = /^([+\-]?\d*n)?\s*(?:([+\-]?)\s*(\d+))?$/;

function parse(formula){
	formula = formula.trim().toLowerCase();

	if(formula === "even"){
		return [2, 0];
	} else if(formula === "odd"){
		return [2, 1];
	} else {
		var parsed = formula.match(re_nthElement);

		if(!parsed){
			throw new SyntaxError("n-th rule couldn't be parsed ('" + formula + "')");
		}

		var a;

		if(parsed[1]){
			a = parseInt(parsed[1], 10);
			if(!a){
				if(parsed[1].charAt(0) === "-") a = -1;
				else a = 1;
			}
		} else a = 0;

		return [
			a,
			parsed[3] ? parseInt((parsed[2] || "") + parsed[3], 10) : 0
		];
	}
}

/*
	returns a function that checks if an elements index matches the given rule
	highly optimized to return the fastest solution
*/
function nthCheck(formula){
	var parsed = parse(formula),
	    a = parsed[0],
	    b = parsed[1] - 1;

	//when b <= 0, a*n won't be possible for any matches when a < 0
	//besides, the specification says that no element is matched when a and b are 0
	if(b < 0 && a <= 0) return falseFunc;

	//when b <= 0 and a === 1, they match any element
	if(b < 0 && a === 1) return trueFunc;

	//when a is in the range -1..1, it matches any element (so only b is checked)
	if(a ===-1) return function(pos){ return pos <= b; };
	if(a === 1) return function(pos){ return pos >= b; };
	if(a === 0) return function(pos){ return pos === b; };

	//when a > 0, modulo can be used to check if there is a match
	if(a > 1){
		return function(pos){
			pos -= b;
			return pos >= 0 && (pos % a) === 0;
		};
	}

	a *= -1; //make `a` positive

	return function(pos){
		pos -= b;
		return pos >= 0 && (pos % a) === 0 && (pos / a) < b;
	};
}
