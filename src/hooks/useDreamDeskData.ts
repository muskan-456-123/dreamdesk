import { useCallback, useEffect, useState } from 'react';
import { supabase, type Task, type Note, type Profile, type RoomItem, type InventoryEntry } from '@/lib/supabase';

const HABIT_KEYS = ['read', 'water', 'move'] as const;
type HabitKey = (typeof HABIT_KEYS)[number];

function last7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push(date.toISOString().slice(0, 10));
  }
  return days;
}

export function xpForLevel(level: number): number {
  return (level - 1) * 500;
}

export function levelFromXp(xp: number): number {
  return Math.floor(xp / 500) + 1;
}

export type RewardEvent = {
  xp: number;
  coins: number;
  levelUp: boolean;
  newLevel: number;
  unlockedItem: string | null;
};

export function useDreamDeskData() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [note, setNoteState] = useState('');
  const [habitChecks, setHabitChecks] = useState<Record<string, boolean[]>>({
    read: [false, false, false, false, false, false, false],
    water: [false, false, false, false, false, false, false],
    move: [false, false, false, false, false, false, false],
  });
  const [mood, setMoodState] = useState('sunset');
  const [focusSeconds, setFocusSeconds] = useState(0);
  const [profile, setProfile] = useState<Profile>({ id: 1, xp: 0, coins: 0, level: 1, total_tasks_done: 0, total_focus_seconds: 0 });
  const [roomItems, setRoomItems] = useState<RoomItem[]>([]);
  const [inventory, setInventory] = useState<InventoryEntry[]>([]);
  const [rewardEvent, setRewardEvent] = useState<RewardEvent | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [tasksRes, noteRes, habitsRes, moodRes, focusRes, profileRes, itemsRes, inventoryRes] = await Promise.all([
        supabase.from('tasks').select('*').order('created_at', { ascending: true }),
        supabase.from('notes').select('*').order('updated_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('habits').select('*'),
        supabase.from('settings').select('*').eq('key', 'mood').maybeSingle(),
        supabase.from('focus_sessions').select('duration_seconds'),
        supabase.from('profile').select('*').eq('id', 1).maybeSingle(),
        supabase.from('room_items').select('*').order('sort_order', { ascending: true }),
        supabase.from('inventory').select('*'),
      ]);

      if (cancelled) return;

      if (tasksRes.data) setTasks(tasksRes.data as Task[]);
      if (noteRes.data) setNoteState((noteRes.data as Note).content);
      if (habitsRes.data) {
        const dayLabels = last7Days();
        const next: Record<string, boolean[]> = {
          read: Array(7).fill(false),
          water: Array(7).fill(false),
          move: Array(7).fill(false),
        };
        for (const row of habitsRes.data as { habit_key: string; checked_date: string }[]) {
          const idx = dayLabels.indexOf(row.checked_date);
          if (idx >= 0 && (HABIT_KEYS as readonly string[]).includes(row.habit_key)) {
            next[row.habit_key as HabitKey][idx] = true;
          }
        }
        setHabitChecks(next);
      }
      if (moodRes.data) setMoodState((moodRes.data as { value: string }).value);
      if (focusRes.data) {
        const total = (focusRes.data as { duration_seconds: number }[]).reduce(
          (sum, session) => sum + session.duration_seconds,
          0,
        );
        setFocusSeconds(total);
      }
      if (profileRes.data) setProfile(profileRes.data as Profile);
      if (itemsRes.data) setRoomItems(itemsRes.data as RoomItem[]);
      if (inventoryRes.data) setInventory(inventoryRes.data as InventoryEntry[]);
      setLoaded(true);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function syncProfile(xpDelta: number, coinsDelta: number, tasksDoneDelta: number, focusDelta: number) {
    const newLevel = levelFromXp(profile.xp + xpDelta);
    const levelUp = newLevel > profile.level;
    let unlockedItem: string | null = null;

    const next: Profile = {
      ...profile,
      xp: profile.xp + xpDelta,
      coins: profile.coins + coinsDelta,
      level: newLevel,
      total_tasks_done: profile.total_tasks_done + tasksDoneDelta,
      total_focus_seconds: profile.total_focus_seconds + focusDelta,
    };
    setProfile(next);

    await supabase.from('profile').update({
      xp: next.xp,
      coins: next.coins,
      level: next.level,
      total_tasks_done: next.total_tasks_done,
      total_focus_seconds: next.total_focus_seconds,
      updated_at: new Date().toISOString(),
    }).eq('id', 1);

    if (levelUp) {
      const newlyUnlocked = roomItems.filter(
        (item) => item.required_level > profile.level && item.required_level <= newLevel && item.cost_coins === 0,
      );
      if (newlyUnlocked.length > 0) {
        for (const item of newlyUnlocked) {
          await supabase.from('inventory').insert({ item_key: item.key, equipped: true }).eq('item_key', item.key).maybeSingle();
        }
        unlockedItem = newlyUnlocked[0].name;
        const { data: invData } = await supabase.from('inventory').select('*');
        if (invData) setInventory(invData as InventoryEntry[]);
      }
    }

    if (xpDelta > 0 || coinsDelta > 0 || levelUp) {
      setRewardEvent({
        xp: Math.max(0, xpDelta),
        coins: Math.max(0, coinsDelta),
        levelUp,
        newLevel,
        unlockedItem,
      });
    }

    return { levelUp, newLevel, unlockedItem };
  }

  const toggleTask = useCallback(async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const newDone = !task.done;
    setTasks((items) => items.map((t) => (t.id === id ? { ...t, done: newDone } : t)));
    await supabase.from('tasks').update({ done: newDone }).eq('id', id);

    if (newDone) {
      await syncProfile(task.xp_reward, Math.round(task.xp_reward / 2), 1, 0);
    } else {
      await syncProfile(-task.xp_reward, -Math.round(task.xp_reward / 2), -1, 0);
    }
  }, [tasks, profile, roomItems]);

  const addTask = useCallback(async (label: string, tag = 'General', xpReward = 40) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert({ label, tag, xp_reward: xpReward })
      .select('*')
      .single();
    if (error || !data) return;
    setTasks((items) => [...items, data as Task]);
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    setTasks((items) => items.filter((t) => t.id !== id));
    await supabase.from('tasks').delete().eq('id', id);
  }, []);

  const saveNote = useCallback(async (content: string) => {
    setNoteState(content);
    const { data: existing } = await supabase.from('notes').select('id').order('updated_at', { ascending: false }).limit(1).maybeSingle();
    if (existing) {
      await supabase.from('notes').update({ content, updated_at: new Date().toISOString() }).eq('id', (existing as { id: string }).id);
    } else {
      await supabase.from('notes').insert({ content });
    }
  }, []);

  const toggleHabit = useCallback(async (habitKey: HabitKey, dayIndex: number) => {
    const dayLabels = last7Days();
    const dateStr = dayLabels[dayIndex];
    const wasChecked = habitChecks[habitKey][dayIndex];
    setHabitChecks((prev) => {
      const next = { ...prev, [habitKey]: [...prev[habitKey]] };
      next[habitKey][dayIndex] = !next[habitKey][dayIndex];
      return next;
    });
    if (wasChecked) {
      await supabase.from('habits').delete().eq('habit_key', habitKey).eq('checked_date', dateStr);
      await syncProfile(-10, -5, 0, 0);
    } else {
      await supabase.from('habits').insert({ habit_key: habitKey, checked_date: dateStr });
      await syncProfile(10, 5, 0, 0);
    }
  }, [habitChecks, profile, roomItems]);

  const setMood = useCallback(async (value: string) => {
    setMoodState(value);
    const { data: existing } = await supabase.from('settings').select('key').eq('key', 'mood').maybeSingle();
    if (existing) {
      await supabase.from('settings').update({ value, updated_at: new Date().toISOString() }).eq('key', 'mood');
    } else {
      await supabase.from('settings').insert({ key: 'mood', value });
    }
  }, []);

  const logFocusSession = useCallback(async (durationSeconds: number) => {
    setFocusSeconds((s) => s + durationSeconds);
    await supabase.from('focus_sessions').insert({ duration_seconds: durationSeconds });
    await syncProfile(50, 20, 0, durationSeconds);
  }, [profile, roomItems]);

  const purchaseItem = useCallback(async (itemKey: string) => {
    const item = roomItems.find((i) => i.key === itemKey);
    if (!item) return false;
    if (profile.coins < item.cost_coins) return false;
    if (profile.level < item.required_level) return false;
    if (inventory.some((inv) => inv.item_key === itemKey)) return false;

    await supabase.from('inventory').insert({ item_key: itemKey, equipped: false });
    const newCoins = profile.coins - item.cost_coins;
    await supabase.from('profile').update({ coins: newCoins, updated_at: new Date().toISOString() }).eq('id', 1);
    setProfile((p) => ({ ...p, coins: newCoins }));

    const { data: invData } = await supabase.from('inventory').select('*');
    if (invData) setInventory(invData as InventoryEntry[]);
    return true;
  }, [roomItems, profile, inventory]);

  const equipItem = useCallback(async (itemKey: string) => {
    await supabase.from('inventory').update({ equipped: false }).neq('item_key', itemKey);
    await supabase.from('inventory').update({ equipped: true }).eq('item_key', itemKey);
    setInventory((items) => items.map((inv) => ({ ...inv, equipped: inv.item_key === itemKey })));
  }, []);

  const clearReward = useCallback(() => setRewardEvent(null), []);

  const completedTasks = tasks.filter((t) => t.done).length;
  const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const streak = (() => {
    let count = 0;
    for (let i = habitChecks.read.length - 1; i >= 0; i--) {
      const anyDone = HABIT_KEYS.some((key) => habitChecks[key][i]);
      if (anyDone) count++;
      else break;
    }
    return count;
  })();

  const ownedKeys = new Set(inventory.map((inv) => inv.item_key));
  const equippedKey = inventory.find((inv) => inv.equipped)?.item_key ?? null;

  const xpIntoLevel = profile.xp - xpForLevel(profile.level);
  const xpForNextLevel = 500;
  const levelProgress = Math.round((xpIntoLevel / xpForNextLevel) * 100);
  const xpToNext = xpForNextLevel - xpIntoLevel;

  return {
    tasks,
    note,
    habitChecks,
    mood,
    focusSeconds,
    profile,
    roomItems,
    inventory,
    ownedKeys,
    equippedKey,
    rewardEvent,
    loaded,
    toggleTask,
    addTask,
    deleteTask,
    saveNote,
    toggleHabit,
    setMood,
    logFocusSession,
    purchaseItem,
    equipItem,
    clearReward,
    completedTasks,
    progress,
    streak,
    xpIntoLevel,
    xpForNextLevel,
    levelProgress,
    xpToNext,
  };
}

export type UseDreamDeskData = ReturnType<typeof useDreamDeskData>;
