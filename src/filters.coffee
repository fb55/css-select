CSSselect = require "./index"
{helpers, env} = require "./helpers"
{uniqueNames} = helpers

###
	returns a function that checks if an elements index matches the given rule
	highly optimized to return the fastest solution
###

re_nthElement = /^([+\-]?\d*n)?\s*([+\-])?\s*(\d)?$/

getNCheck = (formula) ->
	#parse the formula
	#b is lowered by 1 as the rule uses index 1 as the start
	formula = formula.trim().toLowerCase()
	if formula is "even"
		[a, b] = [2, -1]
	else if formula is "odd"
		[a, b] = [2, 0]
	else
		formula = formula.match re_nthElement
		return null unless formula? #rule couldn't be parsed
		if formula[1]
			a = parseInt formula[1], 10
			if not a
				if formula[1].charAt(0) is "-" then a = -1
				else a = 1
		else a = 0;
		if formula[3]
			b = parseInt((formula[2] || "") + formula[3], 10) - 1
		else b = -1

	#when b <= 0, a*n won't be possible for any matches when a < 0
	#besides, the specification says that no element is matched when a and b are 0
	return helpers.FALSE_FUNC if b < 0 and a <= 0

	#when b <= 0 and a === 1, they match any element
	return helpers.TRUE_FUNC if b < 0 and a is 1

	#when a is in the range -1..1, it matches any element (so only b is checked)
	return "pos - #{b} <= 0" if a is -1
	return "pos - #{b} >= 0" if a is 1
	return "pos === #{b}" if a is 0

	#when a > 0, modulo can be used to check if there is a match
	#TODO: needs to be checked
	return "pos >= 0 && (pos -= #{b}) >= 0 && (pos % #{a}) === 0" if a > 1

	a *= -1 #make a positive
	return "pos >= 0 && (pos -= #{b}) >= 0 && (pos % #{a}) === 0 && pos/#{a} < #{b}"

getAttribFunc = (name, value) ->
	(next) -> helpers.checkAttrib next, name, value, false

