#CSSselect [![Build Status](https://secure.travis-ci.org/fb55/CSSselect.png?branch=master)](http://travis-ci.org/fb55/CSSselect)

a CSS selector compiler/engine

##What?

CSSselect turns CSS selectors into functions that tests if elements match them. When searching for elements, testing is executed "from the top", similar to how browsers execute CSS selectors.

In its default configuration, CSSselect queries the DOM structure of the [`domhandler`](https://github.com/fb55/domhandler) module.

__Features:__

- Full implementation of CSS3 selectors
- Partial implementation of jQuery/Sizzle extensions
- 100% test coverage

##API

```js
var CSSselect = require("CSSselect");
```

####`CSSselect(query, elems, options)`

- `query` can be either a function or a string. If it's a string, the string is compiled as a CSS selector.
- `elems` can be either an array of elements, or a single element. If it is an element, its children will be used (so we're working with an array again).
- `options` is described below.

Queries `elems`, returns an array containing all matches.

Aliases: `CSSselect.selectAll(query, elems)`, `CSSselect.iterate(query, elems)`.

####`CSSselect.compile(query)`

Compiles the query, returns the function.

####`CSSselect.is(elem, query, options)`

Tests whether or not an element is matched by `query`. `query` can be either a CSS selector or a function.

####`CSSselect.selectOne(query, elems, options)`

Arguments are the same as for `CSSselect(query, elems)`. Only returns the first match, or `null` if there was no match.

###Options

- `xmlMode`: When enabled, tag names will be case-sensitive. Default: `false`.
- `strict`: Limits the module to only use CSS3 selectors. Default: `false`.
- `rootFunc`: The last function in the stack. Will be called with the last element that's looked at. Should return `true` if it shouldn't be called again for every matching subselector.

##Why?

The common approach of executing CSS selectors (used eg. by [`Sizzle`](https://github.com/jquery/sizzle), [`nwmatcher`](https://github.com/dperini/nwmatcher/) and [`qwery`](https://github.com/ded/qwery)) is to execute every component of the selector in order, from left to right. The selector `a b` for example will first look for `a` elements, then search these for `b` elements.

While this works, it has some downsides: Children of `a`s will be checked multiple times, first, to check if they are also `a`s, then, for every superior `a` once, if they are `b`s. Using [Big O notation](http://en.wikipedia.org/wiki/Big_O_notation), that would be `O(n^2)`.

The far more efficient approach is to first look for `b` elements, then check if they have superior `a` elements: Using big O notation again, that would be `O(n)`.

And that's exactly what CSSselect does.

##How?

By stacking functions!

_//TODO: Better explanation. For now, if you're interested, have a look at the source code._

##Supported selectors:

* Universal (`*`)
* Tag (`<tagname>`)
* Descendant (` `)
* Child (`>`)
* Parent (`<`) *
* Sibling (`+`)
* Adjacent (`~`)
* Attribute (`[attr=foo]`), with supported comparisons:
  * `[attr]` (existential)
  * `=`
  * `~=`
  * `|=`
  * `*=`
  * `^=`
  * `$=`
  * `!=` *
  * Also, `i` can be added after the comparison to make the comparison case-insensitive (eg. `[attr=foo i]`) *
* Pseudos:
  * `:not`
  * `:contains` *
  * `:has` *
  * `:root`
  * `:empty`
  * `:parent` *
  * `:[first|last]-child[-of-type]`
  * `:only-of-type`, `:only-child`
  * `:nth-[last-]child[-of-type]`
  * `:selected` *, `:checked`
  * `:enabled`, `:disabled`
  * `:header`, `:button`, `:input`, `:text`, `:checkbox`, `:file`, `:password`, `:reset`, `:radio` etc. *

__*__: Non-standard extensions

---

License: BSD-like
