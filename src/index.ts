import * as boolbase from "boolbase";
import { parse, type Selector } from "css-what";
import {
    type Element as DomHandlerElement,
    type AnyNode as DomHandlerNode,
} from "domhandler";
import * as DomUtils from "domutils";
import { compileToken } from "./compile.js";
import { findAll, findOne, getNextSiblings } from "./helpers/querying.js";
import {
    type Adapter,
    type CompiledQuery,
    type InternalOptions,
    type Options,
    type Predicate,
    type Query,
} from "./types.js";

const defaultEquals = <Node>(a: Node, b: Node) => a === b;
const defaultOptions: InternalOptions<DomHandlerNode, DomHandlerElement> = {
    adapter: DomUtils,
    equals: defaultEquals,
};

function convertOptionFormats<Node, ElementNode extends Node>(
    options?: Options<Node, ElementNode>,
): InternalOptions<Node, ElementNode> {
    /*
     * We force one format of options to the other one.
     */
    // @ts-expect-error Default options may have incompatible `Node` / `ElementNode`.
    const finalOptions: Options<Node, ElementNode> = options ?? defaultOptions;
    // @ts-expect-error Same as above.
    finalOptions.adapter ??= DomUtils;
    // @ts-expect-error `equals` does not exist on `Options`
    finalOptions.equals ??= finalOptions.adapter?.equals ?? defaultEquals;

    return finalOptions as InternalOptions<Node, ElementNode>;
}

/**
 * Compiles a selector to an executable function.
 *
 * The returned function checks if each passed node is an element. Use
 * `_compileUnsafe` to skip this check.
 * @param selector Selector to compile.
 * @param options Compilation options.
 * @param context Optional context for the selector.
 */
export function compile<Node, ElementNode extends Node>(
    selector: string | Selector[][],
    options?: Options<Node, ElementNode>,
    context?: Node[] | Node,
): CompiledQuery<Node> {
    const convertedOptions = convertOptionFormats(options);
    const next = _compileUnsafe(selector, convertedOptions, context);

    return next === boolbase.falseFunc
        ? boolbase.falseFunc
        : (element: Node) => convertedOptions.adapter.isTag(element) && next(element);
}
/**
 * Like `compile`, but does not add a check if elements are tags.
 * @param selector Selector used to match elements.
 * @param options Options that control this operation.
 * @param context Context nodes used to scope selector matching.
 */
export function _compileUnsafe<Node, ElementNode extends Node>(
    selector: string | Selector[][],
    options?: Options<Node, ElementNode>,
    context?: Node[] | Node,
): CompiledQuery<ElementNode> {
    return _compileToken<Node, ElementNode>(
        typeof selector === "string" ? parse(selector) : selector,
        options,
        context,
    );
}
/**
 * @param selector Selector used to match elements.
 * @param options Options that control this operation.
 * @param context Context nodes used to scope selector matching.
 * @deprecated Use `_compileUnsafe` instead.
 */
export function _compileToken<Node, ElementNode extends Node>(
    selector: Selector[][],
    options?: Options<Node, ElementNode>,
    context?: Node[] | Node,
): CompiledQuery<ElementNode> {
    return compileToken<Node, ElementNode>(
        selector,
        convertOptionFormats(options),
        context,
    );
}

function getSelectorFunction<Node, ElementNode extends Node, T>(
    searchFunction: (
        query: Predicate<ElementNode>,
        elements: Array<Node>,
        options: InternalOptions<Node, ElementNode>,
    ) => T,
) {
    return function select(
        query: Query<ElementNode>,
        elements: Node[] | Node,
        options?: Options<Node, ElementNode>,
    ): T {
        const convertedOptions = convertOptionFormats(options);

        if (typeof query !== "function") {
            query = _compileUnsafe<Node, ElementNode>(
                query,
                convertedOptions,
                elements,
            );
        }

        const filteredElements = prepareContext(
            elements,
            convertedOptions.adapter,
            query.shouldTestNextSiblings,
        );
        return searchFunction(query, filteredElements, convertedOptions);
    };
}

