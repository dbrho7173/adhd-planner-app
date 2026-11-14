/* ==========================================================
   db.js — tiny "local database" built on localStorage.
   Everything is stored in the browser under one key, so no
   server or real database is needed. Seeds fake data on
   first run.
   ========================================================== */

const DB_KEY = 'adhdPlanner.v1';

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/** Local yyyy-mm-dd (not UTC) */
function isoDate(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function daysFromNow(n) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d;
}

function atHour(daysOffset, hour, minute = 0) {
    const d = daysFromNow(daysOffset);
    d.setHours(hour, minute, 0, 0);
    return d;
}

/* ---------- Seed (fake) data ---------- */
function buildSeed() {
    const now = Date.now();
    const ago = (days, hour = 14) => atHour(-days, hour).getTime();

    return {
        profile: {
            name: 'Alex',
            avatar: '🧠',
            dailyGoal: 3,
            notifications: false,
            createdAt: now
        },
        items: [
            { id: uid(), type: 'task', text: 'Finish biology assignment', done: false, createdAt: now - 3600e3 },
            { id: uid(), type: 'note', text: 'Ask Prof. Lee about the lab report format', done: false, createdAt: now - 7200e3 },
            { id: uid(), type: 'task', text: 'Email advisor about spring classes', done: false, createdAt: now - 9000e3 },
            { id: uid(), type: 'note', text: 'Look up cheap flights for spring break', done: false, createdAt: now - 12000e3 },
            { id: uid(), type: 'task', text: 'Refill prescription', done: true, createdAt: ago(1, 9), completedAt: ago(1, 10) },
            { id: uid(), type: 'task', text: 'Do laundry', done: true, createdAt: ago(2, 9), completedAt: ago(2, 18) }
        ],
        reminders: [
            { id: uid(), text: 'Submit financial aid form', date: isoDate(daysFromNow(0)), time: '17:00', priority: 'cant-miss', remind: 'nag', done: false, createdAt: now - 86400e3 },
            { id: uid(), text: 'Take vitamins', date: isoDate(daysFromNow(0)), time: '09:00', priority: 'gentle', remind: 'at-time', done: false, createdAt: now - 86400e3 },
            { id: uid(), text: 'Group project meeting', date: isoDate(daysFromNow(1)), time: '13:30', priority: 'important', remind: 'hour-before', done: false, createdAt: now - 86400e3 },
            { id: uid(), text: 'Pay phone bill', date: isoDate(daysFromNow(3)), time: '12:00', priority: 'important', remind: 'day-before', done: false, createdAt: now - 86400e3 },
            { id: uid(), text: 'Call mom', date: isoDate(daysFromNow(5)), time: '19:00', priority: 'gentle', remind: 'at-time', done: false, createdAt: now - 86400e3 },
            { id: uid(), text: 'Return library books', date: isoDate(daysFromNow(-1)), time: '16:00', priority: 'important', remind: 'at-time', done: false, createdAt: now - 3 * 86400e3 },
            { id: uid(), text: 'Buy groceries', date: isoDate(daysFromNow(-1)), time: '18:00', priority: 'gentle', remind: 'at-time', done: true, completedAt: ago(1, 18), createdAt: now - 3 * 86400e3 },
            { id: uid(), text: 'Study for chem quiz', date: isoDate(daysFromNow(-2)), time: '20:00', priority: 'cant-miss', remind: 'nag', done: true, completedAt: ago(2, 20), createdAt: now - 4 * 86400e3 },
            { id: uid(), text: 'Book dentist appointment', date: isoDate(daysFromNow(-3)), time: '11:00', priority: 'important', remind: 'at-time', done: true, completedAt: ago(3, 11), createdAt: now - 5 * 86400e3 },
            { id: uid(), text: 'Water the plants', date: isoDate(daysFromNow(-3)), time: '08:00', priority: 'gentle', remind: 'at-time', done: true, completedAt: ago(3, 8), createdAt: now - 5 * 86400e3 },
            { id: uid(), text: 'Turn in essay draft', date: isoDate(daysFromNow(-4)), time: '23:00', priority: 'cant-miss', remind: 'nag', done: true, completedAt: ago(4, 22), createdAt: now - 6 * 86400e3 },
            { id: uid(), text: 'Gym session', date: isoDate(daysFromNow(-5)), time: '07:00', priority: 'gentle', remind: 'at-time', done: true, completedAt: ago(5, 7), createdAt: now - 7 * 86400e3 }
        ]
    };
}

