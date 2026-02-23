import { type CompiledQuery, type InternalOptions } from "../types.js";
import { getElementParent } from "./querying.js";

/**
 * Some selectors such as `:contains` and (non-relative) `:has` will only be
 * able to match elements if their parents match the selector (as they contain
 * a subset of the elements that the parent contains).
 *
 * This function wraps the given `matches` function in a function that caches
 * the results of the parent elements, so that the `matches` function only
 * needs to be called once for each subtree.
 * @param next Matcher to run after this matcher succeeds.
 * @param options Configuration object for cache behavior.
 * @param options.adapter Adapter implementation used for DOM access.
 * @param options.cacheResults Whether results should be memoized by input root.
 * @param matches Compiled matcher function to wrap with caching.
 */
export function cacheParentResults<Node, ElementNode extends Node>(
    next: CompiledQuery<ElementNode>,
    { adapter, cacheResults }: InternalOptions<Node, ElementNode>,
    matches: (element: ElementNode) => boolean,
): CompiledQuery<ElementNode> {
    if (cacheResults === false || typeof WeakMap === "undefined") {
        return (element) => next(element) && matches(element);
    }

    // Use a cache to avoid re-checking children of an element.

    // @ts-expect-error `Node` is not extending object
    const resultCache = new WeakMap<Node, boolean>();

    function addResultToCache(element: ElementNode) {
        const result = matches(element);

        resultCache.set(element, result);
        return result;
    }

    return function cachedMatcher(element) {
        if (!next(element)) {
            return false;
        }
        if (resultCache.has(element)) {
            return resultCache.get(element) ?? false;
        }

        // Check all of the element's parents.
        let node = element;

        do {
            const parent = getElementParent(node, adapter);

            if (parent === null) {
                return addResultToCache(element);
            }

            node = parent;
        } while (!resultCache.has(node));

        return resultCache.get(node) ? addResultToCache(element) : false;
    };
}
