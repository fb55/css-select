import * as DomUtils from "domutils";
import { falseFunc } from "boolbase";
import { compile as compileRaw, compileUnsafe, compileToken } from "./compile";

import {
    CompiledQuery,
    Options,
    InternalOptions,
    Query,
    Adapter,
    Predicate,
} from "./types";

export type { Options };

const defaultOptions = { adapter: DomUtils };

function convertOptionFormats<Node, ElementNode extends Node>(
    options?: Options<Node, ElementNode>
): InternalOptions<Node, ElementNode> {
    /*
     * We force one format of options to the other one.
     */
    // @ts-expect-error Default options may have incompatible `Node` / `ElementNode`.
    const opts: Options<Node, ElementNode> = options ?? defaultOptions;
    // @ts-expect-error Same as above.
    opts.adapter = opts.adapter ?? DomUtils;

    return opts as InternalOptions<Node, ElementNode>;
}

function wrapCompile<Selector, Node, ElementNode extends Node>(
    func: (
        selector: Selector,
        options: InternalOptions<Node, ElementNode>,
        context?: Node[]
    ) => CompiledQuery<ElementNode>
) {
    return function addAdapter(
        selector: Selector,
        options?: Options<Node, ElementNode>,
        context?: Node[]
    ) {
        const opts = convertOptionFormats(options);

        return func(selector, opts, context);
    };
}

/**
 * Compiles the query, returns a function.
 *
 * Supported simple selectors:
 *   * Universal (*)
 *   * Tag (<tagname>)
 *   * Attribute ([attr=foo]), with supported comparisons:
 *     * [attr] (existential)
 *     * =
 *     * ~=
 *     * |=
 *     * *=
 *     * ^=
 *     * $=
 *     * !=
 *     * Can be case insensitive (E.g. [attr=foo i])
 *   * Pseudos:
 *     * :not
 *     * :root
 *     * :empty
 *     * :[first|last]-child[-of-type]
 *     * :only-of-type, :only-child
 *     * :nth-[last-]child[-of-type]
 *     * :link, :visited (the latter doesn't match any elements)
 *     * :checked
 *     * :enabled, :disabled
 *     * :required, :optional
 *   * Nonstandard Pseudos (available when strict mode is not enabled):
 *     * `:contains`
 *     * `:icontains` (case-insensitive version of :contains)
 *     * `:has`
 *     * `:parent`
 *     * `:selected`
 *     * `:header, :button, :input, :text, :checkbox, :file, :password, :reset, :radio etc.
 *     * :matches
 *
 * Supported Combinators:
 *
 *   * Descendant (` `)
 *   * Child (`>`)
 *   * Parent (`<`) (when strict mode is not enabled)
 *   * Sibling (`~`)
 *   * Adjacent (`+`)
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
        elements: ElementNode[] | ElementNode,
        options?: Options<Node, ElementNode>
    ): T {
        const opts = convertOptionFormats(options);
        let elems: ElementNode[] | ElementNode = elements;

        if (typeof query !== "function") {
            query = compileUnsafe<Node, ElementNode>(
                query,
                opts,
                Array.isArray(elems) ? elems : []
            );
        }
        /*
         * Add siblings if the query requires them.
         * See https://github.com/fb55/css-select/pull/43#issuecomment-225414692
         */
        if (query.shouldTestNextSiblings) {
            elems = appendNextSiblings(opts.context ?? elems, opts.adapter);
        }

        const filteredElements = Array.isArray(elems)
            ? opts.adapter.removeSubsets(elems)
            : opts.adapter.getChildren(elems);
        return searchFunc(query, filteredElements, opts);
    };
}

function getNextSiblings<Node, ElementNode extends Node>(
    elem: Node,
    adapter: Adapter<Node, ElementNode>
): Node[] {
    const siblings = adapter.getSiblings(elem);
    if (siblings.length <= 1) return [];
    const elemIndex = siblings.indexOf(elem);
    if (elemIndex < 0 || elemIndex === siblings.length - 1) return [];
    return siblings.slice(elemIndex + 1);
}

function appendNextSiblings<Node, ElementNode extends Node>(
    elem: ElementNode | ElementNode[],
    adapter: Adapter<Node, ElementNode>
): ElementNode[] {
    // Order matters because jQuery seems to check the children before the siblings
    const elems = Array.isArray(elem) ? elem.slice(0) : [elem];

    for (let i = 0; i < elems.length; i++) {
        const nextSiblings = getNextSiblings(elems[i], adapter);
        elems.push(
            ...nextSiblings.filter((sibling): sibling is ElementNode =>
                adapter.isTag(sibling)
            )
        );
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
    ) =>
        query === falseFunc || !elems || elems.length === 0
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
    ) =>
        query === falseFunc || !elems || elems.length === 0
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

export { Pseudos as pseudos } from "./compile";
