#CSSselect [![Build Status](https://secure.travis-ci.org/fb55/CSSselect.png?branch=master)](http://travis-ci.org/fb55/CSSselect)

a CSS selector compiler/engine

##What?

CSSselect turns CSS selectors into functions that tests if elements match them. When searching for elements, testing is executed "from the top", similar to how browsers execute CSS selectors.

In it's default configuration, CSSselect provides functions to query the DOM produced by the [`domhandler`](https://github.com/fb55/domhandler) module.

##Why?

The common approach of executing CSS selectors (used eg. by [`Sizzle`](https://github.com/jquery/sizzle), [`nwmatcher`](https://github.com/dperini/nwmatcher/) and [`qwery`](https://github.com/ded/qwery)) is to execute every component of the selector in order, from left to right. The selector `a b` for example will first look for `a` elements, then search these for `b` elements.

While this works, it has some downsides: Children of `a`s will be checked multiple times, first, to check if they are also `a`s, then, for every superior `a` once, if they are `b`s. Using [Big O notation](http://en.wikipedia.org/wiki/Big_O_notation), that would be `O(n^2)`.

The far more efficient approach is to first look for `b` elements, then check if they have superior `a` elements: Using big O notation again, that would be `O(n)`.

And that's exactly what CSSselect does.

##How?

By stacking functions!

_//TODO: Better explanation (for now, if you're interested, have a look at the source code)_

##API

```js
var CSSselect = require("CSSselect");
```

####`CSSselect(query[, elems])`

Compiles the query. If `elems` is specified, it's queried and the result is returned. Otherwise, the function is returned.

(Note: This is a pretty awful API. Don't use it. Will be changed.)

####`CSSselect.parse(query)`

Compiles the query, returns the function.

(Note: Will be renamed to `compile`, but `parse` stays an alias.)

####`CSSselect.is(elem, query)`

Tests whether or not an element is matched by `query`. `query` can be either a CSS selector or a function.

####`CSSselect.iterate(query, elems)`

Traverses `elems` (or, if `elems` is only a single element, its children) and returns all elements that match `query`. Once again, `query` can be either a CSS selector or a function.

---

License: BSD-like
