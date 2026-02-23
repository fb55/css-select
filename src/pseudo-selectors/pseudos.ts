import { type PseudoSelector } from "css-what";
import { type InternalOptions } from "../types.js";

type Pseudo = <Node, ElementNode extends Node>(
    element: ElementNode,
    options: InternalOptions<Node, ElementNode>,
    subselect?: string | null,
) => boolean;

/**
 * CSS limits the characters considered as whitespace to space, tab & line
 * feed. We add carriage returns as htmlparser2 doesn't normalize them to
 * line feeds.
 * @see {@link https://www.w3.org/TR/css-text-3/#white-space}
 */
const isDocumentWhiteSpace = /^[ \t\r\n]*$/;

// While filters are precompiled, pseudos get called when they are needed
/** Runtime pseudo selector implementations. */
export const pseudos: Record<string, Pseudo> = {
    empty(element, { adapter }) {
        const children = adapter.getChildren(element);
        return (
            // First, make sure the tag does not have any element children.
            children.every((element) => !adapter.isTag(element)) &&
            // Then, check that the text content is only whitespace.
            children.every((element) =>
                // FIXME: `getText` call is potentially expensive.
                isDocumentWhiteSpace.test(adapter.getText(element)),
            )
        );
    },

    "first-child"(element, { adapter, equals }) {
        if (adapter.prevElementSibling) {
            return adapter.prevElementSibling(element) == null;
        }

        const firstChild = adapter
            .getSiblings(element)
            .find((sibling) => adapter.isTag(sibling));
        return firstChild != null && equals(element, firstChild);
    },
    "last-child"(element, { adapter, equals }) {
        const siblings = adapter.getSiblings(element);

        for (let index = siblings.length - 1; index >= 0; index--) {
            if (equals(element, siblings[index])) {
                return true;
            }
            if (adapter.isTag(siblings[index])) {
                break;
            }
        }

        return false;
    },
    "first-of-type"(element, { adapter, equals }) {
        const siblings = adapter.getSiblings(element);
        const elementName = adapter.getName(element);

        for (const currentSibling of siblings) {
            if (equals(element, currentSibling)) {
                return true;
            }
            if (
                adapter.isTag(currentSibling) &&
                adapter.getName(currentSibling) === elementName
            ) {
                break;
            }
        }

        return false;
    },
    "last-of-type"(element, { adapter, equals }) {
        const siblings = adapter.getSiblings(element);
        const elementName = adapter.getName(element);

        for (let index = siblings.length - 1; index >= 0; index--) {
            const currentSibling = siblings[index];
            if (equals(element, currentSibling)) {
                return true;
            }
            if (
                adapter.isTag(currentSibling) &&
                adapter.getName(currentSibling) === elementName
            ) {
                break;
            }
        }

        return false;
    },
    "only-of-type"(element, { adapter, equals }) {
        const elementName = adapter.getName(element);

        return adapter
            .getSiblings(element)
            .every(
                (sibling) =>
                    equals(element, sibling) ||
                    !adapter.isTag(sibling) ||
                    adapter.getName(sibling) !== elementName,
            );
    },
    "only-child"(element, { adapter, equals }) {
        return adapter
            .getSiblings(element)
            .every(
                (sibling) =>
                    equals(element, sibling) || !adapter.isTag(sibling),
            );
    },
};

/**
 * Validate pseudo selector argument arity.
 * @param pseudoClassCondition Pseudo-function implementation to wrap.
 * @param name Name of the pseudo selector.
 * @param subselect Subselector passed to the pseudo-function.
 * @param argumentIndex Index of the argument parser to apply.
 */
export function verifyPseudoArguments<T extends Array<unknown>>(
    pseudoClassCondition: (...parameters: T) => boolean,
    name: string,
    subselect: PseudoSelector["data"],
    argumentIndex: number,
): void {
    if (subselect === null) {
        if (pseudoClassCondition.length > argumentIndex) {
            throw new Error(`Pseudo-class :${name} requires an argument`);
        }
    } else if (pseudoClassCondition.length === argumentIndex) {
        throw new Error(`Pseudo-class :${name} doesn't have any arguments`);
    }
}
