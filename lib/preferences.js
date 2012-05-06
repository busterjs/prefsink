var fs = require("fs");
var Path = require("path");
var home = process.env.USERPROFILE || process.env.HOME;

function path(p) {
    return Path.join(home, p);
}

function tryFile(fileName, callback) {
    fs.stat(fileName, function (err, stat) {
        callback(stat && stat.isFile() ? fileName : null);
    });
}

function tryFiles(fileNames, callback) {
    tryFile(path(fileNames.shift()), function (file) {
        if (!file) {
            if (fileNames.length === 0) { return callback(null, null); }
            return tryFiles(fileNames, callback);
        }
        callback(null, file);
    });
}

function envVarName(ns, preference) {
    return [ns, preference].join("_").
        replace(/[-\s]+/g, "_").
        replace(/^[A-Z]/, function (match) { return match.toLowerCase(); }).
        replace(/[A-Z]/g, function (match) { return "_" + match; }).
        toUpperCase();
}

exports.findFile = function (namespace, callback) {
    tryFiles(["." + namespace + ".d/index.js",
              "." + namespace + ".js",
              "." + namespace], callback);
};

exports.create = function (namespace, prefs, source) {
    prefs = prefs || {};
    return {
        namespace: namespace,
        source: source,

        get: function (preference, defaultVal) {
            if (prefs.hasOwnProperty(preference)) {
                return prefs[preference];
            }
            var envVar = envVarName(namespace, preference);
            if (Object.prototype.hasOwnProperty.call(process.env, envVar)) {
                return process.env[envVar];
            }
            return defaultVal;
        }
    };
};

exports.load = function (namespace, callback) {
    exports.findFile(namespace, function (err, file) {
        var error, mod;
        try {
            if (file) { mod = require(file); }
            mod = exports.create(namespace, mod, file);
        } catch (e) {
            error = e;
        }
        callback(error, mod);
    });
};
