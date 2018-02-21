function isNode(v){
	return !!(v && v.type);
}
function isNodeArray(v){
	if(Array.isArray(v) && isNode(v[0])){
		return true;
	}
}
function NodeWithoutCircularReferences(node){
	var newNode = {};
	Object.assign(newNode, node);
	delete newNode.next;
	delete newNode.prev;
	delete newNode.parent;
	if(isNodeArray(newNode.children)){
		newNode.children = removeCircularRefs(newNode.children);
	}
	return newNode;
}

function removeCircularRefs(value){
	if(isNodeArray(value)){
		return value.map(NodeWithoutCircularReferences);
	} else if(isNode(value)){
		return NodeWithoutCircularReferences(value);
	} else {
		return value;
	}
}

module.exports = removeCircularRefs;
