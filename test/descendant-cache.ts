import type { AnyNode, Element } from "domhandler";
import { DomUtils, parseDocument } from "htmlparser2";
import { describe, expect, it, vi } from "vitest";
import * as CSSselect from "../src/index.js";

const html =
    '<div class="c" id="o"><div class="b c" id="m">' +
    '<span class="b c" id="t"><input class="b" disabled>needle</span></div></div>';

describe("descendant caching inside :has", () => {
    const selectors = [
        ":has(:is(.c .b) :disabled)",
        ":has(:where(.c .b) :disabled)",
        ":has(:matches(.c .b) :disabled)",
        ":has(:not(:not(.c .b)) :disabled)",
        ':has(:is(.c .b):contains("needle") :disabled)',
        ':has(:is(.c .b):icontains("NEEDLE") :disabled)',
        ':has(:not(:not(.c .b)):contains("needle") :disabled)',
        ":has(> :is(.c .b) :disabled)",
        ":has(:is(:is(.c .b) :disabled))",
    ];

    it.each(selectors)(
        "does not reuse another anchor's answers for %s",
        (selector) => {
            const document = parseDocument(html);
            const elements = DomUtils.findAll(
                (element) => !!element.attribs["id"],
                document.children,
            );
            // eslint-disable-next-line unicorn/no-array-reverse -- The project targets ES2022.
            for (const ordered of [elements, [...elements].reverse()]) {
                const expected = ordered.filter(
                    CSSselect.compile(selector, { cacheResults: false }),
                );
                const compiled = CSSselect.compile(selector);
                expect(ordered.filter(compiled)).toStrictEqual(expected);
                expect(ordered.filter(compiled)).toStrictEqual(expected);
            }
            expect(CSSselect.selectAll(selector, document)).toStrictEqual(
                CSSselect.selectAll(selector, document, {
                    cacheResults: false,
                }),
            );
        },
    );

    it("matches the reported tree independently of evaluation order", () => {
        const document = parseDocument(html);
        const selector = ":has(:is(.c .b) :disabled)";
        expect(
            CSSselect.selectAll<AnyNode, Element>(selector, document).map(
                (element) => element.attribs["id"],
            ),
        ).toStrictEqual(["o", "m"]);
        const elements = CSSselect.selectAll<AnyNode, Element>(
            "[id]",
            document,
        );
        elements.reverse();
        const compiled = CSSselect.compile(selector);
        expect(
            elements.filter(compiled).map((element) => element.attribs["id"]),
        ).toStrictEqual(["m", "o"]);
    });

    it("retains descendant caching with a stable query context", () => {
        const document = parseDocument(html);
        const elements = CSSselect.selectAll<AnyNode, Element>(
            "[id]",
            document,
        );
        const input = CSSselect.selectOne<AnyNode, Element>("input", document);
        if (input === null) throw new Error("Missing test input");

        for (const context of [undefined, elements[0], [elements[0]]]) {
            for (const shouldCache of [true, false]) {
                const marker = vi.fn(() => true);
                const compiled = CSSselect.compile<AnyNode, Element>(
                    ":is(.c .b):marker :disabled",
                    { pseudos: { marker }, cacheResults: shouldCache },
                    context,
                );
                expect(compiled(input)).toBe(true);
                const calls = marker.mock.calls.length;
                expect(calls).toBeGreaterThan(0);
                expect(compiled(input)).toBe(true);
                if (shouldCache) {
                    expect(marker).toHaveBeenCalledTimes(calls);
                } else {
                    expect(marker.mock.calls.length).toBeGreaterThan(calls);
                }
            }
        }
    });
});
