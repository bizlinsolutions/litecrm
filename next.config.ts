import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/crm',
  assetPrefix: '/crm',
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    ADMIN_NAME: process.env.ADMIN_NAME,
    WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
    APP_NAME: process.env.APP_NAME,
    APP_URL: process.env.APP_URL,
    APP_VERSION: process.env.APP_VERSION,
    PLUGIN_MODE: process.env.PLUGIN_MODE,
    PLUGIN_PREFIX: process.env.PLUGIN_PREFIX,
  },
  serverExternalPackages: ['mongoose'],
};

export default nextConfig;
