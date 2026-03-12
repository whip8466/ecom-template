const { SignJWT, jwtVerify } = require('jose');
const { env } = require('../config/env');

const secret = new TextEncoder().encode(env.JWT_SECRET);

function toSeconds(duration) {
  if (typeof duration === 'number') return duration;
  if (duration.endsWith('d')) return Number(duration.replace('d', '')) * 24 * 60 * 60;
  if (duration.endsWith('h')) return Number(duration.replace('h', '')) * 60 * 60;
  if (duration.endsWith('m')) return Number(duration.replace('m', '')) * 60;
  return 7 * 24 * 60 * 60;
}

async function signAccessToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + toSeconds(env.JWT_EXPIRES_IN))
    .sign(secret);
}

async function verifyAccessToken(token) {
  const { payload } = await jwtVerify(token, secret);
  return payload;
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
};
