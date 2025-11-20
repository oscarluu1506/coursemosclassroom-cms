import crypto from 'crypto';

/**
 * Generate client key từ secret key
 */
export function generateClientKey(secretKey: string): string {
    return crypto
        .createHash('md5')
        .update(secretKey + 'test')
        .digest('hex');
}
