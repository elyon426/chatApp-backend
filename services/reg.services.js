//we push the result to device
//device stores raw token
import crypto from 'node:crypto';
import { db } from '../db/db.js';

export async function registration({ userName, phoneNumber, deviceId } = {}) {
  if (!userName || !phoneNumber || !deviceId) {
    return { success: false, status: 400, message: 'Please fill all the fields' };
  }

  const plainToken = crypto.randomBytes(32).toString('hex');
  const hashToken = crypto.createHash('sha256').update(plainToken).digest('hex');

  try {
    const [row] = await db`
      WITH new_user AS (
        INSERT INTO users (username, phone_number)
        VALUES (${userName}, ${phoneNumber})
        RETURNING user_id
      )
      INSERT INTO devices (user_id, device_id, tokenhash)
      SELECT user_id, ${deviceId}, ${hashToken} FROM new_user
      RETURNING user_id, device_id`;

    return {
      success: true,
      userId: row.user_id,
      deviceId: row.device_id,
      token: plainToken, // shown once, device stores it
    };
  } catch (err) {
    if (err.code === '23505') {
      return { success: false, status: 409, message: 'Phone number already registered' };
    }
    console.error(err);
    return { success: false, status: 500, message: 'Error registering user' };
  }
}