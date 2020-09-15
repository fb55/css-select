export type Predicate<Value> = (v: Value) => boolean;
export interface Adapter<Node, ElementNode extends Node> {
    /**
     *  Is the node a tag?
     */
    isTag: (node: Node) => node is ElementNode;

    /**
     * Does at least one of passed element nodes pass the test predicate?
     */
    existsOne: (test: Predicate<Node>, elems: Node[]) => boolean;

    /**
     * Get the attribute value.
     */
    getAttributeValue: (elem: ElementNode, name: string) => string | undefined;

    /**
     * Get the node's children
     */
    getChildren: (node: Node) => Node[];

    /**
     * Get the name of the tag
     */
    getName: (elem: ElementNode) => string;

    /**
     * Get the parent of the node
     */
    getParent: (node: Node) => Node | null;

    /*
     *Get the siblings of the node. Note that unlike jQuery's `siblings` method,
     *this is expected to include the current node as well
     */
    getSiblings: (node: Node) => Node[];

    /*
     * Get the text content of the node, and its children if it has any.
     */
    getText: (node: Node) => string;

    /**
     * Does the element have the named attribute?
     */
    hasAttrib: (elem: ElementNode, name: string) => boolean;

    /**
     * Takes an array of nodes, and removes any duplicates, as well as any
     * nodes whose ancestors are also in the array.
     */
    removeSubsets: (nodes: Node[]) => Node[];

    /**
     * Finds all of the element nodes in the array that match the test predicate,
     * as well as any of their children that match it.
     */
    findAll: (test: Predicate<ElementNode>, nodes: Node[]) => ElementNode[];

    /**
     * Finds the first node in the array that matches the test predicate, or one
     * of its children.
     */
    findOne: (
        test: Predicate<ElementNode>,
        elems: Node[]
    ) => ElementNode | null;

    /**
     *The adapter can also optionally include an equals method, if your DOM
     *structure needs a custom equality test to compare two objects which refer
     *to the same underlying node. If not provided, `css-select` will fall back to
     *`a === b`.
     */
    equals?: (a: Node, b: Node) => boolean;
}

import * as DomUtils from "domutils";
import { Node, Element } from "domhandler";

// Ensure that DomUtils (the default adapter) matches the given specification
DomUtils as Adapter<Node, Element>;

// TODO default types to the domutil/htmlparser2 types
export interface Options<Node, ElementNode extends Node> {
    /**
     * When enabled, tag names will be case-sensitive. Default: false.
     */
    xmlMode?: boolean;
    /**
     * Limits the module to only use CSS3 selectors. Default: false.
     */
    strict?: boolean;
    /**
     * The last function in the stack, will be called with the last element
     * that's looked at.
     */
    rootFunc?: (element: ElementNode) => boolean;
    /**
     * The adapter to use when interacting with the backing DOM structure. By
     * default it uses domutils.
     */
    adapter?: Adapter<Node, ElementNode>;
    /**
     * The context of the current query. Used to
     */
    context?: Node[];
}

// Internally, we want to ensure that no propterties are accessed on the passed objects
export type InternalAdapter = Adapter<
    Record<string, unknown>,
    Record<string, unknown>
>;
export type InternalOptions = Options<
    Record<string, unknown>,
    Record<string, unknown>
> & { adapter: InternalAdapter };

export type CompiledQuery = (node: Record<string, unknown>) => boolean;
export type Query = string | CompiledQuery;
