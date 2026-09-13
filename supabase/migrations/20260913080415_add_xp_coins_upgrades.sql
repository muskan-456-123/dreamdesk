/*
# Add XP, coins, leveling, and room upgrade shop

1. New Tables
- `profile` — single row storing the user's XP, coins, level, and total stats.
  Columns: xp (int), coins (int), level (int), total_tasks_done (int), total_focus_seconds (int).
- `room_items` — catalog of all purchasable room items (furniture, decor, pets, etc.).
  Columns: key (text PK), name, category, description, cost_coins, required_level, icon (emoji).
- `inventory` — items the user has unlocked.
  Columns: item_key (FK to room_items), equipped (bool), purchased_at.

2. Modified Tables
- `tasks` — add `xp_reward` integer column (default 40) for per-task XP rewards.

3. Security
- Enable RLS on all new tables.
- Allow anon + authenticated CRUD (single-tenant, no sign-in).

4. Important Notes
- The `profile` table is seeded with a default row (0 XP, 0 coins, level 1) if empty.
- `room_items` is seeded with 14 items across categories.
- Level thresholds: Level N requires (N-1)*500 cumulative XP. Level 2 = 500, Level 3 = 1000, etc.
*/

-- Add xp_reward column to tasks
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'xp_reward') THEN
    ALTER TABLE tasks ADD COLUMN xp_reward integer NOT NULL DEFAULT 40;
  END IF;
END $$;

-- Profile table (single row, stores progression)
CREATE TABLE IF NOT EXISTS profile (
  id integer PRIMARY KEY DEFAULT 1,
  xp integer NOT NULL DEFAULT 0,
  coins integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  total_tasks_done integer NOT NULL DEFAULT 0,
  total_focus_seconds integer NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

ALTER TABLE profile ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_profile" ON profile;
CREATE POLICY "anon_select_profile" ON profile FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_profile" ON profile;
CREATE POLICY "anon_insert_profile" ON profile FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_profile" ON profile;
CREATE POLICY "anon_update_profile" ON profile FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Seed default profile if not exists
INSERT INTO profile (id, xp, coins, level) VALUES (1, 0, 0, 1)
  ON CONFLICT (id) DO NOTHING;

-- Room items catalog
CREATE TABLE IF NOT EXISTS room_items (
  key text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'decor',
  description text NOT NULL DEFAULT '',
  cost_coins integer NOT NULL DEFAULT 100,
  required_level integer NOT NULL DEFAULT 1,
  icon text NOT NULL DEFAULT '✦',
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE room_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_room_items" ON room_items;
CREATE POLICY "anon_select_room_items" ON room_items FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_room_items" ON room_items;
CREATE POLICY "anon_insert_room_items" ON room_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_key text NOT NULL REFERENCES room_items(key) ON DELETE CASCADE,
  equipped boolean NOT NULL DEFAULT false,
  purchased_at timestamptz DEFAULT now(),
  UNIQUE (item_key)
);

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_inventory" ON inventory;
CREATE POLICY "anon_select_inventory" ON inventory FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_inventory" ON inventory;
CREATE POLICY "anon_insert_inventory" ON inventory FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_inventory" ON inventory;
CREATE POLICY "anon_update_inventory" ON inventory FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_inventory" ON inventory;
CREATE POLICY "anon_delete_inventory" ON inventory FOR DELETE
  TO anon, authenticated USING (true);

-- Seed room items catalog
INSERT INTO room_items (key, name, category, description, cost_coins, required_level, icon, sort_order) VALUES
  ('plant_basic', 'Potted Plant', 'plant', 'A small green companion for your desk.', 0, 1, '🪴', 1),
  ('lamp_basic', 'Desk Lamp', 'lamp', 'Warm light for evening focus.', 0, 1, '💡', 2),
  ('books_basic', 'Stack of Books', 'decor', 'Knowledge within arm''s reach.', 0, 1, '📚', 3),
  ('lamp_moon', 'Moon Lamp', 'lamp', 'A soft glowing lamp for late-night focus.', 120, 2, '🌙', 4),
  ('plant_glow', 'Glowing Plant', 'plant', 'A magical plant that glows when you complete tasks.', 150, 3, '🌿', 5),
  ('chair_comfy', 'Cozy Chair', 'furniture', 'Sink into comfort during long sessions.', 200, 4, '🪑', 6),
  ('bookshelf', 'Bookshelf', 'furniture', 'Store your notes and ideas in style.', 250, 5, '📚', 7),
  ('wall_art', 'Wall Art', 'decor', 'Beautiful art to inspire your workflow.', 180, 5, '🖼️', 8),
  ('rug_cozy', 'Cozy Rug', 'decor', 'A soft rug to warm up the floor.', 160, 6, '🟫', 9),
  ('setup_gaming', 'Creative Setup', 'computer', 'A powerful computer for creative work.', 350, 7, '🖥️', 10),
  ('pet_cat', 'Desk Cat', 'pet', 'A furry companion who naps while you work.', 400, 8, '🐱', 11),
  ('window_premium', 'Bay Window', 'furniture', 'A larger window with a better view of the clouds.', 300, 10, '🪟', 12),
  ('bed_float', 'Floating Bed', 'furniture', 'Sleep among the stars in your cloud bedroom.', 500, 15, '🛏️', 13),
  ('theme_galaxy', 'Galaxy Theme', 'environment', 'Transform your room into a galaxy workspace.', 800, 20, '🌌', 14)
ON CONFLICT (key) DO NOTHING;

-- Update existing tasks to have xp_reward
UPDATE tasks SET xp_reward = 40 WHERE xp_reward IS NULL OR xp_reward = 0;
