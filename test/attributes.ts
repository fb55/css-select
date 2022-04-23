import * as CSSselect from "../src";
import { parseDocument } from "htmlparser2";
import boolbase from "boolbase";
import type { Element } from "domhandler";

const dom = parseDocument(
    '<div data-foo="In the end, it doesn\'t really matter."></div><div data-foo="Indeed-that\'s a delicate matter.">'
);
const domChilds = dom.children as Element[];

describe("Attributes", () => {
    describe("ignore case", () => {
        it("should for =", () => {
            let matches = CSSselect.selectAll(
                '[data-foo="indeed-that\'s a delicate matter." i]',
                dom
            );
            expect(matches).toHaveLength(1);
            expect(matches).toStrictEqual([domChilds[1]]);
            matches = CSSselect.selectAll(
                '[data-foo="inDeeD-THAT\'s a DELICATE matteR." i]',
                dom
            );
            expect(matches).toStrictEqual([domChilds[1]]);
        });

        it("should for ^=", () => {
            let matches = CSSselect.selectAll("[data-foo^=IN i]", dom);
            expect(matches).toHaveLength(2);
            expect(matches).toStrictEqual(domChilds);
            matches = CSSselect.selectAll("[data-foo^=in i]", dom);
            expect(matches).toStrictEqual(domChilds);
            matches = CSSselect.selectAll("[data-foo^=iN i]", dom);
            expect(matches).toStrictEqual(domChilds);
        });

        it("should for $=", () => {
            let matches = CSSselect.selectAll('[data-foo$="MATTER." i]', dom);
            expect(matches).toHaveLength(2);
            expect(matches).toStrictEqual(domChilds);
            matches = CSSselect.selectAll('[data-foo$="matter." i]', dom);
            expect(matches).toStrictEqual(domChilds);
            matches = CSSselect.selectAll('[data-foo$="MaTtEr." i]', dom);
            expect(matches).toStrictEqual(domChilds);
        });

        it("should for !=", () => {
            let matches = CSSselect.selectAll(
                '[data-foo!="indeed-that\'s a delicate matter." i]',
                dom
            );
            expect(matches).toHaveLength(1);
            expect(matches).toStrictEqual([domChilds[0]]);
            matches = CSSselect.selectAll(
                '[data-foo!="inDeeD-THAT\'s a DELICATE matteR." i]',
                dom
            );
            expect(matches).toStrictEqual([domChilds[0]]);
        });

        it("should for *=", () => {
            let matches = CSSselect.selectAll("[data-foo*=IT i]", dom);
            expect(matches).toHaveLength(1);
            expect(matches).toStrictEqual([domChilds[0]]);
            matches = CSSselect.selectAll("[data-foo*=tH i]", dom);
            expect(matches).toStrictEqual(domChilds);
        });

        it("should for |=", () => {
            let matches = CSSselect.selectAll("[data-foo|=indeed i]", dom);
            expect(matches).toHaveLength(1);
            expect(matches).toStrictEqual([domChilds[1]]);
            matches = CSSselect.selectAll("[data-foo|=inDeeD i]", dom);
            expect(matches).toStrictEqual([domChilds[1]]);
        });

        it("should for ~=", () => {
            let matches = CSSselect.selectAll("[data-foo~=IT i]", dom);
            expect(matches).toHaveLength(1);
            expect(matches).toStrictEqual([domChilds[0]]);
            matches = CSSselect.selectAll("[data-foo~=dElIcAtE i]", dom);
            expect(matches).toStrictEqual([domChilds[1]]);
        });
    });

    describe("no matches", () => {
        it("should for ~=", () => {
            expect(CSSselect._compileUnsafe("[foo~='baz bar']")).toBe(
                boolbase.falseFunc
            );
        });

        it("should for $=", () => {
            expect(CSSselect._compileUnsafe("[foo$='']")).toBe(
                boolbase.falseFunc
            );
        });

        it("should for *=", () => {
            expect(CSSselect._compileUnsafe("[foo*='']")).toBe(
                boolbase.falseFunc
            );
        });
    });
});
