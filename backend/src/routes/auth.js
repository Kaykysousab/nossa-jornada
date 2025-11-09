import express from 'express';
import { register, login, getCurrentUser, registerValidation, loginValidation } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', authenticateToken, getCurrentUser);

export default router;