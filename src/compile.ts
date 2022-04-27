import { parse, Selector, SelectorType } from "css-what";
import boolbase from "boolbase";
import sortRules, { isTraversal } from "./sort.js";
import { compileGeneralSelector } from "./general.js";
import {
    ensureIsTag,
    PLACEHOLDER_ELEMENT,
} from "./pseudo-selectors/subselects.js";
import type {
    CompiledQuery,
    InternalOptions,
    InternalSelector,
} from "./types.js";

/**
 * Compiles a selector to an executable function.
 *
 * @param selector Selector to compile.
 * @param options Compilation options.
 * @param context Optional context for the selector.
 */
export function compile<Node, ElementNode extends Node>(
    selector: string | Selector[][],
    options: InternalOptions<Node, ElementNode>,
    context?: Node[] | Node
): CompiledQuery<Node> {
    const next = compileUnsafe(selector, options, context);
    return ensureIsTag(next, options.adapter);
}

export function compileUnsafe<Node, ElementNode extends Node>(
    selector: string | Selector[][],
    options: InternalOptions<Node, ElementNode>,
    context?: Node[] | Node
): CompiledQuery<ElementNode> {
    const token = typeof selector === "string" ? parse(selector) : selector;
    return compileToken<Node, ElementNode>(token, options, context);
}

function includesScopePseudo(t: InternalSelector): boolean {
    return (
        t.type === SelectorType.Pseudo &&
        (t.name === "scope" ||
            (Array.isArray(t.data) &&
                t.data.some((data) => data.some(includesScopePseudo))))
    );
}

const DESCENDANT_TOKEN: Selector = { type: SelectorType.Descendant };
const FLEXIBLE_DESCENDANT_TOKEN: InternalSelector = {
    type: "_flexibleDescendant",
};
const SCOPE_TOKEN: Selector = {
    type: SelectorType.Pseudo,
    name: "scope",
    data: null,
};

/*
 * CSS 4 Spec (Draft): 3.4.1. Absolutizing a Relative Selector
 * http://www.w3.org/TR/selectors4/#absolutizing
 */
function absolutize<Node, ElementNode extends Node>(
    token: InternalSelector[][],
    { adapter }: InternalOptions<Node, ElementNode>,
    context?: Node[]
) {
    // TODO Use better check if the context is a document
    const hasContext = !!context?.every((e) => {
        const parent = adapter.isTag(e) && adapter.getParent(e);
        return e === PLACEHOLDER_ELEMENT || (parent && adapter.isTag(parent));
    });

    for (const t of token) {
        if (
            t.length > 0 &&
            isTraversal(t[0]) &&
            t[0].type !== SelectorType.Descendant
        ) {
            // Don't continue in else branch
        } else if (hasContext && !t.some(includesScopePseudo)) {
            t.unshift(DESCENDANT_TOKEN);
        } else {
            continue;
        }

        t.unshift(SCOPE_TOKEN);
    }
}

export function compileToken<Node, ElementNode extends Node>(
    token: InternalSelector[][],
    options: InternalOptions<Node, ElementNode>,
    context?: Node[] | Node
): CompiledQuery<ElementNode> {
    token.forEach(sortRules);

    context = options.context ?? context;
    const isArrayContext = Array.isArray(context);

    const finalContext =
        context && (Array.isArray(context) ? context : [context]);

    // Check if the selector is relative
    if (options.relativeSelector !== false) {
        absolutize(token, options, finalContext);
    } else if (token.some((t) => t.length > 0 && isTraversal(t[0]))) {
        throw new Error(
            "Relative selectors are not allowed when the `relativeSelector` option is disabled"
        );
    }

    let shouldTestNextSiblings = false;

    const query = token
        .map((rules) => {
            if (rules.length >= 2) {
                const [first, second] = rules;

                if (
                    first.type !== SelectorType.Pseudo ||
                    first.name !== "scope"
                ) {
                    // Ignore
                } else if (
                    isArrayContext &&
                    second.type === SelectorType.Descendant
                ) {
                    rules[1] = FLEXIBLE_DESCENDANT_TOKEN;
                } else if (
                    second.type === SelectorType.Adjacent ||
                    second.type === SelectorType.Sibling
                ) {
                    shouldTestNextSiblings = true;
                }
            }

            return compileRules<Node, ElementNode>(
                rules,
                options,
                finalContext
            );
        })
        .reduce(reduceRules, boolbase.falseFunc);

    query.shouldTestNextSiblings = shouldTestNextSiblings;

    return query;
}

function compileRules<Node, ElementNode extends Node>(
    rules: InternalSelector[],
    options: InternalOptions<Node, ElementNode>,
    context?: Node[]
): CompiledQuery<ElementNode> {
    return rules.reduce<CompiledQuery<ElementNode>>(
        (previous, rule) =>
            previous === boolbase.falseFunc
                ? boolbase.falseFunc
                : compileGeneralSelector(
                      previous,
                      rule,
                      options,
                      context,
                      compileToken
                  ),
        options.rootFunc ?? boolbase.trueFunc
    );
}

function reduceRules<Node, ElementNode extends Node>(
    a: CompiledQuery<ElementNode>,
    b: CompiledQuery<ElementNode>
): CompiledQuery<ElementNode> {
    if (b === boolbase.falseFunc || a === boolbase.trueFunc) {
        return a;
    }
    if (a === boolbase.falseFunc || b === boolbase.trueFunc) {
        return b;
    }

    return function combine(elem) {
        return a(elem) || b(elem);
    };
}
