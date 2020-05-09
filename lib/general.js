const attributes = require("./attributes.js");
const Pseudos = require("./pseudos");

/*
	all available rules
*/
module.exports = {
    __proto__: null,

    attribute: attributes.compile,
    pseudo: Pseudos.compile,

    //tags
    tag(next, data, options) {
        const name = data.name;
        const adapter = options.adapter;

        return function tag(elem) {
            return adapter.getName(elem) === name && next(elem);
        };
    },

    //traversal
    descendant(next, data, options) {
        // eslint-disable-next-line no-undef
        const isFalseCache =
            typeof WeakSet !== "undefined" ? new WeakSet() : null;
        const adapter = options.adapter;

        return function descendant(elem) {
            let found = false;

            while (!found && (elem = adapter.getParent(elem))) {
                if (!isFalseCache || !isFalseCache.has(elem)) {
                    found = next(elem);
                    if (!found && isFalseCache) {
                        isFalseCache.add(elem);
                    }
                }
            }

            return found;
        };
    },
    _flexibleDescendant(next, data, options) {
        const adapter = options.adapter;

        // Include element itself, only used while querying an array
        return function descendant(elem) {
            let found = next(elem);

            while (!found && (elem = adapter.getParent(elem))) {
                found = next(elem);
            }

            return found;
        };
    },
    parent(next, data, options) {
        if (options && options.strict) {
            throw new Error("Parent selector isn't part of CSS3");
        }

        const adapter = options.adapter;

        return function parent(elem) {
            return adapter.getChildren(elem).some(test);
        };

        function test(elem) {
            return adapter.isTag(elem) && next(elem);
        }
    },
    child(next, data, options) {
        const adapter = options.adapter;

        return function child(elem) {
            const parent = adapter.getParent(elem);
            return !!parent && next(parent);
        };
    },
    sibling(next, data, options) {
        const adapter = options.adapter;

        return function sibling(elem) {
            const siblings = adapter.getSiblings(elem);

            for (let i = 0; i < siblings.length; i++) {
                if (adapter.isTag(siblings[i])) {
                    if (siblings[i] === elem) break;
                    if (next(siblings[i])) return true;
                }
            }

            return false;
        };
    },
    adjacent(next, data, options) {
        const adapter = options.adapter;

        return function adjacent(elem) {
            const siblings = adapter.getSiblings(elem);
            let lastElement;

            for (let i = 0; i < siblings.length; i++) {
                if (adapter.isTag(siblings[i])) {
                    if (siblings[i] === elem) break;
                    lastElement = siblings[i];
                }
            }

            return !!lastElement && next(lastElement);
        };
    },
    universal(next) {
        return next;
    },
};
