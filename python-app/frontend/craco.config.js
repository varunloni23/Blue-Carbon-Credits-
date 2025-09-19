module.exports = {
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:8002',
        changeOrigin: true,
        secure: false,
      },
      // Disable WebSocket proxy to prevent errors
      '/ws': false,
      '/sockjs-node': false,
    },
  },
};
