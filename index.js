"use strict";

module.exports = CSSselect;

var CSSwhat = require("CSSwhat"),
    DomUtils = require("domutils"),
    isElement = DomUtils.isTag,
    getText = DomUtils.getText,
    findOne = DomUtils.findOne,
    findAll = DomUtils.findAll,
    getParent = DomUtils.getParent,
    hasAttrib = DomUtils.hasAttrib,
    getName = DomUtils.getName,
    getChildren = DomUtils.getChildren,
    getAttributeValue = DomUtils.getAttributeValue,
    getNCheck = require("./lib/nth-check.js"),
    baseFuncs = require("./lib/basefunctions.js"),
    rootFunc = baseFuncs.rootFunc,
    trueFunc = baseFuncs.trueFunc,
    falseFunc = baseFuncs.falseFunc;

/*
	pseudo selectors
	
	---
	
	they are available in two forms:
	* filters called when the selector 
	  is compiled and return a function
	  that needs to return next()
	* pseudos get called on execution
	  they need to return a boolean
*/
var filters = {
    not: function(next, select) {
        var func = parse(select);

        if (func === falseFunc) {
            return next === rootFunc ? trueFunc : next;
        }
        if (func === trueFunc || func === rootFunc) {
            return falseFunc;
        }

        return function(elem) {
            return !func(elem) && next(elem);
        };
    },
    contains: function(next, text) {
        if ((text.charAt(0) === '"' || text.charAt(0) === "'") && text.charAt(0) === text.substr(-1)) {
            text = text.slice(1, -1);
        }
        return function(elem) {
            return getText(elem).indexOf(text) >= 0 && next(elem);
        };
    },
    has: function(next, selector) {
        var func = parse(selector);

        if (func === rootFunc || func === trueFunc) return next;
        if (func === falseFunc) return falseFunc;

        return function proc(elem) {
            return findOne(func, getChildren(elem)) !== null && next(elem);
        };
    },
    root: function(next) {
        return function(elem) {
            var parent = getParent(elem);
            return !parent && next(elem);
        };
    },
    empty: function(next) {
        return function(elem) {
            return getChildren(elem).length === 0 && next(elem);
        };
    },
    parent: function(next) {
        //:parent is the inverse of :empty
        return function(elem) {
            return getChildren(elem).length !== 0 && next(elem);
        };
    },

    //location specific methods
    //first- and last-child methods return as soon as they find another element
    "first-child": function(next) {
        return function(elem) {
            return getFirstElement(getSiblings(elem)) === elem && next(elem);
        };
    },
    "last-child": function(next) {
        return function(elem) {
            var siblings = getSiblings(elem);

            for (var i = siblings.length - 1; i >= 0; i--) {
                if (siblings[i] === elem) return next(elem);
                if (isElement(siblings[i])) break;
            }

            return false;
        };
    },
    "first-of-type": function(next) {
        return function(elem) {
            var siblings = getSiblings(elem);

            for (var i = 0; i < siblings.length; i++) {
                if (isElement(siblings[i])) {
                    if (siblings[i] === elem) return next(elem);
                    if (getName(siblings[i]) === getName(elem)) break;
                }
            }

            return false;
        };
    },
    "last-of-type": function(next) {
        return function(elem) {
            var siblings = getSiblings(elem);

            for (var i = siblings.length - 1; i >= 0; i--) {
                if (isElement(siblings[i])) {
                    if (siblings[i] === elem) return next(elem);
                    if (getName(siblings[i]) === getName(elem)) break;
                }
            }

            return false;
        };
    },
    "only-of-type": function(next) {
        return function(elem) {
            var siblings = getSiblings(elem);

            for (var i = 0, j = siblings.length; i < j; i++) {
                if (isElement(siblings[i])) {
                    if (siblings[i] === elem) continue;
                    if (getName(siblings[i]) === getName(elem)) return false;
                }
            }

            return next(elem);
        };
    },
    "only-child": function(next) {
        return function(elem) {
            var siblings = getSiblings(elem);

            for (var i = 0; i < siblings.length; i++) {
                if (isElement(siblings[i]) && siblings[i] !== elem) return false;
            }

            return next(elem);
        };
    },
    "nth-child": function(next, rule) {
        var func = getNCheck(rule);

        if (func === falseFunc) return func;
        if (func === trueFunc) {
            return next === rootFunc ? func : next;
        }

        return function(elem) {
            var siblings = getSiblings(elem);

            for (var i = 0, pos = 0; i < siblings.length; i++) {
                if (isElement(siblings[i])) {
                    if (siblings[i] === elem) break;
                    else pos++;
                }
            }

            return func(pos) && next(elem);
        };
    },
    "nth-last-child": function(next, rule) {
        var func = getNCheck(rule);

        if (func === falseFunc) return func;
        if (func === trueFunc) {
            return next === rootFunc ? func : next;
        }

        return function(elem) {
            var siblings = getSiblings(elem);

            for (var pos = 0, i = siblings.length - 1; i >= 0; i--) {
                if (isElement(siblings[i])) {
                    if (siblings[i] === elem) break;
                    else pos++;
                }
            }

            return func(pos) && next(elem);
        };
    },
    "nth-of-type": function(next, rule) {
        var func = getNCheck(rule);

        if (func === falseFunc) return func;
        if (func === trueFunc) {
            return next === rootFunc ? func : next;
        }

        return function(elem) {
            var siblings = getSiblings(elem);

            for (var pos = 0, i = 0; i < siblings.length; i++) {
                if (isElement(siblings[i])) {
                    if (siblings[i] === elem) break;
                    if (getName(siblings[i]) === getName(elem)) pos++;
                }
            }

            return func(pos) && next(elem);
        };
    },
    "nth-last-of-type": function(next, rule) {
        var func = getNCheck(rule);

        if (func === falseFunc) return func;
        if (func === trueFunc) {
            return next === rootFunc ? func : next;
        }

        return function(elem) {
            var siblings = getSiblings(elem);

            for (var pos = 0, i = siblings.length - 1; i >= 0; i--) {
                if (siblings[i] === elem) break;
                if (getName(siblings[i]) === getName(elem)) pos++;
            }

            return func(pos) && next(elem);
        };
    },

    //forms
    //to consider: :target, :enabled
    selected: function(next) {
        return function(elem) {
            return (
                hasAttrib(elem, "selected") ||
                //the first <option> in a <select> is also selected
                //TODO this only works for direct descendents
                (getName(getParent(elem)) === "option" &&
                    getFirstElement(getSiblings(elem)) === elem &&
                    next(elem))
            );
        };
    },
    disabled: function(next) {
        return function(elem) {
            return hasAttrib(elem, "disabled") && next(elem);
        };
    },
    enabled: function(next) {
        return function(elem) {
            return !hasAttrib(elem, "disabled") && next(elem);
        };
    },
    checked: function(next) {
        return function(elem) {
            return hasAttrib(elem, "checked") && next(elem);
        };
    },

    //jQuery extensions
    header: function(next) {
        return function(elem) {
            var name = getName(elem);
            return (
                (name === "h1" ||
                    name === "h2" ||
                    name === "h3" ||
                    name === "h4" ||
                    name === "h5" ||
                    name === "h6") &&
                next(elem)
            );
        };
    },
    button: function(next) {
        return function(elem) {
            return (
                (getName(elem) === "button" ||
                    (getName(elem) === "input" &&
                        hasAttrib(elem, "type") &&
                        getAttributeValue(elem, "type") === "button")) &&
                next(elem)
            );
        };
    },
    input: function(next) {
        return function(elem) {
            var name = getName(elem);
            return (
                (name === "input" || name === "textarea" || name === "select" || name === "button") &&
                next(elem)
            );
        };
    },
    text: function(next) {
        return function(elem) {
            return (
                getName(elem) !== "input" &&
                (!hasAttrib(elem, "type") || getAttributeValue(elem, "type") === "text") &&
                next(elem)
            );
        };
    },
    checkbox: getAttribFunc("type", "checkbox"),
    file: getAttribFunc("type", "file"),
    password: getAttribFunc("type", "password"),
    radio: getAttribFunc("type", "radio"),
    reset: getAttribFunc("type", "reset"),
    image: getAttribFunc("type", "image"),
    submit: getAttribFunc("type", "submit")
};

