// webpack.config.js
module.exports = {
  // ...existing config...
  resolve: {
    fallback: {
      stream: require.resolve('stream-browserify'),
    },
  },
};