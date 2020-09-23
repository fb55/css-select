import { PseudoSelector } from "css-what";
import type { Adapter } from "../types";

export type Pseudo = <Node, ElementNode extends Node>(
    elem: ElementNode,
    adapter: Adapter<Node, ElementNode>,
    subselect?: ElementNode | string | null
) => boolean;

const isLinkTag = namePseudo(["a", "area", "link"]);

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
        const elemName = adapter.getName(elem);

        for (let i = 0; i < siblings.length; i++) {
            const currentSibling = siblings[i];
            if (currentSibling === elem) return true;
            if (
                adapter.isTag(currentSibling) &&
                adapter.getName(currentSibling) === elemName
            ) {
                break;
            }
        }

        return false;
    },
    "last-of-type"(elem, adapter) {
        const siblings = adapter.getSiblings(elem);
        const elemName = adapter.getName(elem);

        for (let i = siblings.length - 1; i >= 0; i--) {
            const currentSibling = siblings[i];
            if (currentSibling === elem) return true;
            if (
                adapter.isTag(currentSibling) &&
                adapter.getName(currentSibling) === elemName
            ) {
                break;
            }
        }

        return false;
    },
    "only-of-type"(elem, adapter) {
        const elemName = adapter.getName(elem);

        return adapter
            .getSiblings(elem)
            .every(
                (sibling) =>
                    sibling === elem ||
                    !adapter.isTag(sibling) ||
                    adapter.getName(sibling) !== elemName
            );
    },
    "only-child"(elem, adapter) {
        return adapter
            .getSiblings(elem)
            .every((sibling) => sibling === elem || !adapter.isTag(sibling));
    },

    // :matches(a, area, link)[href]
    "any-link"(elem, adapter) {
        return isLinkTag(elem, adapter) && adapter.hasAttrib(elem, "href");
    },
    // :any-link:not(:visited)
    link(elem, adapter) {
        return (
            adapter.isVisited?.(elem) !== true &&
            pseudos["any-link"](elem, adapter)
        );
    },

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

        return (elem, adapter) => nameSet.has(adapter.getName(elem));
    }

    return (elem, adapter) => names.includes(adapter.getName(elem));
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
