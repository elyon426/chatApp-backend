import { db } from '../db/db.js';

/**
 * 1. Bulk Sync Endpoint (Runs ONLY once on first-time login)
 * POST /api/contacts/sync-bulk
 */
export async function syncBulkContacts(req, res) {
    const { phoneNumbers } = req.body; // Expects an array
    if (!phoneNumbers || !Array.isArray(phoneNumbers)) {
        return res.status(400).json({ success: false, message: "Invalid payload" });
    }
    try {
        const result = await db.sql`
            SELECT user_id, phone_number, username FROM users 
            WHERE phone_number = ANY(${phoneNumbers});
        `;
        return res.status(200).json({ success: true, matches: result.rows });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false });
    }
}

/**
 * 2. Single Sync Endpoint (Runs incrementally on search / add)
 * GET /api/contacts/sync-single?phone=...
 */
export async function syncSingleContact(req, res) {
    const { phone } = req.query; // Expects a single string parameter
    if (!phone) {
        return res.status(400).json({ success: false, message: "Missing phone number" });
    }
    try {
        const result = await db.sql`
            SELECT user_id, phone_number, username FROM users 
            WHERE phone_number = ${phone} LIMIT 1;
        `;
        
        if (!result.rows || result.rows.length === 0) {
            return res.status(200).json({ success: true, match: null });
        }
        return res.status(200).json({ success: true, match: result.rows[0] });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false });
    }
}
