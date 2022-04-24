import * as DomUtils from "domutils";
import boolbase from "boolbase";
import type {
    AnyNode as DomHandlerNode,
    Element as DomHandlerElement,
} from "domhandler";
import {
    compile as compileRaw,
    compileUnsafe,
    compileToken,
} from "./compile.js";
import type {
    CompiledQuery,
    Options,
    InternalOptions,
    Query,
    Adapter,
    Predicate,
} from "./types.js";
import { getNextSiblings } from "./pseudo-selectors/subselects.js";

export type { Options };

const defaultEquals = <Node>(a: Node, b: Node) => a === b;
const defaultOptions: InternalOptions<DomHandlerNode, DomHandlerElement> = {
    adapter: DomUtils,
    equals: defaultEquals,
};

function convertOptionFormats<Node, ElementNode extends Node>(
    options?: Options<Node, ElementNode>
): InternalOptions<Node, ElementNode> {
    /*
     * We force one format of options to the other one.
     */
    // @ts-expect-error Default options may have incompatible `Node` / `ElementNode`.
    const opts: Options<Node, ElementNode> = options ?? defaultOptions;
    // @ts-expect-error Same as above.
    opts.adapter ??= DomUtils;
    // @ts-expect-error `equals` does not exist on `Options`
    opts.equals ??= opts.adapter?.equals ?? defaultEquals;

    return opts as InternalOptions<Node, ElementNode>;
}

function wrapCompile<Selector, Node, ElementNode extends Node, R extends Node>(
    func: (
        selector: Selector,
        options: InternalOptions<Node, ElementNode>,
        context?: Node[] | Node
    ) => CompiledQuery<R>
) {
    return function addAdapter(
        selector: Selector,
        options?: Options<Node, ElementNode>,
        context?: Node[] | Node
    ): CompiledQuery<R> {
        const opts = convertOptionFormats(options);

        return func(selector, opts, context);
    };
}

/**
 * Compiles the query, returns a function.
 */
export const compile = wrapCompile(compileRaw);
export const _compileUnsafe = wrapCompile(compileUnsafe);
export const _compileToken = wrapCompile(compileToken);

function getSelectorFunc<Node, ElementNode extends Node, T>(
    searchFunc: (
        query: Predicate<ElementNode>,
        elems: Array<Node>,
        options: InternalOptions<Node, ElementNode>
    ) => T
) {
    return function select(
        query: Query<ElementNode>,
        elements: Node[] | Node,
        options?: Options<Node, ElementNode>
    ): T {
        const opts = convertOptionFormats(options);

        if (typeof query !== "function") {
            query = compileUnsafe<Node, ElementNode>(query, opts, elements);
        }

        const filteredElements = prepareContext(
            elements,
            opts.adapter,
            query.shouldTestNextSiblings
        );
        return searchFunc(query, filteredElements, opts);
    };
}

export function prepareContext<Node, ElementNode extends Node>(
    elems: Node | Node[],
    adapter: Adapter<Node, ElementNode>,
    shouldTestNextSiblings = false
): Node[] {
    /*
     * Add siblings if the query requires them.
     * See https://github.com/fb55/css-select/pull/43#issuecomment-225414692
     */
    if (shouldTestNextSiblings) {
        elems = appendNextSiblings(elems, adapter);
    }

    return Array.isArray(elems)
        ? adapter.removeSubsets(elems)
        : adapter.getChildren(elems);
}

function appendNextSiblings<Node, ElementNode extends Node>(
    elem: Node | Node[],
    adapter: Adapter<Node, ElementNode>
): Node[] {
    // Order matters because jQuery seems to check the children before the siblings
    const elems = Array.isArray(elem) ? elem.slice(0) : [elem];
    const elemsLength = elems.length;

    for (let i = 0; i < elemsLength; i++) {
        const nextSiblings = getNextSiblings(elems[i], adapter);
        elems.push(...nextSiblings);
    }
    return elems;
}

/**
 * @template Node The generic Node type for the DOM adapter being used.
 * @template ElementNode The Node type for elements for the DOM adapter being used.
 * @param elems Elements to query. If it is an element, its children will be queried..
 * @param query can be either a CSS selector string or a compiled query function.
 * @param [options] options for querying the document.
 * @see compile for supported selector queries.
 * @returns All matching elements.
 *
 */
export const selectAll = getSelectorFunc(
    <Node, ElementNode extends Node>(
        query: Predicate<ElementNode>,
        elems: Node[] | null,
        options: InternalOptions<Node, ElementNode>
    ): ElementNode[] =>
        query === boolbase.falseFunc || !elems || elems.length === 0
            ? []
            : options.adapter.findAll(query, elems)
);

/**
 * @template Node The generic Node type for the DOM adapter being used.
 * @template ElementNode The Node type for elements for the DOM adapter being used.
 * @param elems Elements to query. If it is an element, its children will be queried..
 * @param query can be either a CSS selector string or a compiled query function.
 * @param [options] options for querying the document.
 * @see compile for supported selector queries.
 * @returns the first match, or null if there was no match.
 */
export const selectOne = getSelectorFunc(
    <Node, ElementNode extends Node>(
        query: Predicate<ElementNode>,
        elems: Node[] | null,
        options: InternalOptions<Node, ElementNode>
    ): ElementNode | null =>
        query === boolbase.falseFunc || !elems || elems.length === 0
            ? null
            : options.adapter.findOne(query, elems)
);

/**
 * Tests whether or not an element is matched by query.
 *
 * @template Node The generic Node type for the DOM adapter being used.
 * @template ElementNode The Node type for elements for the DOM adapter being used.
 * @param elem The element to test if it matches the query.
 * @param query can be either a CSS selector string or a compiled query function.
 * @param [options] options for querying the document.
 * @see compile for supported selector queries.
 * @returns
 */
export function is<Node, ElementNode extends Node>(
    elem: ElementNode,
    query: Query<ElementNode>,
    options?: Options<Node, ElementNode>
): boolean {
    const opts = convertOptionFormats(options);
    return (typeof query === "function" ? query : compileRaw(query, opts))(
        elem
    );
}

/**
 * Alias for selectAll(query, elems, options).
 * @see [compile] for supported selector queries.
 */
export default selectAll;

// Export filters, pseudos and aliases to allow users to supply their own.
/** @deprecated Use the `pseudos` option instead. */
export { filters, pseudos, aliases } from "./pseudo-selectors/index.js";