module.exports =
	not: (next, select) ->
		func = CSSselect.getSource select

		if func is helpers.FALSE_FUNC
			helpers.TRUE_FUNC if next is helpers.ROOT_FUNC
			else next
		else if func in [helpers.TRUE_FUNC, helpers.ROOT_FUNC] then helpers.FALSE_FUNC
		else "if(!(function(elem){#{func}})(elem)){ #{next} }"

	contains: (next, text) ->
		"if(#{env.getText "elem"}.indexOf(#{helpers.quote text}) >= 0){ #{next} }"

	has: (next, select) ->
		func = CSSselect.getSource select
		if func in [helpers.TRUE_FUNC, helpers.ROOT_FUNC] then next
		else if func is helpers.FALSE_FUNC then helpers.FALSE_FUNC
		
		else
			"
			if((function proc(elem){
				var children = #{env.getChildren "elem"};
				if(!children) return;
				for(var i = 0, j = children.length; i < j; i++){
					if(!#{env.isElement "children[i]"}) continue;
					if((function(elem){ #{func} })(children[i])) return true;
					if(proc(children[i])) return true;
				}
			})(elem)){ #{next} }
			"
	root: (next) -> "if(!#{env.getParent "elem"}){ #{next} }"
	empty: (next) ->
		"
		if(!#{env.getChildren "elem"} || #{env.getChildren "elem"}.length === 0){
		#{next}
		}
		"
	parent: (next) -> #:parent is the inverse of :empty
		"
		if(#{env.getChildren "elem"} && #{env.getChildren "elem"}.length !== 0){
		#{next}
		}
		"
	
	#location specific methods
	#first- and last-child methods return as soon as they find another element
	"first-child": (next) ->
		"
		var siblings = #{helpers.getSiblings "elem"};
		if(siblings){
			for(var i = 0, j = siblings.length; i < j; i++){
				if(#{env.isElement "siblings[i]"}){
					if(siblings[i] === elem){
						#{next}
					}
					break;
				}
			}
		}
		"
	"last-child": (next) ->
		"
		var siblings = #{helpers.getSiblings "elem"};
		if(siblings){
			for(var i = siblings.length-1; i >= 0; i--){
				if(#{env.isElement "siblings[i]"}){
					if(siblings[i] === elem){
						#{next}
					}
					break;
				}
			}
		}
		"
	"first-of-type": (next) ->
		"
		var siblings = #{helpers.getSiblings "elem"};
		if(siblings){
			for(var i = 0, j = siblings.length; i < j; i++){
				if(#{env.getName "siblings[i]"} === #{env.getName()}){
					if(siblings[i] === elem){
						#{next}
					}
					break;
				}
			}
		}
		"
	"last-of-type": (next) ->
		"
		var siblings = #{helpers.getSiblings "elem"};
		if(siblings){
			for(var i = siblings.length-1; i >= 0; i--){
				if(#{env.getName "siblings[i]"} === #{env.getName()}){
					if(siblings[i] === elem){
						#{next}
					}
					break;
				}
			}
		}
		"
	"only-of-type": (next) ->
		label = uniqueNames.get()
		"
		var siblings = #{helpers.getSiblings "elem"};
		#{label}: if(siblings){
			for(var i = 0, j = siblings.length; i < j; i++){
				if(siblings[i] === elem) continue;
				if(#{env.getName "siblings[i]"} === #{env.getName()}) break #{label};
			}
			
			#{next}
		}
		"
	"only-child": (next) ->
		label = uniqueNames.get()
		"
		var siblings = #{helpers.getSiblings "elem"};
		#{label}: if(siblings){
			if(siblings.length !== 1){
				for(var i = 0, j = siblings.length; i < j; i++){
					if(#{env.isElement "siblings[i]"} && siblings[i] !== elem) break #{label};
				}
			}
			
			#{next}
		}
		"

	#nth-element selectors
	"nth-child": (next, rule) ->
		rule = getNCheck rule

		return next if rule is null
		return func if rule is helpers.FALSE_FUNC
		if rule is helpers.TRUE_FUNC
			if next is helpers.ROOT_FUNC
				return rule
			else
				return next

		"
		var siblings = #{helpers.getSiblings "elem"};
		if(siblings){
			for(var pos = 0, i = 0, j = siblings.length; i < j; i++){
				if(siblings[i] === elem){
					if(#{rule}){ #{next} }
				}
				if(#{env.isElement "siblings[i]"}) pos++;
			}
		}
		"
	"nth-last-child": (next, rule) ->
		rule = getNCheck rule

		return next if rule is null
		return func if rule is helpers.FALSE_FUNC
		if rule is helpers.TRUE_FUNC
			return rule if next is helpers.ROOT_FUNC else next
		
		"
		var siblings = #{helpers.getSiblings "elem"};
		if(siblings){
			for(var pos = 0, i = siblings.length - 1; i >= 0; i--){
				if(siblings[i] === elem){
					if(#{rule}){ #{next} }
				}
				if(#{env.isElement "siblings[i]"}) pos++;
			}
		}
		"
	"nth-of-type": (next, rule) ->
		rule = getNCheck rule

		return next if rule is null
		return func if rule is helpers.FALSE_FUNC
		if rule is helpers.TRUE_FUNC
			return rule if next is helpers.ROOT_FUNC else next
		
		"
		var siblings = #{helpers.getSiblings "elem"};
		if(siblings){
			for(var pos = 0, i = 0, j = siblings.length; i < j; i++){
				if(siblings[i] === elem){
					if(#{rule}){ #{next} }
				}
				if(#{env.getName "siblings[i]"} === #{env.getName()}) pos++;
			}
		}
		"
	"nth-last-of-type": (next, rule) ->
		rule = getNCheck rule

		return next if rule is null
		return func if rule is helpers.FALSE_FUNC
		if rule is helpers.TRUE_FUNC
			return rule if next is helpers.ROOT_FUNC else next
		
		"
		var siblings = #{helpers.getSiblings "elem"};
		if(siblings){
			for(var pos = 0, i = siblings.length-1; i >= 0; i--){
				if(siblings[i] === elem){
					if(#{rule}){ #{next} }
				}
				if(#{env.getName "siblings[i]"} === #{env.getName()}) pos++;
			}
		}
		"
	
	#forms
	#to consider: :target, :enabled
	selected: (next) ->
		label = uniqueNames.get()
		"
		#{label}: {
			if(!(#{env.hasAttrib "elem", "selected"})){
				if(#{env.getName env.getParent "elem"} !== 'option'){
					break #{label};
				}
				var siblings = #{helpers.getSiblings "elem"};
				if(!siblings) break #{label};
				for(var i = 0, j = siblings.length; i < j; i++){
				    if(#{env.isElement "siblings[i]"}){
				    	if(siblings[i] !== elem) break #{label};
				    	break;
				    }
				}
			}
			#{next}
		}	
		"
	disabled: (next) ->
		"
		if(#{env.hasAttrib "elem", "disabled"}){
			#{next}
		}
		"
	enabled: (next) ->
		"
		if(!(#{env.hasAttrib "elem", "disabled"})){
			#{next}
		}
		"
	checked: (next) ->
		"
		if(#{env.hasAttrib "elem", "checked"}){
			#{next}
		}
		"
	
	#jQuery extensions
	header: (next) ->
		"
		var name = #{env.getName()};
		if(
		    name === 'h1' ||
		    name === 'h2' ||
		    name === 'h3' ||
		    name === 'h4' ||
		    name === 'h5'' ||
		    name === 'h6'
		){ #{next} }
		"
	button: (next) ->
		"
		if(
			#{env.getName()} === 'button' ||
		    #{env.getName()} === 'input' &&
		    #{env.hasAttrib "elem", "type"} &&
		    #{env.getAttributeValue "elem", "type"} === 'button'
		){ #{next} }
		"
	input: (next) ->
		"
		var name = #{env.getName()};
		if(
		    name === 'input' ||
		    name === 'textarea' ||
		    name === 'select' ||
		    name === 'button'
		){ #{next} }
		"
	text: (next) ->
		"
		if(
		    #{env.getName()} === 'input' &&
		    (
		    	!(#{env.hasAttrib "elem", "type"}) ||
		    	#{env.getAttributeValue "elem", "type"} === 'text'
		    )
		){ #{next} }
		"	
	checkbox: getAttribFunc "type", "checkbox"
	file: getAttribFunc "type", "file"
	password: getAttribFunc "type", "password"
	radio: getAttribFunc "type", "radio"
	reset: getAttribFunc "type", "reset"
	image: getAttribFunc "type", "image"
	submit: getAttribFunc "type", "submit"