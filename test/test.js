describe("nwmatcher", () => {
    require("./nwmatcher/");
});

describe("sizzle", () => {
    describe("selector", () => {
        require("./sizzle/selector");
    });
});

describe("qwery", () => {
    exportsRun(require("./qwery/"));
});

function exportsRun(mod) {
    for (const name of Object.keys(mod)) {
        if (typeof mod[name] === "object") {
            describe(name, () => {
                exportsRun(mod[name]);
            });
        } else {
            it(name, mod[name]);
        }
    }
}
