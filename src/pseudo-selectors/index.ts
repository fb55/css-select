/*
 * Pseudo selectors
 *
 * Pseudo selectors are available in three forms:
 *
 * 1. Filters are called when the selector is compiled and return a function
 *  that has to return either false, or the results of `next()`.
 * 2. Pseudos are called on execution. They have to return a boolean.
 * 3. Subselects work like filters, but have an embedded selector that will be run separately.
 *
 * Filters are great if you want to do some pre-processing, or change the call order
 * of `next()` and your code.
 * Pseudos should be used to implement simple checks.
 */

import { type PseudoSelector, parse } from "css-what";
import type { CompiledQuery, CompileToken, InternalOptions } from "../types.js";
import { aliases } from "./aliases.js";
import { filters } from "./filters.js";
import { pseudos, verifyPseudoArguments } from "./pseudos.js";
import { subselects } from "./subselects.js";

const allFilterNames = new Set(Object.keys(filters));

const filtersWithArguments = new Set([
    "contains",
    "icontains",
    "nth-child",
    "nth-last-child",
    "nth-of-type",
    "nth-last-of-type",
    "lang",
]);

for (const filterName of filtersWithArguments) {
    if (!allFilterNames.has(filterName)) {
        throw new Error(`Unknown filter in filtersWithArguments: ${filterName}`);
    }
}

const filtersWithoutArguments = new Set(
    [...allFilterNames].filter((filterName) => !filtersWithArguments.has(filterName)),
);

/**
 * Compile a pseudo selector into an executable query function.
 * @param next Matcher to run after this matcher succeeds.
 * @param selector Selector used to match elements.
 * @param options Options that control this operation.
 * @param context Context nodes used to scope selector matching.
 * @param compileToken Function used to compile nested selector tokens.
 */
export function compilePseudoSelector<Node, ElementNode extends Node>(
    next: CompiledQuery<ElementNode>,
    selector: PseudoSelector,
    options: InternalOptions<Node, ElementNode>,
    context: Node[] | undefined,
    compileToken: CompileToken<Node, ElementNode>,
): CompiledQuery<ElementNode> {
    const { name, data } = selector;

    if (data === null && Object.hasOwn(subselects, name)) {
        throw new Error(`Pseudo-class :${name} requires an argument`);
    }

    if (Array.isArray(data)) {
        if (!Object.hasOwn(subselects, name)) {
            throw new Error(`Unknown pseudo-class :${name}(${data})`);
        }

        return subselects[name](next, data, options, context, compileToken);
    }

    const userPseudo = options.pseudos?.[name];

    const stringPseudo =
        typeof userPseudo === "string" ? userPseudo : aliases[name];

    if (typeof stringPseudo === "string") {
        if (data != null) {
            throw new Error(
                `Pseudo-class :${name} doesn't have any arguments`,
            );
        }

        // The alias has to be parsed here, to make sure options are respected.
        const alias = parse(stringPseudo);
        return subselects["is"](next, alias, options, context, compileToken);
    }

    if (typeof userPseudo === "function") {
        verifyPseudoArguments(userPseudo, name, data, 1);

        return (element) => userPseudo(element, data) && next(element);
    }

    if (Object.hasOwn(filters, name)) {
        if (data === null && filtersWithArguments.has(name)) {
            throw new Error(`Pseudo-class :${name} requires an argument`);
        }

        if (data !== null && filtersWithoutArguments.has(name)) {
            throw new Error(`Pseudo-class :${name} doesn't have any arguments`);
        }

        return filters[name](
            next,
            data as string,
            options,
            context,
            compileToken,
        );
    }

    if (Object.hasOwn(pseudos, name)) {
        const pseudo = pseudos[name];
        verifyPseudoArguments(pseudo, name, data, 2);

        return (element) => pseudo(element, options, data) && next(element);
    }

    throw new Error(`Unknown pseudo-class :${name}`);
}

export { aliases } from "./aliases.js";
export { filters } from "./filters.js";
export { pseudos } from "./pseudos.js";
