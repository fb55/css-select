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

const getNCheck = require("nth-check");
const BaseFuncs = require("boolbase");
const attributes = require("./attributes.js");
const trueFunc = BaseFuncs.trueFunc;
const falseFunc = BaseFuncs.falseFunc;

const checkAttrib = attributes.rules.equals;

function getAttribFunc(name, value) {
    const data = { name, value };
    return function attribFunc(next, rule, options) {
        return checkAttrib(next, data, options);
    };
}

function getChildFunc(next, adapter) {
    return function (elem) {
        return !!adapter.getParent(elem) && next(elem);
    };
}

const filters = {
    contains(next, text, options) {
        const adapter = options.adapter;

        return function contains(elem) {
            return next(elem) && adapter.getText(elem).indexOf(text) >= 0;
        };
    },
    icontains(next, text, options) {
        const itext = text.toLowerCase();
        const adapter = options.adapter;

        return function icontains(elem) {
            return (
                next(elem) &&
                adapter.getText(elem).toLowerCase().indexOf(itext) >= 0
            );
        };
    },

    //location specific methods
    "nth-child"(next, rule, options) {
        const func = getNCheck(rule);
        const adapter = options.adapter;

        if (func === falseFunc) return func;
        if (func === trueFunc) return getChildFunc(next, adapter);

        return function nthChild(elem) {
            const siblings = adapter.getSiblings(elem);

            let pos = 0;
            for (let i = 0; i < siblings.length; i++) {
                if (adapter.isTag(siblings[i])) {
                    if (siblings[i] === elem) break;
                    else pos++;
                }
            }

            return func(pos) && next(elem);
        };
    },
    "nth-last-child"(next, rule, options) {
        const func = getNCheck(rule);
        const adapter = options.adapter;

        if (func === falseFunc) return func;
        if (func === trueFunc) return getChildFunc(next, adapter);

        return function nthLastChild(elem) {
            const siblings = adapter.getSiblings(elem);

            let pos = 0;
            for (let i = siblings.length - 1; i >= 0; i--) {
                if (adapter.isTag(siblings[i])) {
                    if (siblings[i] === elem) break;
                    else pos++;
                }
            }

            return func(pos) && next(elem);
        };
    },
    "nth-of-type"(next, rule, options) {
        const func = getNCheck(rule);
        const adapter = options.adapter;

        if (func === falseFunc) return func;
        if (func === trueFunc) return getChildFunc(next, adapter);

        return function nthOfType(elem) {
            const siblings = adapter.getSiblings(elem);

            let pos = 0;
            for (let i = 0; i < siblings.length; i++) {
                if (adapter.isTag(siblings[i])) {
                    if (siblings[i] === elem) break;
                    if (adapter.getName(siblings[i]) === adapter.getName(elem))
                        pos++;
                }
            }

            return func(pos) && next(elem);
        };
    },
    "nth-last-of-type"(next, rule, options) {
        const func = getNCheck(rule);
        const adapter = options.adapter;

        if (func === falseFunc) return func;
        if (func === trueFunc) return getChildFunc(next, adapter);

        return function nthLastOfType(elem) {
            const siblings = adapter.getSiblings(elem);

            let pos = 0;
            for (let i = siblings.length - 1; i >= 0; i--) {
                if (adapter.isTag(siblings[i])) {
                    if (siblings[i] === elem) break;
                    if (adapter.getName(siblings[i]) === adapter.getName(elem))
                        pos++;
                }
            }

            return func(pos) && next(elem);
        };
    },

    //TODO determine the actual root element
    root(next, rule, options) {
        const adapter = options.adapter;

        return function (elem) {
            return !adapter.getParent(elem) && next(elem);
        };
    },

    scope(next, rule, options, context) {
        const adapter = options.adapter;

        if (!context || context.length === 0) {
            //equivalent to :root
            return filters.root(next, rule, options);
        }

        function equals(a, b) {
            if (typeof adapter.equals === "function")
                return adapter.equals(a, b);

            return a === b;
        }

        if (context.length === 1) {
            //NOTE: can't be unpacked, as :has uses this for side-effects
            return function (elem) {
                return equals(context[0], elem) && next(elem);
            };
        }

        return function (elem) {
            return context.indexOf(elem) >= 0 && next(elem);
        };
    },

    //jQuery extensions (others follow as pseudos)
    checkbox: getAttribFunc("type", "checkbox"),
    file: getAttribFunc("type", "file"),
    password: getAttribFunc("type", "password"),
    radio: getAttribFunc("type", "radio"),
    reset: getAttribFunc("type", "reset"),
    image: getAttribFunc("type", "image"),
    submit: getAttribFunc("type", "submit"),

    //dynamic state pseudos. These depend on optional Adapter methods.
    hover(next, rule, options) {
        const adapter = options.adapter;

        if (typeof adapter.isHovered === "function") {
            return function hover(elem) {
                return next(elem) && adapter.isHovered(elem);
            };
        }

        return falseFunc;
    },
    visited(next, rule, options) {
        const adapter = options.adapter;

        if (typeof adapter.isVisited === "function") {
            return function visited(elem) {
                return next(elem) && adapter.isVisited(elem);
            };
        }

        return falseFunc;
    },
    active(next, rule, options) {
        const adapter = options.adapter;

        if (typeof adapter.isActive === "function") {
            return function active(elem) {
                return next(elem) && adapter.isActive(elem);
            };
        }

        return falseFunc;
    },
};

