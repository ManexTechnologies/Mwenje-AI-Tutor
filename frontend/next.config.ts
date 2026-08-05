import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.95', 'localhost', '127.0.0.1'],
  async rewrites() {
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:4000'

    return [
      {
        source: '/backend/:path*',
        destination: `${backendUrl}/:path*`
      }
    ]
  }
}

export default nextConfig
