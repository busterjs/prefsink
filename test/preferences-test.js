var buster = require("buster");
var fs = require("fs");
var prefs = require("../lib/preferences");
var Path = require("path");
var home = process.env.USERPROFILE || process.env.HOME;

function path(p) {
    return Path.join(home, p);
}

function fileNotFound(fileName) {
    fs.stat.withArgs(fileName).yields({
        name: "Error",
        message: "ENOENT, no such file or directory '" + fileName + "'",
        errno: 34,
        code: "ENOENT",
        path: fileName
    });
}

buster.testCase("Preferences", {
    setUp: function () {
        this.stub(fs, "stat").yields(null, {
            isFile: this.stub().returns(true)
        });
    },

    "findFile": {
        "tries ~/.<project>.d/index.js": function (done) {
            prefs.findFile("buster", function () {
                assert.calledWith(fs.stat, path(".buster.d/index.js"));

                prefs.findFile("sinon", done(function () {
                    assert.calledWith(fs.stat, path(".sinon.d/index.js"));
                }));
            });
        },

        "yields ~/.buster.d/index.js when it exists": function (done) {
            prefs.findFile("buster", done(function (err, file) {
                assert.equals(file, path(".buster.d/index.js"));
            }));
        },

        "does not yield ~/.buster.d/index.js if it is a directory": function (done) {
            fs.stat.withArgs(path(".buster.d/index.js")).yields(null, {
                isFile: this.stub().returns(false)
            });

            prefs.findFile("buster", done(function (err, file) {
                refute.equals(file, path(".buster.d/index.js"));
            }));
        },

        "uses ~/.buster.js if .buster.d does not exist": function (done) {
            fileNotFound(path(".buster.d/index.js"));

            prefs.findFile("buster", done(function (err, file) {
                assert.equals(file, path(".buster.js"));
            }));
        },

        "does not use ~/.buster.js if not a file": function (done) {
            fileNotFound(path(".buster.d/index.js"));
            fs.stat.withArgs(path(".buster.js")).yields(null, {
                isFile: this.stub().returns(false)
            });

            prefs.findFile("buster", done(function (err, file) {
                refute.equals(file, path(".buster.js"));
            }));
        },

        "uses ~/.buster if .buster.d and .buster.js do not exist": function (done) {
            fileNotFound(path(".buster.d/index.js"));
            fileNotFound(path(".buster.js"));

            prefs.findFile("buster", done(function (err, file) {
                assert.equals(file, path(".buster"));
            }));
        },

        "does not use ~/.buster if not a file": function (done) {
            fileNotFound(path(".buster.d/index.js"));
            fileNotFound(path(".buster.js"));
            fs.stat.withArgs(path(".buster")).yields(null, {
                isFile: this.stub().returns(false)
            });

            prefs.findFile("buster", done(function (err, file) {
                refute.equals(file, path(".buster"));
            }));
        },

        "yields null when no preference file exists": function (done) {
            fileNotFound(path(".buster.d/index.js"));
            fileNotFound(path(".buster.js"));
            fileNotFound(path(".buster"));

            prefs.findFile("buster", done(function (err, file) {
                assert.equals(file, null);
            }));
        }
    },

    "loading properties": {
        "finds file for project": function () {
            this.stub(prefs, "findFile");
            prefs.load("buster", function () {});

            assert.calledOnceWith(prefs.findFile, "buster");
        },

        "yields prefs even if no preference files exist": function (done) {
            this.stub(prefs, "findFile").yields(null, null);
            prefs.load("buster", done(function (err, preferences) {
                assert.isObject(preferences);
            }));
        },

        "yields prefs with source": function (done) {
            var fixture = Path.join(__dirname, "fixture.js");
            this.stub(prefs, "findFile").yields(null, fixture);

            prefs.load("buster", done(function (err, preferences) {
                assert.equals(preferences.source, fixture);
                assert.equals(preferences.get("id"), 42);
            }));
        },

        "yields prefs with namespace": function (done) {
            var fixture = Path.join(__dirname, "fixture.js");
            this.stub(prefs, "findFile").yields(null, fixture);

            prefs.load("buster", done(function (err, preferences) {
                assert.equals(preferences.namespace, "buster");
            }));
        },

        "yields error if module cannot be loaded": function (done) {
            var fixture = Path.join(__dirname, "invalid-fixture.js");
            this.stub(prefs, "findFile").yields(null, fixture);

            prefs.load("sinon", done(function (err, preferences) {
                assert.isObject(err);
            }));
        }
    },

    "getting properties": {
        setUp: function () {
            this.prefs = prefs.create("buster", { id: 42, name: "Bob" });
        },

        "prefers properties from wrapped object": function () {
            assert.equals(this.prefs.get("id"), 42);
            assert.equals(this.prefs.get("name"), "Bob");
        },

        "prefers existing properties over default value": function () {
            assert.equals(this.prefs.get("id", 13), 42);
        },

        "tries environment variable for non-existent property": function () {
            process.env.BUSTER_TYPE = "Something";
            assert.equals(this.prefs.get("type"), "Something");
        },

        "underscores environment variable name": function () {
            process.env.BUSTER_TYPE_OF_THING = "Something";
            assert.equals(this.prefs.get("typeOfThing"), "Something");
        },

        "translates dash in environment variable to underscore": function () {
            process.env.BUSTER_TYPE_OF_THING = "Something";
            assert.equals(this.prefs.get("type-of-thing"), "Something");
        },

        "translates space in environment variable to underscore": function () {
            process.env.BUSTER_TYPE_OF_THING = "Something";
            assert.equals(this.prefs.get("type of thing"), "Something");
        },

        "keeps environment variable name tight": function () {
            process.env.BUSTER_TYPE_OF_THING = "Something";
            assert.equals(this.prefs.get("type - of thing"), "Something");
        },

        "returns undefined for non-existent property": function () {
            refute.defined(this.prefs.get("something"));
        },

        "returns default value for non-existent property": function () {
            assert.equals(this.prefs.get("something", 13), 13);
        },

        "prefers wrapped object over environment variable": function () {
            process.env.AWESOME_STUFF = 13;
            var preferences = prefs.create("awesome", { stuff: 42 });
            assert.equals(preferences.get("stuff", 100), 42);
        },

        "prefers environment variable over default": function () {
            process.env.AWESOME_STUFF = 13;
            var preferences = prefs.create("awesome", {});
            assert.equals(preferences.get("stuff", 100), 13);
        }
    }
});
