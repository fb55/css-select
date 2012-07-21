possibleChars = []
	.concat (String.fromCharCode c for c in ["0".charCodeAt(0).."9".charCodeAt(0)])
	.concat (String.fromCharCode c for c in ["A".charCodeAt(0).."Z".charCodeAt(0)])
	.concat (String.fromCharCode c for c in ["a".charCodeAt(0).."z".charCodeAt(0)])
	.concat "_", "$"

uniqNameCounter = 0

getUniqueName = () ->
	name = "_$_" #a unique prefix to avoid collisions
	counter = uniqNameCounter++
	while counter > 0
		if counter >= possibleChars.length
			counter -= possibleChars.length-1
			name += possibleChars[possibleChars.length-1]
		else
			name += possibleChars[counter]
			counter = 0
	name

helpers =
	# we need unique names for saving the elem variable
	uniqueNames:
		get: getUniqueName
		reset: () -> uniqNameCounter = 0
	#returns the siblings of an element (including the element)
	getSiblings: (elem) ->
		"
		#{env.getParent elem} && #{env.getChildren env.getParent elem}
		"
	#returns a function that checks if an attribute has a certain value
	checkAttrib: (next, name, value, ignoreCase) ->
		"
		if(#{env.hasAttrib "elem", name} && #{env.getAttributeValue "elem", name}
			#{if ignoreCase then ".toLowerCase()" else ""} === #{helpers.quote value}){
			#{next}
		}
		"
	quote: (str) -> "'#{str.replace(/['\\]/g, "\\$&")}'" #escape all single quotes
	ROOT_FUNC: "return true"
	TRUE_FUNC: "return true;"
	FALSE_FUNC: "return false;"

#functions that make porting the library to another DOM easy
env =
	isElement: (elem = "elem") ->
		"(#{elem}.type === 'tag' || #{elem}.type === 'style' || #{elem}.type === 'script')"
	getChildren: (elem = "elem") -> "#{elem}.children"
	getParent: (elem = "elem") -> "#{elem}.parent"
	getAttributeValue: (elem = "elem", name) -> "#{elem}.attribs[#{helpers.quote name}]"
	hasAttrib: (elem = "elem", name) -> "(#{elem}.attribs && #{helpers.quote name} in #{elem}.attribs)"
	getName: (elem = "elem") -> "#{elem}.name"
	getText: (elem = "elem") ->
		"
		(function getText(node){
			var text = '',
				childs = #{env.getChildren "node"};
		
			if(!childs) return text;
		
			for(var i = 0, j = childs.length; i < j; i++){
				if(#{env.isElement "childs[i]"}) text += getText(childs[i]);
				else text += childs[i].data;
			}
		
			return text;
		})(#{elem})
		"

module.exports = {helpers, env}