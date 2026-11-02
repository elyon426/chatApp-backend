import { db } from '../db/db.js';

export async function syncBulkContacts(req, res) {
    const { phoneNumbers } = req.body;
    if (!phoneNumbers || !Array.isArray(phoneNumbers)) {
        return res.status(400).json({ success: false, message: "Invalid payload" });
    }
    try {
        const rows = await db`
            SELECT user_id, phone_number, username FROM users
            WHERE phone_number = ANY(${phoneNumbers});
        `;
        return res.status(200).json({ success: true, matches: rows });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false });
    }
}

export async function syncSingleContact(req, res) {
    const { phone } = req.query;
    if (!phone) {
        return res.status(400).json({ success: false, message: "Missing phone number" });
    }
    try {
        const rows = await db`
            SELECT user_id, phone_number, username FROM users
            WHERE phone_number = ${phone} LIMIT 1;
        `;
        return res.status(200).json({ success: true, match: rows[0] ?? null });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false });
    }
}