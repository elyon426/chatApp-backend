import { Router } from "express";
import { registerUser, loginUser } from "../controllers/auth.controller.js";
import { syncBulkContacts, syncSingleContact } from "../controllers/contacts.controller.js";

// Place 'export' directly before 'const'
export const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/sync-bulk', syncBulkContacts);
router.get('/sync-single', syncSingleContact);