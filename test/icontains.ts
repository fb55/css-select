import * as CSSselect from "../src";
import { parseDOM } from "htmlparser2";
import type { Element } from "domhandler";

const dom = parseDOM(
    "<div><p>In the end, it doesn't really Matter.</p><div>Indeed-that's a delicate matter.</div>"
) as Element[];

describe("icontains", () => {
    describe("ignore case", () => {
        it("should match full string", () => {
            let matches = CSSselect.selectAll(
                ":icontains(indeed-that's a delicate matter.)",
                dom
            );
            expect(matches).toHaveLength(2);
            expect(matches).toStrictEqual([
                dom[0],
                dom[0].children[1],
            ] as Element[]);
            matches = CSSselect.selectAll(
                ":icontains(inDeeD-THAT's a DELICATE matteR.)",
                dom
            );
            expect(matches).toHaveLength(2);
            expect(matches).toStrictEqual([
                dom[0],
                dom[0].children[1],
            ] as Element[]);
        });

        it("should match substring", () => {
            let matches = CSSselect.selectAll(":icontains(indeed)", dom);
            expect(matches).toHaveLength(2);
            expect(matches).toStrictEqual([
                dom[0],
                dom[0].children[1],
            ] as Element[]);
            matches = CSSselect.selectAll(":icontains(inDeeD)", dom);
            expect(matches).toHaveLength(2);
            expect(matches).toStrictEqual([
                dom[0],
                dom[0].children[1],
            ] as Element[]);
        });

        it("should match specific element", () => {
            let matches = CSSselect.selectAll("p:icontains(matter)", dom);
            expect(matches).toHaveLength(1);
            expect(matches).toStrictEqual([dom[0].children[0] as Element]);
            matches = CSSselect.selectAll("p:icontains(mATter)", dom);
            expect(matches).toHaveLength(1);
            expect(matches).toStrictEqual([dom[0].children[0] as Element]);
        });

        it("should match multiple elements", () => {
            let matches = CSSselect.selectAll(":icontains(matter)", dom);
            expect(matches).toHaveLength(3);
            expect(matches).toStrictEqual([
                dom[0],
                dom[0].children[0],
                dom[0].children[1],
            ] as Element[]);
            matches = CSSselect.selectAll(":icontains(mATter)", dom);
            expect(matches).toHaveLength(3);
            expect(matches).toStrictEqual([
                dom[0],
                dom[0].children[0],
                dom[0].children[1],
            ] as Element[]);
        });

        it("should match empty string", () => {
            const matches = CSSselect.selectAll(":icontains()", dom);
            expect(matches).toHaveLength(3);
            expect(matches).toStrictEqual([
                dom[0],
                dom[0].children[0],
                dom[0].children[1],
            ] as Element[]);
        });

        it("should match quoted string", () => {
            let matches = CSSselect.selectAll(":icontains('')", dom);
            expect(matches).toHaveLength(3);
            expect(matches).toStrictEqual([
                dom[0],
                dom[0].children[0],
                dom[0].children[1],
            ] as Element[]);
            matches = CSSselect.selectAll("p:icontains('matter')", dom);
            expect(matches).toHaveLength(1);
            expect(matches).toStrictEqual([dom[0].children[0] as Element]);
            matches = CSSselect.selectAll('p:icontains("matter")', dom);
            expect(matches).toHaveLength(1);
            expect(matches).toStrictEqual([dom[0].children[0] as Element]);
        });

        it("should match whitespace", () => {
            let matches = CSSselect.selectAll(":icontains( matter)", dom);
            expect(matches).toHaveLength(3);
            expect(matches).toStrictEqual([
                dom[0],
                dom[0].children[0],
                dom[0].children[1],
            ] as Element[]);
            matches = CSSselect.selectAll(":icontains( mATter)", dom);
            expect(matches).toHaveLength(3);
            expect(matches).toStrictEqual([
                dom[0],
                dom[0].children[0],
                dom[0].children[1],
            ] as Element[]);
        });
    });

    describe("no matches", () => {
        it("should not match", () => {
            const matches = CSSselect.selectAll("p:icontains(indeed)", dom);
            expect(matches).toHaveLength(0);
        });
    });
});
