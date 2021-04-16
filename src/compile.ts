import { InternalSelector } from "./types";
import { parse, Selector } from "css-what";
import { trueFunc, falseFunc } from "boolbase";
import sortRules from "./sort";
import { isTraversal } from "./procedure";
import { compileGeneralSelector } from "./general";
import {
    ensureIsTag,
    PLACEHOLDER_ELEMENT,
} from "./pseudo-selectors/subselects";
import type { CompiledQuery, InternalOptions } from "./types";

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
    const token =
        typeof selector === "string" ? parse(selector, options) : selector;
    return compileToken<Node, ElementNode>(token, options, context);
}

function includesScopePseudo(t: InternalSelector): boolean {
    return (
        t.type === "pseudo" &&
        (t.name === "scope" ||
            (Array.isArray(t.data) &&
                t.data.some((data) => data.some(includesScopePseudo))))
    );
}

const DESCENDANT_TOKEN: Selector = { type: "descendant" };
const FLEXIBLE_DESCENDANT_TOKEN: InternalSelector = {
    type: "_flexibleDescendant",
};
const SCOPE_TOKEN: Selector = { type: "pseudo", name: "scope", data: null };

/*
 * CSS 4 Spec (Draft): 3.3.1. Absolutizing a Scope-relative Selector
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
        if (t.length > 0 && isTraversal(t[0]) && t[0].type !== "descendant") {
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
    token = token.filter((t) => t.length > 0);

    token.forEach(sortRules);

    context = options.context ?? context;
    const isArrayContext = Array.isArray(context);

    const finalContext =
        context && (Array.isArray(context) ? context : [context]);

    absolutize(token, options, finalContext);

    let shouldTestNextSiblings = false;

    const query = token
        .map((rules) => {
            if (rules.length >= 2) {
                const [first, second] = rules;

                if (first.type !== "pseudo" || first.name !== "scope") {
                    // Ignore
                } else if (isArrayContext && second.type === "descendant") {
                    rules[1] = FLEXIBLE_DESCENDANT_TOKEN;
                } else if (
                    second.type === "adjacent" ||
                    second.type === "sibling"
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
        .reduce(reduceRules, falseFunc);

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
            previous === falseFunc
                ? falseFunc
                : compileGeneralSelector(
                      previous,
                      rule,
                      options,
                      context,
                      compileToken
                  ),
        options.rootFunc ?? trueFunc
    );
}

function reduceRules<Node, ElementNode extends Node>(
    a: CompiledQuery<ElementNode>,
    b: CompiledQuery<ElementNode>
): CompiledQuery<ElementNode> {
    if (b === falseFunc || a === trueFunc) {
        return a;
    }
    if (a === falseFunc || b === trueFunc) {
        return b;
    }

    return function combine(elem) {
        return a(elem) || b(elem);
    };
}
