/*
  # Seed Categories and Subcategories

  ## Overview
  Populates the database with predefined categories and subcategories
  for the Happiness with AI app based on the user's specification.

  ## Categories
  1. Health
  2. Productivity
  3. Social Relationships
  4. Leisure
  5. Well-being
  6. Contributions
  7. Commute
  8. Breaks & Rest

  ## Security
  This migration only inserts data into tables that are already secured with RLS.
*/

-- Insert Categories
INSERT INTO categories (name, icon, color, sort_order) VALUES
('Health', '💪', '#10b981', 1),
('Productivity', '💼', '#3b82f6', 2),
('Social Relationships', '👥', '#f59e0b', 3),
('Leisure', '🎨', '#8b5cf6', 4),
('Well-being', '🧘', '#ec4899', 5),
('Contributions', '🤝', '#14b8a6', 6),
('Commute', '🚗', '#6b7280', 7),
('Breaks & Rest', '☕', '#f97316', 8)
ON CONFLICT DO NOTHING;

-- Insert Subcategories for Health
INSERT INTO subcategories (category_id, name, icon, suggested_duration, sort_order)
SELECT 
  id,
  subcategory.name,
  subcategory.icon,
  subcategory.duration,
  subcategory.sort_order
FROM categories,
LATERAL (VALUES
  ('Running', '🏃', 30, 1),
  ('Gym', '🏋️', 60, 2),
  ('Yoga', '🧘', 45, 3),
  ('Walking', '🚶', 30, 4),
  ('Swimming', '🏊', 45, 5),
  ('Sleep', '😴', 480, 6),
  ('Nap', '💤', 20, 7),
  ('Bedtime Routine', '🌙', 30, 8),
  ('Balanced Meal', '🍎', 30, 9),
  ('Hydration', '💧', 5, 10),
  ('Meal Planning', '📝', 30, 11),
  ('Cooking', '🍳', 45, 12)
) AS subcategory(name, icon, duration, sort_order)
WHERE categories.name = 'Health'
ON CONFLICT DO NOTHING;

-- Insert Subcategories for Productivity
INSERT INTO subcategories (category_id, name, icon, suggested_duration, sort_order)
SELECT 
  id,
  subcategory.name,
  subcategory.icon,
  subcategory.duration,
  subcategory.sort_order
FROM categories,
LATERAL (VALUES
  ('Work Tasks', '💻', 120, 1),
  ('Side Projects', '🚀', 90, 2),
  ('Freelancing', '💰', 120, 3),
  ('Online Course', '📚', 60, 4),
  ('Reading', '📖', 30, 5),
  ('Podcasts', '🎧', 45, 6),
  ('Skill Development', '🎯', 60, 7),
  ('Daily Planning', '🗓️', 15, 8),
  ('Weekly Review', '📊', 30, 9),
  ('Journaling', '✍️', 15, 10)
) AS subcategory(name, icon, duration, sort_order)
WHERE categories.name = 'Productivity'
ON CONFLICT DO NOTHING;

-- Insert Subcategories for Social Relationships
INSERT INTO subcategories (category_id, name, icon, suggested_duration, sort_order)
SELECT 
  id,
  subcategory.name,
  subcategory.icon,
  subcategory.duration,
  subcategory.sort_order
FROM categories,
LATERAL (VALUES
  ('Family Meal', '🍽️', 60, 1),
  ('Kids Activities', '👨‍👩‍👧', 90, 2),
  ('Partner Time', '💑', 120, 3),
  ('Phone Call', '📞', 20, 4),
  ('Meet Friends', '☕', 120, 5),
  ('Social Outing', '🎉', 180, 6),
  ('Networking', '🤝', 90, 7),
  ('Group Activity', '👥', 120, 8),
  ('Community Event', '🌍', 150, 9)
) AS subcategory(name, icon, duration, sort_order)
WHERE categories.name = 'Social Relationships'
ON CONFLICT DO NOTHING;

