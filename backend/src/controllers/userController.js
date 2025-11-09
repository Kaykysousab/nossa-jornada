import { database } from '../config/database.js';

export const getAllUsers = async (req, res) => {
  try {
    const users = await database.all(`
      SELECT id, email, name, avatar_url, role, xp, level, created_at
      FROM users
      ORDER BY created_at DESC
    `);

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProgress = async (req, res) => {
  try {
    const { lessonId, completed } = req.body;
    const userId = req.user.id;

    // Update or insert progress
    await database.run(`
      INSERT OR REPLACE INTO user_progress (user_id, lesson_id, completed, completed_at)
      VALUES (?, ?, ?, ?)
    `, [userId, lessonId, completed ? 1 : 0, completed ? new Date().toISOString() : null]);

    // Update user XP if lesson completed
    if (completed) {
      await database.run(`
        UPDATE users 
        SET xp = xp + 10, 
            level = (xp + 10) / 100 + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [userId]);
    }

    const progress = await database.get(
      'SELECT * FROM user_progress WHERE user_id = ? AND lesson_id = ?',
      [userId, lessonId]
    );

    res.json({ progress });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserEnrollments = async (req, res) => {
  try {
    const enrollments = await database.all(`
      SELECT e.*, c.*
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.user_id = ?
      ORDER BY e.enrolled_at DESC
    `, [req.user.id]);

    // Parse skills for each course
    const enrollmentsWithSkills = enrollments.map(enrollment => ({
      ...enrollment,
      skills: enrollment.skills ? JSON.parse(enrollment.skills) : [],
      is_premium: Boolean(enrollment.is_premium)
    }));

    res.json({ enrollments: enrollmentsWithSkills });
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};