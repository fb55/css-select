import { PseudoSelector } from "css-what";
import type { InternalOptions } from "../types";

export type Pseudo = <Node, ElementNode extends Node>(
    elem: ElementNode,
    options: InternalOptions<Node, ElementNode>,
    subselect?: ElementNode | string | null
) => boolean;

const isLinkTag = namePseudo(["a", "area", "link"]);

// While filters are precompiled, pseudos get called when they are needed
export const pseudos: Record<string, Pseudo> = {
    empty(elem, { adapter }) {
        return !adapter.getChildren(elem).some(
            (elem) =>
                // FIXME: `getText` call is potentially expensive.
                adapter.isTag(elem) || adapter.getText(elem) !== ""
        );
    },

    "first-child"(elem, { adapter, equals }) {
        const firstChild = adapter
            .getSiblings(elem)
            .find((elem) => adapter.isTag(elem));
        return firstChild != null && equals(elem, firstChild);
    },
    "last-child"(elem, { adapter, equals }) {
        const siblings = adapter.getSiblings(elem);

        for (let i = siblings.length - 1; i >= 0; i--) {
            if (equals(elem, siblings[i])) return true;
            if (adapter.isTag(siblings[i])) break;
        }

        return false;
    },
    "first-of-type"(elem, { adapter, equals }) {
        const siblings = adapter.getSiblings(elem);
        const elemName = adapter.getName(elem);

        for (let i = 0; i < siblings.length; i++) {
            const currentSibling = siblings[i];
            if (equals(elem, currentSibling)) return true;
            if (
                adapter.isTag(currentSibling) &&
                adapter.getName(currentSibling) === elemName
            ) {
                break;
            }
        }

        return false;
    },
    "last-of-type"(elem, { adapter, equals }) {
        const siblings = adapter.getSiblings(elem);
        const elemName = adapter.getName(elem);

        for (let i = siblings.length - 1; i >= 0; i--) {
            const currentSibling = siblings[i];
            if (equals(elem, currentSibling)) return true;
            if (
                adapter.isTag(currentSibling) &&
                adapter.getName(currentSibling) === elemName
            ) {
                break;
            }
        }

        return false;
    },
    "only-of-type"(elem, { adapter, equals }) {
        const elemName = adapter.getName(elem);

        return adapter
            .getSiblings(elem)
            .every(
                (sibling) =>
                    equals(elem, sibling) ||
                    !adapter.isTag(sibling) ||
                    adapter.getName(sibling) !== elemName
            );
    },
    "only-child"(elem, { adapter, equals }) {
        return adapter
            .getSiblings(elem)
            .every(
                (sibling) => equals(elem, sibling) || !adapter.isTag(sibling)
            );
    },

    // :is(a, area, link)[href]
    "any-link"(elem, options) {
        return (
            isLinkTag(elem, options) && options.adapter.hasAttrib(elem, "href")
        );
    },
    // :any-link:not(:visited)
    link(elem, options) {
        return (
            options.adapter.isVisited?.(elem) !== true &&
            pseudos["any-link"](elem, options)
        );
    },

    /*
     * Forms
     * to consider: :target
     */

    // :is([selected], select:not([multiple]):not(> option[selected]) > option:first-of-type)
    selected(elem, { adapter, equals }) {
        if (adapter.hasAttrib(elem, "selected")) return true;
        else if (adapter.getName(elem) !== "option") return false;

        // The first <option> in a <select> is also selected
        const parent = adapter.getParent(elem);

        if (
            !parent ||
            !adapter.isTag(parent) ||
            adapter.getName(parent) !== "select" ||
            adapter.hasAttrib(parent, "multiple")
        ) {
            return false;
        }

        const siblings = adapter.getChildren(parent);
        let sawElem = false;

        for (let i = 0; i < siblings.length; i++) {
            const currentSibling = siblings[i];
            if (adapter.isTag(currentSibling)) {
                if (equals(elem, currentSibling)) {
                    sawElem = true;
                } else if (!sawElem) {
                    return false;
                } else if (adapter.hasAttrib(currentSibling, "selected")) {
                    return false;
                }
            }
        }

        return sawElem;
    },
    /*
     * https://html.spec.whatwg.org/multipage/scripting.html#disabled-elements
     * :is(
     *   :is(button, input, select, textarea, optgroup, option)[disabled],
     *   optgroup[disabled] > option,
     *   fieldset[disabled] :not(fieldset[disabled] legend:first-child *)
     * )
     */
    disabled(elem, { adapter }) {
        return adapter.hasAttrib(elem, "disabled");
    },
    enabled(elem, { adapter }) {
        return !adapter.hasAttrib(elem, "disabled");
    },
    // :is(:is(input[type=radio], input[type=checkbox])[checked], option:selected)
    checked(elem, options) {
        return (
            options.adapter.hasAttrib(elem, "checked") ||
            pseudos.selected(elem, options)
        );
    },
    // :is(input, select, textarea)[required]
    required(elem, { adapter }) {
        return adapter.hasAttrib(elem, "required");
    },
    // :is(input, select, textarea):not([required])
    optional(elem, { adapter }) {
        return !adapter.hasAttrib(elem, "required");
    },

    // JQuery extensions

    // :not(:empty)
    parent(elem, options) {
        return !pseudos.empty(elem, options);
    },
    // :is(h1, h2, h3, h4, h5, h6)
    header: namePseudo(["h1", "h2", "h3", "h4", "h5", "h6"]),

    // :is(button, input[type=button])
    button(elem, { adapter }) {
        const name = adapter.getName(elem);
        return (
            name === "button" ||
            (name === "input" &&
                adapter.getAttributeValue(elem, "type") === "button")
        );
    },
    // :is(input, textarea, select, button)
    input: namePseudo(["input", "textarea", "select", "button"]),
    // `input:is([type=''], [type=text])`
    text(elem, { adapter }) {
        const type = adapter.getAttributeValue(elem, "type");
        return (
            adapter.getName(elem) === "input" &&
            (!type || type.toLowerCase() === "text")
        );
    },
};

function namePseudo(names: string[]): Pseudo {
    if (typeof Set !== "undefined") {
        const nameSet = new Set(names);

        return (elem, { adapter }) => nameSet.has(adapter.getName(elem));
    }

    return (elem, { adapter }) => names.includes(adapter.getName(elem));
}

export function verifyPseudoArgs(
    func: Pseudo,
    name: string,
    subselect: PseudoSelector["data"]
): void {
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
