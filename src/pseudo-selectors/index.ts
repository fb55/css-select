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
import { trueFunc, falseFunc } from "boolbase";
import type { CompiledQuery, InternalOptions, CompileToken } from "../types";
import { parse, PseudoSelector } from "css-what";
import { filters } from "./filters";
import { pseudos, verifyPseudoArgs } from "./pseudos";
import { aliases } from "./aliases";
import { subselects } from "./subselects";

export { filters, pseudos, aliases };

export function compilePseudoSelector<Node, ElementNode extends Node>(
    next: CompiledQuery<ElementNode>,
    selector: PseudoSelector,
    options: InternalOptions<Node, ElementNode>,
    context: Node[] | undefined,
    compileToken: CompileToken<Node, ElementNode>
): CompiledQuery<ElementNode> {
    const { name, data } = selector;

    if (Array.isArray(data)) {
        return subselects[name](next, data, options, context, compileToken);
    }
    if (name in aliases) {
        if (data != null) {
            throw new Error(`Pseudo ${name} doesn't have any arguments`);
        }

        // The alias has to be parsed here, to make sure options are respected.
        const alias = parse(aliases[name], options);
        return subselects.is(next, alias, options, context, compileToken);
    }
    if (name in filters) {
        return filters[name](next, data as string, options, context);
    }
    if (name in pseudos) {
        const pseudo = pseudos[name];
        verifyPseudoArgs(pseudo, name, data);

        return pseudo === falseFunc
            ? falseFunc
            : next === trueFunc
            ? (elem) => pseudo(elem, options, data)
            : (elem) => pseudo(elem, options, data) && next(elem);
    }
    throw new Error(`unmatched pseudo-class :${name}`);
}
