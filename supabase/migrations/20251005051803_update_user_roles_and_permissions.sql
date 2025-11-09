/*
  # Update User Roles and Permissions System

  1. Changes to profiles table
    - Update role constraint to include super_admin and teacher
    - Add course_instructor field for teachers to link them to courses

  2. New RLS Policies
    - Super Admin: Full access to everything
    - Teacher Admin: Access only to their assigned courses and students
    - Students: Access only to their own data

  3. Security
    - Strict RLS policies based on role hierarchy
    - Teachers can only manage their own courses
    - Students have read-only access to course content
*/

-- Drop existing role constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS valid_role;

-- Add new role constraint with super_admin and teacher
ALTER TABLE profiles ADD CONSTRAINT valid_role 
  CHECK (role IN ('super_admin', 'teacher', 'student'));

-- Add is_instructor flag to courses table to link teachers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' AND column_name = 'instructor_id'
  ) THEN
    ALTER TABLE courses ADD COLUMN instructor_id uuid REFERENCES profiles(id);
  END IF;
END $$;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

-- Profiles RLS Policies

-- Super Admin has full access
CREATE POLICY "Super Admin can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super Admin can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super Admin can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super Admin can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Teachers can view students enrolled in their courses
CREATE POLICY "Teachers can view their students"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles teacher
      WHERE teacher.id = auth.uid()
      AND teacher.role = 'teacher'
    )
    AND (
      profiles.id = auth.uid()
      OR
      profiles.id IN (
        SELECT e.user_id FROM enrollments e
        INNER JOIN courses c ON c.id = e.course_id
        WHERE c.instructor_id = auth.uid()
      )
    )
  );

-- Users can view own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can update own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Drop existing course policies
DROP POLICY IF EXISTS "Anyone can view published courses" ON courses;
DROP POLICY IF EXISTS "Admins can view all courses" ON courses;
DROP POLICY IF EXISTS "Admins can insert courses" ON courses;
DROP POLICY IF EXISTS "Admins can update courses" ON courses;
DROP POLICY IF EXISTS "Admins can delete courses" ON courses;

-- Courses RLS Policies

-- Anyone can view published courses
CREATE POLICY "Anyone can view published courses"
  ON courses FOR SELECT
  TO authenticated
  USING (status = 'published');

-- Super Admin can do everything
CREATE POLICY "Super Admin can manage all courses"
  ON courses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Teachers can view their own courses
CREATE POLICY "Teachers can view own courses"
  ON courses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
    AND instructor_id = auth.uid()
  );

-- Teachers can update their own courses
CREATE POLICY "Teachers can update own courses"
  ON courses FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
    AND instructor_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
    AND instructor_id = auth.uid()
  );

-- Teachers can create courses (will be assigned as instructor)
CREATE POLICY "Teachers can create courses"
  ON courses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
    AND instructor_id = auth.uid()
  );

-- Drop existing lesson policies
DROP POLICY IF EXISTS "Anyone can view lessons of published courses" ON lessons;
DROP POLICY IF EXISTS "Admins can manage lessons" ON lessons;

-- Lessons RLS Policies

-- Anyone can view lessons of published courses
CREATE POLICY "Anyone can view published lessons"
  ON lessons FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = lessons.course_id
      AND courses.status = 'published'
    )
  );

-- Super Admin can manage all lessons
CREATE POLICY "Super Admin can manage all lessons"
  ON lessons FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Teachers can manage lessons of their courses
CREATE POLICY "Teachers can manage own course lessons"
  ON lessons FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
    AND EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = lessons.course_id
      AND courses.instructor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
    AND EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = lessons.course_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- Drop existing enrollment policies
DROP POLICY IF EXISTS "Admins can view all enrollments" ON enrollments;

-- Enrollments RLS Policies

-- Super Admin can view all enrollments
CREATE POLICY "Super Admin can view all enrollments"
  ON enrollments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Teachers can view enrollments in their courses
CREATE POLICY "Teachers can view course enrollments"
  ON enrollments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
    AND EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = enrollments.course_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- Drop existing lesson progress policies
DROP POLICY IF EXISTS "Admins can view all lesson progress" ON lesson_progress;

-- Lesson Progress RLS Policies

-- Super Admin can view all progress
CREATE POLICY "Super Admin can view all progress"
  ON lesson_progress FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Teachers can view progress of students in their courses
CREATE POLICY "Teachers can view student progress"
  ON lesson_progress FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
    AND EXISTS (
      SELECT 1 FROM lessons l
      INNER JOIN courses c ON c.id = l.course_id
      WHERE l.id = lesson_progress.lesson_id
      AND c.instructor_id = auth.uid()
    )
  );

-- Create index for instructor_id
CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON courses(instructor_id);

-- Create function to get teacher's students
CREATE OR REPLACE FUNCTION get_teacher_students(teacher_id uuid)
RETURNS TABLE (
  student_id uuid,
  student_name text,
  student_email text,
  course_id uuid,
  course_title text,
  enrolled_at timestamptz,
  progress numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as student_id,
    p.name as student_name,
    p.email as student_email,
    c.id as course_id,
    c.title as course_title,
    e.enrolled_at,
    e.progress
  FROM enrollments e
  INNER JOIN profiles p ON p.id = e.user_id
  INNER JOIN courses c ON c.id = e.course_id
  WHERE c.instructor_id = teacher_id
  AND p.role = 'student'
  ORDER BY e.enrolled_at DESC;
END;
$$;

-- Create function to check if user has permission
CREATE OR REPLACE FUNCTION has_permission(user_id uuid, required_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM profiles WHERE id = user_id;
  
  IF required_role = 'super_admin' THEN
    RETURN user_role = 'super_admin';
  ELSIF required_role = 'teacher' THEN
    RETURN user_role IN ('super_admin', 'teacher');
  ELSIF required_role = 'student' THEN
    RETURN user_role IN ('super_admin', 'teacher', 'student');
  ELSE
    RETURN false;
  END IF;
END;
$$;