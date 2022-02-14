module.exports = (api) => {
    if (process.env.NODE_ENV === 'test' || api.env('test')) {
        api.cache(false);
        return {
            presets: [["@babel/preset-env", { "useBuiltIns": "entry", "corejs": 3 }],],
            plugins: ['macros'],
        }
    }

    api.cache(false);
    return {
        presets: [
            ["@babel/preset-env", { "useBuiltIns": "entry", "corejs": 3 }],
            "@babel/preset-typescript",
        ],
    };
}
