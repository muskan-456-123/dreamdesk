import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL ?? import.meta.env.SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn('Supabase env vars missing — data will not persist. Check .env configuration.');
}

export const supabase = createClient(url ?? '', anonKey ?? '');

export type Task = {
  id: string;
  label: string;
  tag: string;
  done: boolean;
  xp_reward: number;
  created_at: string;
};

export type Note = {
  id: string;
  content: string;
  updated_at: string;
};

export type HabitRow = {
  id: string;
  habit_key: string;
  checked_date: string;
};

export type FocusSession = {
  id: string;
  duration_seconds: number;
  completed_at: string;
};

export type Setting = {
  key: string;
  value: string;
  updated_at: string;
};

export type Profile = {
  id: number;
  xp: number;
  coins: number;
  level: number;
  total_tasks_done: number;
  total_focus_seconds: number;
};

export type RoomItem = {
  key: string;
  name: string;
  category: string;
  description: string;
  cost_coins: number;
  required_level: number;
  icon: string;
  sort_order: number;
};

export type InventoryEntry = {
  id: string;
  item_key: string;
  equipped: boolean;
  purchased_at: string;
};
