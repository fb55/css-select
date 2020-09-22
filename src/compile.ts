import { InternalSelector } from "./types";
/*
 *Compiles a selector to an executable function
 */

import { parse, Selector, Traversal } from "css-what";
import { trueFunc, falseFunc } from "boolbase";
import sortRules from "./sort";
import procedure from "./procedure";
import { compileGeneralSelector } from "./general";
import { filters } from "./pseudos/filters";
import { pseudos } from "./pseudos/pseudos";
import { CompiledQuery, InternalOptions } from "./types";

export function compile<Node, ElementNode extends Node>(
    selector: string,
    options: InternalOptions<Node, ElementNode>,
    context?: ElementNode[]
): CompiledQuery<ElementNode> {
    const next = compileUnsafe(selector, options, context);
    return wrap(next, options);
}

export { filters, pseudos };

function wrap<Node, ElementNode extends Node>(
    next: CompiledQuery<ElementNode>,
    { adapter }: InternalOptions<Node, ElementNode>
): CompiledQuery<ElementNode> {
    return (elem: Node) => adapter.isTag(elem) && next(elem);
}

export function compileUnsafe<Node, ElementNode extends Node>(
    selector: string,
    options: InternalOptions<Node, ElementNode>,
    context?: ElementNode[]
): CompiledQuery<ElementNode> {
    const token = parse(selector, options);
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
const PLACEHOLDER_ELEMENT = {};

/*
 * CSS 4 Spec (Draft): 3.3.1. Absolutizing a Scope-relative Selector
 * http://www.w3.org/TR/selectors4/#absolutizing
 */
function absolutize<Node, ElementNode extends Node>(
    token: InternalSelector[][],
    { adapter }: InternalOptions<Node, ElementNode>,
    context?: ElementNode[]
) {
    // TODO Use better check if the context is a document
    const hasContext = !!context?.every(
        (e) => e === PLACEHOLDER_ELEMENT || !!adapter.getParent(e)
    );

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
    context?: ElementNode[]
): CompiledQuery<ElementNode> {
    token = token.filter((t) => t.length > 0);

    token.forEach(sortRules);

    context = options.context ?? context;
    const isArrayContext = Array.isArray(context);

    if (context && !Array.isArray(context)) context = [context];

    absolutize(token, options, context);

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

            return compileRules<Node, ElementNode>(rules, options, context);
        })
        .reduce(reduceRules, falseFunc);

    query.shouldTestNextSiblings = shouldTestNextSiblings;

    return query;
}

function isTraversal(t: InternalSelector): t is Traversal {
    return procedure[t.type] < 0;
}

function compileRules<Node, ElementNode extends Node>(
    rules: InternalSelector[],
    options: InternalOptions<Node, ElementNode>,
    context?: ElementNode[]
): CompiledQuery<ElementNode> {
    return rules.reduce<CompiledQuery<ElementNode>>(
        (previous, rule) =>
            previous === falseFunc
                ? falseFunc
                : compileGeneralSelector(previous, rule, options, context),
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

function containsTraversal(t: Selector[]): boolean {
    return t.some(isTraversal);
}

/*
 * :not, :has and :matches have to compile selectors
 * doing this in src/pseudos.ts would lead to circular dependencies,
 * so we add them here
 */
filters.not = function not<Node, ElementNode extends Node>(
    next: CompiledQuery<ElementNode>,
    token: Selector[][],
    options: InternalOptions<Node, ElementNode>,
    context?: ElementNode[]
): CompiledQuery<ElementNode> {
    const opts = {
        xmlMode: !!options.xmlMode,
        strict: !!options.strict,
        adapter: options.adapter,
    };

    if (opts.strict) {
        if (token.length > 1 || token.some(containsTraversal)) {
            throw new Error(
                "complex selectors in :not aren't allowed in strict mode"
            );
        }
    }

    const func = compileToken(token, opts, context);

    if (func === falseFunc) return next;
    if (func === trueFunc) return falseFunc;

    return function not(elem) {
        return !func(elem) && next(elem);
    };
};

filters.has = function has<Node, ElementNode extends Node>(
    next: CompiledQuery<ElementNode>,
    token: Selector[][],
    options: InternalOptions<Node, ElementNode>
): CompiledQuery<ElementNode> {
    const { adapter } = options;
    const opts = {
        xmlMode: options.xmlMode,
        strict: options.strict,
        adapter,
    };

    // FIXME: Uses an array as a pointer to the current element (side effects)
    const context = token.some(containsTraversal)
        ? [PLACEHOLDER_ELEMENT]
        : undefined;

    let func = compileToken<Node, ElementNode>(token, opts, context);

    if (func === falseFunc) return falseFunc;
    if (func === trueFunc) {
        return (elem) =>
            adapter.getChildren(elem).some(adapter.isTag) && next(elem);
    }

    func = wrap(func, options);

    if (context) {
        return (elem) =>
            next(elem) &&
            ((context[0] = elem),
            adapter.existsOne(func, adapter.getChildren(elem)));
    }

    return (elem) =>
        next(elem) && adapter.existsOne(func, adapter.getChildren(elem));
};

filters.is = filters.matches = function matches<Node, ElementNode extends Node>(
    next: CompiledQuery<ElementNode>,
    token: Selector[][],
    options: InternalOptions<Node, ElementNode>,
    context?: ElementNode[]
): CompiledQuery<ElementNode> {
    const opts = {
        xmlMode: options.xmlMode,
        strict: options.strict,
        adapter: options.adapter,
        rootFunc: next,
    };

    return compileToken<Node, ElementNode>(token, opts, context);
};
