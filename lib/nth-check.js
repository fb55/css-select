var baseFuncs = require("./basefunctions.js"),
    trueFunc = baseFuncs.trueFunc,
    falseFunc = baseFuncs.falseFunc;

/*
	returns a function that checks if an elements index matches the given rule
	highly optimized to return the fastest solution
*/
var re_nthElement = /^([+\-]?\d*n)?\s*(?:([+\-]?)\s*(\d+))?$/;

module.exports = function nthCheck(formula) {
    var a, b;

    //parse the formula
    //b is lowered by 1 as the rule uses index 1 as the start
    formula = formula.trim().toLowerCase();
    if (formula === "even") {
        a = 2;
        b = -1;
    } else if (formula === "odd") {
        a = 2;
        b = 0;
    } else {
        var parsed = formula.match(re_nthElement);

        if (!parsed) {
            //TODO forward rule to error
            throw new SyntaxError("n-th rule couldn't be parsed ('" + formula + "')");
        }

        if (parsed[1]) {
            a = parseInt(parsed[1], 10);
            if (!a) {
                if (parsed[1].charAt(0) === "-") a = -1;
                else a = 1;
            }
        } else a = 0;

        if (parsed[3]) b = parseInt((parsed[2] || "") + parsed[3], 10) - 1;
        else b = -1;
    }

    //when b <= 0, a*n won't be possible for any matches when a < 0
    //besides, the specification says that no element is matched when a and b are 0
    if (b < 0 && a <= 0) return falseFunc;

    //when b <= 0 and a === 1, they match any element
    if (b < 0 && a === 1) return trueFunc;

    //when a is in the range -1..1, it matches any element (so only b is checked)
    if (a === -1)
        return function(pos) {
            return pos <= b;
        };
    if (a === 1)
        return function(pos) {
            return pos >= b;
        };
    if (a === 0)
        return function(pos) {
            return pos === b;
        };

    //when a > 0, modulo can be used to check if there is a match
    if (a > 1) {
        return function(pos) {
            return pos >= 0 && (pos -= b) >= 0 && pos % a === 0;
        };
    }

    a *= -1; //make a positive
    return function(pos) {
        return pos >= 0 && (pos -= b) >= 0 && pos % a === 0 && pos / a < b;
    };
};
