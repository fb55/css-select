import * as boolbase from "boolbase";
import { type AttributeAction, type AttributeSelector } from "css-what";
import { type CompiledQuery, type InternalOptions } from "./types.js";

/**
 * All reserved characters in a regex, used for escaping.
 *
 * Taken from XRegExp, (c) 2007-2020 Steven Levithan under the MIT license
 * https://github.com/slevithan/xregexp/blob/95eeebeb8fac8754d54eafe2b4743661ac1cf028/src/xregexp.js#L794
 */
const reChars = /[-[\]{}()*+?.,\\^$|#\s]/g;
function escapeRegex(value: string): string {
    return value.replace(reChars, "\\$&");
}

/**
 * Attributes that are case-insensitive in HTML.
 * @see https://html.spec.whatwg.org/multipage/semantics-other.html#case-sensitivity-of-selectors
 */
const caseInsensitiveAttributes = new Set([
    "accept",
    "accept-charset",
    "align",
    "alink",
    "axis",
    "bgcolor",
    "charset",
    "checked",
    "clear",
    "codetype",
    "color",
    "compact",
    "declare",
    "defer",
    "dir",
    "direction",
    "disabled",
    "enctype",
    "face",
    "frame",
    "hreflang",
    "http-equiv",
    "lang",
    "language",
    "link",
    "media",
    "method",
    "multiple",
    "nohref",
    "noresize",
    "noshade",
    "nowrap",
    "readonly",
    "rel",
    "rev",
    "rules",
    "scope",
    "scrolling",
    "selected",
    "shape",
    "target",
    "text",
    "type",
    "valign",
    "valuetype",
    "vlink",
]);

function shouldIgnoreCase<Node, ElementNode extends Node>(
    selector: AttributeSelector,
    options: InternalOptions<Node, ElementNode>,
): boolean {
    return typeof selector.ignoreCase === "boolean"
        ? selector.ignoreCase
        : selector.ignoreCase === "quirks"
          ? !!options.quirksMode
          : !options.xmlMode && caseInsensitiveAttributes.has(selector.name);
}

/**
 * Attribute selectors
 */
export const attributeRules: Record<
    AttributeAction,
    <Node, ElementNode extends Node>(
        next: CompiledQuery<ElementNode>,
        data: AttributeSelector,
        options: InternalOptions<Node, ElementNode>,
    ) => CompiledQuery<ElementNode>
> = {
    equals(next, data, options) {
        const { adapter } = options;
        const { name } = data;
        let { value } = data;

        if (shouldIgnoreCase(data, options)) {
            value = value.toLowerCase();

            return (element) => {
                const attribute = adapter.getAttributeValue(element, name);
                return (
                    attribute != null &&
                    attribute.length === value.length &&
                    attribute.toLowerCase() === value &&
                    next(element)
                );
            };
        }

        return (element) =>
            adapter.getAttributeValue(element, name) === value && next(element);
    },
    hyphen(next, data, options) {
        const { adapter } = options;
        const { name } = data;
        let { value } = data;
        const { length } = value;

        if (shouldIgnoreCase(data, options)) {
            value = value.toLowerCase();

            return function hyphenIC(element) {
                const attribute = adapter.getAttributeValue(element, name);
                return (
                    attribute != null &&
                    (attribute.length === length ||
                        attribute.charAt(length) === "-") &&
                    attribute.substr(0, length).toLowerCase() === value &&
                    next(element)
                );
            };
        }

        return function hyphen(element) {
            const attribute = adapter.getAttributeValue(element, name);
            return (
                attribute != null &&
                (attribute.length === length ||
                    attribute.charAt(length) === "-") &&
                attribute.substr(0, length) === value &&
                next(element)
            );
        };
    },
    element(next, data, options) {
        const { adapter } = options;
        const { name, value } = data;
        if (/\s/.test(value)) {
            return boolbase.falseFunc;
        }

        const regex = new RegExp(
            `(?:^|\\s)${escapeRegex(value)}(?:$|\\s)`,
            shouldIgnoreCase(data, options) ? "i" : "",
        );

        return function element(node) {
            const attribute = adapter.getAttributeValue(node, name);
            return (
                attribute != null &&
                attribute.length >= value.length &&
                regex.test(attribute) &&
                next(node)
            );
        };
    },
    exists(next, { name }, { adapter }) {
        return (element) => adapter.hasAttrib(element, name) && next(element);
    },
    start(next, data, options) {
        const { adapter } = options;
        const { name } = data;
        let { value } = data;
        const { length } = value;

        if (length === 0) {
            return boolbase.falseFunc;
        }

        if (shouldIgnoreCase(data, options)) {
            value = value.toLowerCase();

            return (element) => {
                const attribute = adapter.getAttributeValue(element, name);
                return (
                    attribute != null &&
                    attribute.length >= length &&
                    attribute.substr(0, length).toLowerCase() === value &&
                    next(element)
                );
            };
        }

        return (element) =>
            !!adapter.getAttributeValue(element, name)?.startsWith(value) &&
            next(element);
    },
    end(next, data, options) {
        const { adapter } = options;
        const { name } = data;
        let { value } = data;
        const length = -value.length;

        if (length === 0) {
            return boolbase.falseFunc;
        }

        if (shouldIgnoreCase(data, options)) {
            value = value.toLowerCase();

            return (element) =>
                adapter
                    .getAttributeValue(element, name)
                    ?.substr(length)
                    .toLowerCase() === value && next(element);
        }

        return (element) =>
            !!adapter.getAttributeValue(element, name)?.endsWith(value) &&
            next(element);
    },
    any(next, data, options) {
        const { adapter } = options;
        const { name, value } = data;

        if (value === "") {
            return boolbase.falseFunc;
        }

        if (shouldIgnoreCase(data, options)) {
            const regex = new RegExp(escapeRegex(value), "i");

            return function anyIC(element) {
                const attribute = adapter.getAttributeValue(element, name);
                return (
                    attribute != null &&
                    attribute.length >= value.length &&
                    regex.test(attribute) &&
                    next(element)
                );
            };
        }

        return (element) =>
            !!adapter.getAttributeValue(element, name)?.includes(value) &&
            next(element);
    },
    not(next, data, options) {
        const { adapter } = options;
        const { name } = data;
        let { value } = data;

        if (value === "") {
            return (element) =>
                !!adapter.getAttributeValue(element, name) && next(element);
        }
        if (shouldIgnoreCase(data, options)) {
            value = value.toLowerCase();

            return (element) => {
                const attribute = adapter.getAttributeValue(element, name);
                return (
                    (attribute == null ||
                        attribute.length !== value.length ||
                        attribute.toLowerCase() !== value) &&
                    next(element)
                );
            };
        }

        return (element) =>
            adapter.getAttributeValue(element, name) !== value && next(element);
    },
};
