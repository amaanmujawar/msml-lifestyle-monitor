const crypto = require('crypto');

const AES_ALGORITHM = 'aes-256-gcm';
const DEFAULT_SECRET = 'msml-lifestyle-monitor-passwords';

function deriveKey() {
  const secret =
    process.env.PASSWORD_ENCRYPTION_KEY ||
    process.env.SESSION_SECRET ||
    DEFAULT_SECRET;
  return crypto.createHash('sha256').update(secret).digest(); // 32 bytes for AES-256
}

const ENCRYPTION_KEY = deriveKey();

function createDigest(password) {
  const normalized = typeof password === 'string' ? password : '';
  return crypto.createHash('sha256').update(normalized).digest();
}

function hashPassword(password) {
  const digest = createDigest(password);
  const iv = crypto.randomBytes(12); // GCM recommended IV size
  const cipher = crypto.createCipheriv(AES_ALGORITHM, ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(digest), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('hex'), authTag.toString('hex'), encrypted.toString('hex')].join(':');
}

function verifyPassword(password, stored) {
  if (typeof stored !== 'string' || stored.length === 0) {
    return false;
  }

  const digest = createDigest(password);

  // Support legacy SHA-256 hex hashes so existing accounts can still sign in.
  if (/^[a-f0-9]{64}$/i.test(stored)) {
    const legacyBuffer = Buffer.from(stored, 'hex');
    if (legacyBuffer.length !== digest.length) {
      return false;
    }
    return crypto.timingSafeEqual(legacyBuffer, digest);
  }

  const [ivHex, tagHex, encryptedHex] = stored.split(':');
  if (!ivHex || !tagHex || !encryptedHex) {
    return false;
  }

  try {
    const decipher = crypto.createDecipheriv(
      AES_ALGORITHM,
      ENCRYPTION_KEY,
      Buffer.from(ivHex, 'hex')
    );
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedHex, 'hex')),
      decipher.final(),
    ]);

    if (decrypted.length !== digest.length) {
      return false;
    }
    return crypto.timingSafeEqual(decrypted, digest);
  } catch (error) {
    return false;
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
};
