/*
  # Add Helper Functions

  1. New Functions
    - `increment_enrolled_count` - Increments the enrolled_count for a course
    - This function is used when a student enrolls in a course

  2. Notes
    - Function is marked as SECURITY DEFINER to bypass RLS policies
    - Only increments, never decrements for data integrity
*/

CREATE OR REPLACE FUNCTION increment_enrolled_count(course_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE courses
  SET enrolled_count = enrolled_count + 1
  WHERE id = course_id;
END;
$$;