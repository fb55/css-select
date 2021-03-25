import { PseudoSelector } from "css-what";
import type { InternalOptions } from "../types";

export type Pseudo = <Node, ElementNode extends Node>(
    elem: ElementNode,
    options: InternalOptions<Node, ElementNode>,
    subselect?: ElementNode | string | null
) => boolean;

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
};

export function verifyPseudoArgs(
    func: Pseudo,
    name: string,
    subselect: PseudoSelector["data"]
): void {
    if (subselect === null) {
        if (func.length > 2) {
            throw new Error(`pseudo-selector :${name} requires an argument`);
        }
    } else if (func.length === 2) {
        throw new Error(`pseudo-selector :${name} doesn't have any arguments`);
    }
}
