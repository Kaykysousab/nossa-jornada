import express from 'express';
import {
  getAllUsers,
  updateProgress,
  getUserEnrollments
} from '../controllers/userController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, requireAdmin, getAllUsers);
router.post('/progress', authenticateToken, updateProgress);
router.get('/enrollments', authenticateToken, getUserEnrollments);

export default router;