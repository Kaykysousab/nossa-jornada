import { stripe } from '../config/stripe.js';
import { database } from '../config/database.js';

export const createPaymentIntent = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;

    // Get course details
    const course = await database.get('SELECT * FROM courses WHERE id = ?', [courseId]);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.price === 0) {
      return res.status(400).json({ error: 'This course is free' });
    }

    // Check if already enrolled
    const existingEnrollment = await database.get(
      'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    );

    if (existingEnrollment) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(course.price * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        courseId: courseId.toString(),
        userId: userId.toString(),
        courseName: course.title
      }
    });

    // Create payment record
    await database.run(`
      INSERT INTO payments (user_id, course_id, stripe_payment_intent_id, amount, status)
      VALUES (?, ?, ?, ?, ?)
    `, [userId, courseId, paymentIntent.id, course.price, 'pending']);

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const userId = req.user.id;

    // Get payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      const courseId = paymentIntent.metadata.courseId;

      // Update payment status
      await database.run(
        'UPDATE payments SET status = ? WHERE stripe_payment_intent_id = ?',
        ['succeeded', paymentIntentId]
      );

      // Create or update enrollment
      await database.run(`
        INSERT OR REPLACE INTO enrollments 
        (user_id, course_id, payment_status, stripe_payment_intent_id, amount_paid, access_granted)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [userId, courseId, 'completed', paymentIntentId, paymentIntent.amount / 100, 1]);

      // Update course enrolled count
      await database.run(
        'UPDATE courses SET enrolled_count = enrolled_count + 1 WHERE id = ?',
        [courseId]
      );

      res.json({ success: true, message: 'Payment confirmed and access granted' });
    } else {
      res.status(400).json({ error: 'Payment not completed' });
    }
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getStripeConfig = async (req, res) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
  });
};

export const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      
      // Update payment status
      await database.run(
        'UPDATE payments SET status = ? WHERE stripe_payment_intent_id = ?',
        ['succeeded', paymentIntent.id]
      );

      // Grant course access
      const courseId = paymentIntent.metadata.courseId;
      const userId = paymentIntent.metadata.userId;

      await database.run(`
        INSERT OR REPLACE INTO enrollments 
        (user_id, course_id, payment_status, stripe_payment_intent_id, amount_paid, access_granted)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [userId, courseId, 'completed', paymentIntent.id, paymentIntent.amount / 100, 1]);

      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      
      await database.run(
        'UPDATE payments SET status = ? WHERE stripe_payment_intent_id = ?',
        ['failed', failedPayment.id]
      );

      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

export const getUserPayments = async (req, res) => {
  try {
    const payments = await database.all(`
      SELECT p.*, c.title as course_title, c.thumbnail as course_thumbnail
      FROM payments p
      JOIN courses c ON p.course_id = c.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
    `, [req.user.id]);

    res.json({ payments });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};