-- Insert Subcategories for Leisure
INSERT INTO subcategories (category_id, name, icon, suggested_duration, sort_order)
SELECT 
  id,
  subcategory.name,
  subcategory.icon,
  subcategory.duration,
  subcategory.sort_order
FROM categories,
LATERAL (VALUES
  ('Reading Books', '📚', 45, 1),
  ('Magazines', '📰', 20, 2),
  ('Articles', '📄', 15, 3),
  ('Movies', '🎬', 120, 4),
  ('TV Series', '📺', 45, 5),
  ('Video Games', '🎮', 60, 6),
  ('Board Games', '🎲', 90, 7),
  ('Sports Games', '⚽', 120, 8),
  ('Painting', '🎨', 60, 9),
  ('Music', '🎵', 30, 10),
  ('Writing', '✍️', 45, 11),
  ('DIY Projects', '🔨', 90, 12)
) AS subcategory(name, icon, duration, sort_order)
WHERE categories.name = 'Leisure'
ON CONFLICT DO NOTHING;

-- Insert Subcategories for Well-being
INSERT INTO subcategories (category_id, name, icon, suggested_duration, sort_order)
SELECT 
  id,
  subcategory.name,
  subcategory.icon,
  subcategory.duration,
  subcategory.sort_order
FROM categories,
LATERAL (VALUES
  ('Meditation', '🧘', 20, 1),
  ('Breathing Exercise', '🌬️', 10, 2),
  ('Mindfulness', '🙏', 15, 3),
  ('Skincare', '💆', 15, 4),
  ('Spa Time', '🛁', 60, 5),
  ('Relaxation', '😌', 30, 6),
  ('Solo Walk', '🚶', 30, 7),
  ('Reflection', '💭', 20, 8)
) AS subcategory(name, icon, duration, sort_order)
WHERE categories.name = 'Well-being'
ON CONFLICT DO NOTHING;

-- Insert Subcategories for Contributions
INSERT INTO subcategories (category_id, name, icon, suggested_duration, sort_order)
SELECT 
  id,
  subcategory.name,
  subcategory.icon,
  subcategory.duration,
  subcategory.sort_order
FROM categories,
LATERAL (VALUES
  ('Volunteering', '👐', 120, 1),
  ('Helping Others', '🤲', 60, 2),
  ('Acts of Kindness', '💝', 15, 3),
  ('Donations', '💸', 10, 4)
) AS subcategory(name, icon, duration, sort_order)
WHERE categories.name = 'Contributions'
ON CONFLICT DO NOTHING;

-- Insert Subcategories for Commute
INSERT INTO subcategories (category_id, name, icon, suggested_duration, sort_order)
SELECT 
  id,
  subcategory.name,
  subcategory.icon,
  subcategory.duration,
  subcategory.sort_order
FROM categories,
LATERAL (VALUES
  ('Driving', '🚗', 30, 1),
  ('Public Transport', '🚆', 45, 2),
  ('Cycling', '🚲', 20, 3),
  ('Walking Commute', '🚶', 25, 4)
) AS subcategory(name, icon, duration, sort_order)
WHERE categories.name = 'Commute'
ON CONFLICT DO NOTHING;

-- Insert Subcategories for Breaks & Rest
INSERT INTO subcategories (category_id, name, icon, suggested_duration, sort_order)
SELECT 
  id,
  subcategory.name,
  subcategory.icon,
  subcategory.duration,
  subcategory.sort_order
FROM categories,
LATERAL (VALUES
  ('Coffee Break', '☕', 10, 1),
  ('Tea Break', '🍵', 10, 2),
  ('Stretching', '🤸', 5, 3),
  ('Micro Pause', '⏸️', 5, 4),
  ('Lunch Break', '🍲', 45, 5)
) AS subcategory(name, icon, duration, sort_order)
WHERE categories.name = 'Breaks & Rest'
ON CONFLICT DO NOTHING;