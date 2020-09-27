import * as CSSselect from "../src";
import { parseDOM as makeDom } from "htmlparser2";
import * as assert from "assert";
import type { Element } from "domhandler";

const dom = makeDom(
    "<div><p>In the end, it doesn't really Matter.</p><div>Indeed-that's a delicate matter.</div>"
) as Element[];

describe("icontains", () => {
    describe("ignore case", () => {
        it("should match full string", () => {
            let matches = CSSselect.selectAll(
                ":icontains(indeed-that's a delicate matter.)",
                dom
            );
            assert.equal(matches.length, 2);
            assert.deepEqual(matches, [dom[0], dom[0].children[1]]);
            matches = CSSselect.selectAll(
                ":icontains(inDeeD-THAT's a DELICATE matteR.)",
                dom
            );
            assert.equal(matches.length, 2);
            assert.deepEqual(matches, [dom[0], dom[0].children[1]]);
        });

        it("should match substring", () => {
            let matches = CSSselect.selectAll(":icontains(indeed)", dom);
            assert.equal(matches.length, 2);
            assert.deepEqual(matches, [dom[0], dom[0].children[1]]);
            matches = CSSselect.selectAll(":icontains(inDeeD)", dom);
            assert.equal(matches.length, 2);
            assert.deepEqual(matches, [dom[0], dom[0].children[1]]);
        });

        it("should match specific element", () => {
            let matches = CSSselect.selectAll("p:icontains(matter)", dom);
            assert.equal(matches.length, 1);
            assert.deepEqual(matches, [dom[0].children[0]]);
            matches = CSSselect.selectAll("p:icontains(mATter)", dom);
            assert.equal(matches.length, 1);
            assert.deepEqual(matches, [dom[0].children[0]]);
        });

        it("should match multiple elements", () => {
            let matches = CSSselect.selectAll(":icontains(matter)", dom);
            assert.equal(matches.length, 3);
            assert.deepEqual(matches, [
                dom[0],
                dom[0].children[0],
                dom[0].children[1],
            ]);
            matches = CSSselect.selectAll(":icontains(mATter)", dom);
            assert.equal(matches.length, 3);
            assert.deepEqual(matches, [
                dom[0],
                dom[0].children[0],
                dom[0].children[1],
            ]);
        });

        it("should match empty string", () => {
            const matches = CSSselect.selectAll(":icontains()", dom);
            assert.equal(matches.length, 3);
            assert.deepEqual(matches, [
                dom[0],
                dom[0].children[0],
                dom[0].children[1],
            ]);
        });

        it("should match quoted string", () => {
            let matches = CSSselect.selectAll(":icontains('')", dom);
            assert.equal(matches.length, 3);
            assert.deepEqual(matches, [
                dom[0],
                dom[0].children[0],
                dom[0].children[1],
            ]);
            matches = CSSselect.selectAll("p:icontains('matter')", dom);
            assert.equal(matches.length, 1);
            assert.deepEqual(matches, [dom[0].children[0]]);
            matches = CSSselect.selectAll('p:icontains("matter")', dom);
            assert.equal(matches.length, 1);
            assert.deepEqual(matches, [dom[0].children[0]]);
        });

        it("should match whitespace", () => {
            let matches = CSSselect.selectAll(":icontains( matter)", dom);
            assert.equal(matches.length, 3);
            assert.deepEqual(matches, [
                dom[0],
                dom[0].children[0],
                dom[0].children[1],
            ]);
            matches = CSSselect.selectAll(":icontains( mATter)", dom);
            assert.equal(matches.length, 3);
            assert.deepEqual(matches, [
                dom[0],
                dom[0].children[0],
                dom[0].children[1],
            ]);
        });
    });

    describe("no matches", () => {
        it("should not match", () => {
            const matches = CSSselect.selectAll("p:icontains(indeed)", dom);
            assert.equal(matches.length, 0);
        });
    });
});
