import * as boolbase from "boolbase";
import getNCheck from "nth-check";
import { cacheParentResults } from "../helpers/cache.js";
import { getElementParent } from "../helpers/querying.js";
import type { CompiledQuery, InternalOptions } from "../types.js";

/**
 * RFC 4647 extended filtering with pre-split subtags.
 * @param tag - Lowercased subtags of the element's language value.
 * @param range - Lowercased subtags of the language range to match against.
 */
function extendedFilter(tag: string[], range: string[]): boolean {
    if (range[0] !== "*" && range[0] !== tag[0]) return false;

    let tagIndex = 1;

    for (let rangeIndex = 1; rangeIndex < range.length; rangeIndex++) {
        if (range[rangeIndex] === "*") continue;

        // Skip non-singleton tag subtags until we find a match.
        while (tagIndex < tag.length && tag[tagIndex] !== range[rangeIndex]) {
            if (tag[tagIndex++].length <= 1) return false;
        }

        if (tagIndex >= tag.length) return false;
        tagIndex++;
    }

    return true;
}

type Filter = <Node, ElementNode extends Node>(
    next: CompiledQuery<ElementNode>,
    text: string,
    options: InternalOptions<Node, ElementNode>,
    context?: Node[],
) => CompiledQuery<ElementNode>;

/**
 * Pre-compiled pseudo filters.
 */
export const filters: Record<string, Filter> = {
    contains(next, text, options) {
        const { getText } = options.adapter;

        return cacheParentResults(next, options, (element) =>
            getText(element).includes(text),
        );
    },
    icontains(next, text, options) {
        const itext = text.toLowerCase();
        const { getText } = options.adapter;

        return cacheParentResults(next, options, (element) =>
            getText(element).toLowerCase().includes(itext),
        );
    },

    // Location specific methods
    "nth-child"(next, rule, { adapter, equals }) {
        const nthCheck = getNCheck(rule);

        if (nthCheck === boolbase.falseFunc) {
            return boolbase.falseFunc;
        }
        if (nthCheck === boolbase.trueFunc) {
            return (element) =>
                getElementParent(element, adapter) !== null && next(element);
        }

        return function nthChild(element) {
            const siblings = adapter.getSiblings(element);
            let pos = 0;

            for (const sibling of siblings) {
                if (equals(element, sibling)) {
                    break;
                }
                if (adapter.isTag(sibling)) {
                    pos++;
                }
            }

            return nthCheck(pos) && next(element);
        };
    },
    "nth-last-child"(next, rule, { adapter, equals }) {
        const nthCheck = getNCheck(rule);

        if (nthCheck === boolbase.falseFunc) {
            return boolbase.falseFunc;
        }
        if (nthCheck === boolbase.trueFunc) {
            return (element) =>
                getElementParent(element, adapter) !== null && next(element);
        }

        return function nthLastChild(element) {
            const siblings = adapter.getSiblings(element);
            let pos = 0;

            for (let index = siblings.length - 1; index >= 0; index--) {
                if (equals(element, siblings[index])) {
                    break;
                }
                if (adapter.isTag(siblings[index])) {
                    pos++;
                }
            }

            return nthCheck(pos) && next(element);
        };
    },
    "nth-of-type"(next, rule, { adapter, equals }) {
        const nthCheck = getNCheck(rule);

        if (nthCheck === boolbase.falseFunc) {
            return boolbase.falseFunc;
        }
        if (nthCheck === boolbase.trueFunc) {
            return (element) =>
                getElementParent(element, adapter) !== null && next(element);
        }

        return function nthOfType(element) {
            const siblings = adapter.getSiblings(element);
            let pos = 0;

            for (const currentSibling of siblings) {
                if (equals(element, currentSibling)) {
                    break;
                }
                if (
                    adapter.isTag(currentSibling) &&
                    adapter.getName(currentSibling) === adapter.getName(element)
                ) {
                    pos++;
                }
            }

            return nthCheck(pos) && next(element);
        };
    },
    "nth-last-of-type"(next, rule, { adapter, equals }) {
        const nthCheck = getNCheck(rule);

        if (nthCheck === boolbase.falseFunc) {
            return boolbase.falseFunc;
        }
        if (nthCheck === boolbase.trueFunc) {
            return (element) =>
                getElementParent(element, adapter) !== null && next(element);
        }

        return function nthLastOfType(element) {
            const siblings = adapter.getSiblings(element);
            let pos = 0;

            for (let index = siblings.length - 1; index >= 0; index--) {
                const currentSibling = siblings[index];
                if (equals(element, currentSibling)) {
                    break;
                }
                if (
                    adapter.isTag(currentSibling) &&
                    adapter.getName(currentSibling) === adapter.getName(element)
                ) {
                    pos++;
                }
            }

            return nthCheck(pos) && next(element);
        };
    },

    // TODO determine the actual root element
    root(next, _rule, { adapter }) {
        return (element) =>
            getElementParent(element, adapter) === null && next(element);
    },

    scope<Node, ElementNode extends Node>(
        next: CompiledQuery<ElementNode>,
        rule: string,
        options: InternalOptions<Node, ElementNode>,
        context?: Node[],
    ): CompiledQuery<ElementNode> {
        const { equals } = options;

        if (!context || context.length === 0) {
            // Equivalent to :root
            return filters["root"](next, rule, options);
        }

        if (context.length === 1) {
            // NOTE: can't be unpacked, as :has uses this for side-effects
            return (element) => equals(context[0], element) && next(element);
        }

        return (element) => context.includes(element) && next(element);
    },

    lang(next, code, { adapter }) {
        const ranges = code
            .split(",")
            .map((r) => r.trim())
            .filter((r) => r.length > 0)
            .map((r) =>
                r
                    .replace(/^['"]|['"]$/g, "")
                    .toLowerCase()
                    .split("-"),
            );

        return function lang(element) {
            let node: typeof element | null = element;

            while (node != null) {
                const value =
                    adapter.getAttributeValue(node, "xml:lang") ??
                    adapter.getAttributeValue(node, "lang");

                if (value != null) {
                    if (!value) {
                        return ranges.some((r) => r[0] === "") && next(element);
                    }

                    const tag = value.toLowerCase().split("-");
                    return (
                        ranges.some((r) => extendedFilter(tag, r)) &&
                        next(element)
                    );
                }

                const parent = adapter.getParent(node);
                node =
                    parent != null && adapter.isTag(parent)
                        ? (parent as typeof element)
                        : null;
            }

            return ranges.some((r) => r[0] === "") && next(element);
        };
    },

    hover: dynamicStatePseudo("isHovered"),
    visited: dynamicStatePseudo("isVisited"),
    active: dynamicStatePseudo("isActive"),
};

/**
 * Dynamic state pseudos. These depend on optional Adapter methods.
 * @param name The name of the adapter method to call.
 * @returns Pseudo for the `filters` object.
 */
function dynamicStatePseudo(
    name: "isHovered" | "isVisited" | "isActive",
): Filter {
    return function dynamicPseudo(next, _rule, { adapter }) {
        const filterFunction = adapter[name];

        if (typeof filterFunction !== "function") {
            return boolbase.falseFunc;
        }

        return function active(element) {
            return filterFunction(element) && next(element);
        };
    };
}
