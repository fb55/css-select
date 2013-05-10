#CSSselect [![Build Status](https://secure.travis-ci.org/fb55/CSSselect.png?branch=master)](http://travis-ci.org/fb55/CSSselect)

a CSS selector compiler/engine

##What?

CSSselect turns a CSS selector into a a function that tests elements if they match it. When searching for elements, checking needs to happen "from the top", similar to how browsers execute CSS selectors.

To give you a head start, `is` and `iterate` methods are provided that can be used to easily query a document.

In it's default configuration, CSSselect uses the DOM produced by the [`domhandler`](https://github.com/fb55/domhandler) module.

##Why?

The common approach of executing CSS selectors (used for example by [`Sizzle`](https://github.com/jquery/sizzle), [`nwmatcher`](https://github.com/dperini/nwmatcher/), [`qwery`](https://github.com/ded/qwery)) is to execute every component of the selector in order, from left to right. The selector `a b` for example will first look for `a` elements, then search these for `b` elements.

While this works, it has some downsides: Children of `a`s will be checked multiple times, first, to check if they are also `a`s, then, for every superior `a` once, if they are `b`s. Using [Big O notation](http://en.wikipedia.org/wiki/Big_O_notation), that would be `O(n^2)`.

The far better approach is to first look for `b` elements, then check if they have superior `a` elements: Using big O notation again, that would be `O(n)`.

And that's exactly what CSSselect does.

##How?

By stacking functions!

Initially, we take a function that simply returns `true`. Every component of the selector (like tagname checks, attribute comparisons) is now turned into a function that first checks if the own condition is met (eg. if the tagname matches) and then passes the element to the function on it's left side. The rightmost function is then returned.

---

License: BSD-like
