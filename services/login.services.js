//we take devicedId and hashedToken and userId which are stored in user device
export async function login(data){
    const {hashToken,deviceId,userId} = data;
    if(!deviceId ||!userId ||!hashToken ){
        return {success:"false",message:"Please fill all the fields"}
    }
    try{
        //confirm userId
        // Fetch tokenhash and device_id matching the specific user out of the single row
        const result = await db.sql`
            SELECT tokenhash, device_id 
            FROM devices 
            WHERE user_id = ${userId} AND device_id = ${deviceId}
            LIMIT 1;
        `;

        // If no matching device/user record is found
        if (!result.rows || result.rows.length === 0) {
            return { success: "false", message: "Invalid user or device structure" };
        }

        const dbRecord = result.rows[0];
        
        // Securely match database secrets against incoming request items
        if (hashToken !== dbRecord.tokenhash || deviceId !== dbRecord.device_id) {
            return { success: "false", message: "Wrong token or device ID" };
        }
        
        return { success: "true", isValid: "true" };

    }catch(err){
        console.log(err)
        throw new Error('error logn in user')
    }

}