import type { InternalOptions, Predicate, Adapter } from "../types.js";

/**
 * Find all elements matching the query. If not in XML mode, the query will ignore
 * the contents of `<template>` elements.
 *
 *
 * @param query - Function that returns true if the element matches the query.
 * @param elems - Nodes to query. If a node is an element, its children will be queried.
 * @param options - Options for querying the document.
 * @returns All matching elements.
 */
export function findAll<Node, ElementNode extends Node>(
    query: Predicate<ElementNode>,
    elems: Node[],
    options: InternalOptions<Node, ElementNode>,
): ElementNode[] {
    const { adapter, xmlMode = false } = options;
    const result: ElementNode[] = [];
    const stack = elems.filter(adapter.isTag);

    let elem;
    while ((elem = stack.shift())) {
        if (xmlMode || adapter.getName(elem) !== "template") {
            const children = adapter.getChildren(elem).filter(adapter.isTag);

            if (children.length > 0) {
                stack.unshift(...children);
            }
        }

        if (query(elem)) result.push(elem);
    }

    return result;
}

/**
 * Find the first element matching the query. If not in XML mode, the query will ignore
 * the contents of `<template>` elements.
 *
 *
 * @param query - Function that returns true if the element matches the query.
 * @param elems - Nodes to query. If a node is an element, its children will be queried.
 * @param options - Options for querying the document.
 * @returns The first matching element, or null if there was no match.
 */
export function findOne<Node, ElementNode extends Node>(
    query: Predicate<ElementNode>,
    elems: Node[],
    options: InternalOptions<Node, ElementNode>,
): ElementNode | null {
    const { adapter, xmlMode = false } = options;
    const stack = elems.filter(adapter.isTag);

    let elem;
    while ((elem = stack.shift())) {
        if (xmlMode || adapter.getName(elem) !== "template") {
            const children = adapter.getChildren(elem).filter(adapter.isTag);

            if (children.length > 0) {
                stack.unshift(...children);
            }
        }

        if (query(elem)) return elem;
    }

    return null;
}

export function getNextSiblings<Node, ElementNode extends Node>(
    elem: Node,
    adapter: Adapter<Node, ElementNode>,
): ElementNode[] {
    const siblings = adapter.getSiblings(elem);
    if (siblings.length <= 1) return [];
    const elemIndex = siblings.indexOf(elem);
    if (elemIndex < 0 || elemIndex === siblings.length - 1) return [];
    return siblings.slice(elemIndex + 1).filter(adapter.isTag);
}

export function getElementParent<Node, ElementNode extends Node>(
    node: ElementNode,
    adapter: Adapter<Node, ElementNode>,
): ElementNode | null {
    const parent = adapter.getParent(node);
    return parent != null && adapter.isTag(parent) ? parent : null;
}
