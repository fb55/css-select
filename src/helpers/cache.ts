import type { CompiledQuery, InternalOptions } from "../types.js";

/**
 * Some selectors such as `:contains` and (non-relative) `:has` will only be
 * able to match elements if their parents match the selector (as they contain
 * a subset of the elements that the parent contains).
 *
 * This function wraps the given `matches` function in a function that caches
 * the results of the parent elements, so that the `matches` function only
 * needs to be called once for each subtree.
 */
export function cacheParentResults<Node, ElementNode extends Node>(
    next: CompiledQuery<ElementNode>,
    { adapter, cacheResults }: InternalOptions<Node, ElementNode>,
    matches: (elem: ElementNode) => boolean
): CompiledQuery<ElementNode> {
    if (cacheResults === false || typeof WeakSet === "undefined") {
        return (elem) => next(elem) && matches(elem);
    }

    // Use a cache to avoid re-checking children of an element.

    // @ts-expect-error `Node` is not extending object
    const resultCache = new WeakMap<Node, boolean>();

    function addResultToCache(elem: ElementNode) {
        const result = matches(elem);

        resultCache.set(elem, result);
        return result;
    }

    return function cachedMatcher(elem) {
        if (!next(elem)) return false;
        if (resultCache.has(elem)) {
            return resultCache.get(elem)!;
        }

        // Check all of the element's parents.
        let node = elem;

        do {
            const parent = adapter.getParent(node);

            if (parent == null || !adapter.isTag(parent)) {
                return addResultToCache(elem);
            }

            node = parent;
        } while (!resultCache.has(node));

        return resultCache.get(node)! && addResultToCache(elem);
    };
}
