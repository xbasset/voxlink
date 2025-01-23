module.exports = {
  async headers() {
    return [
      {
        source: '/embed',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.ALLOWED_ORIGINS || '*'
          }
        ]
      }
    ]
  }
} 