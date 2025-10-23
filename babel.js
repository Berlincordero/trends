module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      "expo-router/babel",
      // Siempre al final:
      "react-native-reanimated/plugin",
    ],
  };
};
