var { createMacro } = require("babel-plugin-macros");
var getMacro = require("./lib").default;

var macro = getMacro({
    extension: /\.json$/,
    load: function (content) {
        return JSON.parse(content);
    },
});

module.exports = createMacro(macro, {
    configName: '@jochlain/translations-json',
});
