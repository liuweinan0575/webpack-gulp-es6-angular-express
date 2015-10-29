module.exports = {
  production: (process.env.NODE_ENV === 'production'),

  ports: {
    httpServer: 4000,
    devServer: 3000
  }
};
