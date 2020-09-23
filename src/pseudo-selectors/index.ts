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
import type { PseudoSelector } from "css-what";
import { filters } from "./filters";
import { pseudos, verifyPseudoArgs } from "./pseudos";
import { subselects } from "./subselects";

export { filters, pseudos };

// FIXME This is pretty hacky
const reCSS3 = /^(?:(?:nth|last|first|only)-(?:child|of-type)|root|empty|(?:en|dis)abled|checked|not)$/;

export function compilePseudoSelector<Node, ElementNode extends Node>(
    next: CompiledQuery<ElementNode>,
    selector: PseudoSelector,
    options: InternalOptions<Node, ElementNode>,
    context: ElementNode[] | undefined,
    compileToken: CompileToken<Node, ElementNode>
): CompiledQuery<ElementNode> {
    const { name, data } = selector;

    if (options.strict && !reCSS3.test(name)) {
        throw new Error(`:${name} isn't part of CSS3`);
    }

    if (Array.isArray(data)) {
        return subselects[name](next, data, options, context, compileToken);
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
