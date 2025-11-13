// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      "expo-router/babel",
      // 👇 estos dos al final
      "react-native-reanimated/plugin",
      "react-native-worklets/plugin",
    ],
  };
};
