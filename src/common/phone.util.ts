export function normalizePhone(phone: string): string {
    if (!phone) {
        throw new Error('Phone number is required');
    }

    // Remove spaces, dashes, brackets
    let cleaned = phone.replace(/[\s\-()]/g, '');

    // Remove leading 0
    if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
    }

    // Add country code if missing
    if (!cleaned.startsWith('+')) {
        // Assuming India (+91)
        if (cleaned.length === 10) {
            cleaned = '+91' + cleaned;
        } else {
            throw new Error('Invalid phone number format');
        }
    }

    // Final validation
    if (!/^\+\d{11,15}$/.test(cleaned)) {
        throw new Error('Invalid phone number');
    }

    return cleaned;
}
