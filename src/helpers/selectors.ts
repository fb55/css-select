import type { InternalSelector } from "../types.js";
import {
    AttributeAction,
    AttributeSelector,
    SelectorType,
    type Traversal,
} from "css-what";

export function isTraversal(token: InternalSelector): token is Traversal {
    switch (token.type) {
        case SelectorType.Descendant:
        case SelectorType.Child:
        case SelectorType.Parent:
        case SelectorType.Sibling:
        case SelectorType.Adjacent:
        case SelectorType.ColumnCombinator:
        case "_flexibleDescendant": {
            return true;
        }
        case SelectorType.Attribute:
        case SelectorType.Pseudo:
        case SelectorType.Tag:
        case SelectorType.Universal:
        case SelectorType.PseudoElement: {
            return false;
        }
    }
}

/**
 * Sort the parts of the passed selector,
 * as there is potential for optimization
 * (some types of selectors are faster than others)
 *
 * @param arr Selector to sort
 */
export function sortRules(arr: InternalSelector[]): void {
    const procs = arr.map(getProcedure);
    for (let i = 1; i < arr.length; i++) {
        const procNew = procs[i];

        if (procNew < 0) continue;

        for (let j = i - 1; j >= 0 && procNew < procs[j]; j--) {
            const token = arr[j + 1];
            arr[j + 1] = arr[j];
            arr[j] = token;
            procs[j + 1] = procs[j];
            procs[j] = procNew;
        }
    }
}

function getAttributeProcedure(token: AttributeSelector): number {
    switch (token.action) {
        case AttributeAction.Exists: {
            return 10;
        }
        case AttributeAction.Equals: {
            // Prefer ID selectors (eg. #ID)
            return token.name === "id" ? 9 : 8;
        }
        case AttributeAction.Not: {
            return 7;
        }
        case AttributeAction.Start: {
            return 6;
        }
        case AttributeAction.End: {
            return 6;
        }
        case AttributeAction.Any: {
            return 5;
        }
        case AttributeAction.Hyphen: {
            return 4;
        }
        case AttributeAction.Element: {
            return 3;
        }
    }
}

function getProcedure(token: InternalSelector): number {
    switch (token.type) {
        case SelectorType.Universal: {
            return 50;
        }
        case SelectorType.Tag: {
            return 30;
        }
        case SelectorType.Attribute: {
            const proc = getAttributeProcedure(token);

            // `ignoreCase` adds some overhead, half the result if applicable.
            return token.ignoreCase ? Math.floor(proc / 2) : proc;
        }
        case SelectorType.Pseudo: {
            if (!token.data) {
                return 3;
            }

            if (
                token.name === "has" ||
                token.name === "contains" ||
                token.name === "icontains"
            ) {
                return 0; // Expensive in any case — run as late as possible.
            }

            // Eg. `:is`, `:not`
            if (Array.isArray(token.data)) {
                // If we have traversals, try to avoid executing this selector
                return Math.max(
                    0,
                    Math.min(
                        ...token.data.map((d) =>
                            Math.min(...d.map(getProcedure))
                        )
                    )
                );
            }

            return 2;
        }
        default: {
            return -1;
        }
    }
}
