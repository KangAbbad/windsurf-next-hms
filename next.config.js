/** @type {import('next').NextConfig} */
const nextConfig = {
  // api: {
  //   bodyParser: {
  //     sizeLimit: '1mb',
  //   },
  //   responseLimit: '8mb',
  // },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
