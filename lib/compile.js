/*
	compiles a selector to an executable function
*/

module.exports = compile;

const parse = require("css-what").parse;
const BaseFuncs = require("boolbase");
const sortRules = require("./sort.js");
const procedure = require("./procedure.json");
const Rules = require("./general.js");
const Pseudos = require("./pseudos.js");
const trueFunc = BaseFuncs.trueFunc;
const falseFunc = BaseFuncs.falseFunc;

const filters = Pseudos.filters;

function compile(selector, options, context) {
    const next = compileUnsafe(selector, options, context);
    return wrap(next, options);
}

function wrap(next, options) {
    const adapter = options.adapter;

    return function base(elem) {
        return adapter.isTag(elem) && next(elem);
    };
}

function compileUnsafe(selector, options, context) {
    const token = parse(selector, options);
    return compileToken(token, options, context);
}

function includesScopePseudo(t) {
    return (
        t.type === "pseudo" &&
        (t.name === "scope" ||
            (Array.isArray(t.data) &&
                t.data.some((data) => data.some(includesScopePseudo))))
    );
}

const DESCENDANT_TOKEN = { type: "descendant" };
const FLEXIBLE_DESCENDANT_TOKEN = { type: "_flexibleDescendant" };
const SCOPE_TOKEN = { type: "pseudo", name: "scope" };
const PLACEHOLDER_ELEMENT = {};

//CSS 4 Spec (Draft): 3.3.1. Absolutizing a Scope-relative Selector
//http://www.w3.org/TR/selectors4/#absolutizing
function absolutize(token, options, context) {
    const adapter = options.adapter;

    //TODO better check if context is document
    const hasContext =
        !!context &&
        !!context.length &&
        context.every((e) => e === PLACEHOLDER_ELEMENT || !!adapter.getParent(e));

    token.forEach((t) => {
        if (t.length > 0 && isTraversal(t[0]) && t[0].type !== "descendant") {
            //don't return in else branch
        } else if (
            hasContext &&
            !(Array.isArray(t)
                ? t.some(includesScopePseudo)
                : includesScopePseudo(t))
        ) {
            t.unshift(DESCENDANT_TOKEN);
        } else {
            return;
        }

        t.unshift(SCOPE_TOKEN);
    });
}

function compileToken(token, options, context) {
    token = token.filter((t) => t.length > 0);

    token.forEach(sortRules);

    const isArrayContext = Array.isArray(context);

    context = (options && options.context) || context;

    if (context && !isArrayContext) context = [context];

    absolutize(token, options, context);

    let shouldTestNextSiblings = false;

    const query = token
        .map((rules) => {
            if (rules[0] && rules[1] && rules[0].name === "scope") {
                const ruleType = rules[1].type;
                if (isArrayContext && ruleType === "descendant") {
                    rules[1] = FLEXIBLE_DESCENDANT_TOKEN;
                } else if (ruleType === "adjacent" || ruleType === "sibling") {
                    shouldTestNextSiblings = true;
                }
            }
            return compileRules(rules, options, context);
        })
        .reduce(reduceRules, falseFunc);

    query.shouldTestNextSiblings = shouldTestNextSiblings;

    return query;
}

function isTraversal(t) {
    return procedure[t.type] < 0;
}

function compileRules(rules, options, context) {
    return rules.reduce((func, rule) => {
        if (func === falseFunc) return func;

        if (!(rule.type in Rules)) {
            throw new Error(
                `Rule type ${  rule.type  } is not supported by css-select`
            );
        }

        return Rules[rule.type](func, rule, options, context);
    }, (options && options.rootFunc) || trueFunc);
}

function reduceRules(a, b) {
    if (b === falseFunc || a === trueFunc) {
        return a;
    }
    if (a === falseFunc || b === trueFunc) {
        return b;
    }

    return function combine(elem) {
        return a(elem) || b(elem);
    };
}

function containsTraversal(t) {
    return t.some(isTraversal);
}

//:not, :has and :matches have to compile selectors
//doing this in lib/pseudos.js would lead to circular dependencies,
//so we add them here
filters.not = function (next, token, options, context) {
    const opts = {
        xmlMode: !!(options && options.xmlMode),
        strict: !!(options && options.strict),
        adapter: options.adapter,
    };

    if (opts.strict) {
        if (token.length > 1 || token.some(containsTraversal)) {
            throw new Error(
                "complex selectors in :not aren't allowed in strict mode"
            );
        }
    }

    const func = compileToken(token, opts, context);

    if (func === falseFunc) return next;
    if (func === trueFunc) return falseFunc;

    return function not(elem) {
        return !func(elem) && next(elem);
    };
};

filters.has = function (next, token, options) {
    const adapter = options.adapter;
    const opts = {
        xmlMode: !!(options && options.xmlMode),
        strict: !!(options && options.strict),
        adapter,
    };

    //FIXME: Uses an array as a pointer to the current element (side effects)
    const context = token.some(containsTraversal) ? [PLACEHOLDER_ELEMENT] : null;

    let func = compileToken(token, opts, context);

    if (func === falseFunc) return falseFunc;
    if (func === trueFunc) {
        return function hasChild(elem) {
            return adapter.getChildren(elem).some(adapter.isTag) && next(elem);
        };
    }

    func = wrap(func, options);

    if (context) {
        return function has(elem) {
            return (
                next(elem) &&
                ((context[0] = elem),
                adapter.existsOne(func, adapter.getChildren(elem)))
            );
        };
    }

    return function has(elem) {
        return next(elem) && adapter.existsOne(func, adapter.getChildren(elem));
    };
};

filters.matches = function (next, token, options, context) {
    const opts = {
        xmlMode: !!(options && options.xmlMode),
        strict: !!(options && options.strict),
        rootFunc: next,
        adapter: options.adapter,
    };

    return compileToken(token, opts, context);
};

compile.compileToken = compileToken;
compile.compileUnsafe = compileUnsafe;
compile.Pseudos = Pseudos;