//while filters are precompiled, pseudos get called when they are needed
var pseudos = {};

//helper methods
function getSiblings(elem) {
    var parent = getParent(elem);
    return parent ? getChildren(parent) : [elem];
}

function getFirstElement(elems) {
    for (var i = 0; elems && i < elems.length; i++) {
        if (isElement(elems[i])) return elems[i];
    }
}

function getAttribFunc(name, value) {
    return function(next) {
        return checkAttrib(next, name, value);
    };
}

function checkAttrib(next, name, value) {
    return function(elem) {
        return getAttributeValue(elem, name) === value && next(elem);
    };
}

/*
	all available rules
*/
var generalRules = {
    __proto__: null,

    //tags
    tag: function(next, data) {
        var name = data.name;
        return function(elem) {
            return getName(elem) === name && next(elem);
        };
    },

    //traversal
    descendant: function(next) {
        return function(elem) {
            var found = false;

            while (!found && (elem = getParent(elem))) {
                found = next(elem);
            }

            return found;
        };
    },
    parent: function(next) {
        return function(elem) {
            return getChildren(elem).some(next);
        };
    },
    child: function(next) {
        return function(elem) {
            var parent = getParent(elem);
            return parent && next(parent);
        };
    },
    sibling: function(next) {
        return function(elem) {
            var siblings = getSiblings(elem);

            for (var i = 0; i < siblings.length; i++) {
                if (isElement(siblings[i])) {
                    if (siblings[i] === elem) break;
                    if (next(siblings[i])) return true;
                }
            }

            return false;
        };
    },
    adjacent: function(next) {
        return function(elem) {
            var siblings = getSiblings(elem),
                lastElement;

            for (var i = 0; i < siblings.length; i++) {
                if (isElement(siblings[i])) {
                    if (siblings[i] === elem) break;
                    lastElement = siblings[i];
                }
            }

            return !!lastElement && next(lastElement);
        };
    },
    universal: function(next) {
        return next === rootFunc ? trueFunc : next;
    },

    //attributes
    attribute: function(next, data) {
        var map = data.ignoreCase ? noCaseAttributeRules : attributeRules;

        return map[data.action](next, data.name, data.value, data.ignoreCase);
    },

    //pseudos
    pseudo: function(next, data) {
        var name = data.name,
            subselect = data.data;

        if (name in filters) return filters[name](next, subselect);
        else if (name in pseudos) {
            return function(elem) {
                return pseudos[name](elem, subselect) && next(elem);
            };
        } else {
            throw new SyntaxError("unmatched pseudo-class: " + name);
        }
    }
};

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
            return hasAttrib(elem, name) && regex.test(getAttributeValue(elem, name)) && next(elem);
        };
    };
}

