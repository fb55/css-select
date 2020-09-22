import { attributeRules } from "./attributes";
import { compile as pseudo } from "./pseudos";
import type { CompiledQuery, InternalOptions, InternalSelector } from "./types";

/*
 * All available rules
 */

export function compileGeneralSelector<Node, ElementNode extends Node>(
    next: CompiledQuery<ElementNode>,
    selector: InternalSelector,
    options: InternalOptions<Node, ElementNode>,
    context: ElementNode[] | undefined
): CompiledQuery<ElementNode> {
    const { adapter } = options;

    switch (selector.type) {
        case "pseudo-element":
            throw new Error("Pseudo-elements are not supported by css-select");

        case "attribute":
            if (
                options.strict &&
                (selector.ignoreCase || selector.action === "not")
            ) {
                throw new Error("Unsupported attribute selector");
            }

            return attributeRules[selector.action](next, selector, options);
        case "pseudo":
            return pseudo(next, selector, options, context);

        // Tags
        case "tag":
            return function tag(elem: ElementNode): boolean {
                return adapter.getName(elem) === selector.name && next(elem);
            };

        // Traversal
        case "descendant":
            if (typeof WeakSet === "undefined") {
                return function descendant(elem: ElementNode): boolean {
                    let current: ElementNode | null = elem;

                    while ((current = adapter.getParent(current))) {
                        if (next(current)) return true;
                    }

                    return false;
                };
            }

            // @ts-expect-error `ElementNode` is not extending object
            // eslint-disable-next-line no-case-declarations
            const isFalseCache = new WeakSet<ElementNode>();
            return function cachedDescendant(elem: ElementNode): boolean {
                let current: ElementNode | null = elem;

                while ((current = adapter.getParent(current))) {
                    if (!isFalseCache.has(elem)) {
                        if (next(current)) return true;
                        isFalseCache.add(current);
                    }
                }

                return false;
            };
        case "_flexibleDescendant":
            // Include element itself, only used while querying an array
            return function flexibleDescendant(elem: ElementNode): boolean {
                let found = next(elem);
                let current: ElementNode | null = elem;

                while (!found && (current = adapter.getParent(current))) {
                    found = next(elem);
                }

                return found;
            };

        case "parent":
            if (options.strict) {
                throw new Error("Parent selector isn't part of CSS3");
            }

            return function parent(elem: ElementNode): boolean {
                return adapter
                    .getChildren(elem)
                    .some((elem) => adapter.isTag(elem) && next(elem));
            };

        case "child":
            return function child(elem: ElementNode): boolean {
                const parent = adapter.getParent(elem);
                return !!parent && next(parent);
            };

        case "sibling":
            return function sibling(elem: ElementNode): boolean {
                const siblings = adapter.getSiblings(elem);

                for (let i = 0; i < siblings.length; i++) {
                    const currentSibling = siblings[i];
                    if (adapter.isTag(currentSibling)) {
                        if (currentSibling === elem) break;
                        if (next(currentSibling)) return true;
                    }
                }

                return false;
            };

        case "adjacent":
            return function adjacent(elem: ElementNode): boolean {
                const siblings = adapter.getSiblings(elem);
                let lastElement;

                for (let i = 0; i < siblings.length; i++) {
                    const currentSibling = siblings[i];
                    if (adapter.isTag(currentSibling)) {
                        if (currentSibling === elem) break;
                        lastElement = currentSibling;
                    }
                }

                return !!lastElement && next(lastElement);
            };

        case "universal":
            return next;
    }
}
