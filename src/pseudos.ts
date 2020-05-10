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

import getNCheck from "nth-check";
import { trueFunc, falseFunc } from "boolbase";
import { rules } from "./attributes";
import { CompiledQuery, InternalOptions, InternalAdapter } from "./types";

import { Selector, AttributeSelector, PseudoSelector } from "css-what";

const checkAttrib = rules.equals;

function getAttribFunc(name: string, value: string) {
    const data: AttributeSelector = {
        type: "attribute",
        action: "equals",
        ignoreCase: false,
        name,
        value,
    };

    return function attribFunc(
        next: CompiledQuery,
        _rule: string,
        options: InternalOptions
    ): CompiledQuery {
        return checkAttrib(next, data, options);
    };
}

function getChildFunc(
    next: CompiledQuery,
    adapter: InternalAdapter
): CompiledQuery {
    return (elem) => !!adapter.getParent(elem) && next(elem);
}

export const filters = {
    contains(
        next: CompiledQuery,
        text: string,
        { adapter }: InternalOptions
    ): CompiledQuery {
        return function contains(elem) {
            return next(elem) && adapter.getText(elem).includes(text);
        };
    },
    icontains(
        next: CompiledQuery,
        text: string,
        { adapter }: InternalOptions
    ): CompiledQuery {
        const itext = text.toLowerCase();

        return function icontains(elem) {
            return (
                next(elem) &&
                adapter.getText(elem).toLowerCase().includes(itext)
            );
        };
    },

    //location specific methods
    "nth-child"(
        next: CompiledQuery,
        rule: string,
        { adapter }: InternalOptions
    ): CompiledQuery {
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
    "nth-last-child"(
        next: CompiledQuery,
        rule: string,
        { adapter }: InternalOptions
    ): CompiledQuery {
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
    "nth-of-type"(
        next: CompiledQuery,
        rule: string,
        { adapter }: InternalOptions
    ): CompiledQuery {
        const func = getNCheck(rule);

        if (func === falseFunc) return falseFunc;
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
    "nth-last-of-type"(
        next: CompiledQuery,
        rule: string,
        { adapter }: InternalOptions
    ): CompiledQuery {
        const func = getNCheck(rule);

        if (func === falseFunc) return falseFunc;
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
    root(
        next: CompiledQuery,
        _rule: string,
        { adapter }: InternalOptions
    ): CompiledQuery {
        return (elem) => !adapter.getParent(elem) && next(elem);
    },

    scope(
        next: CompiledQuery,
        rule: string,
        options: InternalOptions,
        context?: Array<Record<string, unknown>>
    ): CompiledQuery {
        const { adapter } = options;

        if (!context || context.length === 0) {
            //equivalent to :root
            return filters.root(next, rule, options);
        }

        function equals(
            a: Record<string, unknown>,
            b: Record<string, unknown>
        ) {
            if (typeof adapter.equals === "function")
                return adapter.equals(a, b);

            return a === b;
        }

        if (context.length === 1) {
            //NOTE: can't be unpacked, as :has uses this for side-effects
            return (elem) => equals(context[0], elem) && next(elem);
        }

        return (elem) => context.includes(elem) && next(elem);
    },

    //jQuery extensions (others follow as pseudos)
    checkbox: getAttribFunc("type", "checkbox"),
    file: getAttribFunc("type", "file"),
    password: getAttribFunc("type", "password"),
    radio: getAttribFunc("type", "radio"),
    reset: getAttribFunc("type", "reset"),
    image: getAttribFunc("type", "image"),
    submit: getAttribFunc("type", "submit"),

    // Added later on
    matches(
        _next: CompiledQuery,
        _token: Selector[][],
        _options: InternalOptions,
        _context?: Array<Record<string, unknown>>
    ): CompiledQuery {
        throw new Error("Unexpected state");
    },
    not(
        _next: CompiledQuery,
        _token: Selector[][],
        _options: InternalOptions,
        _context?: Array<Record<string, unknown>>
    ): CompiledQuery {
        throw new Error("Unexpected state");
    },
    has(
        _next: CompiledQuery,
        _token: Selector[][],
        _options: InternalOptions
    ): CompiledQuery {
        throw new Error("Unexpected state");
    },
};

//helper methods
function getFirstElement(
    elems: Array<Record<string, unknown>>,
    adapter: InternalAdapter
): Record<string, unknown> | null {
    for (let i = 0; elems && i < elems.length; i++) {
        if (adapter.isTag(elems[i])) return elems[i];
    }

    return null;
}

//while filters are precompiled, pseudos get called when they are needed
export const pseudos: Record<
    string,
    (elem: Record<string, unknown>, adapter: InternalAdapter) => boolean
> = {
    empty(elem, adapter) {
        return !adapter.getChildren(elem).some(
            (elem: Record<string, unknown>) =>
                // FIXME: `getText` call is potentially expensive.
                adapter.isTag(elem) || adapter.getText(elem) !== ""
        );
    },

    "first-child"(
        elem: Record<string, unknown>,
        adapter: InternalAdapter
    ): boolean {
        return getFirstElement(adapter.getSiblings(elem), adapter) === elem;
    },
    "last-child"(
        elem: Record<string, unknown>,
        adapter: InternalAdapter
    ): boolean {
        const siblings = adapter.getSiblings(elem);

        for (let i = siblings.length - 1; i >= 0; i--) {
            if (siblings[i] === elem) return true;
            if (adapter.isTag(siblings[i])) break;
        }

        return false;
    },
    "first-of-type"(
        elem: Record<string, unknown>,
        adapter: InternalAdapter
    ): boolean {
        const siblings = adapter.getSiblings(elem);

        for (let i = 0; i < siblings.length; i++) {
            if (adapter.isTag(siblings[i])) {
                if (siblings[i] === elem) return true;
                if (adapter.getName(siblings[i]) === adapter.getName(elem)) {
                    break;
                }
            }
        }

        return false;
    },
    "last-of-type"(
        elem: Record<string, unknown>,
        adapter: InternalAdapter
    ): boolean {
        const siblings = adapter.getSiblings(elem);

        for (let i = siblings.length - 1; i >= 0; i--) {
            if (adapter.isTag(siblings[i])) {
                if (siblings[i] === elem) return true;
                if (adapter.getName(siblings[i]) === adapter.getName(elem)) {
                    break;
                }
            }
        }

        return false;
    },
    "only-of-type"(
        elem: Record<string, unknown>,
        adapter: InternalAdapter
    ): boolean {
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
    "only-child"(
        elem: Record<string, unknown>,
        adapter: InternalAdapter
    ): boolean {
        const siblings = adapter.getSiblings(elem);

        for (let i = 0; i < siblings.length; i++) {
            if (adapter.isTag(siblings[i]) && siblings[i] !== elem) {
                return false;
            }
        }

        return true;
    },

    //:matches(a, area, link)[href]
    link(elem, adapter) {
        return adapter.hasAttrib(elem, "href");
    },
    visited: falseFunc, // Valid implementation
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
        return (
            adapter.getName(elem) === "input" &&
            adapter.getAttributeValue(elem, "type")?.toLowerCase() === "text"
        );
    },
};

function namePseudo(names: string[]) {
    if (typeof Set !== "undefined") {
        const nameSet = new Set(names);

        return (elem: Record<string, unknown>, adapter: InternalAdapter) =>
            nameSet.has(adapter.getName(elem));
    }

    return (elem: Record<string, unknown>, adapter: InternalAdapter) =>
        names.includes(adapter.getName(elem));
}

function verifyArgs(
    func: (
        elem: Record<string, unknown>,
        adapter: InternalAdapter,
        subselect?: Selector[]
    ) => boolean,
    name: string,
    subselect: Record<string, unknown> | string | null
) {
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
const reCSS3 = /^(?:(?:nth|last|first|only)-(?:child|of-type)|root|empty|(?:en|dis)abled|checked|not)$/;

export function compile(
    next: CompiledQuery,
    data: PseudoSelector,
    options: InternalOptions,
    context?: Array<Record<string, unknown>>
): CompiledQuery {
    const { name } = data;
    const subselect = data.data as string;
    const { adapter } = options;

    if (options.strict && !reCSS3.test(name)) {
        throw new Error(`:${name} isn't part of CSS3`);
    }

    // @ts-ignore
    const filter = filters[name];
    // @ts-ignore
    const pseudo = pseudos[name];
    if (typeof filter === "function") {
        return filter(next, subselect, options, context);
    } else if (typeof pseudo === "function") {
        verifyArgs(pseudo, name, subselect);

        return pseudo === falseFunc
            ? falseFunc
            : next === trueFunc
            ? (elem) => pseudo(elem, adapter, subselect)
            : (elem) => pseudo(elem, adapter, subselect) && next(elem);
    } else {
        throw new Error(`unmatched pseudo-class :${name}`);
    }
}
