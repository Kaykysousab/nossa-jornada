import { database } from '../config/database.js';

export const getAllCourses = async (req, res) => {
  try {
    const courses = await database.all(`
      SELECT c.*, 
             COUNT(l.id) as lesson_count
      FROM courses c
      LEFT JOIN lessons l ON c.id = l.course_id
      WHERE c.status = 'published'
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);

    // Parse skills JSON for each course
    const coursesWithSkills = courses.map(course => ({
      ...course,
      skills: course.skills ? JSON.parse(course.skills) : [],
      is_premium: Boolean(course.is_premium),
      enrolled_count: course.enrolled_count || 0
    }));

    res.json({ courses: coursesWithSkills });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await database.get('SELECT * FROM courses WHERE id = ?', [id]);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Get lessons for this course
    const lessons = await database.all(
      'SELECT * FROM lessons WHERE course_id = ? ORDER BY order_index',
      [id]
    );

    res.json({
      course: {
        ...course,
        skills: course.skills ? JSON.parse(course.skills) : [],
        is_premium: Boolean(course.is_premium),
        lessons
      }
    });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createCourse = async (req, res) => {
  try {
    const courseData = {
      ...req.body,
      skills: JSON.stringify(req.body.skills || []),
      is_premium: req.body.is_premium ? 1 : 0
    };

    const result = await database.run(`
      INSERT INTO courses (title, description, thumbnail, instructor, instructor_avatar, 
                          duration, level, category, price, is_premium, skills, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      courseData.title, courseData.description, courseData.thumbnail,
      courseData.instructor, courseData.instructor_avatar, courseData.duration,
      courseData.level, courseData.category, courseData.price,
      courseData.is_premium, courseData.skills, courseData.status || 'draft'
    ]);

    const course = await database.get('SELECT * FROM courses WHERE id = ?', [result.id]);
    
    res.status(201).json({
      course: {
        ...course,
        skills: JSON.parse(course.skills),
        is_premium: Boolean(course.is_premium)
      }
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const courseData = {
      ...req.body,
      skills: JSON.stringify(req.body.skills || []),
      is_premium: req.body.is_premium ? 1 : 0,
      updated_at: new Date().toISOString()
    };

    await database.run(`
      UPDATE courses 
      SET title = ?, description = ?, thumbnail = ?, instructor = ?, 
          instructor_avatar = ?, duration = ?, level = ?, category = ?, 
          price = ?, is_premium = ?, skills = ?, status = ?, updated_at = ?
      WHERE id = ?
    `, [
      courseData.title, courseData.description, courseData.thumbnail,
      courseData.instructor, courseData.instructor_avatar, courseData.duration,
      courseData.level, courseData.category, courseData.price,
      courseData.is_premium, courseData.skills, courseData.status,
      courseData.updated_at, id
    ]);

    const course = await database.get('SELECT * FROM courses WHERE id = ?', [id]);
    
    res.json({
      course: {
        ...course,
        skills: JSON.parse(course.skills),
        is_premium: Boolean(course.is_premium)
      }
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    await database.run('DELETE FROM courses WHERE id = ?', [id]);
    
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const enrollInCourse = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const userId = req.user.id;

    // Check if already enrolled
    const existingEnrollment = await database.get(
      'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    );

    if (existingEnrollment) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    // Get course details
    const course = await database.get('SELECT price FROM courses WHERE id = ?', [courseId]);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Create enrollment
    const result = await database.run(`
      INSERT INTO enrollments (user_id, course_id, payment_status, access_granted)
      VALUES (?, ?, ?, ?)
    `, [
      userId, courseId,
      course.price === 0 ? 'completed' : 'pending',
      course.price === 0 ? 1 : 0
    ]);

    const enrollment = await database.get('SELECT * FROM enrollments WHERE id = ?', [result.id]);
    
    res.status(201).json({ enrollment });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const checkCourseAccess = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const userId = req.user.id;

    const enrollment = await database.get(
      'SELECT access_granted FROM enrollments WHERE user_id = ? AND course_id = ? AND access_granted = 1',
      [userId, courseId]
    );

    res.json({ hasAccess: !!enrollment });
  } catch (error) {
    console.error('Check access error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};