//helper methods
function getFirstElement(elems, adapter) {
    for (let i = 0; elems && i < elems.length; i++) {
        if (adapter.isTag(elems[i])) return elems[i];
    }
}

//while filters are precompiled, pseudos get called when they are needed
const pseudos = {
    empty(elem, adapter) {
        return !adapter
            .getChildren(elem)
            .some((elem) => adapter.isTag(elem) || elem.type === "text");
    },

    "first-child"(elem, adapter) {
        return getFirstElement(adapter.getSiblings(elem), adapter) === elem;
    },
    "last-child"(elem, adapter) {
        const siblings = adapter.getSiblings(elem);

        for (let i = siblings.length - 1; i >= 0; i--) {
            if (siblings[i] === elem) return true;
            if (adapter.isTag(siblings[i])) break;
        }

        return false;
    },
    "first-of-type"(elem, adapter) {
        const siblings = adapter.getSiblings(elem);

        for (let i = 0; i < siblings.length; i++) {
            if (adapter.isTag(siblings[i])) {
                if (siblings[i] === elem) return true;
                if (adapter.getName(siblings[i]) === adapter.getName(elem))
                    break;
            }
        }

        return false;
    },
    "last-of-type"(elem, adapter) {
        const siblings = adapter.getSiblings(elem);

        for (let i = siblings.length - 1; i >= 0; i--) {
            if (adapter.isTag(siblings[i])) {
                if (siblings[i] === elem) return true;
                if (adapter.getName(siblings[i]) === adapter.getName(elem))
                    break;
            }
        }

        return false;
    },
    "only-of-type"(elem, adapter) {
        const siblings = adapter.getSiblings(elem);

        for (let i = 0, j = siblings.length; i < j; i++) {
            if (adapter.isTag(siblings[i])) {
                if (siblings[i] === elem) continue;
                if (adapter.getName(siblings[i]) === adapter.getName(elem)) {
                    return false;
                }
            }
        }

        return true;
    },
    "only-child"(elem, adapter) {
        const siblings = adapter.getSiblings(elem);

        for (let i = 0; i < siblings.length; i++) {
            if (adapter.isTag(siblings[i]) && siblings[i] !== elem)
                return false;
        }

        return true;
    },

    //:matches(a, area, link)[href]
    link(elem, adapter) {
        return adapter.hasAttrib(elem, "href");
    },
    //TODO: :any-link once the name is finalized (as an alias of :link)

    //forms
    //to consider: :target

    //:matches([selected], select:not([multiple]):not(> option[selected]) > option:first-of-type)
    selected(elem, adapter) {
        if (adapter.hasAttrib(elem, "selected")) return true;
        else if (adapter.getName(elem) !== "option") return false;

        //the first <option> in a <select> is also selected
        const parent = adapter.getParent(elem);

        if (
            !parent ||
            adapter.getName(parent) !== "select" ||
            adapter.hasAttrib(parent, "multiple")
        ) {
            return false;
        }

        const siblings = adapter.getChildren(parent);
        let sawElem = false;

        for (let i = 0; i < siblings.length; i++) {
            if (adapter.isTag(siblings[i])) {
                if (siblings[i] === elem) {
                    sawElem = true;
                } else if (!sawElem) {
                    return false;
                } else if (adapter.hasAttrib(siblings[i], "selected")) {
                    return false;
                }
            }
        }

        return sawElem;
    },
    //https://html.spec.whatwg.org/multipage/scripting.html#disabled-elements
    //:matches(
    //  :matches(button, input, select, textarea, menuitem, optgroup, option)[disabled],
    //  optgroup[disabled] > option),
    // fieldset[disabled] * //TODO not child of first <legend>
    //)
    disabled(elem, adapter) {
        return adapter.hasAttrib(elem, "disabled");
    },
    enabled(elem, adapter) {
        return !adapter.hasAttrib(elem, "disabled");
    },
    //:matches(:matches(:radio, :checkbox)[checked], :selected) (TODO menuitem)
    checked(elem, adapter) {
        return (
            adapter.hasAttrib(elem, "checked") ||
            pseudos.selected(elem, adapter)
        );
    },
    //:matches(input, select, textarea)[required]
    required(elem, adapter) {
        return adapter.hasAttrib(elem, "required");
    },
    //:matches(input, select, textarea):not([required])
    optional(elem, adapter) {
        return !adapter.hasAttrib(elem, "required");
    },

    //jQuery extensions

    //:not(:empty)
    parent(elem, adapter) {
        return !pseudos.empty(elem, adapter);
    },
    //:matches(h1, h2, h3, h4, h5, h6)
    header: namePseudo(["h1", "h2", "h3", "h4", "h5", "h6"]),

    //:matches(button, input[type=button])
    button(elem, adapter) {
        const name = adapter.getName(elem);
        return (
            name === "button" ||
            (name === "input" &&
                adapter.getAttributeValue(elem, "type") === "button")
        );
    },
    //:matches(input, textarea, select, button)
    input: namePseudo(["input", "textarea", "select", "button"]),
    //input:matches(:not([type!='']), [type='text' i])
    text(elem, adapter) {
        let attr;
        return (
            adapter.getName(elem) === "input" &&
            (!(attr = adapter.getAttributeValue(elem, "type")) ||
                attr.toLowerCase() === "text")
        );
    },
};

