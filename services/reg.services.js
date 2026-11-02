//we push the result to device
//device stores raw token
import {db} from '../db/db.js';
export async function registration(data){
    const {userName,phoneNumber,deviceId} = data;
    const plainToken = crypto.randomBytes(32).toString('hex');
    const hashToken = crypto.createHash('sha256').update(plainToken).digest('hex');
    if(!userName || !phoneNumber || !deviceId){
        return {success:"false",message:"Please fill all the fields"}
    }
    try{
        await db.sql('BEGIN')
        //const username = `${firstName}${lastName}`;
        const result = await db.sql
        `INSERT INTO users (username,phone_number) 
        VALUES (${userName},${phoneNumber})
        `;       
        if (!userResult.rows || userResult.rows.length === 0) {
            throw new Error('Failed to create user row');
        }
        const newUserId = result.rows[0].id;
       const deviceRes =  await db.sql
         `INSERT INTO devices(user_id,device_id,tokenhash)
         VALUES (${newUserId},${deviceId},${hashToken})
        `;
        if (!deviceRes.rows || deviceRes.rows.length === 0) {
            throw new Error('Failed to create device row');
        }
        const newDeviceId = deviceRes.rows[0].id;
        await db.sql('COMMIT')
        return {
            success: "true",
            message: "User registered successfully",
            userId: newUserId,
            token: plainToken, // Provide plain token to client ONCE on registration
            deviceId: newDeviceId
        };


    }catch(err){
        await db.sql('ROLLBACK')
        console.error(err);
        throw new Error('Error registering user');

    }
    
}