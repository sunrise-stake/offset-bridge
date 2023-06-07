/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack5: true,
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback.fs = false;
        }
        return config;
    },
}

module.exports = nextConfig
