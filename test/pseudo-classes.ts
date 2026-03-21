import { type AnyNode, type Element, isTag } from "domhandler";
import { DomUtils, parseDocument } from "htmlparser2";
import { describe, expect, it } from "vitest";
import * as CSSselect from "../src/index.js";
import type { Adapter } from "../src/types.js";
import { parseDOM } from "./tools/helper.js";

const dom = parseDOM(
    "<div><p>In the end, it doesn't really Matter.</p><div>Indeed-that's a delicate matter.</div>",
) as Element[];

describe(":icontains", () => {
    describe("ignore case", () => {
        it("should match full string", () => {
            let matches = CSSselect.selectAll(
                ":icontains(indeed-that's a delicate matter.)",
                dom,
            );
            expect(matches).toHaveLength(2);
            expect(matches).toStrictEqual([dom[0], dom[0].children[1]]);
            matches = CSSselect.selectAll(
                ":icontains(inDeeD-THAT's a DELICATE matteR.)",
                dom,
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
            "Unknown pseudo-class :unmatched",
        );

        expect(() => CSSselect.selectAll(":unmatched(foo)", dom)).toThrow(
            "Unknown pseudo-class :unmatched",
        );

        expect(() => CSSselect.selectAll(":host-context(foo)", dom)).toThrow(
            "Unknown pseudo-class :host-context",
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
        const adapter: Adapter<AnyNode, Element> = { ...DomUtils, isTag };
        delete adapter.prevElementSibling;

        const matches = CSSselect.selectAll(":first-child", dom, { adapter });
        expect(matches).toHaveLength(2);
        expect(matches).toStrictEqual([dom[0], dom[0].children[0]]);
    });
});

describe(":empty", () => {
    // Adopted from the example in https://www.w3.org/TR/selectors-4/#the-empty-pseudo

    it("should match", () => {
        const dom = parseDocument(`
            <p></p>
            <p>
            <p> </p>
            <p></p>
        `);
        const matches = CSSselect.selectAll("p:empty", dom);
        expect(matches).toHaveLength(4);
    });

    it("should not match", () => {
        const dom = parseDocument(`
            <div>text</div>
            <div><p></p></div>
            <div>&nbsp;</div>
            <div><p>bla</p></div>
            <div>this is not <p>:empty</p></div>
        `);
        const matches = CSSselect.selectAll("div:empty", dom);
        expect(matches).toHaveLength(0);
    });
});

describe(":has", () => {
    it("should cache :has if applicable", () => {
        const dom = parseDocument(`
            <div>
                <div class="a">
                    <div class="b"></div>
                    <div class="c"></div>
                </div>
                <div class="d"></div>
            </div>
        `);
        const compiled = CSSselect.compile(":has(.a .b ~ .c)");

        expect(
            CSSselect.selectAll<AnyNode, Element>(compiled, dom),
        ).toHaveLength(2);

        (
            ((dom.childNodes[1] as Element).childNodes[1] as Element)
                .attribs as { class: string }
        ).class = "";

        // Should not find the element anymore
        expect(CSSselect.selectAll<AnyNode, Element>(".a", dom)).toHaveLength(
            0,
        );
        // But as we have cached the results in `compiled`, we should succeed here.
        expect(
            CSSselect.selectAll<AnyNode, Element>(compiled, dom),
        ).toHaveLength(2);
    });
});

describe(":lang", () => {
    it("should match exact language", () => {
        const dom = parseDocument('<div lang="en"><p>hello</p></div>');
        const matches = CSSselect.selectAll<AnyNode, Element>(":lang(en)", dom);
        expect(matches).toHaveLength(2);
    });

    it("should match language prefix", () => {
        const dom = parseDocument('<div lang="en-US"><p>hello</p></div>');
        const matches = CSSselect.selectAll<AnyNode, Element>(":lang(en)", dom);
        expect(matches).toHaveLength(2);
    });

    it("should be case-insensitive", () => {
        const dom = parseDocument('<div lang="en"><p>hello</p></div>');
        expect(
            CSSselect.selectAll<AnyNode, Element>(":lang(EN)", dom),
        ).toHaveLength(2);

        const dom2 = parseDocument('<div lang="EN-US"><p>hello</p></div>');
        expect(
            CSSselect.selectAll<AnyNode, Element>(":lang(en)", dom2),
        ).toHaveLength(2);
    });

    it("should inherit from ancestors", () => {
        const dom = parseDocument(
            '<div lang="fr"><section><p>bonjour</p></section></div>',
        );
        const matches = CSSselect.selectAll<AnyNode, Element>(
            "p:lang(fr)",
            dom,
        );
        expect(matches).toHaveLength(1);
    });

    it("should not match different languages", () => {
        const dom = parseDocument(
            '<div lang="fr"><p>bonjour</p></div><div lang="en"><p>hello</p></div>',
        );
        const matches = CSSselect.selectAll<AnyNode, Element>(":lang(en)", dom);
        expect(matches).toHaveLength(2);
    });

    it("should not match partial non-prefix", () => {
        const dom = parseDocument('<div lang="enx"><p>hello</p></div>');
        const matches = CSSselect.selectAll<AnyNode, Element>(":lang(en)", dom);
        expect(matches).toHaveLength(0);
    });

    it("should allow closer ancestor to override", () => {
        const dom = parseDocument(
            '<div lang="en"><div lang="fr"><p>bonjour</p></div></div>',
        );
        expect(
            CSSselect.selectAll<AnyNode, Element>("p:lang(fr)", dom),
        ).toHaveLength(1);
        expect(
            CSSselect.selectAll<AnyNode, Element>("p:lang(en)", dom),
        ).toHaveLength(0);
    });

    it("should support comma-separated language ranges", () => {
        const dom = parseDocument(
            '<div lang="en"><p>hello</p></div><div lang="fr"><p>bonjour</p></div><div lang="de"><p>hallo</p></div>',
        );
        const matches = CSSselect.selectAll<AnyNode, Element>(
            ":lang(en, fr)",
            dom,
        );
        expect(matches).toHaveLength(4);
    });

    it("should use extended filtering (RFC 4647)", () => {
        // :lang(de-DE) should match de-Latn-DE (skipping single-char subtags)
        const dom = parseDocument(
            '<p lang="de-DE">a</p><p lang="de-DE-1996">b</p><p lang="de-Latn-DE">c</p><p lang="de-Latf-DE">d</p><p lang="de-Latn-DE-1996">e</p>',
        );
        const matches = CSSselect.selectAll<AnyNode, Element>(
            ":lang(de-DE)",
            dom,
        );
        expect(matches).toHaveLength(5);
    });

    it("should support wildcard primary subtag", () => {
        const dom = parseDocument(
            '<p lang="de-CH">a</p><p lang="it-CH">b</p><p lang="fr-CH">c</p><p lang="fr-FR">d</p>',
        );
        const matches = CSSselect.selectAll<AnyNode, Element>(
            ":lang(\\*-CH)",
            dom,
        );
        expect(matches).toHaveLength(3);
    });

    it("should support xml:lang attribute", () => {
        const dom = parseDocument('<div xml:lang="ja"><p>hello</p></div>', {
            xmlMode: true,
        });
        const matches = CSSselect.selectAll<AnyNode, Element>(":lang(ja)", dom);
        expect(matches).toHaveLength(2);
    });
});

describe(":read-only and :read-write", () => {
    it("should match", () => {
        const dom = parseDocument(`
            <div>
                <input type="text" readonly>
                <input type="text">
                <input type="color" readonly>
                <input type="color">
                <textarea readonly></textarea>
                <textarea></textarea>
            </div>
        `);

        expect(
            CSSselect.selectAll<AnyNode, Element>(":read-only", dom),
        ).toHaveLength(2);

        expect(
            CSSselect.selectAll<AnyNode, Element>(":read-write", dom),
        ).toHaveLength(2);
    });
});
