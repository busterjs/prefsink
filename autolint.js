module.exports = {
    paths: [
        "lib/*.js",
        "test/prefsink-test.js"
    ],
    linterOptions: {
        es5: true,
        node: true,
        plusplus: true,
        vars: true,
        nomen: true,
        forin: true,
        sloppy: true,
        regexp: true,
        predef: [
            "assert",
            "refute",
            "buster"
        ]
    }
};
