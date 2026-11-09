module.exports = function (api) {
    // Cached per environment: the Tabler rewrite below is skipped under Jest,
    // where tests mock the barrel import (`jest.mock('@tabler/icons-react-native')`).
    const isTest = api.cache.using(() => process.env.NODE_ENV === "test");
    return {
        presets: [
            ["babel-preset-expo"],
        ],
        plugins: [
            ...(isTest ? [] : [require("./babel-plugins/tabler-per-icon")]),
            // Must stay last.
            "react-native-reanimated/plugin",
        ],
    };
};
