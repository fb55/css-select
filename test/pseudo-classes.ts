import * as CSSselect from "../src";
import { DomUtils, parseDOM } from "htmlparser2";
import type { AnyNode, Element } from "domhandler";
import type { Adapter } from "../src/types.js";

const dom = parseDOM(
    "<div><p>In the end, it doesn't really Matter.</p><div>Indeed-that's a delicate matter.</div>"
) as Element[];

describe(":icontains", () => {
    describe("ignore case", () => {
        it("should match full string", () => {
            let matches = CSSselect.selectAll(
                ":icontains(indeed-that's a delicate matter.)",
                dom
            );
            expect(matches).toHaveLength(2);
            expect(matches).toStrictEqual([dom[0], dom[0].children[1]]);
            matches = CSSselect.selectAll(
                ":icontains(inDeeD-THAT's a DELICATE matteR.)",
                dom
            );
            expect(matches).toHaveLength(2);
            expect(matches).toStrictEqual([dom[0], dom[0].children[1]]);
        });

        it("should match substring", () => {
            let matches = CSSselect.selectAll(":icontains(indeed)", dom);
            expect(matches).toHaveLength(2);
            expect(matches).toStrictEqual([dom[0], dom[0].children[1]]);
            matches = CSSselect.selectAll(":icontains(inDeeD)", dom);
            expect(matches).toHaveLength(2);
            expect(matches).toStrictEqual([dom[0], dom[0].children[1]]);
        });

        it("should match specific element", () => {
            let matches = CSSselect.selectAll("p:icontains(matter)", dom);
            expect(matches).toHaveLength(1);
            expect(matches).toStrictEqual([dom[0].children[0]]);
            matches = CSSselect.selectAll("p:icontains(mATter)", dom);
            expect(matches).toHaveLength(1);
            expect(matches).toStrictEqual([dom[0].children[0]]);
        });

        it("should match multiple elements", () => {
            let matches = CSSselect.selectAll(":icontains(matter)", dom);
            expect(matches).toHaveLength(3);
            expect(matches).toStrictEqual([
                dom[0],
                dom[0].children[0],
                dom[0].children[1],
            ]);
            matches = CSSselect.selectAll(":icontains(mATter)", dom);
            expect(matches).toHaveLength(3);
            expect(matches).toStrictEqual([
                dom[0],
                dom[0].children[0],
                dom[0].children[1],
            ]);
        });

        it("should match empty string", () => {
            const matches = CSSselect.selectAll(":icontains()", dom);
            expect(matches).toHaveLength(3);
            expect(matches).toStrictEqual([
                dom[0],
                dom[0].children[0],
                dom[0].children[1],
            ]);
        });

        it("should match quoted string", () => {
            let matches = CSSselect.selectAll(":icontains('')", dom);
            expect(matches).toHaveLength(3);
            expect(matches).toStrictEqual([
                dom[0],
                dom[0].children[0],
                dom[0].children[1],
            ]);
            matches = CSSselect.selectAll("p:icontains('matter')", dom);
            expect(matches).toHaveLength(1);
            expect(matches).toStrictEqual([dom[0].children[0]]);
            matches = CSSselect.selectAll('p:icontains("matter")', dom);
            expect(matches).toHaveLength(1);
            expect(matches).toStrictEqual([dom[0].children[0]]);
        });

        it("should match whitespace", () => {
            let matches = CSSselect.selectAll(":icontains( matter)", dom);
            expect(matches).toHaveLength(3);
            expect(matches).toStrictEqual([
                dom[0],
                dom[0].children[0],
                dom[0].children[1],
            ]);
            matches = CSSselect.selectAll(":icontains( mATter)", dom);
            expect(matches).toHaveLength(3);
            expect(matches).toStrictEqual([
                dom[0],
                dom[0].children[0],
                dom[0].children[1],
            ]);
        });
    });

    describe("no matches", () => {
        it("should not match", () => {
            const matches = CSSselect.selectAll("p:icontains(indeed)", dom);
            expect(matches).toHaveLength(0);
        });
    });
});

describe("unmatched", () => {
    it("should throw on unknown pseudo-class (#741)", () => {
        expect(() => CSSselect.selectAll(":unmatched(foo)", dom)).toThrow(
            "Unknown pseudo-class :unmatched"
        );

        expect(() => CSSselect.selectAll(":unmatched(foo)", dom)).toThrow(
            "Unknown pseudo-class :unmatched"
        );

        expect(() => CSSselect.selectAll(":host-context(foo)", dom)).toThrow(
            "Unknown pseudo-class :host-context"
        );
    });
});

describe(":first-child", () => {
    it("should match", () => {
        const matches = CSSselect.selectAll(":first-child", dom);
        expect(matches).toHaveLength(2);
        expect(matches).toStrictEqual([dom[0], dom[0].children[0]]);
    });

    it("should work without `prevElementSibling`", () => {
        const adapter: Adapter<AnyNode, Element> = { ...DomUtils };
        delete adapter.prevElementSibling;

        const matches = CSSselect.selectAll(":first-child", dom, { adapter });
        expect(matches).toHaveLength(2);
        expect(matches).toStrictEqual([dom[0], dom[0].children[0]]);
    });
});
