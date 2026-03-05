import crypto from 'node:crypto';

// The key should be a 32-byte (256-bit) hex string in .env
const ENCRYPTION_KEY = process.env.CHAT_ENCRYPTION_KEY
    ? Buffer.from(process.env.CHAT_ENCRYPTION_KEY, 'hex')
    : crypto.randomBytes(32); // Fallback securely, but instances will lose sync if restarting without ENV

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

export function encryptMessage(text: string): { content: string, iv: string } {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    // We combine the encrypted text and the auth tag.
    // iv is stored separately in the DB.
    return {
        content: encrypted + ':' + authTag,
        iv: iv.toString('hex')
    };
}

export function decryptMessage(encryptedContent: string, ivHex: string): string {
    try {
        const parts = encryptedContent.split(':');
        const encryptedText = parts[0];
        const authTagHex = parts[1];

        if (!encryptedText || !authTagHex || !ivHex) {
            return "[Message Illisible]";
        }

        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');

        const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (e) {
        console.error("Erreur de déchiffrement:", e);
        return "[Erreur de Déchiffrement]";
    }
}
