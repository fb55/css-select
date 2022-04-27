import type { Selector } from "css-what";
import boolbase from "boolbase";
import type {
    CompiledQuery,
    InternalOptions,
    CompileToken,
    Adapter,
} from "../types.js";
import { isTraversal } from "../sort.js";

/** Used as a placeholder for :has. Will be replaced with the actual element. */
export const PLACEHOLDER_ELEMENT = {};

export function ensureIsTag<Node, ElementNode extends Node>(
    next: CompiledQuery<ElementNode>,
    adapter: Adapter<Node, ElementNode>
): CompiledQuery<Node> {
    if (next === boolbase.falseFunc) return boolbase.falseFunc;
    return (elem: Node) => adapter.isTag(elem) && next(elem);
}

export type Subselect = <Node, ElementNode extends Node>(
    next: CompiledQuery<ElementNode>,
    subselect: Selector[][],
    options: InternalOptions<Node, ElementNode>,
    context: Node[] | undefined,
    compileToken: CompileToken<Node, ElementNode>
) => CompiledQuery<ElementNode>;

export function getNextSiblings<Node, ElementNode extends Node>(
    elem: Node,
    adapter: Adapter<Node, ElementNode>
): ElementNode[] {
    const siblings = adapter.getSiblings(elem);
    if (siblings.length <= 1) return [];
    const elemIndex = siblings.indexOf(elem);
    if (elemIndex < 0 || elemIndex === siblings.length - 1) return [];
    return siblings.slice(elemIndex + 1).filter(adapter.isTag);
}

function copyOptions<Node, ElementNode extends Node>(
    options: InternalOptions<Node, ElementNode>
): InternalOptions<Node, ElementNode> {
    // Not copied: context, rootFunc
    return {
        xmlMode: !!options.xmlMode,
        lowerCaseAttributeNames: !!options.lowerCaseAttributeNames,
        lowerCaseTags: !!options.lowerCaseTags,
        quirksMode: !!options.quirksMode,
        cacheResults: !!options.cacheResults,
        pseudos: options.pseudos,
        adapter: options.adapter,
        equals: options.equals,
    };
}

const is: Subselect = (next, token, options, context, compileToken) => {
    const func = compileToken(token, copyOptions(options), context);

    return func === boolbase.trueFunc
        ? next
        : func === boolbase.falseFunc
        ? boolbase.falseFunc
        : (elem) => func(elem) && next(elem);
};

/*
 * :not, :has, :is, :matches and :where have to compile selectors
 * doing this in src/pseudos.ts would lead to circular dependencies,
 * so we add them here
 */
export const subselects: Record<string, Subselect> = {
    is,
    /**
     * `:matches` and `:where` are aliases for `:is`.
     */
    matches: is,
    where: is,
    not(next, token, options, context, compileToken) {
        const func = compileToken(token, copyOptions(options), context);

        return func === boolbase.falseFunc
            ? next
            : func === boolbase.trueFunc
            ? boolbase.falseFunc
            : (elem) => !func(elem) && next(elem);
    },
    has<Node, ElementNode extends Node>(
        next: CompiledQuery<ElementNode>,
        subselect: Selector[][],
        options: InternalOptions<Node, ElementNode>,
        _context: Node[] | undefined,
        compileToken: CompileToken<Node, ElementNode>
    ): CompiledQuery<ElementNode> {
        const { adapter } = options;

        const opts = copyOptions(options);
        opts.relativeSelector = true;

        const context = subselect.some((s) => s.some(isTraversal))
            ? // Used as a placeholder. Will be replaced with the actual element.
              ([PLACEHOLDER_ELEMENT] as unknown as ElementNode[])
            : undefined;

        const compiled = compileToken(subselect, opts, context);

        if (compiled === boolbase.falseFunc) return boolbase.falseFunc;

        const hasElement = ensureIsTag(compiled, adapter);

        // If `compiled` is `trueFunc`, we can skip this.
        if (context && compiled !== boolbase.trueFunc) {
            /*
             * `shouldTestNextSiblings` will only be true if the query starts with
             * a traversal (sibling or adjacent). That means we will always have a context.
             */
            const { shouldTestNextSiblings = false } = compiled;

            return (elem) => {
                if (!next(elem)) return false;

                context[0] = elem;
                const childs = adapter.getChildren(elem);
                const nextElements = shouldTestNextSiblings
                    ? [...childs, ...getNextSiblings(elem, adapter)]
                    : childs;

                return adapter.existsOne(hasElement, nextElements);
            };
        }

        return (elem) =>
            next(elem) &&
            adapter.existsOne(hasElement, adapter.getChildren(elem));
    },
};
