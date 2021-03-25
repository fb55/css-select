import { falseFunc } from "boolbase";
import { CompiledQuery, InternalOptions } from "./types";
import type { AttributeSelector, AttributeAction } from "css-what";

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
 * Attribute selectors
 */
export const attributeRules: Record<
    AttributeAction,
    <Node, ElementNode extends Node>(
        next: CompiledQuery<ElementNode>,
        data: AttributeSelector,
        options: InternalOptions<Node, ElementNode>
    ) => CompiledQuery<ElementNode>
> = {
    equals(next, data, { adapter }) {
        const { name } = data;
        let { value } = data;

        if (data.ignoreCase) {
            value = value.toLowerCase();

            return (elem) => {
                const attr = adapter.getAttributeValue(elem, name);
                return (
                    attr != null &&
                    attr.length === value.length &&
                    attr.toLowerCase() === value &&
                    next(elem)
                );
            };
        }

        return (elem) =>
            adapter.getAttributeValue(elem, name) === value && next(elem);
    },
    hyphen(next, data, { adapter }) {
        const { name } = data;
        let { value } = data;
        const len = value.length;

        if (data.ignoreCase) {
            value = value.toLowerCase();

            return function hyphenIC(elem) {
                const attr = adapter.getAttributeValue(elem, name);
                return (
                    attr != null &&
                    (attr.length === len || attr.charAt(len) === "-") &&
                    attr.substr(0, len).toLowerCase() === value &&
                    next(elem)
                );
            };
        }

        return function hyphen(elem) {
            const attr = adapter.getAttributeValue(elem, name);
            return (
                attr != null &&
                (attr.length === len || attr.charAt(len) === "-") &&
                attr.substr(0, len) === value &&
                next(elem)
            );
        };
    },
    element(next, { name, value, ignoreCase }, { adapter }) {
        if (/\s/.test(value)) {
            return falseFunc;
        }

        const regex = new RegExp(
            `(?:^|\\s)${escapeRegex(value)}(?:$|\\s)`,
            ignoreCase ? "i" : ""
        );

        return function element(elem) {
            const attr = adapter.getAttributeValue(elem, name);
            return (
                attr != null &&
                attr.length >= value.length &&
                regex.test(attr) &&
                next(elem)
            );
        };
    },
    exists(next, { name }, { adapter }) {
        return (elem) => adapter.hasAttrib(elem, name) && next(elem);
    },
    start(next, data, { adapter }) {
        const { name } = data;
        let { value } = data;
        const len = value.length;

        if (len === 0) {
            return falseFunc;
        }

        if (data.ignoreCase) {
            value = value.toLowerCase();

            return (elem) => {
                const attr = adapter.getAttributeValue(elem, name);
                return (
                    attr != null &&
                    attr.length >= len &&
                    attr.substr(0, len).toLowerCase() === value &&
                    next(elem)
                );
            };
        }

        return (elem) =>
            !!adapter.getAttributeValue(elem, name)?.startsWith(value) &&
            next(elem);
    },
    end(next, data, { adapter }) {
        const { name } = data;
        let { value } = data;
        const len = -value.length;

        if (len === 0) {
            return falseFunc;
        }

        if (data.ignoreCase) {
            value = value.toLowerCase();

            return (elem) =>
                adapter
                    .getAttributeValue(elem, name)
                    ?.substr(len)
                    .toLowerCase() === value && next(elem);
        }

        return (elem) =>
            !!adapter.getAttributeValue(elem, name)?.endsWith(value) &&
            next(elem);
    },
    any(next, data, { adapter }) {
        const { name, value } = data;

        if (value === "") {
            return falseFunc;
        }

        if (data.ignoreCase) {
            const regex = new RegExp(escapeRegex(value), "i");

            return function anyIC(elem) {
                const attr = adapter.getAttributeValue(elem, name);
                return (
                    attr != null &&
                    attr.length >= value.length &&
                    regex.test(attr) &&
                    next(elem)
                );
            };
        }

        return (elem) =>
            !!adapter.getAttributeValue(elem, name)?.includes(value) &&
            next(elem);
    },
    not(next, data, { adapter }) {
        const { name } = data;
        let { value } = data;

        if (value === "") {
            return (elem) =>
                !!adapter.getAttributeValue(elem, name) && next(elem);
        } else if (data.ignoreCase) {
            value = value.toLowerCase();

            return (elem) => {
                const attr = adapter.getAttributeValue(elem, name);
                return (
                    (attr == null ||
                        attr.length !== value.length ||
                        attr.toLowerCase() !== value) &&
                    next(elem)
                );
            };
        }

        return (elem) =>
            adapter.getAttributeValue(elem, name) !== value && next(elem);
    },
};
