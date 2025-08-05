const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Hash a password using bcrypt
 */
async function hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
}

/**
 * Compare a password with its hash
 */
async function comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token
 */
function generateToken(payload) {
    return jwt.sign(
        payload,
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
}

/**
 * Verify a JWT token
 */
function verifyToken(token) {
    try {
        return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
        console.error('JWT verification error:', error);
        return null;
    }
}

/**
 * Extract token from Authorization header
 */
function extractTokenFromHeader(authHeader) {
    if (!authHeader) return null;

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }

    return parts[1];
}

module.exports = {
    hashPassword,
    comparePassword,
    generateToken,
    verifyToken,
    extractTokenFromHeader
};
