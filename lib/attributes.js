var DomUtils = require("domutils"),
    hasAttrib = DomUtils.hasAttrib,
    getAttributeValue = DomUtils.getAttributeValue;

/*
	attribute selectors
*/
var reChars = /[-[\]{}()*+?.,\\^$|#\s]/g; //https://github.com/slevithan/XRegExp/blob/master/src/xregexp.js#L469
function escapeRe(str) {
    return str.replace(reChars, "\\$&");
}

function wrapReRule(pre, post) {
    return function(next, name, value, ignoreCase) {
        var regex = new RegExp(pre + escapeRe(value) + post, ignoreCase ? "i" : "");

        return function(elem) {
            var attr = getAttributeValue(elem, name);
            return attr != null && regex.test(attr) && next(elem);
        };
    };
}

var attributeRules = {
    __proto__: null,
    equals: function(next, name, value) {
        return function(elem) {
            return getAttributeValue(elem, name) === value && next(elem);
        };
    },
    hyphen: wrapReRule("^", "(?:$|-)"),
    element: wrapReRule("(?:^|\\s)", "(?:$|\\s)"),
    exists: function(next, name) {
        return function(elem) {
            return hasAttrib(elem, name) && next(elem);
        };
    },
    start: function(next, name, value) {
        var len = value.length;

        return function(elem) {
            var attr = getAttributeValue(elem, name);
            return attr != null && attr.substr(0, len) === value && next(elem);
        };
    },
    end: function(next, name, value) {
        var len = -value.length;

        return function(elem) {
            var attr = getAttributeValue(elem, name);
            return attr != null && attr.substr(len) === value && next(elem);
        };
    },
    any: function(next, name, value) {
        return function(elem) {
            var attr = getAttributeValue(elem, name);
            return attr != null && attr.indexOf(value) >= 0 && next(elem);
        };
    },
    not: function(next, name, value) {
        if (value === "") {
            return function(elem) {
                return getAttributeValue(elem, name) != null && next(elem);
            };
        }

        return function(elem) {
            return getAttributeValue(elem, name) !== value && next(elem);
        };
    }
};

var noCaseAttributeRules = {
    __proto__: attributeRules,
    equals: wrapReRule("^", "$"),
    start: wrapReRule("^", ""),
    end: wrapReRule("", "$"),
    any: wrapReRule("", ""),
    not: wrapReRule("^(?!^", "$)")
};

module.exports = {
    compile: function(next, data) {
        var map = data.ignoreCase ? noCaseAttributeRules : attributeRules;

        return map[data.action](next, data.name, data.value, data.ignoreCase);
    },
    rules: attributeRules,
    noCaseRules: noCaseAttributeRules
};
