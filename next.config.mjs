/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'https://maps.googleapis.com/:path*', // Proxy all requests to Google Places API
            },
        ];
    },
};

export default nextConfig;
