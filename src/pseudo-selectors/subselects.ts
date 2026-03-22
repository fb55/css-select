import * as boolbase from "boolbase";
import type { Selector } from "css-what";
import { cacheParentResults } from "../helpers/cache.js";
import { copyOptions } from "../helpers/options.js";
import { findOne, getNextSiblings } from "../helpers/querying.js";
import { includesScopePseudo, isTraversal } from "../helpers/selectors.js";
import type { CompiledQuery, CompileToken, InternalOptions } from "../types.js";

/** Used as a placeholder for :has. Will be replaced with the actual element. */
export const PLACEHOLDER_ELEMENT = {};

type Subselect = <Node, ElementNode extends Node>(
    next: CompiledQuery<ElementNode>,
    subselect: Selector[][],
    options: InternalOptions<Node, ElementNode>,
    context: Node[] | undefined,
    compileToken: CompileToken<Node, ElementNode>,
) => CompiledQuery<ElementNode>;

/**
 * Check if the selector has any properties that rely on the current element.
 * If not, we can cache the result of the selector.
 *
 * We can't cache selectors that start with a traversal (e.g. `>`, `+`, `~`),
 * or include a `:scope`.
 * @param selector - The selector to check.
 * @returns Whether the selector has any properties that rely on the current element.
 */
function hasDependsOnCurrentElement(selector: Selector[][]) {
    return selector.some(
        (sel) =>
            sel.length > 0 &&
            (isTraversal(sel[0]) || sel.some(includesScopePseudo)),
    );
}

const is: Subselect = (next, token, options, context, compileToken) => {
    const compiledToken = compileToken(token, copyOptions(options), context);

    return compiledToken === boolbase.trueFunc
        ? next
        : compiledToken === boolbase.falseFunc
          ? boolbase.falseFunc
          : (element) => compiledToken(element) && next(element);
};

/*
 * :not, :has, :is, :matches and :where have to compile selectors
 * doing this in src/pseudos.ts would lead to circular dependencies,
 * so we add them here
 */
/** Pseudo selectors that compile nested selectors. */
export const subselects: Record<string, Subselect> = {
    is,
    /**
     * `:matches` and `:where` are aliases for `:is`.
     */
    matches: is,
    where: is,
    not(next, token, options, context, compileToken) {
        const compiledToken = compileToken(
            token,
            copyOptions(options),
            context,
        );

        return compiledToken === boolbase.falseFunc
            ? next
            : compiledToken === boolbase.trueFunc
              ? boolbase.falseFunc
              : (element) => !compiledToken(element) && next(element);
    },
    has<Node, ElementNode extends Node>(
        next: CompiledQuery<ElementNode>,
        subselect: Selector[][],
        options: InternalOptions<Node, ElementNode>,
        _context: Node[] | undefined,
        compileToken: CompileToken<Node, ElementNode>,
    ): CompiledQuery<ElementNode> {
        const { adapter } = options;

        const copiedOptions = copyOptions(options);
        copiedOptions.relativeSelector = true;

        const context = subselect.some((s) => s.some(isTraversal))
            ? // Used as a placeholder. Will be replaced with the actual element.
              [PLACEHOLDER_ELEMENT as unknown as ElementNode]
            : undefined;
        const skipCache = hasDependsOnCurrentElement(subselect);

        const compiled = compileToken(subselect, copiedOptions, context);

        if (compiled === boolbase.falseFunc) {
            return boolbase.falseFunc;
        }

        // If `compiled` is `trueFunc`, we can skip this.
        if (context && compiled !== boolbase.trueFunc) {
            return skipCache
                ? (element) => {
                      if (!next(element)) {
                          return false;
                      }

                      context[0] = element;
                      const childs = adapter.getChildren(element);

                      return (
                          findOne(
                              compiled,
                              compiled.shouldTestNextSiblings
                                  ? [
                                        ...childs,
                                        ...getNextSiblings(element, adapter),
                                    ]
                                  : childs,
                              options,
                          ) !== null
                      );
                  }
                : cacheParentResults(next, options, (element) => {
                      context[0] = element;

                      return (
                          findOne(
                              compiled,
                              adapter.getChildren(element),
                              options,
                          ) !== null
                      );
                  });
        }

        const hasOne = (element: ElementNode) =>
            findOne(compiled, adapter.getChildren(element), options) !== null;

        return skipCache
            ? (element) => next(element) && hasOne(element)
            : cacheParentResults(next, options, hasOne);
    },
};
