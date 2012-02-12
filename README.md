##What?

CSSselect is CSS selector parser. It returns a function that tests elements if they match a selector - checking needs to happen "from the top", like browser engines execute queries.

##Why?

Just take the following CSS query: `foo bar baz`. When the element named `baz` has like a billion children, every one of them needs to be checked if they match a query. Three times, to be precise, if run a CSS query from the start to the end (as e.g. JSDOM does). Yup, that's slow.

This library checks every element once. The more complex the query, the greater the benefit.

##How?

___TODO___

##Current State

1. The API needs to be improved
2. Currently, only a specific type of DOM is supported
    * All names (e.g. `parent` for the parent node) need to be changeable
    * The returned function assumes that only element nodes are present. Other node types need to be supported.
3. Documentation needs to be written