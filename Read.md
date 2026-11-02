``` 
-- 1. Users Table (Core profiles)
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    username VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Groups Table (Core chat structures)
CREATE TABLE groups (
    group_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Group Members Table (Simple room membership mappings)
CREATE TABLE group_members (
    group_id UUID REFERENCES groups(group_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'member', -- 'admin', 'member'
    PRIMARY KEY (group_id, user_id)
);

-- 4. Messages History Table (Lean single-source log with media support)
CREATE TABLE messages (
    message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL, -- Can point directly to a user_id or a group_id
    content TEXT,              -- Kept nullable in case it's a media-only item (e.g., sending just a photo)
    media_url TEXT,            -- Preserved for image, video, or voice note attachments
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for high-speed chronological message retrieval
CREATE INDEX idx_messages_receiver_time ON messages(receiver_id, timestamp DESC);
```
import * as Contacts from 'expo-contacts';

// Clean helper to strip out spaces, brackets, and dashes
const cleanNumber = (num) => num.replace(/[\s()-]/g, '');

/**
 * FUNCTION 1: First-Time Bulk Sync Execution
 * Loops through nested contact structures, extracts numbers, flattens duplicates,
 * queries backend, and inserts registered app users into SQLite.
 */
export async function runInitialBulkSync(db, serverUrl) {
  // Request native phone book permissions
  const { status } = await Contacts.requestPermissionsAsync();
  if (status !== 'granted') {
    console.log("Permission to access native contacts denied.");
    return;
  }

  // Fetch only the entries that have phone numbers attached
  const { data } = await Contacts.getContactsAsync({
    fields: [Contacts.Fields.PhoneNumbers],
  });

  if (!data || data.length === 0) return;

  const phoneMap = new Map(); // Maps 'cleanNumber' -> 'Native Display Name ("Jane Doe")'
  const cleanList = [];       // Holds all plain numbers to send to the server

  // --- FILTER & EXTRACTION LOGIC ---
  // Loop 1: Iterate through every contact object in the address book array
  data.forEach(contact => {
    // Guard Clause: Only step inside if the person actually has phone numbers
    if (contact.phoneNumbers && Array.isArray(contact.phoneNumbers)) {
      
      // Loop 2: Nested loop to process multiple numbers for a single contact
      contact.phoneNumbers.forEach(phoneObj => {
        if (phoneObj.number) {
          const clean = cleanNumber(phoneObj.number);
          
          // Save the link between the number and what the user calls them on their phone
          phoneMap.set(clean, contact.name || 'No Name');
          
          // Push to our staging array for the server
          cleanList.push(clean);
        }
      });
    }
  });

  // Strip duplicate numbers out of the payload array completely using a Set
  const optimizedPhoneNumbersList = [...new Set(cleanList)];

  if (optimizedPhoneNumbersList.length === 0) return;

  // --- BACKEND COORDINATION ---
  try {
    const res = await fetch(`${serverUrl}/api/contacts/sync-bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumbers: optimizedPhoneNumbersList })
    });
    
    const result = await res.json();

    if (result.success && result.matches && result.matches.length > 0) {
      // Begin a transaction block to safely write all matches into SQLite
      for (const match of result.matches) {
        // Fallback hierarchy: 1. Native contact name, 2. Global app username
        const localDisplayName = phoneMap.get(match.phone_number) || match.username;
        
        await db.runAsync(`
          INSERT OR REPLACE INTO contacts_lookup (user_id, phone_number, display_name, app_username)
          VALUES (?, ?, ?, ?);
        `, [match.user_id, match.phone_number, localDisplayName, match.username]);
      }
      console.log(`Successfully mapped and cached ${result.matches.length} app contacts.`);
    }
  } catch (err) {
    console.error("Bulk synchronization failed on network tier:", err);
  }
}

/**
 * FUNCTION 2: Single Target Check (On-Demand Search)
 * Checks the single localized phone number against local SQLite cache first.
 * If missing, fetches from server single engine and caches on discovery.
 */
export async function syncSingleNewContact(phoneNumber, fallbackName, db, serverUrl) {
  const sanitized = cleanNumber(phoneNumber);

  try {
    // 1. Read from local SQLite lookup cache first to prevent database or server strains
    const localCheck = await db.getFirstAsync(
      `SELECT user_id FROM contacts_lookup WHERE phone_number = ? LIMIT 1;`,
      [sanitized]
    );
    
    if (localCheck) {
      console.log("Contact cache hit! Returning user_id immediately.");
      return localCheck.user_id; 
    }

    // 2. Cache miss: Request verification for this single entity from your auth server
    const res = await fetch(`${serverUrl}/api/contacts/sync-single?phone=${sanitized}`);
    const result = await res.json();

    if (result.success && result.match) {
      // The user exists on your app system! Cache them immediately
      await db.runAsync(`
        INSERT OR REPLACE INTO contacts_lookup (user_id, phone_number, display_name, app_username)
        VALUES (?, ?, ?, ?);
      `, [result.match.user_id, result.match.phone_number, fallbackName || result.match.username, result.match.username]);
      
      return result.match.user_id;
    }
  } catch (err) {
    console.error("Single item lookup sync failure:", err);
  }

  return null; // Return null if the user is not found anywhere
}
