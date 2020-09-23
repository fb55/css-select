import { PseudoSelector } from "css-what";
import { falseFunc } from "boolbase";
import type { Adapter } from "../types";

export type Pseudo = <Node, ElementNode extends Node>(
    elem: ElementNode,
    adapter: Adapter<Node, ElementNode>,
    subselect?: ElementNode | string | null
) => boolean;

// While filters are precompiled, pseudos get called when they are needed
export const pseudos: Record<string, Pseudo> = {
    empty(elem, adapter) {
        return !adapter.getChildren(elem).some(
            (elem) =>
                // FIXME: `getText` call is potentially expensive.
                adapter.isTag(elem) || adapter.getText(elem) !== ""
        );
    },

    "first-child"(elem, adapter) {
        return (
            adapter.getSiblings(elem).find((elem) => adapter.isTag(elem)) ===
            elem
        );
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
            const currentSibling = siblings[i];
            if (adapter.isTag(currentSibling)) {
                if (siblings[i] === elem) return true;
                if (adapter.getName(currentSibling) === adapter.getName(elem)) {
                    break;
                }
            }
        }

        return false;
    },
    "last-of-type"(elem, adapter) {
        const siblings = adapter.getSiblings(elem);

        for (let i = siblings.length - 1; i >= 0; i--) {
            const currentSibling = siblings[i];
            if (adapter.isTag(currentSibling)) {
                if (siblings[i] === elem) return true;
                if (adapter.getName(currentSibling) === adapter.getName(elem)) {
                    break;
                }
            }
        }

        return false;
    },
    "only-of-type"(elem, adapter) {
        const siblings = adapter.getSiblings(elem);

        for (let i = 0, j = siblings.length; i < j; i++) {
            const currentSibling = siblings[i];
            if (adapter.isTag(currentSibling)) {
                if (currentSibling === elem) continue;
                if (adapter.getName(currentSibling) === adapter.getName(elem)) {
                    return false;
                }
            }
        }

        return true;
    },
    "only-child"(elem, adapter) {
        const siblings = adapter.getSiblings(elem);

        for (let i = 0; i < siblings.length; i++) {
            if (adapter.isTag(siblings[i]) && siblings[i] !== elem) {
                return false;
            }
        }

        return true;
    },

    // :matches(a, area, link)[href]
    link(elem, adapter) {
        return adapter.hasAttrib(elem, "href");
    },
    visited: falseFunc, // Valid implementation
    // TODO: :any-link once the name is finalized (as an alias of :link)

    /*
     * Forms
     * to consider: :target
     */

    // :matches([selected], select:not([multiple]):not(> option[selected]) > option:first-of-type)
    selected(elem, adapter) {
        if (adapter.hasAttrib(elem, "selected")) return true;
        else if (adapter.getName(elem) !== "option") return false;

        // The first <option> in a <select> is also selected
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
            const currentSibling = siblings[i];
            if (adapter.isTag(currentSibling)) {
                if (currentSibling === elem) {
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
     * :matches(
     *   :matches(button, input, select, textarea, menuitem, optgroup, option)[disabled],
     *   optgroup[disabled] > option),
     *  fieldset[disabled] * //TODO not child of first <legend>
     * )
     */
    disabled(elem, adapter) {
        return adapter.hasAttrib(elem, "disabled");
    },
    enabled(elem, adapter) {
        return !adapter.hasAttrib(elem, "disabled");
    },
    // :matches(:matches(:radio, :checkbox)[checked], :selected) (TODO menuitem)
    checked(elem, adapter) {
        return (
            adapter.hasAttrib(elem, "checked") ||
            pseudos.selected(elem, adapter)
        );
    },
    // :matches(input, select, textarea)[required]
    required(elem, adapter) {
        return adapter.hasAttrib(elem, "required");
    },
    // :matches(input, select, textarea):not([required])
    optional(elem, adapter) {
        return !adapter.hasAttrib(elem, "required");
    },

    // JQuery extensions

    // :not(:empty)
    parent(elem, adapter) {
        return !pseudos.empty(elem, adapter);
    },
    // :matches(h1, h2, h3, h4, h5, h6)
    header: namePseudo(["h1", "h2", "h3", "h4", "h5", "h6"]),

    // :matches(button, input[type=button])
    button(elem, adapter) {
        const name = adapter.getName(elem);
        return (
            name === "button" ||
            (name === "input" &&
                adapter.getAttributeValue(elem, "type") === "button")
        );
    },
    // :matches(input, textarea, select, button)
    input: namePseudo(["input", "textarea", "select", "button"]),
    // `input:matches(:not([type!='']), [type='text' i])`
    text(elem, adapter) {
        return (
            adapter.getName(elem) === "input" &&
            adapter.getAttributeValue(elem, "type")?.toLowerCase() === "text"
        );
    },
};

function namePseudo<Node, ElementNode extends Node>(names: string[]) {
    if (typeof Set !== "undefined") {
        const nameSet = new Set(names);

        return (elem: ElementNode, adapter: Adapter<Node, ElementNode>) =>
            nameSet.has(adapter.getName(elem));
    }

    return (elem: ElementNode, adapter: Adapter<Node, ElementNode>) =>
        names.includes(adapter.getName(elem));
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