function namePseudo(names) {
    if (typeof Set !== "undefined") {
        // eslint-disable-next-line no-undef
        const nameSet = new Set(names);

        return function (elem, adapter) {
            return nameSet.has(adapter.getName(elem));
        };
    }

    return function (elem, adapter) {
        return names.indexOf(adapter.getName(elem)) >= 0;
    };
}

function verifyArgs(func, name, subselect) {
    if (subselect === null) {
        if (func.length > 2 && name !== "scope") {
            throw new Error(`pseudo-selector :${name} requires an argument`);
        }
    } else {
        if (func.length === 2) {
            throw new Error(
                `pseudo-selector :${name} doesn't have any arguments`
            );
        }
    }
}

//FIXME this feels hacky
const re_CSS3 = /^(?:(?:nth|last|first|only)-(?:child|of-type)|root|empty|(?:en|dis)abled|checked|not)$/;

module.exports = {
    compile(next, data, options, context) {
        const name = data.name;
        const subselect = data.data;
        const adapter = options.adapter;

        if (options && options.strict && !re_CSS3.test(name)) {
            throw new Error(`:${name} isn't part of CSS3`);
        }

        if (typeof filters[name] === "function") {
            return filters[name](next, subselect, options, context);
        } else if (typeof pseudos[name] === "function") {
            const func = pseudos[name];

            verifyArgs(func, name, subselect);

            if (func === falseFunc) {
                return func;
            }

            if (next === trueFunc) {
                return function pseudoRoot(elem) {
                    return func(elem, adapter, subselect);
                };
            }

            return function pseudoArgs(elem) {
                return func(elem, adapter, subselect) && next(elem);
            };
        } else {
            throw new Error(`unmatched pseudo-class :${name}`);
        }
    },
    filters,
    pseudos,
};
