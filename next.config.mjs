/** @type {import('next').NextConfig} */

const isExport = process.env.NEXT_PUBLIC_READONLY === 'true'

const config = {
  output: isExport ? 'export' : undefined,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  images: { unoptimized: true },
  trailingSlash: true,
}

if (!isExport) {
  config.rewrites = async () => [
    { source: '/api/:path*', destination: 'http://localhost:3001/api/:path*' },
    { source: '/source/:path*', destination: 'http://localhost:3001/source/:path*' },
  ]
}

export default config
