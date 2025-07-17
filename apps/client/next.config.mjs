import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    distDir: 'dist',
    transpilePackages: ['@game-core', '@shared', '@web3'],
    webpack: (config) => {
        config.resolve.alias['@game-core'] = path.resolve(__dirname, '../../packages/game-core');
        config.resolve.alias['@shared'] = path.resolve(__dirname, '../../packages/shared');
        config.resolve.alias['@web3'] = path.resolve(__dirname, '../../packages/web3');
        return config;
    }
};

export default nextConfig;
