/*
 * Pseudo selectors
 *
 * Pseudo selectors are available in two forms:
 *
 * 1. Filters are called when the selector is compiled and return a function
 *  that has to return either false, or the results of `next()`.
 * 2. Pseudos are called on execution. They have to return a boolean.
 *
 * Filters are great if you want to do some pre-processing, or change the call order
 * of `next()` and your code.
 * Pseudos should be used to implement simple checks.
 */
import { trueFunc, falseFunc } from "boolbase";
import type { CompiledQuery, InternalOptions } from "../types";
import type { PseudoSelector } from "css-what";
import { filters } from "./filters";
import { pseudos, Pseudo } from "./pseudos";

function verifyArgs<Node, ElementNode extends Node>(
    func: Pseudo,
    name: string,
    subselect: ElementNode | string | null
) {
    if (subselect === null) {
        if (func.length > 2 && name !== "scope") {
            throw new Error(`pseudo-selector :${name} requires an argument`);
        }
    } else {
        if (func.length === 2) {
            throw new Error(
                `pseudo-selector :${name} doesn't have any arguments`
            );
        }
    }
}

// FIXME this feels hacky
const reCSS3 = /^(?:(?:nth|last|first|only)-(?:child|of-type)|root|empty|(?:en|dis)abled|checked|not)$/;

export function compile<Node, ElementNode extends Node>(
    next: CompiledQuery<ElementNode>,
    data: PseudoSelector,
    options: InternalOptions<Node, ElementNode>,
    context?: ElementNode[]
): CompiledQuery<ElementNode> {
    const { name } = data;
    const subselect = data.data as string;
    const { adapter } = options;

    if (options.strict && !reCSS3.test(name)) {
        throw new Error(`:${name} isn't part of CSS3`);
    }

    const filter = filters[name];
    const pseudo = pseudos[name];
    if (typeof filter === "function") {
        return filter(next, subselect, options, context);
    } else if (typeof pseudo === "function") {
        verifyArgs(pseudo, name, subselect);

        return pseudo === falseFunc
            ? falseFunc
            : next === trueFunc
            ? (elem) => pseudo(elem, adapter, subselect)
            : (elem) => pseudo(elem, adapter, subselect) && next(elem);
    }
    throw new Error(`unmatched pseudo-class :${name}`);
}
