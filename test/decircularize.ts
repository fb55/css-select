import type { ElementType } from "htmlparser2";
import type { Node, NodeWithChildren } from "domhandler";

interface NonCircularNode extends Omit<Partial<NodeWithChildren>, "children"> {
    type: ElementType.ElementType;
    children?: NonCircularNode[];
}
type AcceptedNode = NonCircularNode | Node;

function isNode(v?: AcceptedNode): boolean {
    return !!(v && v.type);
}
function isNodeArray(v?: AcceptedNode[]): v is Node[] {
    return Array.isArray(v) && isNode(v[0]);
}

function NodeWithoutCircularReferences(node: Node): NonCircularNode {
    const newNode: NonCircularNode = { ...node };
    delete newNode.next;
    delete newNode.prev;
    delete newNode.parent;
    if (isNodeArray(newNode.children)) {
        newNode.children = newNode.children.map(NodeWithoutCircularReferences);
    }
    return newNode;
}

export default function removeCircularRefs(
    value: Node[] | Node
): NonCircularNode | NonCircularNode[] {
    if (Array.isArray(value) && isNodeArray(value)) {
        return value.map(NodeWithoutCircularReferences);
    } else if (isNode(value)) {
        return NodeWithoutCircularReferences(value);
    }
    return value;
}