/* ---------- Core load / save ---------- */
function loadDB() {
    try {
        const raw = localStorage.getItem(DB_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) {
        console.warn('Could not read saved data, reseeding.', e);
    }
    const seed = buildSeed();
    localStorage.setItem(DB_KEY, JSON.stringify(seed));
    return seed;
}

function saveDB(data) {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
}

/* ---------- Public API ---------- */
const DB = {
    /* Profile */
    getProfile() { return loadDB().profile; },
    updateProfile(patch) {
        const data = loadDB();
        data.profile = { ...data.profile, ...patch };
        saveDB(data);
        return data.profile;
    },

    /* Parking lot items (notes + tasks) */
    getItems() {
        return loadDB().items.slice().sort((a, b) => b.createdAt - a.createdAt);
    },
    addItem(type, text) {
        const data = loadDB();
        const item = { id: uid(), type, text: text.trim(), done: false, createdAt: Date.now() };
        data.items.push(item);
        saveDB(data);
        return item;
    },
    toggleItem(id) {
        const data = loadDB();
        const item = data.items.find(i => i.id === id);
        if (!item) return;
        item.done = !item.done;
        item.completedAt = item.done ? Date.now() : null;
        saveDB(data);
        return item;
    },
    deleteItem(id) {
        const data = loadDB();
        data.items = data.items.filter(i => i.id !== id);
        saveDB(data);
    },

    /* Reminders */
    getReminders() {
        return loadDB().reminders.slice().sort((a, b) =>
            (a.date + a.time).localeCompare(b.date + b.time));
    },
    getReminder(id) {
        return loadDB().reminders.find(r => r.id === id) || null;
    },
    saveReminder(reminder) {
        const data = loadDB();
        const idx = data.reminders.findIndex(r => r.id === reminder.id);
        if (idx >= 0) {
            data.reminders[idx] = { ...data.reminders[idx], ...reminder };
        } else {
            data.reminders.push({
                id: uid(), done: false, createdAt: Date.now(), ...reminder
            });
        }
        saveDB(data);
    },
    toggleReminder(id) {
        const data = loadDB();
        const r = data.reminders.find(x => x.id === id);
        if (!r) return;
        r.done = !r.done;
        r.completedAt = r.done ? Date.now() : null;
        saveDB(data);
        return r;
    },
    markNotified(id, ts) {
        const data = loadDB();
        const r = data.reminders.find(x => x.id === id);
        if (r) { r.lastNotified = ts; saveDB(data); }
    },
    deleteReminder(id) {
        const data = loadDB();
        data.reminders = data.reminders.filter(r => r.id !== id);
        saveDB(data);
    },

    /* Progress stats */
    stats() {
        const data = loadDB();
        const completions = [
            ...data.items.filter(i => i.done && i.completedAt),
            ...data.reminders.filter(r => r.done && r.completedAt)
        ];
        const countsByDay = {};
        completions.forEach(c => {
            const k = isoDate(new Date(c.completedAt));
            countsByDay[k] = (countsByDay[k] || 0) + 1;
        });

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const last7 = [];
        for (let i = 6; i >= 0; i--) {
            const d = daysFromNow(-i);
            const key = isoDate(d);
            last7.push({ date: key, label: dayNames[d.getDay()], count: countsByDay[key] || 0, isToday: i === 0 });
        }

        // Streak: consecutive days with >=1 completion. Today doesn't break it until it ends.
        let streak = 0;
        let offset = countsByDay[isoDate()] ? 0 : 1;
        while (countsByDay[isoDate(daysFromNow(-offset))]) { streak++; offset++; }

        const totalDone = completions.length;
        const totalOpen = data.items.filter(i => !i.done).length + data.reminders.filter(r => !r.done).length;
        const rate = totalDone + totalOpen ? Math.round((totalDone / (totalDone + totalOpen)) * 100) : 0;

        const byPriority = { gentle: 0, important: 0, 'cant-miss': 0 };
        data.reminders.filter(r => r.done).forEach(r => { byPriority[r.priority] = (byPriority[r.priority] || 0) + 1; });

        return {
            last7, streak, totalDone, totalOpen, rate, byPriority,
            today: countsByDay[isoDate()] || 0,
            best: Math.max(...last7.map(d => d.count), 0)
        };
    },

    /* Utilities */
    export() { return JSON.stringify(loadDB(), null, 2); },
    reset() { localStorage.removeItem(DB_KEY); loadDB(); },
    clearAll() {
        const data = loadDB();
        data.items = [];
        data.reminders = [];
        saveDB(data);
    }
};