/**
 * Normalize a query context and optionally include next siblings.
 * @param elements Elements to test against sibling-dependent selectors.
 * @param adapter Adapter implementation used for DOM operations.
 * @param shouldTestNextSiblings Whether sibling combinators should include following siblings.
 */
export function prepareContext<Node, ElementNode extends Node>(
    elements: Node | Node[],
    adapter: Adapter<Node, ElementNode>,
    shouldTestNextSiblings = false,
): Node[] {
    /*
     * Add siblings if the query requires them.
     * See https://github.com/fb55/css-select/pull/43#issuecomment-225414692
     */
    if (shouldTestNextSiblings) {
        elements = appendNextSiblings(elements, adapter);
    }

    return Array.isArray(elements)
        ? adapter.removeSubsets(elements)
        : adapter.getChildren(elements);
}

function appendNextSiblings<Node, ElementNode extends Node>(
    element: Node | Node[],
    adapter: Adapter<Node, ElementNode>,
): Node[] {
    // Order matters because jQuery seems to check the children before the siblings
    const elements = Array.isArray(element) ? [...element] : [element];
    const elementsLength = elements.length;

    for (let index = 0; index < elementsLength; index++) {
        const nextSiblings = getNextSiblings(elements[index], adapter);
        elements.push(...nextSiblings);
    }
    return elements;
}

/**
 * @template Node The generic Node type for the DOM adapter being used.
 * @template ElementNode The Node type for elements for the DOM adapter being used.
 * @param elems Elements to query. If it is an element, its children will be queried.
 * @param query can be either a CSS selector string or a compiled query function.
 * @param [options] options for querying the document.
 * @see compile for supported selector queries.
 * @returns All matching elements.
 */
export const selectAll: <Node, ElementNode extends Node>(
    query: Query<ElementNode>,
    elements: Node | Node[],
    options?: Options<Node, ElementNode> | undefined,
) => ElementNode[] = getSelectorFunction(
    <Node, ElementNode extends Node>(
        query: Predicate<ElementNode>,
        elements: Node[] | null,
        options: InternalOptions<Node, ElementNode>,
    ): ElementNode[] =>
        query === boolbase.falseFunc || !elements || elements.length === 0
            ? []
            : findAll(query, elements, options),
);

/**
 * @template Node The generic Node type for the DOM adapter being used.
 * @template ElementNode The Node type for elements for the DOM adapter being used.
 * @param elems Elements to query. If it is an element, its children will be queried.
 * @param query can be either a CSS selector string or a compiled query function.
 * @param [options] options for querying the document.
 * @see compile for supported selector queries.
 * @returns the first match, or null if there was no match.
 */
export const selectOne: <Node, ElementNode extends Node>(
    query: Query<ElementNode>,
    elements: Node | Node[],
    options?: Options<Node, ElementNode> | undefined,
) => ElementNode | null = getSelectorFunction(
    <Node, ElementNode extends Node>(
        query: Predicate<ElementNode>,
        elements: Node[] | null,
        options: InternalOptions<Node, ElementNode>,
    ): ElementNode | null =>
        query === boolbase.falseFunc || !elements || elements.length === 0
            ? null
            : findOne(query, elements, options),
);

/**
 * Tests whether or not an element is matched by query.
 * @template Node The generic Node type for the DOM adapter being used.
 * @template ElementNode The Node type for elements for the DOM adapter being used.
 * @param element The element to test if it matches the query.
 * @param query can be either a CSS selector string or a compiled query function.
 * @param [options] options for querying the document.
 * @see compile for supported selector queries.
 * @returns Whether the element matches the query.
 */
export function is<Node, ElementNode extends Node>(
    element: ElementNode,
    query: Query<ElementNode>,
    options?: Options<Node, ElementNode>,
): boolean {
    return (typeof query === "function" ? query : compile(query, options))(
        element,
    );
}

/**
 * Alias for selectAll(query, elems, options).
 * @see [compile] for supported selector queries.
 */
export default selectAll;

// Export filters, pseudos and aliases to allow users to supply their own.
/** @deprecated Use the `pseudos` option instead. */
export { aliases, filters, pseudos } from "./pseudo-selectors/index.js";

export type { Options } from "./types.js";
