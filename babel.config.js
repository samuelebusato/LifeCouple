module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // jsxImportSource "nativewind" e' cio' che fa funzionare className sui
      // componenti React Native; babel-preset-expo include gia' il plugin worklets.
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
