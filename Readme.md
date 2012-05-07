# Preferences

Manage user-provided preferences for your Node programs through a file in the
user's home directory, environment variables and default values.

## Preference modules

    preferences.load("myproject", function (err, prefs) {
        /* ... */
    });

Preferences will use the first available of the following files (`~/` denotes
'home directory', which on Windows means the directory specified by
`USERPROFILE`):

1. `~/.myproject.d/index.js` (lets the user organize all related files in one
   directory)
2. `~/.myproject.js` (the suffix may be useful for editor syntax highlighting
   etc)
3. `~/.myproject` (iconic Unix style preference file)

Preferences expects the settings file to be a node module that can be
`require`'d.

If you want Preferences to look for other files, or with a different ordering,
just set `preferences.locations` to an array of desired paths. The array should
contain full paths, optionally with `{namespace}` which will be replaced with
the namespace.

## Preference property lookup

    prefs.get("id", 42);

Given one of those modules, Preferences uses the following property lookup:

1. Does the preference module export `id`? Use that
2. Is `process.env.MYPROJECT_ID` set? Use that
3. Otherwise, use the default (`42` in the above example)

# API

### `preferences.home`

String, contains the path to where Preferences thinks the user's home directory
is.

### `preferences.locations`

Array of strings. The locations Preferences will attempt to load, in preferred
order. Default value is

    exports.locations = [
        Path.join(exports.home, ".{namespace}.d", "index.js"),
        Path.join(exports.home, ".{namespace}.js"),
        Path.join(exports.home, ".{namespace}")
    ];

### `preferences.findFile(namespace, callback(err, fileName))`

Finds the filename for the preferred preference module according to the lookup
described above. Yields `null` if none of the files are available. The error
object is currently not being used as any error will simply result in a `null`
file name.

### `preferences.findFileSync(namespace)`

Sync version

### `preferences.create(namespace[, prefs[, source]]) //=> prefsJar`

Creates a preference "jar" (see API below).

`namespace` is a string, typically the name of your project, like "buster". It
will be used to find environment variables relevant to your preferences.

`prefs` is an object with properties. When asking the preference jar for
properties, properties on this object will be preferred.

`source` is a string that reveals which source `prefs` were loaded from. It's
simply exposed as `prefsJar.source`.

### `preferences.load(namespace, callback(err, prefsJar))`

Figures out which file to use, loads its contents and creates a preference
jar that is passed to the callback. The error object is used when `require`-ing
the preference file fails (i.e. when the file exists but is not loadable).

### `preferences.loadSync(namespace)`

Sync version

## `preferenceJar` API

* `namespace` - the corresponding string passed in as argument to `create`
* `source` - the corresponding string passed in as argument to `create`
* `get(name[, defaultVal])` - returns the named property according to the
  property lookup described above. Dashes and spaces are converted to
  underscores when trying environment variables, e.g. `get("something-nice")`
  will try the environment variable `MYPROJECT_SOMETHING_NICE`.
