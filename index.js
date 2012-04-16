(function(global) {
    var re_whitespace = /\s+/,
        re_name = /^(?:[\w\-]|\\.)+/, //https://github.com/jquery/sizzle/blob/master/sizzle.js#L378 /^(?:[\w\u00c0-\uFFFF\-]|\\.)+/
        re_par = /\(.*?\)/,
        re_cleanSelector = / ?([>~+]) ?/g,
        filters = {
            not: function(next, select) {
                var func = parse(select);
                return function(elem) {
                    if (!func(elem)) return next(elem);
                };
            },
            root: function(next) {
                return function(elem) {
                    if (!elem.parent) return next(elem);
                };
            },
            empty: function(next) {
                return function(elem) {
                    if (!elem.children || elem.children.length === 0) return next(elem);
                };
            },
            "only-child": function(next) {
                return function(elem) {
                    if (elem.parent && elem.parent.children.length === 1) return next(elem);
                };
            } /*,
        "nth-child": function(next, num){
        	// TODO
        	return next;
        }*/
        };

    var parse = function(selector, cb) {
        var p = new Parser(selector, cb);
        return p.getFunc();
    };

    var Parser = function(selector, cb) {
        this._selector = selector;
        if (typeof cb === "function") this.func = cb;

        this._clean();
        this._parse();
    };

    Parser.prototype.func = function() {
        return true;
    };

    Parser.prototype.getFunc = function() {
        return this.func;
    };

    Parser.prototype._clean = function(selector) {
        this._selector = this._selector
            .trim()
            .replace(re_whitespace, " ")
            .replace(re_cleanSelector, "$1");
    };

    Parser.prototype._parse = function() {
        var firstChar;
        while (this._selector !== "") {
            if (re_name.test(this._selector)) {
                this._processTag();
            } else {
                firstChar = this._selector.charAt(0);
                this._selector = this._selector.substr(1);
                switch (firstChar) {
                    case "*":
                        continue;
                    case "#":
                        this._processId();
                        break;
                    case "+":
                        this._processPlus();
                        break;
                    case ".":
                        this._processClass();
                        break;
                    case " ":
                        this._processSpace();
                        break;
                    case "~":
                        this._processTilde();
                        break;
                    case ":":
                        this._processColon();
                        break;
                    case ">":
                        this._processArrow();
                        break;
                    case "[":
                        this._processBracket();
                        break;
                    //otherwise, the parser needs to throw or it would enter an infinite loop
                    default:
                        throw Error("Unmatched selector:" + firstChar + this._selector);
                }
            }
        }
    };

    Parser.prototype._getName = function() {
        var sub = this._selector.match(re_name)[0];
        this._selector = this._selector.substr(sub.length);
        return sub;
    };

    Parser.prototype._processTag = function() {
        var next = this.func,
            name = this._getName();
        this.func = function(elem) {
            if (elem.name === name) return next(elem);
        };
    };

    Parser.prototype._processClass = function() {
        this._matchElement("class", this._getName(), false);
    };

    Parser.prototype._matchElement = function(name, value, ignoreCase) {
        this._buildRe(name, "(?:^|\\s)" + value + "(?:$|\\s)", ignoreCase);
    };

    Parser.prototype._processId = function() {
        this._matchExact("id", this._getName(), false);
    };

    Parser.prototype._matchExact = function(name, value, ignoreCase) {
        if (ignoreCase) {
            this._buildRe(name, "^" + value + "$", true);
            return;
        }
        var next = this.func;
        this.func = function(elem) {
            if (name in elem.attribs && elem.attribs[name] === value) return next(elem);
        };
    };

    Parser.prototype._buildRe = function(name, value, ignoreCase) {
        var next = this.func,
            regex;

        if (ignoreCase) regex = new RegExp(value, "i");
        else regex = new RegExp(value);
        this.func = function(elem) {
            if (name in elem.attribs && regex.test(elem.attribs[name])) return next(elem);
        };
    };

    Parser.prototype._processColon = function() {
        /*if(selector.charAt(0) === ":"){
    	//pseudo-element
    	// TODO
    }*/

        var name = this._getName(),
            subselect;

        if (this._selector.charAt(0) === "(") {
            subselect = this._selector.substring(1, this._selector.indexOf(")", 2));
            this._selector = this._selector.substr(subselect.length + 2);
        }
        if (name in filters) this.func = filters[name](this.func, subselect);
    };

    Parser.prototype._processPlus = function() {
        var next = this.func;

        this.func = function(elem) {
            if (elem.parent && elem.parent.children) {
                for (var i = 0, j = elem.parent.children.length; i < j; i++) {
                    if (elem === elem.parent.children[i]) continue;
                    if (next(elem.parent.children[i])) return true;
                }
            }
        };
    };

    Parser.prototype._processSpace = function() {
        var next = this.func;

        this.func = function(elem) {
            while ((elem = elem.parent)) {
                if (next(elem)) return true;
            }
        };
    };

    Parser.prototype._processArrow = function() {
        var next = this.func;

        this.func = function(elem) {
            if (elem.parent) return next(elem.parent);
        };
    };

    Parser.prototype._processTilde = function() {
        var next = this.func;
        this.func = function(elem) {
            if (!elem.parent || !elem.parent.children) return;
            var index = elem.parent.children.indexOf(elem);
            while (--index !== -1) {
                if (next(elem.parent.children[index])) return true;
            }
        };
    };

    Parser.prototype._processBracket = function() {
        var next = this.func;

        if (this._selector.charAt(0) === " ") this._selector = this._selector.substr(1);

        var name = this._getName(),
            action = this._selector.charAt(0);

        if (action === " ") {
            action = this._selector.charAt(1);
            this._selector = this._selector.substr(2);
        } else this._selector = this._selector.substr(1);

        if (action === "]") {
            return function(elem) {
                if (name in elem.attribs) return next(elem);
            };
        }

        var value = this._selector.substr(0, this._selector.indexOf("]"));
        this._selector = this._selector.substr(value.length + 1);

        value = value.trim();

        if (action !== "=") {
            if (value.charAt(0) !== "=") return;
            if (value.charAt(1) === " ") value = value.substr(2);
            else value = value.substr(1);
        } else {
            if (value.charAt(1) === " ") value = value.substr(1);
        }

        var i = value.substr(-2) === " i";
        if (i) value = value.slice(0, -2);

        if (value.charAt(0) === '"') value = value.substr(1, value.indexOf('"', 1));
        if (value.charAt(0) === "'") value = value.substr(1, value.indexOf("'", 1));

        switch (action) {
            case "=":
                return this._matchExact(name, value, i);
            case "~":
                return this._matchElement(name, value, i);
            case "*":
                return this._buildRe(name, value, i);
            case "$":
                return this._buildRe(name, value + "$", i);
            case "^":
                return this._buildRe(name, "^" + value, i);
            case "|":
                return this._buildRe(name, "^" + value + "(?:$|-)", i);
            default:
                return; // ignore it
        }
    };

    var CSSselect = function(selector, cb) {
        if (selector.indexOf(",") !== -1) {
            //TODO move this to the parser
            selector = selector.split(",").map(parse);
            var num = selector.length;
            return function(elem) {
                for (var i = 0; i < num; i++) {
                    if (selector[i](elem)) return cb ? cb(elem) : true;
                }
            };
        }

        return parse(selector);
    };

    if (typeof module !== "undefined" && "exports" in module) {
        module.exports = CSSselect;
    } else {
        if (typeof define === "function" && define.amd) {
            define("CSSselect", function() {
                return CSSselect;
            });
        }
        global.CSSselect = CSSselect;
    }
})(typeof window === "object" ? window : this);
