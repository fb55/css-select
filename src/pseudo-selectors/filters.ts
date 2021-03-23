import getNCheck from "nth-check";
import { trueFunc, falseFunc } from "boolbase";
import { attributeRules } from "../attributes";
import type { CompiledQuery, InternalOptions, Adapter } from "../types";
import type { AttributeSelector } from "css-what";

export type Filter = <Node, ElementNode extends Node>(
    next: CompiledQuery<ElementNode>,
    text: string,
    options: InternalOptions<Node, ElementNode>,
    context?: ElementNode[]
) => CompiledQuery<ElementNode>;

const checkAttrib = attributeRules.equals;

function getAttribFunc(name: string, value: string): Filter {
    const data: AttributeSelector = {
        type: "attribute",
        action: "equals",
        ignoreCase: false,
        namespace: null,
        name,
        value,
    };

    return function attribFunc(next, _rule, options) {
        return checkAttrib(next, data, options);
    };
}

function getChildFunc<Node, ElementNode extends Node>(
    next: CompiledQuery<ElementNode>,
    adapter: Adapter<Node, ElementNode>
): CompiledQuery<ElementNode> {
    return (elem) => {
        const parent = adapter.getParent(elem);
        return !!parent && adapter.isTag(parent) && next(elem);
    };
}

export const filters: Record<string, Filter> = {
    contains(next, text, { adapter }) {
        return function contains(elem) {
            return next(elem) && adapter.getText(elem).includes(text);
        };
    },
    icontains(next, text, { adapter }) {
        const itext = text.toLowerCase();

        return function icontains(elem) {
            return (
                next(elem) &&
                adapter.getText(elem).toLowerCase().includes(itext)
            );
        };
    },

    // Location specific methods
    "nth-child"(next, rule, { adapter, equals }) {
        const func = getNCheck(rule);

        if (func === falseFunc) return falseFunc;
        if (func === trueFunc) return getChildFunc(next, adapter);

        return function nthChild(elem) {
            const siblings = adapter.getSiblings(elem);
            let pos = 0;

            for (let i = 0; i < siblings.length; i++) {
                if (equals(elem, siblings[i])) break;
                if (adapter.isTag(siblings[i])) {
                    pos++;
                }
            }

            return func(pos) && next(elem);
        };
    },
    "nth-last-child"(next, rule, { adapter, equals }) {
        const func = getNCheck(rule);

        if (func === falseFunc) return falseFunc;
        if (func === trueFunc) return getChildFunc(next, adapter);

        return function nthLastChild(elem) {
            const siblings = adapter.getSiblings(elem);
            let pos = 0;

            for (let i = siblings.length - 1; i >= 0; i--) {
                if (equals(elem, siblings[i])) break;
                if (adapter.isTag(siblings[i])) {
                    pos++;
                }
            }

            return func(pos) && next(elem);
        };
    },
    "nth-of-type"(next, rule, { adapter, equals }) {
        const func = getNCheck(rule);

        if (func === falseFunc) return falseFunc;
        if (func === trueFunc) return getChildFunc(next, adapter);

        return function nthOfType(elem) {
            const siblings = adapter.getSiblings(elem);
            let pos = 0;

            for (let i = 0; i < siblings.length; i++) {
                const currentSibling = siblings[i];
                if (equals(elem, currentSibling)) break;
                if (
                    adapter.isTag(currentSibling) &&
                    adapter.getName(currentSibling) === adapter.getName(elem)
                ) {
                    pos++;
                }
            }

            return func(pos) && next(elem);
        };
    },
    "nth-last-of-type"(next, rule, { adapter, equals }) {
        const func = getNCheck(rule);

        if (func === falseFunc) return falseFunc;
        if (func === trueFunc) return getChildFunc(next, adapter);

        return function nthLastOfType(elem) {
            const siblings = adapter.getSiblings(elem);
            let pos = 0;

            for (let i = siblings.length - 1; i >= 0; i--) {
                const currentSibling = siblings[i];
                if (equals(elem, currentSibling)) break;
                if (
                    adapter.isTag(currentSibling) &&
                    adapter.getName(currentSibling) === adapter.getName(elem)
                ) {
                    pos++;
                }
            }

            return func(pos) && next(elem);
        };
    },

    // TODO determine the actual root element
    root(next, _rule, { adapter }) {
        return (elem) => {
            const parent = adapter.getParent(elem);
            return (parent == null || !adapter.isTag(parent)) && next(elem);
        };
    },

    scope<Node, ElementNode extends Node>(
        next: CompiledQuery<ElementNode>,
        rule: string,
        options: InternalOptions<Node, ElementNode>,
        context?: ElementNode[]
    ): CompiledQuery<ElementNode> {
        const { equals } = options;

        if (!context || context.length === 0) {
            // Equivalent to :root
            return filters.root(next, rule, options);
        }

        if (context.length === 1) {
            // NOTE: can't be unpacked, as :has uses this for side-effects
            return (elem) => equals(context[0], elem) && next(elem);
        }

        return (elem) => context.includes(elem) && next(elem);
    },

    // JQuery extensions (others follow as pseudos)

    // [type=checkbox]
    checkbox: getAttribFunc("type", "checkbox"),
    // [type=file]
    file: getAttribFunc("type", "file"),
    // [type=password]
    password: getAttribFunc("type", "password"),
    // [type=radio]
    radio: getAttribFunc("type", "radio"),
    // [type=reset]
    reset: getAttribFunc("type", "reset"),
    // [type=image]
    image: getAttribFunc("type", "image"),
    // [type=submit]
    submit: getAttribFunc("type", "submit"),

    // Dynamic state pseudos. These depend on optional Adapter methods.
    hover(next, _rule, { adapter }) {
        const { isHovered } = adapter;
        if (typeof isHovered !== "function") {
            return falseFunc;
        }

        return function hover(elem) {
            return isHovered(elem) && next(elem);
        };
    },
    visited(next, _rule, { adapter }) {
        const { isVisited } = adapter;
        if (typeof isVisited !== "function") {
            return falseFunc;
        }

        return function visited(elem) {
            return isVisited(elem) && next(elem);
        };
    },
    active(next, _rule, { adapter }) {
        const { isActive } = adapter;
        if (typeof isActive !== "function") {
            return falseFunc;
        }

        return function active(elem) {
            return isActive(elem) && next(elem);
        };
    },
};
