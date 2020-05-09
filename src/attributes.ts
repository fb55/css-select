import { falseFunc } from "boolbase";
import { CompiledQuery, InternalOptions } from "./types";
import { AttributeSelector } from "css-what";

//https://github.com/slevithan/XRegExp/blob/master/src/xregexp.js#L469
const reChars = /[-[\]{}()*+?.,\\^$|#\s]/g;

/*
	attribute selectors
*/
const attributeRules = {
    __proto__: null,
    equals(
        next: CompiledQuery,
        data: AttributeSelector,
        options: InternalOptions
    ): CompiledQuery {
        const { name } = data;
        let { value } = data;
        const { adapter } = options;

        if (data.ignoreCase) {
            value = value.toLowerCase();

            return function equalsIC(elem) {
                const attr = adapter.getAttributeValue(elem, name);
                return (
                    attr != null && attr.toLowerCase() === value && next(elem)
                );
            };
        }

        return function equals(elem) {
            return (
                adapter.getAttributeValue(elem, name) === value && next(elem)
            );
        };
    },
    hyphen(
        next: CompiledQuery,
        data: AttributeSelector,
        options: InternalOptions
    ): CompiledQuery {
        const { name } = data;
        let { value } = data;
        const len = value.length;
        const { adapter } = options;

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
    element(
        next: CompiledQuery,
        data: AttributeSelector,
        options: InternalOptions
    ): CompiledQuery {
        const { name } = data;
        let { value } = data;
        const { adapter } = options;

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
    exists(
        next: CompiledQuery,
        data: AttributeSelector,
        options: InternalOptions
    ): CompiledQuery {
        const { name } = data;
        const { adapter } = options;

        return function exists(elem) {
            return adapter.hasAttrib(elem, name) && next(elem);
        };
    },
    start(
        next: CompiledQuery,
        data: AttributeSelector,
        options: InternalOptions
    ): CompiledQuery {
        const { name } = data;
        let { value } = data;
        const len = value.length;
        const { adapter } = options;

        if (len === 0) {
            return falseFunc;
        }

        if (data.ignoreCase) {
            value = value.toLowerCase();

            return function startIC(elem) {
                const attr = adapter.getAttributeValue(elem, name);
                return (
                    attr != null &&
                    attr.substr(0, len).toLowerCase() === value &&
                    next(elem)
                );
            };
        }

        return function start(elem) {
            const attr = adapter.getAttributeValue(elem, name);
            return attr != null && attr.substr(0, len) === value && next(elem);
        };
    },
    end(
        next: CompiledQuery,
        data: AttributeSelector,
        options: InternalOptions
    ): CompiledQuery {
        const { name } = data;
        let { value } = data;
        const len = -value.length;
        const { adapter } = options;

        if (len === 0) {
            return falseFunc;
        }

        if (data.ignoreCase) {
            value = value.toLowerCase();

            return function endIC(elem) {
                const attr = adapter.getAttributeValue(elem, name);
                return (
                    attr != null &&
                    attr.substr(len).toLowerCase() === value &&
                    next(elem)
                );
            };
        }

        return function end(elem) {
            const attr = adapter.getAttributeValue(elem, name);
            return attr != null && attr.substr(len) === value && next(elem);
        };
    },
    any(
        next: CompiledQuery,
        data: AttributeSelector,
        options: InternalOptions
    ): CompiledQuery {
        const { name } = data;
        const { value } = data;
        const { adapter } = options;

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

        return function any(elem) {
            const attr = adapter.getAttributeValue(elem, name);
            return attr?.includes(value) && next(elem);
        };
    },
    not(
        next: CompiledQuery,
        data: AttributeSelector,
        options: InternalOptions
    ): CompiledQuery {
        const { name } = data;
        let { value } = data;
        const { adapter } = options;

        if (value === "") {
            return function notEmpty(elem) {
                return !!adapter.getAttributeValue(elem, name) && next(elem);
            };
        } else if (data.ignoreCase) {
            value = value.toLowerCase();

            return function notIC(elem) {
                const attr = adapter.getAttributeValue(elem, name);
                return (
                    attr != null && attr.toLowerCase() !== value && next(elem)
                );
            };
        }

        return function not(elem) {
            return (
                adapter.getAttributeValue(elem, name) !== value && next(elem)
            );
        };
    },
};

export function compile(
    next: CompiledQuery,
    data: AttributeSelector,
    options: InternalOptions
): CompiledQuery {
    if (options?.strict && (data.ignoreCase || data.action === "not")) {
        throw new Error("Unsupported attribute selector");
    }
    return attributeRules[data.action](next, data, options);
}

export { attributeRules as rules };
