/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    const noindex = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]
    return [
      { source: '/dashboard/:path*', headers: noindex },
      { source: '/dashboard', headers: noindex },
      { source: '/login', headers: noindex },
      { source: '/api/:path*', headers: noindex },
    ]
  },
}

export default nextConfig
