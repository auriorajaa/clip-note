import {Router} from "express";
import {AuthController} from "../controller/auth.controller.js";
import {authenticate} from "../middleware/auth.middleware.js";

const router = Router();

router.get("/verify-email", AuthController.verifyEmail);
router.get("/me", authenticate, AuthController.getProfile);

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/resend-verification", AuthController.resendVerificationEmail);

export default router;
