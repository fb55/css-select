import type { InternalSelector } from "./types";

const procedure: Record<InternalSelector["type"], number> = {
    universal: 50,
    tag: 30,
    attribute: 1,
    pseudo: 0,
    descendant: -1,
    child: -1,
    parent: -1,
    sibling: -1,
    adjacent: -1,
    _flexibleDescendant: -1,
    "pseudo-element": -100, // Here to make TS happy
};

export default procedure;
