import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Bell,
  BookOpen,
  Check,
  ChevronRight,
  Coffee,
  Coins,
  Droplets,
  Flame,
  Flower2,
  Gift,
  Globe2,
  Home,
  Leaf,
  Lock,
  Menu,
  Moon,
  Plus,
  Sparkles,
  Star,
  Sun,
  TimerReset,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import { useDreamDeskData, xpForLevel } from '@/hooks/useDreamDeskData';
import type { RoomItem } from '@/lib/supabase';

type Mood = 'sunset' | 'morning' | 'night' | 'rain' | 'cozy';
type Panel = 'tasks' | 'calendar' | 'notes' | 'habits' | 'statistics' | 'focus' | 'break' | 'upgrades' | null;

const moodDetails: Record<Mood, { label: string; icon: typeof Sun; detail: string }> = {
  sunset: { label: 'Sunset', icon: Sun, detail: 'Warm & reflective' },
  morning: { label: 'Morning', icon: Sun, detail: 'Fresh & bright' },
  night: { label: 'Night', icon: Moon, detail: 'Deep focus' },
  rain: { label: 'Rain', icon: Droplets, detail: 'Slow & steady' },
  cozy: { label: 'Cozy', icon: Flame, detail: 'Warm & grounded' },
};

const PRIORITY_XP: Record<string, number> = { Low: 20, Normal: 40, Important: 75, Major: 100 };

