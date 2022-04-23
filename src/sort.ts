import type { InternalSelector } from "./types.js";
import { AttributeAction, SelectorType, type Traversal } from "css-what";

const procedure = new Map<InternalSelector["type"], number>([
    [SelectorType.Universal, 50],
    [SelectorType.Tag, 30],
    [SelectorType.Attribute, 1],
    [SelectorType.Pseudo, 0],
]);

export function isTraversal(token: InternalSelector): token is Traversal {
    return !procedure.has(token.type);
}

const attributes = new Map<AttributeAction, number>([
    [AttributeAction.Exists, 10],
    [AttributeAction.Equals, 8],
    [AttributeAction.Not, 7],
    [AttributeAction.Start, 6],
    [AttributeAction.End, 6],
    [AttributeAction.Any, 5],
]);

/**
 * Sort the parts of the passed selector,
 * as there is potential for optimization
 * (some types of selectors are faster than others)
 *
 * @param arr Selector to sort
 */
export default function sortByProcedure(arr: InternalSelector[]): void {
    const procs = arr.map(getProcedure);
    for (let i = 1; i < arr.length; i++) {
        const procNew = procs[i];

        if (procNew < 0) continue;

        for (let j = i - 1; j >= 0 && procNew < procs[j]; j--) {
            const token = arr[j + 1];
            arr[j + 1] = arr[j];
            arr[j] = token;
            procs[j + 1] = procs[j];
            procs[j] = procNew;
        }
    }
}

function getProcedure(token: InternalSelector): number {
    let proc = procedure.get(token.type) ?? -1;

    if (token.type === SelectorType.Attribute) {
        proc = attributes.get(token.action) ?? 4;

        if (token.action === AttributeAction.Equals && token.name === "id") {
            // Prefer ID selectors (eg. #ID)
            proc = 9;
        }

        if (token.ignoreCase) {
            /*
             * IgnoreCase adds some overhead, prefer "normal" token
             * this is a binary operation, to ensure it's still an int
             */
            proc >>= 1;
        }
    } else if (token.type === SelectorType.Pseudo) {
        if (!token.data) {
            proc = 3;
        } else if (token.name === "has" || token.name === "contains") {
            proc = 0; // Expensive in any case
        } else if (Array.isArray(token.data)) {
            // Eg. :matches, :not
            proc = Math.min(
                ...token.data.map((d) => Math.min(...d.map(getProcedure)))
            );

            // If we have traversals, try to avoid executing this selector
            if (proc < 0) {
                proc = 0;
            }
        } else {
            proc = 2;
        }
    }
    return proc;
}
