describe("nwmatcher", () => {
    require("./nwmatcher/");
});

describe("sizzle", () => {
    describe("selector", () => {
        require("./sizzle/selector");
    });
});

describe.only("qwery", () => {
    exportsRun(require("./qwery/"));
});

function exportsRun(mod) {
    for (const [name, suite] of Object.entries(mod)) {
        if (typeof suite === "object") {
            describe(name, () => exportsRun(suite));
        } else {
            it(name, suite);
        }
    }
}
