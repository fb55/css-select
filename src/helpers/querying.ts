import type { Adapter, InternalOptions, Predicate } from "../types.js";

/**
 * Find all elements matching the query. If not in XML mode, the query will ignore
 * the contents of `<template>` elements.
 * @param query - Function that returns true if the element matches the query.
 * @param nodes - Nodes to query. If a node is an element, its children will be queried.
 * @param options - Options for querying the document.
 * @returns All matching elements.
 */
export function findAll<Node, ElementNode extends Node>(
    query: Predicate<ElementNode>,
    nodes: Node[],
    options: InternalOptions<Node, ElementNode>,
): ElementNode[] {
    const { adapter, xmlMode = false } = options;
    const result: ElementNode[] = [];
    /** Stack of the parent arrays we will return to. */
    const nodeStack: Node[][] = [];
    /** Stack of the indices to resume at within the parent arrays. */
    const indexStack: number[] = [];
    /** The array we are currently looking at. */
    let currentNodes = nodes;
    /** The index of the next node within `currentNodes`. */
    let currentIndex = 0;

    for (;;) {
        // First, check if the current array has any more elements to look at.
        if (currentIndex >= currentNodes.length) {
            // If we have no more arrays to look at, we are done.
            if (nodeStack.length === 0) {
                return result;
            }

            // biome-ignore lint/style/noNonNullAssertion: The stack is not empty.
            currentNodes = nodeStack.pop()!;
            // biome-ignore lint/style/noNonNullAssertion: The stack is not empty.
            currentIndex = indexStack.pop()!;

            // Loop back to the start to continue with the next array.
            continue;
        }

        const element = currentNodes[currentIndex++];

        if (!adapter.isTag(element)) {
            continue;
        }
        if (query(element)) {
            result.push(element);
        }

        if (xmlMode || adapter.getName(element) !== "template") {
            /*
             * Add the children to the stack. We are depth-first, so this is
             * the next array we look at.
             */
            const children = adapter.getChildren(element);

            if (children.length > 0) {
                nodeStack.push(currentNodes);
                indexStack.push(currentIndex);
                currentNodes = children;
                currentIndex = 0;
            }
        }
    }
}

/**
 * Find the first element matching the query. If not in XML mode, the query will ignore
 * the contents of `<template>` elements.
 * @param query - Function that returns true if the element matches the query.
 * @param nodes - Nodes to query. If a node is an element, its children will be queried.
 * @param options - Options for querying the document.
 * @returns The first matching element, or null if there was no match.
 */
export function findOne<Node, ElementNode extends Node>(
    query: Predicate<ElementNode>,
    nodes: Node[],
    options: InternalOptions<Node, ElementNode>,
): ElementNode | null {
    const { adapter, xmlMode = false } = options;
    /** Stack of the parent arrays we will return to. */
    const nodeStack: Node[][] = [];
    /** Stack of the indices to resume at within the parent arrays. */
    const indexStack: number[] = [];
    /** The array we are currently looking at. */
    let currentNodes = nodes;
    /** The index of the next node within `currentNodes`. */
    let currentIndex = 0;

    for (;;) {
        // First, check if the current array has any more elements to look at.
        if (currentIndex >= currentNodes.length) {
            // If we have no more arrays to look at, we are done.
            if (nodeStack.length === 0) {
                return null;
            }

            // biome-ignore lint/style/noNonNullAssertion: The stack is not empty.
            currentNodes = nodeStack.pop()!;
            // biome-ignore lint/style/noNonNullAssertion: The stack is not empty.
            currentIndex = indexStack.pop()!;

            // Loop back to the start to continue with the next array.
            continue;
        }

        const element = currentNodes[currentIndex++];

        if (!adapter.isTag(element)) {
            continue;
        }
        if (query(element)) {
            return element;
        }

        if (xmlMode || adapter.getName(element) !== "template") {
            /*
             * Add the children to the stack. We are depth-first, so this is
             * the next array we look at.
             */
            const children = adapter.getChildren(element);

            if (children.length > 0) {
                nodeStack.push(currentNodes);
                indexStack.push(currentIndex);
                currentNodes = children;
                currentIndex = 0;
            }
        }
    }
}

/**
 * Get all element siblings after the provided node.
 * @param element Element candidate being tested.
 * @param adapter Adapter implementation used for DOM operations.
 */
export function getNextSiblings<Node, ElementNode extends Node>(
    element: Node,
    adapter: Adapter<Node, ElementNode>,
): ElementNode[] {
    const siblings = adapter.getSiblings(element);
    if (siblings.length <= 1) {
        return [];
    }
    const elementIndex = siblings.indexOf(element);
    if (elementIndex === -1 || elementIndex === siblings.length - 1) {
        return [];
    }
    return siblings.slice(elementIndex + 1).filter(adapter.isTag);
}

/**
 * Get the parent element of a node.
 * @param node Node to inspect.
 * @param adapter Adapter implementation used for DOM operations.
 */
export function getElementParent<Node, ElementNode extends Node>(
    node: ElementNode,
    adapter: Adapter<Node, ElementNode>,
): ElementNode | null {
    const parent = adapter.getParent(node);
    return parent != null && adapter.isTag(parent) ? parent : null;
}