var attributeRules = {
    __proto__: null,
    equals: checkAttrib,
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
            return (
                hasAttrib(elem, name) && getAttributeValue(elem, name).substr(0, len) === value && next(elem)
            );
        };
    },
    end: function(next, name, value) {
        var len = -value.length;

        return function(elem) {
            return hasAttrib(elem, name) && getAttributeValue(elem, name).substr(len) === value && next(elem);
        };
    },
    any: function(next, name, value) {
        return function(elem) {
            return hasAttrib(elem, name) && getAttributeValue(elem, name).indexOf(value) >= 0 && next(elem);
        };
    },
    not: function(next, name, value) {
        if (value === "") {
            return function(elem) {
                return hasAttrib(elem, name) && getAttributeValue(elem, name) !== "" && next(elem);
            };
        }

        return function(elem) {
            return !(hasAttrib(elem, name) && getAttributeValue(elem, name) === value) && next(elem);
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

/*
	sort the parts of the passed selector,
	as there is potential for optimization
*/
var procedure = {
    __proto__: null,
    universal: 5, //should be last so that it can be ignored
    tag: 3, //very quick test
    attribute: 1, //can be faster than class
    pseudo: 0, //can be pretty expensive (especially :has)

    //everything else shouldn't be moved
    descendant: -1,
    child: -1,
    sibling: -1,
    adjacent: -1
};

function procedureSorter(a, b) {
    return procedure[a.type] - procedure[b.type];
}

function sortByProcedure(arr) {
    //TODO optimize, sort individual attribute selectors
    var parts = [],
        last = 0,
        end = false;
    for (var i = 0, j = arr.length - 1; i <= j; i++) {
        if (procedure[arr[i].type] === -1 || (end = i === j)) {
            if (end) i++;
            parts = parts.concat(arr.slice(last, i).sort(procedureSorter));
            if (!end) last = parts.push(arr[i]);
        }
    }
    return parts;
}

function parse(selector) {
    var functions = CSSwhat(selector)
        .map(function(arr) {
            var func = rootFunc;
            arr = sortByProcedure(arr);
            for (var i = 0, j = arr.length; i < j; i++) {
                func = generalRules[arr[i].type](func, arr[i]);
                if (func === falseFunc) return func;
            }
            return func;
        })
        .filter(function(func) {
            return func !== rootFunc && func !== falseFunc;
        });

    var num = functions.length;

    if (num === 0) return falseFunc;
    if (num === 1) return functions[0];

    if (functions.indexOf(trueFunc) >= 0) return trueFunc;

    return function(elem) {
        for (var i = 0; i < num; i++) {
            if (functions[i](elem)) return true;
        }
        return false;
    };
}

/*
	the exported interface
*/
function CSSselect(query, elems) {
    if (typeof query !== "function") query = parse(query);
    if (arguments.length === 1) return query;
    return CSSselect.iterate(query, elems);
}

CSSselect.parse = parse;
CSSselect.filters = filters;
CSSselect.pseudos = pseudos;

CSSselect.iterate = function(query, elems) {
    if (typeof query !== "function") query = parse(query);
    if (query === falseFunc) return [];
    if (!Array.isArray(elems)) elems = getChildren(elems);
    return findAll(query, elems);
};

CSSselect.is = function(elem, query) {
    if (typeof query !== "function") query = parse(query);
    return query(elem);
};
