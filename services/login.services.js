//we take devicedId and hashedToken and userId which are stored in user device
import crypto from 'node:crypto';
import { db } from '../db/db.js';
export async function login(data){
    const {token,deviceId,userId} = data;
    if(!deviceId ||!userId ||!token ){
        return { success: false, status: 400, message: 'Missing fields' };
    }
    try{
        //confirm userId
        const incoming = crypto.createHash('sha256').update(token).digest(); 
        // Fetch tokenhash and device_id matching the specific user out of the single row
        const [row] = await db
        `
            SELECT tokenhash
            FROM devices 
            WHERE user_id = ${userId} AND device_id = ${deviceId}
            LIMIT 1;
        `;

        // If no matching device/user record is found
        if (!row) return { success: false, status: 401, message: 'Invalid credentials' };

        const stored = Buffer.from(row.tokenhash, 'hex');
    if (stored.length !== incoming.length || !crypto.timingSafeEqual(stored, incoming)) {
      return { success: false, status: 401, message: 'Invalid credentials' };
    }

    return { success: true, userId };

    }catch(err){
        console.log(err)
        throw new Error('error logn in user')
    }

}