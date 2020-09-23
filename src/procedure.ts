import type { Traversal } from "css-what";
import type { InternalSelector } from "./types";

export const procedure: Record<InternalSelector["type"], number> = {
    universal: 50,
    tag: 30,
    attribute: 1,
    pseudo: 0,
    "pseudo-element": 0, // Here to make TS happy, we don't support this.
    descendant: -1,
    child: -1,
    parent: -1,
    sibling: -1,
    adjacent: -1,
    _flexibleDescendant: -1,
};

export function isTraversal(t: InternalSelector): t is Traversal {
    return procedure[t.type] < 0;
}
