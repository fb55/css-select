CSSwhat = require "CSSwhat"
{helpers, env} = require "./helpers"
attributeRules = require "./attributes"

pseudos = {}

generalRules = {
	__proto__: require "./general"

	#attributes
	id: (next, {value}) -> attributeRules.equals next, "id", value, false
	class: (next, {value}) -> attributeRules.element next, "class", value, false
	attribute: (next, {ignoreCase, action, name, value}) ->
		value = value.toLowerCase() if ignoreCase
		attributeRules[action] next, name, value, ignoreCase
	
	#pseudos
	pseudo: (next, {name, data: subselect}) ->
		if CSSselect.filters[name]? then CSSselect.filters[name] next, subselect
		else if pseudos[name]?
			"
			if(pseudos[#{helpers.quote name}](elem, #{helpers.quote subselect})){
				#{next}
			}
			"
		else throw new SyntaxError "doesn't support pseudo-selector :#{name}"
}

sortByProcedure = (arr) ->
	parts = []
	i = last = 0
	j = arr.length - 1
	end = false

	sortFunc = ({type:a}, {type:b}) -> procedure[a] - procedure[b]

	while i <= j
		if procedure[arr[i].type] is -1 or (end = i is j)
			if end then i += 1
			parts = parts.concat arr.slice(last, i).sort sortFunc
			last = parts.push arr[i] unless end
		i++

	parts

procedure =
	universal: 5
	id: 4
	tag: 3
	class: 2
	attribute: 1
	pseudo: 0
	descendant: -1
	child: -1
	sibling: -1
	adjacent: -1

parse = (selector) ->
	selector = CSSwhat(selector) unless typeof selector is "object"
	
	functions = selector.map((arr) ->
		arr = sortByProcedure arr
		func = helpers.ROOT_FUNC
		i = 0
		j = arr.length
		
		while i < j and func isnt helpers.FALSE_FUNC
			func = generalRules[arr[i].type] func, arr[i]
			i++
		func
	).filter((func) -> func not in [helpers.ROOT_FUNC, helpers.FALSE_FUNC])
	
	helpers.uniqueNames.reset() #reset the counter

	if functions.length is 0 then helpers.FALSE_FUNC
	else if functions.length is 1 then functions[0]
	else if helpers.TRUE_FUNC in functions then helpers.TRUE_FUNC
	else functions.join "\n"

getFunc = (selector) -> eval "(function(elem){#{parse selector}})" #can't use function constructor or won't support pseudos

CSSselect = module.exports = (query, elem) ->
	query = getFunc query if typeof query != "function"
	if arguments.length != 1 then CSSselect.iterate query, elem else query

CSSselect.parse = getFunc
CSSselect.getSource = parse

CSSselect.filters = require "./filters"
CSSselect.pseudos = pseudos

CSSselect.is = (elem, query) ->
	query = getFunc(query) if typeof query != "function"
	query elem

CSSselect.iterate = (query, elems) ->
	query = getFunc(query) unless typeof query is "function"
	return [] if query is helpers.FALSE_FUNC
	elems = elems.children unless Array.isArray(elems)
	iterate query, elems

isElement = new Function "elem", "return #{env.isElement "elem"}"

iterate = (query, elems) ->
	result = []

	for elem in elems
		continue unless isElement elem
		result.push elem if query elem
		result = result.concat(iterate query, elem.children) if elem.children
	result

module.exports = CSSselect