import { registerUser } from "../controllers/auth.controller";
import { loginUser } from "../controllers/auth.controller";

router.post('/register',registerUser);
router.post('/login',loginUser);