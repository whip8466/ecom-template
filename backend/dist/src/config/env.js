"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const env = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: Number(process.env.PORT || 4000),
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/eco_next',
    JWT_SECRET: process.env.JWT_SECRET || 'change-me-super-secret',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
};
module.exports = { env };
