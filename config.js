module.exports = {
  production: (process.env.NODE_ENV === 'production'),
  watch : (process.env.NODE_ENV === 'watch'),

  ports: {
    httpServer: 4000,
    devServer: 3000
  }
};
