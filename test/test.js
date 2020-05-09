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
    Object.keys(mod).forEach((name) => {
        if (typeof mod[name] === "object") {
            describe(name, () => {
                exportsRun(mod[name]);
            });
        } else it(name, mod[name]);
    });
}
