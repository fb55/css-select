import getNCheck from "nth-check";
import { trueFunc, falseFunc } from "boolbase";
import { rules } from "../attributes";
import type { CompiledQuery, InternalOptions, Adapter } from "../types";
import type { AttributeSelector } from "css-what";

const checkAttrib = rules.equals;

function getAttribFunc<Node, ElementNode extends Node>(
    name: string,
    value: string
) {
    const data: AttributeSelector = {
        type: "attribute",
        action: "equals",
        ignoreCase: false,
        name,
        value,
    };

    return function attribFunc(
        next: CompiledQuery<ElementNode>,
        _rule: string,
        options: InternalOptions<Node, ElementNode>
    ): CompiledQuery<ElementNode> {
        return checkAttrib(next, data, options);
    };
}

function getChildFunc<Node, ElementNode extends Node>(
    next: CompiledQuery<ElementNode>,
    adapter: Adapter<Node, ElementNode>
): CompiledQuery<ElementNode> {
    return (elem) => !!adapter.getParent(elem) && next(elem);
}

export type Filter = <Node, ElementNode extends Node>(
    next: CompiledQuery<ElementNode>,
    text: string,
    options: InternalOptions<Node, ElementNode>,
    context?: ElementNode[]
) => CompiledQuery<ElementNode>;

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
    "nth-child"(next, rule, { adapter }) {
        const func = getNCheck(rule);

        if (func === falseFunc) return falseFunc;
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
    "nth-last-child"(next, rule, { adapter }) {
        const func = getNCheck(rule);

        if (func === falseFunc) return falseFunc;
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
    "nth-of-type"(next, rule, { adapter }) {
        const func = getNCheck(rule);

        if (func === falseFunc) return falseFunc;
        if (func === trueFunc) return getChildFunc(next, adapter);

        return function nthOfType(elem) {
            const siblings = adapter.getSiblings(elem);
            let pos = 0;

            for (let i = 0; i < siblings.length; i++) {
                const currentSibling = siblings[i];
                if (adapter.isTag(currentSibling)) {
                    if (currentSibling === elem) break;
                    if (
                        adapter.getName(currentSibling) ===
                        adapter.getName(elem)
                    ) {
                        pos++;
                    }
                }
            }

            return func(pos) && next(elem);
        };
    },
    "nth-last-of-type"(next, rule, { adapter }) {
        const func = getNCheck(rule);

        if (func === falseFunc) return falseFunc;
        if (func === trueFunc) return getChildFunc(next, adapter);

        return function nthLastOfType(elem) {
            const siblings = adapter.getSiblings(elem);
            let pos = 0;

            for (let i = siblings.length - 1; i >= 0; i--) {
                const currentSibling = siblings[i];
                if (adapter.isTag(currentSibling)) {
                    if (currentSibling === elem) break;
                    if (
                        adapter.getName(currentSibling) ===
                        adapter.getName(elem)
                    ) {
                        pos++;
                    }
                }
            }

            return func(pos) && next(elem);
        };
    },

    // TODO determine the actual root element
    root(next, _rule: string, { adapter }) {
        return (elem) => !adapter.getParent(elem) && next(elem);
    },

    scope<Node, ElementNode extends Node>(
        next: CompiledQuery<ElementNode>,
        rule: string,
        options: InternalOptions<Node, ElementNode>,
        context?: ElementNode[]
    ): CompiledQuery<ElementNode> {
        const { adapter } = options;

        if (!context || context.length === 0) {
            // Equivalent to :root
            return filters.root(next, rule, options);
        }

        function equals(a: ElementNode, b: ElementNode) {
            if (typeof adapter.equals === "function") {
                return adapter.equals(a, b);
            }

            return a === b;
        }

        if (context.length === 1) {
            // NOTE: can't be unpacked, as :has uses this for side-effects
            return (elem) => equals(context[0], elem) && next(elem);
        }

        return (elem) => context.includes(elem) && next(elem);
    },

    // JQuery extensions (others follow as pseudos)
    checkbox: getAttribFunc("type", "checkbox"),
    file: getAttribFunc("type", "file"),
    password: getAttribFunc("type", "password"),
    radio: getAttribFunc("type", "radio"),
    reset: getAttribFunc("type", "reset"),
    image: getAttribFunc("type", "image"),
    submit: getAttribFunc("type", "submit"),

    // Added later on
    matches(_next, _token, _options, _context) {
        throw new Error("Unexpected state");
    },
    not(_next, _token, _options, _context) {
        throw new Error("Unexpected state");
    },
    has(_next, _token, _options) {
        throw new Error("Unexpected state");
    },
};
