import { database } from './database.js';

const createTables = async () => {
  try {
    await database.connect();

    // Users table
    await database.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        avatar_url TEXT,
        role TEXT DEFAULT 'student' CHECK (role IN ('student', 'instructor', 'admin')),
        xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Courses table
    await database.run(`
      CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        thumbnail TEXT,
        instructor TEXT NOT NULL,
        instructor_avatar TEXT,
        duration TEXT NOT NULL,
        level TEXT NOT NULL CHECK (level IN ('Beginner', 'Intermediate', 'Advanced')),
        category TEXT NOT NULL,
        price DECIMAL(10,2) DEFAULT 0,
        is_premium BOOLEAN DEFAULT 0,
        rating DECIMAL(3,2) DEFAULT 0,
        review_count INTEGER DEFAULT 0,
        enrolled_count INTEGER DEFAULT 0,
        skills TEXT, -- JSON string
        status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Lessons table
    await database.run(`
      CREATE TABLE IF NOT EXISTS lessons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        video_url TEXT,
        duration TEXT NOT NULL,
        order_index INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
      )
    `);

    // Enrollments table
    await database.run(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'cancelled')),
        stripe_payment_intent_id TEXT,
        amount_paid DECIMAL(10,2),
        enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        access_granted BOOLEAN DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
        UNIQUE(user_id, course_id)
      )
    `);

    // User progress table
    await database.run(`
      CREATE TABLE IF NOT EXISTS user_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        lesson_id INTEGER NOT NULL,
        completed BOOLEAN DEFAULT 0,
        completed_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE,
        UNIQUE(user_id, lesson_id)
      )
    `);

    // Payments table
    await database.run(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        stripe_payment_intent_id TEXT UNIQUE,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'cancelled', 'refunded')),
        amount DECIMAL(10,2) NOT NULL,
        currency TEXT DEFAULT 'usd',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better performance
    await database.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await database.run('CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status)');
    await database.run('CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON lessons(course_id)');
    await database.run('CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments(user_id)');
    await database.run('CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id)');
    await database.run('CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id)');
    await database.run('CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id)');

    // Insert default admin user
    const adminExists = await database.get('SELECT id FROM users WHERE email = ?', ['admin@cosmic.com']);
    if (!adminExists) {
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      await database.run(`
        INSERT INTO users (email, password, name, role)
        VALUES (?, ?, ?, ?)
      `, ['admin@cosmic.com', hashedPassword, 'Admin User', 'admin']);
      
      console.log('Default admin user created: admin@cosmic.com / admin123');
    }

    // Insert default student user
    const studentExists = await database.get('SELECT id FROM users WHERE email = ?', ['user@cosmic.com']);
    if (!studentExists) {
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash('user123', 12);
      
      await database.run(`
        INSERT INTO users (email, password, name, role)
        VALUES (?, ?, ?, ?)
      `, ['user@cosmic.com', hashedPassword, 'Student User', 'student']);
      
      console.log('Default student user created: user@cosmic.com / user123');
    }

    // Insert sample courses
    const courseExists = await database.get('SELECT id FROM courses LIMIT 1');
    if (!courseExists) {
      const sampleCourses = [
        {
          title: 'React Fundamentals',
          description: 'Learn the basics of React development',
          thumbnail: 'https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?auto=compress&cs=tinysrgb&w=800',
          instructor: 'John Doe',
          duration: '6 hours',
          level: 'Beginner',
          category: 'Programming',
          price: 0,
          skills: JSON.stringify(['React', 'JavaScript', 'JSX']),
          status: 'published'
        },
        {
          title: 'Advanced TypeScript',
          description: 'Master TypeScript for large-scale applications',
          thumbnail: 'https://images.pexels.com/photos/1181676/pexels-photo-1181676.jpeg?auto=compress&cs=tinysrgb&w=800',
          instructor: 'Jane Smith',
          duration: '8 hours',
          level: 'Advanced',
          category: 'Programming',
          price: 49.99,
          is_premium: 1,
          skills: JSON.stringify(['TypeScript', 'JavaScript', 'Node.js']),
          status: 'published'
        }
      ];

      for (const course of sampleCourses) {
        await database.run(`
          INSERT INTO courses (title, description, thumbnail, instructor, duration, level, category, price, is_premium, skills, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          course.title, course.description, course.thumbnail, course.instructor,
          course.duration, course.level, course.category, course.price,
          course.is_premium || 0, course.skills, course.status
        ]);
      }

      console.log('Sample courses created');
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createTables()
    .then(() => {
      console.log('Database setup complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database setup failed:', error);
      process.exit(1);
    });
}

export { createTables };