module.exports = (api) => {
    const presets = [["@babel/preset-env", { "useBuiltIns": "entry", "corejs": 3 }]];
    const plugins = [];

    if (process.env.NODE_ENV !== 'test' && !api.env('test')) {
        presets.push("@babel/preset-typescript");
    } else {
        plugins.push("macros");
    }

    api.cache(false);
    return {
        presets,
        plugins
    };
}