function App() {
  const data = useDreamDeskData();
  const [panel, setPanel] = useState<Panel>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [newTaskLabel, setNewTaskLabel] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('Normal');

  const mood = (data.mood as Mood) || 'sunset';
  const setMood = (value: Mood) => data.setMood(value);
  const progress = data.progress;
  const completed = data.completedTasks;
  const totalTasks = data.tasks.length;
  const timerLabel = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`;
  const activeMood = moodDetails[mood];
  const focusMinutes = Math.round(data.focusSeconds / 60);
  const level = data.profile.level;
  const coins = data.profile.coins;
  const xpToNext = data.xpToNext;
  const levelProgress = data.levelProgress;

  useEffect(() => {
    if (!isTimerRunning || secondsLeft <= 0) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((value) => {
        if (value <= 1) {
          setIsTimerRunning(false);
          data.logFocusSession(25 * 60);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isTimerRunning, secondsLeft, data]);

  const sceneClass = useMemo(() => `scene scene-${mood} ${focusMode ? 'focus-scene' : ''}`, [mood, focusMode]);

  function startFocus() {
    setFocusMode(true);
    setPanel('focus');
    setMood('night');
    setSecondsLeft(25 * 60);
    setIsTimerRunning(true);
  }

  async function handleAddTask() {
    const trimmed = newTaskLabel.trim();
    if (!trimmed) return;
    const xp = PRIORITY_XP[newTaskPriority] ?? 40;
    await data.addTask(trimmed, newTaskPriority, xp);
    setNewTaskLabel('');
  }

  const ownedKeys = data.ownedKeys;
  const hasBookshelf = ownedKeys.has('bookshelf');
  const hasWallArt = ownedKeys.has('wall_art');
  const hasRug = ownedKeys.has('rug_cozy');
  const hasGlowPlant = ownedKeys.has('plant_glow');
  const hasMoonLamp = ownedKeys.has('lamp_moon');
  const hasPetCat = ownedKeys.has('pet_cat');
  const hasGalaxy = ownedKeys.has('theme_galaxy');

  return (
    <main className={sceneClass}>
      <div className="stars" />
      {hasGalaxy && <div className="galaxy-overlay" />}
      <div className="cloud cloud-one" /><div className="cloud cloud-two" /><div className="cloud cloud-three" />
      <div className="rain-layer" />

      {data.rewardEvent && (
        <RewardToast event={data.rewardEvent} onDismiss={data.clearReward} />
      )}

      <header className="topbar glass">
        <button className="brand" onClick={() => { setPanel(null); setFocusMode(false); }} aria-label="Return home">
          <span className="brand-mark"><Sparkles size={15} /></span>
          <span>Dream<span>Desk</span></span>
        </button>
        <div className="top-actions">
          <div className="xp-pill">
            <Star size={13} className="xp-icon" />
            <span className="xp-level">Lv {level}</span>
            <span className="xp-bar-mini"><i style={{ width: `${levelProgress}%` }} /></span>
            <span className="xp-text">{xpToNext} XP to go</span>
          </div>
          <div className="coins-pill"><Coins size={13} /> {coins}</div>
          <button className="icon-button" aria-label="Notifications"><Bell size={16} /></button>
          <button className="profile"><span className="avatar">AM</span><span className="profile-copy"><b>Alex Morgan</b><small>Good evening</small></span><ChevronRight size={15} /></button>
          <button className="icon-button mobile-menu" aria-label="Menu"><Menu size={18} /></button>
        </div>
      </header>

      <section className="welcome">
        <p className="eyebrow"><span className="eyebrow-line" /> {activeMood.detail}</p>
        <h1>What will you <em>accomplish</em> today?</h1>
        <p className="welcome-subtitle">Complete tasks to earn XP and coins, then spend them to build your dream room.</p>
        <div className="welcome-actions">
          <button className="primary-button" onClick={() => setPanel('tasks')}><Plus size={16} /> Add a task</button>
          <button className="quiet-button" onClick={() => setPanel('upgrades')}><Gift size={14} /> Upgrade room</button>
        </div>
      </section>

      <section className="room" aria-label="Interactive DreamDesk room">
        <div className="window-frame interactive-object" onClick={() => setPanel('calendar')} title="Open Calendar">
          <div className="window-sky"><div className="sun-disc" /><div className="mountain mountain-back" /><div className="mountain mountain-front" /><div className="window-clouds"><i /><i /><i /></div></div>
          <div className="window-cross vertical" /><div className="window-cross horizontal" />
          <span className="object-tooltip">Calendar <small>Plan your sky</small></span>
        </div>
        {hasWallArt && <div className="wall-art-decor"><span>DREAM</span><b>BIG</b></div>}
        <div className="wall-shelf">
          <div className="shelf-item plant-pot"><Leaf size={26} /><span /></div>
          {hasBookshelf && <div className="shelf-bookshelf"><i /><i /><i /><i /><i /><i /></div>}
          <div className="shelf-books"><i /><i /><i /><i /></div>
          <div className="shelf-frame"><BarChart3 size={18} /></div>
        </div>
        <div className="bed"><div className="headboard" /><div className="pillow" /><div className="blanket" /><div className="bed-throw" /></div>
        {hasRug && <div className="floor-rug" />}
        <div className="desk">
          <div className="desk-top">
            <div className="monitor interactive-object" onClick={() => setPanel('tasks')} title="Open Tasks">
              <div className="monitor-screen">
                <span>Good things<br /><b>take time.</b></span>
                <div className="screen-bar"><i style={{ width: `${progress}%` }} /></div>
              </div>
              <span className="object-tooltip">Tasks <small>+{PRIORITY_XP.Normal} XP each</small></span>
            </div>
            <div className="desk-lamp">
              <div className={`lamp-shade ${hasMoonLamp ? 'lamp-moon' : ''}`} />
              <div className="lamp-neck" /><div className="lamp-base" />
            </div>
            <div className="coffee interactive-object" onClick={() => setPanel('break')} title="Open Break Mode">
              <div className="steam steam-one" /><div className="steam steam-two" />
              <div className="cup-top" /><div className="cup-body" />
              <span className="object-tooltip">Break mode <small>Take a breath</small></span>
            </div>
            <div className="desk-books" />
          </div>
          <div className="desk-front"><div className="drawer" /><div className="desk-leg left" /><div className="desk-leg right" /></div>
        </div>
        <div className="chair"><div className="chair-back" /><div className="chair-seat" /><div className="chair-leg" /></div>
        <div className={`floor-plant interactive-object ${hasGlowPlant ? 'plant-glow' : ''}`} onClick={() => setPanel('habits')} title="Open Habits">
          <div className="plant-leaves"><Leaf /><Leaf /><Leaf /><Leaf /><Leaf /></div>
          <div className="plant-pot-large" />
          <span className="object-tooltip">Habits <small>+10 XP each</small></span>
        </div>
        {hasPetCat && <div className="room-pet">🐱</div>}
        <div className="room-light" />
      </section>

      <div className="xp-bar-container glass">
        <div className="xp-bar-header">
          <span className="xp-level-badge"><Star size={11} fill="currentColor" /> LEVEL {level}</span>
          <span className="xp-coins"><Coins size={12} /> {coins} coins</span>
        </div>
        <div className="xp-bar-track"><span style={{ width: `${levelProgress}%` }} /></div>
        <div className="xp-bar-footer">
          <span>{data.xpIntoLevel} / {data.xpForNextLevel} XP</span>
          <span>{xpToNext} XP to Level {level + 1}</span>
        </div>
      </div>

      {!focusMode && <>
        <div className="floating-card progress-card glass">
          <div className="card-heading"><span><Zap size={14} /> Today's progress</span></div>
          <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
          <p>{completed}/{totalTasks} tasks done</p>
        </div>
        <div className="floating-card streak-card glass">
          <span className="card-icon flame-icon"><Flame size={16} /></span>
          <div><b>{data.streak} day streak</b></div>
        </div>
        <div className="floating-card focus-card glass">
          <span className="card-icon timer-icon"><TimerReset size={17} /></span>
          <div><b>{focusMinutes}m focused</b></div>
        </div>
      </>}

      <nav className="dock glass" aria-label="Main navigation">
        <button className={!panel ? 'active' : ''} onClick={() => { setPanel(null); setFocusMode(false); }}><Home size={17} /><span>Home</span></button>
        <button className={panel === 'tasks' ? 'active' : ''} onClick={() => setPanel('tasks')}><Check size={17} /><span>Tasks</span></button>
        <button className={panel === 'calendar' ? 'active' : ''} onClick={() => setPanel('calendar')}><BookOpen size={17} /><span>Calendar</span></button>
        <button className={panel === 'notes' ? 'active' : ''} onClick={() => setPanel('notes')}><BookOpen size={17} /><span>Notes</span></button>
        <button className={panel === 'habits' ? 'active' : ''} onClick={() => setPanel('habits')}><Flower2 size={17} /><span>Habits</span></button>
        <button className={panel === 'upgrades' ? 'active' : ''} onClick={() => setPanel('upgrades')}><Gift size={17} /><span>Upgrades</span></button>
        <button className={panel === 'statistics' ? 'active' : ''} onClick={() => setPanel('statistics')}><BarChart3 size={17} /><span>Stats</span></button>
      </nav>

      <div className="mood-switcher glass">
        <div className="mood-title"><Globe2 size={14} /> Room mood</div>
        <div className="mood-options">
          {(Object.keys(moodDetails) as Mood[]).map((key) => {
            const MoodIcon = moodDetails[key].icon;
            return <button key={key} className={mood === key ? 'selected' : ''} onClick={() => setMood(key)}><MoodIcon size={14} /><span>{moodDetails[key].label}</span></button>;
          })}
        </div>
      </div>

      {panel && (
        <PanelView
          panel={panel}
          tasks={data.tasks}
          toggleTask={data.toggleTask}
          addTask={data.addTask}
          deleteTask={data.deleteTask}
          note={data.note}
          saveNote={data.saveNote}
          timerLabel={timerLabel}
          isTimerRunning={isTimerRunning}
          setIsTimerRunning={setIsTimerRunning}
          setSecondsLeft={setSecondsLeft}
          habitChecks={data.habitChecks}
          toggleHabit={data.toggleHabit}
          profile={data.profile}
          roomItems={data.roomItems}
          ownedKeys={data.ownedKeys}
          equippedKey={data.equippedKey}
          purchaseItem={data.purchaseItem}
          equipItem={data.equipItem}
          focusMinutes={focusMinutes}
          newTaskLabel={newTaskLabel}
          setNewTaskLabel={setNewTaskLabel}
          newTaskPriority={newTaskPriority}
          setNewTaskPriority={setNewTaskPriority}
          handleAddTask={handleAddTask}
          onClose={() => { setPanel(null); if (focusMode) setFocusMode(false); }}
        />
      )}
    </main>
  );
}

function RewardToast({ event, onDismiss }: { event: { xp: number; coins: number; levelUp: boolean; newLevel: number; unlockedItem: string | null }; onDismiss: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onDismiss, event.levelUp ? 6000 : 3500);
    return () => window.clearTimeout(t);
  }, [event, onDismiss]);

  return (
    <div className={`reward-toast ${event.levelUp ? 'level-up' : ''}`}>
      {event.levelUp ? (
        <>
          <div className="reward-burst"><Star size={32} fill="currentColor" /></div>
          <h2>LEVEL UP!</h2>
          <p>You reached Level {event.newLevel}</p>
          {event.unlockedItem && <div className="reward-unlock"><Gift size={14} /> Unlocked: {event.unlockedItem}</div>}
        </>
      ) : (
        <>
          <div className="reward-icons">
            <span className="reward-xp"><Star size={14} fill="currentColor" /> +{event.xp} XP</span>
            <span className="reward-coins"><Coins size={14} /> +{event.coins}</span>
          </div>
          <p>Task complete!</p>
        </>
      )}
    </div>
  );
}

type PanelViewProps = {
  panel: Panel;
  tasks: { id: string; label: string; tag: string; done: boolean; xp_reward: number }[];
  toggleTask: (id: string) => void;
  addTask: (label: string, tag?: string, xp?: number) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  note: string;
  saveNote: (content: string) => Promise<void>;
  timerLabel: string;
  isTimerRunning: boolean;
  setIsTimerRunning: (value: boolean) => void;
  setSecondsLeft: (value: number) => void;
  habitChecks: Record<string, boolean[]>;
  toggleHabit: (habitKey: 'read' | 'water' | 'move', dayIndex: number) => Promise<void>;
  profile: { xp: number; coins: number; level: number; total_tasks_done: number; total_focus_seconds: number };
  roomItems: RoomItem[];
  ownedKeys: Set<string>;
  equippedKey: string | null;
  purchaseItem: (itemKey: string) => Promise<boolean>;
  equipItem: (itemKey: string) => Promise<void>;
  focusMinutes: number;
  newTaskLabel: string;
  setNewTaskLabel: (value: string) => void;
  newTaskPriority: string;
  setNewTaskPriority: (value: string) => void;
  handleAddTask: () => Promise<void>;
  onClose: () => void;
};

function PanelView(props: PanelViewProps) {
  const { panel, tasks, toggleTask, deleteTask, note, saveNote, timerLabel, isTimerRunning, setIsTimerRunning, setSecondsLeft, habitChecks, toggleHabit, profile, roomItems, ownedKeys, equippedKey, purchaseItem, equipItem, focusMinutes, newTaskLabel, setNewTaskLabel, newTaskPriority, setNewTaskPriority, handleAddTask, onClose } = props;
  const titles: Record<Exclude<Panel, null>, string> = {
    tasks: 'Today\'s plan', calendar: 'Your week', notes: 'Notes from the clouds', habits: 'Little rituals', statistics: 'Your rhythm', focus: 'Deep focus', break: 'A little pause', upgrades: 'Upgrade your room',
  };
  return (
    <div className={`panel-backdrop ${panel === 'focus' ? 'focus-backdrop' : ''}`}>
      <aside className="side-panel glass">
        <div className="panel-header">
          <div><p className="eyebrow"><span className="eyebrow-line" /> DreamDesk</p><h2>{titles[panel!]}</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Close panel"><X size={18} /></button>
        </div>
        {panel === 'tasks' && (
          <div className="panel-content">
            <div className="panel-summary"><b>{tasks.filter((t) => !t.done).length}</b><span>tasks<br /><small>waiting for you</small></span></div>
            {tasks.length === 0 && (
              <div className="empty-state"><p>The desk is waiting for your first mission.</p><button className="primary-button" onClick={() => { const input = document.querySelector<HTMLInputElement>('.add-task-row input'); input?.focus(); }}><Plus size={14} /> Create task</button></div>
            )}
            {tasks.map((task) => (
              <div className="task-row-wrapper" key={task.id}>
                <button className={`task-row ${task.done ? 'done' : ''}`} onClick={() => toggleTask(task.id)}>
                  <span className="check-circle">{task.done && <Check size={12} />}</span>
                  <span>{task.label}<small>{task.tag}</small></span>
                  <span className="task-xp"><Star size={9} fill="currentColor" /> {task.xp_reward}</span>
                </button>
                <button className="delete-task" onClick={() => deleteTask(task.id)} aria-label="Delete task"><X size={13} /></button>
              </div>
            ))}
            <div className="add-task-row">
              <input type="text" placeholder="Add a task..." value={newTaskLabel} onChange={(e) => setNewTaskLabel(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleAddTask(); }} />
              <select className="priority-select" value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value)}>
                {Object.keys(PRIORITY_XP).map((p) => <option key={p} value={p}>{p} (+{PRIORITY_XP[p]} XP)</option>)}
              </select>
              <button className="primary-button" onClick={handleAddTask}><Plus size={14} /></button>
            </div>
          </div>
        )}
        {panel === 'calendar' && <CalendarPanel />}
        {panel === 'notes' && (
          <div className="panel-content">
            <textarea className="note-area" value={note} onChange={(e) => saveNote(e.target.value)} placeholder="Write your thoughts..." />
            <div className="note-meta"><span>Saved automatically</span><BookOpen size={14} /></div>
            <div className="note-tags"><span>Ideas</span><span>Reflection</span><span>Personal</span></div>
          </div>
        )}
        {panel === 'habits' && <HabitsPanel habitChecks={habitChecks} toggleHabit={toggleHabit} />}
        {panel === 'statistics' && <StatsPanel profile={profile} focusMinutes={focusMinutes} />}
        {panel === 'upgrades' && <UpgradesPanel roomItems={roomItems} ownedKeys={ownedKeys} equippedKey={equippedKey} purchaseItem={purchaseItem} equipItem={equipItem} profile={profile} />}
        {(panel === 'focus' || panel === 'break') && (
          <FocusPanel panel={panel} timerLabel={timerLabel} isTimerRunning={isTimerRunning} setIsTimerRunning={setIsTimerRunning} setSecondsLeft={setSecondsLeft} />
        )}
      </aside>
    </div>
  );
}

function CalendarPanel() {
  return (
    <div className="panel-content calendar-panel">
      <div className="calendar-top"><b>September 2026</b><span>Week 38</span></div>
      <div className="calendar-grid">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => <span className="day-label" key={`${day}-${i}`}>{day}</span>)}
        {Array.from({ length: 30 }, (_, index) => <button className={index === 12 ? 'today' : ''} key={index}>{index + 1}</button>)}
      </div>
      <div className="upcoming">
        <span className="event-dot blue" /><div><b>Creative block</b><small>Today · 7:00 PM</small></div>
        <span className="event-dot peach" /><div><b>Slow Sunday</b><small>Sunday · All day</small></div>
      </div>
    </div>
  );
}

function HabitsPanel({ habitChecks, toggleHabit }: { habitChecks: Record<string, boolean[]>; toggleHabit: (habitKey: 'read' | 'water' | 'move', dayIndex: number) => Promise<void> }) {
  const habitMeta: { key: 'read' | 'water' | 'move'; label: string; detail: string; Icon: typeof BookOpen }[] = [
    { key: 'read', label: 'Read', detail: '20 min', Icon: BookOpen },
    { key: 'water', label: 'Water', detail: '6 glasses', Icon: Droplets },
    { key: 'move', label: 'Move', detail: '15 min', Icon: Zap },
  ];
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return (
    <div className="panel-content">
      <div className="habit-hero">
        <Leaf size={24} />
        <b>Small steps become a life.</b>
        <span>Each habit: +10 XP, +5 coins</span>
      </div>
      {habitMeta.map(({ key, label, detail, Icon }) => (
        <div className="habit-row" key={key}>
          <span className="habit-icon"><Icon size={15} /></span>
          <span><b>{label}</b><small>{detail}</small></span>
          <span className="habit-checks">
            {habitChecks[key].map((checked, i) => <i key={i} className={checked ? 'checked' : 'unchecked'} />)}
          </span>
        </div>
      ))}
      <div className="week-row">
        {dayLabels.map((day, i) => {
          const anyChecked = habitMeta.some((h) => habitChecks[h.key][i]);
          return (
            <button key={i} className={anyChecked ? 'active' : ''} onClick={() => toggleHabit('read', i)}>
              <span>{day}</span><i>{anyChecked && <Check size={12} />}</i>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StatsPanel({ profile, focusMinutes }: { profile: { xp: number; coins: number; level: number; total_tasks_done: number; total_focus_seconds: number }; focusMinutes: number }) {
  const bars = [42, 65, 48, 82, 74, 94, 66];
  return (
    <div className="panel-content">
      <div className="big-stat">
        <b>Level {profile.level}</b>
        <span>{profile.xp} total XP</span>
        <small>{profile.total_tasks_done} tasks completed, {focusMinutes}m focused</small>
      </div>
      <div className="stat-grid">
        <div className="stat-cell"><Coins size={16} /><b>{profile.coins}</b><span>coins</span></div>
        <div className="stat-cell"><Check size={16} /><b>{profile.total_tasks_done}</b><span>tasks done</span></div>
        <div className="stat-cell"><TimerReset size={16} /><b>{focusMinutes}m</b><span>focus time</span></div>
        <div className="stat-cell"><Trophy size={16} /><b>{profile.level}</b><span>level</span></div>
      </div>
      <div className="chart">{bars.map((h, i) => <div key={i} style={{ height: `${h}%` }} />)}</div>
      <div className="chart-labels"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div>
    </div>
  );
}

function UpgradesPanel({ roomItems, ownedKeys, equippedKey, purchaseItem, equipItem, profile }: { roomItems: RoomItem[]; ownedKeys: Set<string>; equippedKey: string | null; purchaseItem: (itemKey: string) => Promise<boolean>; equipItem: (itemKey: string) => Promise<void>; profile: { coins: number; level: number } }) {
  const categories = [...new Set(roomItems.map((i) => i.category))];
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleBuy(item: RoomItem) {
    if (ownedKeys.has(item.key)) {
      await equipItem(item.key);
      setFeedback(`${item.name} equipped`);
    } else if (profile.level < item.required_level) {
      setFeedback(`Reach Level ${item.required_level} to unlock`);
    } else if (profile.coins < item.cost_coins) {
      setFeedback(`Need ${item.cost_coins - profile.coins} more coins`);
    } else {
      const ok = await purchaseItem(item.key);
      if (ok) {
        setFeedback(`${item.name} unlocked!`);
        await equipItem(item.key);
      }
    }
    window.setTimeout(() => setFeedback(null), 2500);
  }

  return (
    <div className="panel-content upgrades-panel">
      <div className="upgrades-header">
        <div className="upgrades-balance"><Coins size={16} /> {profile.coins} coins</div>
        <div className="upgrades-level">Level {profile.level}</div>
      </div>
      {feedback && <div className="upgrades-feedback">{feedback}</div>}
      {categories.map((cat) => (
        <div key={cat} className="upgrade-category">
          <h4>{cat}</h4>
          <div className="upgrade-grid">
            {roomItems.filter((i) => i.category === cat).map((item) => {
              const owned = ownedKeys.has(item.key);
              const equipped = equippedKey === item.key;
              const locked = profile.level < item.required_level;
              const tooExpensive = profile.coins < item.cost_coins && !owned;
              return (
                <div className={`upgrade-card ${owned ? 'owned' : ''} ${equipped ? 'equipped' : ''} ${locked ? 'locked' : ''}`} key={item.key}>
                  <div className="upgrade-icon">{item.icon}</div>
                  <div className="upgrade-info">
                    <b>{item.name}</b>
                    <small>{item.description}</small>
                    <div className="upgrade-cost">
                      {item.cost_coins > 0 && !owned && <span><Coins size={10} /> {item.cost_coins}</span>}
                      {locked && <span className="upgrade-lock"><Lock size={9} /> Lv {item.required_level}</span>}
                      {equipped && <span className="upgrade-equipped"><Check size={10} /> Equipped</span>}
                    </div>
                  </div>
                  <button
                    className={`upgrade-btn ${equipped ? 'equipped' : ''}`}
                    disabled={locked || (tooExpensive && !owned)}
                    onClick={() => handleBuy(item)}
                  >
                    {equipped ? 'On' : owned ? 'Equip' : locked ? 'Locked' : 'Buy'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function FocusPanel({ panel, timerLabel, isTimerRunning, setIsTimerRunning, setSecondsLeft }: { panel: Panel; timerLabel: string; isTimerRunning: boolean; setIsTimerRunning: (value: boolean) => void; setSecondsLeft: (value: number) => void }) {
  return (
    <div className="panel-content focus-panel">
      {panel === 'break' ? (
        <>
          <div className="break-illustration"><Coffee size={38} /></div>
          <h3>Step away for a moment.</h3>
          <p>Let your eyes soften. Notice three things you can see, two you can hear, one you can feel.</p>
          <button className="primary-button full" onClick={() => setIsTimerRunning(false)}>Take a real break</button>
        </>
      ) : (
        <>
          <div className="timer-orbit">
            <div className="timer-inner">
              <small>DEEP FOCUS</small>
              <b>{timerLabel}</b>
              <span>+50 XP on completion</span>
            </div>
          </div>
          <div className="focus-controls">
            <button className="primary-button" onClick={() => setIsTimerRunning(!isTimerRunning)}>{isTimerRunning ? 'Pause' : 'Start'} session</button>
            <button className="quiet-button" onClick={() => { setSecondsLeft(25 * 60); setIsTimerRunning(false); }}>Reset</button>
          </div>
          <p className="focus-quote">Almost everything will work again if you unplug it for a few minutes, including you.</p>
        </>
      )}
    </div>
  );
}

export default App;
