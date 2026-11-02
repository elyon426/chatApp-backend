import { Router } from "express";
import { registerUser, loginUser } from "../controllers/auth.controller.js";

// Place 'export' directly before 'const'
export const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
