import * as boolbase from "boolbase";
import type { Element } from "domhandler";
import { parseDocument } from "htmlparser2";
import { describe, expect, it } from "vitest";
import * as CSSselect from "../src/index.js";

const dom = parseDocument(
    '<div data-foo="In the end, it doesn\'t really matter."></div><div data-foo="Indeed-that\'s a delicate matter.">',
);
const domChilds = dom.children as Element[];

describe("Attributes", () => {
    describe("ASCII case-insensitive matching", () => {
        const document = parseDocument('<i data-foo="Ä" type="Ä"></i>');
        it.each(["=", "|=", "^=", "$=", "*=", "~="])(
            "should preserve non-ASCII case with %s",
            (operator) => {
                expect(
                    CSSselect.selectAll(`[data-foo${operator}"ä" i]`, document),
                ).toHaveLength(0);
                expect(
                    CSSselect.selectAll(`[data-foo${operator}"Ä" i]`, document),
                ).toStrictEqual(document.children);
            },
        );
        it("should preserve non-ASCII case with !=", () => {
            expect(
                CSSselect.selectAll('[data-foo!="ä" i]', document),
            ).toStrictEqual(document.children);
        });
        it("should preserve non-ASCII case for implicitly insensitive attributes", () => {
            expect(CSSselect.selectAll('[type="ä"]', document)).toHaveLength(0);
        });
        it("should keep regex characters literal when matching ASCII letters", () => {
            const document = parseDocument('<i data-foo="[A]+"></i>');
            expect(
                CSSselect.selectAll('[data-foo*="[a]+" i]', document),
            ).toStrictEqual(document.children);
            expect(
                CSSselect.selectAll('[data-foo~="[a]+" i]', document),
            ).toStrictEqual(document.children);
        });
    });

    describe("ignore case", () => {
        it("should for =", () => {
            let matches = CSSselect.selectAll(
                '[data-foo="indeed-that\'s a delicate matter." i]',
                dom,
            );
            expect(matches).toHaveLength(1);
            expect(matches).toStrictEqual([domChilds[1]]);
            matches = CSSselect.selectAll(
                '[data-foo="inDeeD-THAT\'s a DELICATE matteR." i]',
                dom,
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
                dom,
            );
            expect(matches).toHaveLength(1);
            expect(matches).toStrictEqual([domChilds[0]]);
            matches = CSSselect.selectAll(
                '[data-foo!="inDeeD-THAT\'s a DELICATE matteR." i]',
                dom,
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
                boolbase.falseFunc,
            );
        });

        it("should for $=", () => {
            expect(CSSselect._compileUnsafe("[foo$='']")).toBe(
                boolbase.falseFunc,
            );
        });

        it("should for *=", () => {
            expect(CSSselect._compileUnsafe("[foo*='']")).toBe(
                boolbase.falseFunc,
            );
        });
    });
});
