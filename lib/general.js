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
    tag(next, data, { adapter }) {
        const { name } = data;

        return (elem) => adapter.getName(elem) === name && next(elem);
    },

    //traversal
    descendant(next, data, { adapter }) {
        // eslint-disable-next-line no-undef
        const isFalseCache =
            typeof WeakSet !== "undefined" ? new WeakSet() : null;

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
    _flexibleDescendant(next, data, { adapter }) {
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
        if (options.strict) {
            throw new Error("Parent selector isn't part of CSS3");
        }

        const { adapter } = options;

        return (elem) => adapter.getChildren(elem).some(test);

        function test(elem) {
            return adapter.isTag(elem) && next(elem);
        }
    },
    child(next, data, { adapter }) {
        return function child(elem) {
            const parent = adapter.getParent(elem);
            return !!parent && next(parent);
        };
    },
    sibling(next, data, { adapter }) {
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
    adjacent(next, data, { adapter }) {
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
