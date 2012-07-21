{helpers, env} = require "./helpers"

reChars = /[-[\]{}()*+?.,\\^$|#\s]/g; #https://github.com/slevithan/XRegExp/blob/master/src/xregexp.js#L469

wrapReRule = (pre, post) ->
	(next, name, value, ignoreCase) ->
		"
		if(
			#{env.hasAttrib "elem", name} &&
			/#{pre + value.replace(reChars, "\\$&") + post}/#{if ignoreCase then "i" else ""}.test(#{env.getAttributeValue "elem", name})
		){
			#{next}
		} 
		"

###
	attribute selectors
###

module.exports =
	equals: helpers.checkAttrib
	hyphen: wrapReRule "^", "(?:$|-)"
	element: wrapReRule "(?:^|\\s)", "(?:$|\\s)"
	exists: (next, name) -> "if(#{env.hasAttrib "elem", name}){ #{next} }"
	start: (next, name, value, ignoreCase) ->
		"
		if(
			#{env.hasAttrib "elem", name} &&
		    #{env.getAttributeValue "elem", name}.substr(0, #{value.length})
		    	#{if ignoreCase then ".toLowerCase()" else ""} === #{helpers.quote value}
		){
			#{next}
		}
		"
	end: (next, name, value, ignoreCase) ->
		"
		if(
			#{env.hasAttrib "elem", name} &&
		     #{env.getAttributeValue "elem", name}.substr(#{-value.length})
		     	#{if ignoreCase then ".toLowerCase()" else ""} === #{helpers.quote value}
		){
			#{next}
		}
		"
	any: (next, name, value, ignoreCase) ->
		"
		if(
			#{env.hasAttrib "elem", name} &&
		    #{env.getAttributeValue "elem", name}#{if ignoreCase then ".toLowerCase()" else ""}
		    	.indexOf(#{helpers.quote value}) >= 0
		){
			#{next}
		}
		"
	not: (next, name, value, ignoreCase) ->
		if value is ""
			"
			if(
				#{env.hasAttrib "elem", name} &&
				#{env.getAttributeValue "elem", name} !== ''
			){
				#{next}
			}
			"
		else
			"
			if(
				!#{env.hasAttrib "elem", name} ||
				#{env.getAttributeValue "elem", name}
					#{if ignoreCase then ".toLowerCase()" else ""} !== #{helpers.quote value}
			){
				#{next}
			}
			"