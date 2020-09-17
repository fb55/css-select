import { falseFunc } from "boolbase";
import { CompiledQuery, InternalOptions } from "./types";
import { AttributeSelector } from "css-what";

/*
 * All allowed characters in a regex, used for escaping.
 *
 * Taken from XRegExp, (c) 2007-2020 Steven Levithan under the MIT license
 * https://github.com/slevithan/xregexp/blob/95eeebeb8fac8754d54eafe2b4743661ac1cf028/src/xregexp.js#L794
 */
const reChars = /[-[\]{}()*+?.,\\^$|#\s]/g;

/*
 *Attribute selectors
 */
const attributeRules: Record<
    string,
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

            return (elem) =>
                adapter.getAttributeValue(elem, name)?.toLowerCase() ===
                    value && next(elem);
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
                attr.substr(0, len) === value &&
                (attr.length === len || attr.charAt(len) === "-") &&
                next(elem)
            );
        };
    },
    element(next, data, { adapter }) {
        const { name } = data;
        let { value } = data;

        if (/\s/.test(value)) {
            return falseFunc;
        }

        value = value.replace(reChars, "\\$&");

        const pattern = `(?:^|\\s)${value}(?:$|\\s)`;
        const flags = data.ignoreCase ? "i" : "";
        const regex = new RegExp(pattern, flags);

        return function element(elem) {
            const attr = adapter.getAttributeValue(elem, name);
            return attr != null && regex.test(attr) && next(elem);
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

            return (elem) =>
                adapter
                    .getAttributeValue(elem, name)
                    ?.substr(0, len)
                    .toLowerCase() === value && next(elem);
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
            const regex = new RegExp(value.replace(reChars, "\\$&"), "i");

            return function anyIC(elem) {
                const attr = adapter.getAttributeValue(elem, name);
                return attr != null && regex.test(attr) && next(elem);
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

            return (elem) =>
                adapter.getAttributeValue(elem, name)?.toLowerCase() !==
                    value && next(elem);
        }

        return (elem) =>
            adapter.getAttributeValue(elem, name) !== value && next(elem);
    },
};

export function compile<Node, ElementNode extends Node>(
    next: CompiledQuery<ElementNode>,
    data: AttributeSelector,
    options: InternalOptions<Node, ElementNode>
): CompiledQuery<ElementNode> {
    if (options.strict && (data.ignoreCase || data.action === "not")) {
        throw new Error("Unsupported attribute selector");
    }
    return attributeRules[data.action](next, data, options);
}

export { attributeRules as rules };
