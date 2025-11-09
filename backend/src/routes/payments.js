import express from 'express';
import {
  createPaymentIntent,
  confirmPayment,
  getStripeConfig,
  handleWebhook,
  getUserPayments
} from '../controllers/paymentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/config', getStripeConfig);
router.post('/create-intent', authenticateToken, createPaymentIntent);
router.post('/confirm', authenticateToken, confirmPayment);
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);
router.get('/', authenticateToken, getUserPayments);

export default router;