import * as CSSselect from "../src";
import { parseDOM } from "htmlparser2";
import { falseFunc } from "boolbase";
import type { Element } from "domhandler";

const dom = parseDOM(
    '<div><div data-foo="In the end, it doesn\'t really matter."></div><div data-foo="Indeed-that\'s a delicate matter.">'
) as Element[];

describe("Attributes", () => {
    describe("ignore case", () => {
        it("should for =", () => {
            let matches = CSSselect.selectAll(
                '[data-foo="indeed-that\'s a delicate matter." i]',
                dom
            );
            expect(matches).toHaveLength(1);
            expect(matches).toStrictEqual([dom[0].children[1]]);
            matches = CSSselect.selectAll(
                '[data-foo="inDeeD-THAT\'s a DELICATE matteR." i]',
                dom
            );
            expect(matches).toStrictEqual([dom[0].children[1]]);
        });

        it("should for ^=", () => {
            let matches = CSSselect.selectAll("[data-foo^=IN i]", dom);
            expect(matches).toHaveLength(2);
            expect(matches).toStrictEqual(dom[0].children);
            matches = CSSselect.selectAll("[data-foo^=in i]", dom);
            expect(matches).toStrictEqual(dom[0].children);
            matches = CSSselect.selectAll("[data-foo^=iN i]", dom);
            expect(matches).toStrictEqual(dom[0].children);
        });

        it("should for $=", () => {
            let matches = CSSselect.selectAll('[data-foo$="MATTER." i]', dom);
            expect(matches).toHaveLength(2);
            expect(matches).toStrictEqual(dom[0].children);
            matches = CSSselect.selectAll('[data-foo$="matter." i]', dom);
            expect(matches).toStrictEqual(dom[0].children);
            matches = CSSselect.selectAll('[data-foo$="MaTtEr." i]', dom);
            expect(matches).toStrictEqual(dom[0].children);
        });

        it("should for !=", () => {
            let matches = CSSselect.selectAll(
                '[data-foo!="indeed-that\'s a delicate matter." i]',
                dom
            );
            expect(matches).toHaveLength(1);
            expect(matches).toStrictEqual([dom[0].children[0]]);
            matches = CSSselect.selectAll(
                '[data-foo!="inDeeD-THAT\'s a DELICATE matteR." i]',
                dom
            );
            expect(matches).toStrictEqual([dom[0].children[0]]);
        });

        it("should for *=", () => {
            let matches = CSSselect.selectAll("[data-foo*=IT i]", dom);
            expect(matches).toHaveLength(1);
            expect(matches).toStrictEqual([dom[0].children[0]]);
            matches = CSSselect.selectAll("[data-foo*=tH i]", dom);
            expect(matches).toStrictEqual(dom[0].children);
        });

        it("should for |=", () => {
            let matches = CSSselect.selectAll("[data-foo|=indeed i]", dom);
            expect(matches).toHaveLength(1);
            expect(matches).toStrictEqual([dom[0].children[1]]);
            matches = CSSselect.selectAll("[data-foo|=inDeeD i]", dom);
            expect(matches).toStrictEqual([dom[0].children[1]]);
        });

        it("should for ~=", () => {
            let matches = CSSselect.selectAll("[data-foo~=IT i]", dom);
            expect(matches).toHaveLength(1);
            expect(matches).toStrictEqual([dom[0].children[0]]);
            matches = CSSselect.selectAll("[data-foo~=dElIcAtE i]", dom);
            expect(matches).toStrictEqual([dom[0].children[1]]);
        });
    });

    describe("no matches", () => {
        it("should for ~=", () => {
            expect(CSSselect._compileUnsafe("[foo~='baz bar']")).toBe(
                falseFunc
            );
        });

        it("should for $=", () => {
            expect(CSSselect._compileUnsafe("[foo$='']")).toBe(falseFunc);
        });

        it("should for *=", () => {
            expect(CSSselect._compileUnsafe("[foo*='']")).toBe(falseFunc);
        });
    });
});
