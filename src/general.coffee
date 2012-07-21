{helpers, env} = require "./helpers"
{uniqueNames} = helpers

###
	all available rules
###
module.exports =
	tag: (next, {name}) ->
		"
		if(#{env.getName()} === #{helpers.quote name}){ #{next} }
		"
	
	#traversal
	descendant: (next) ->
		name = uniqueNames.get()
		"
		var #{name} = elem;
		while(elem = #{env.getParent "elem"}){
			#{next}
		}
		elem = #{name};
		"
	child: (next) ->
		name = uniqueNames.get()
		"
		var #{name} = elem;
		if(elem = #{env.getParent "elem"}){
			#{next}
		}
		elem = #{name};
		"
	sibling: (next) ->
		sibling = uniqueNames.get()
		elemName = uniqueNames.get()
		"
		var #{sibling} = #{helpers.getSiblings "elem"},
		    #{elemName} = elem;

		if(#{sibling}){
			for(var i = 0, j = #{sibling}.length; i < j; i++){
				elem = #{sibling}[i];
				if(#{env.isElement "elem"}){
					if(#{sibling}[i] === #{elemName}) break;
					#{next}
				}
			}
		}
		elem = #{elemName};
		"
	adjacent: (next) ->
		name = uniqueNames.get()
		"
		var siblings = #{helpers.getSiblings "elem"},
		    #{name} = elem;
		if(siblings){
			var lastElement;
			for(var i = 0, j = siblings.length; i < j; i++){
				if(#{env.isElement "siblings[i]"}){
					if(siblings[i] === elem){
						if(lastElement){
							elem = lastElement;
							#{next}
						}
						break;
					}
					lastElement = siblings[i];
				}
			}
		}
		elem = #{name};
		"
	
	universal: (next) -> if next is helpers.ROOT_FUNC then helpers.TRUE_FUNC else next