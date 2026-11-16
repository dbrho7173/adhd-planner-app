/* ==========================================================
   app.js — shared helpers: nav bar, toasts, formatting,
   and the in-app reminder notifier. Loaded on every page
   after db.js.
   ========================================================== */

const NAV_LINKS = [
    { href: 'index.html',     icon: 'bx-home',      label: 'home' },
    { href: 'reminders.html', icon: 'bx-checklist', label: 'reminders' },
    { href: 'add.html',       icon: 'bx-bell',      label: 'add reminder', plus: true },
    { href: 'progress.html',  icon: 'bx-bar-chart', label: 'progress' },
    { href: 'profile.html',   icon: 'bx-face',      label: 'profile' }
];

function renderNav() {
    const nav = document.getElementById('nav');
    if (!nav) return;
    const current = location.pathname.split('/').pop() || 'index.html';
    nav.className = 'navBar';
    nav.innerHTML = NAV_LINKS.map(l => {
        const classes = [
            l.plus ? 'plus' : '',
            current === l.href && !l.plus ? 'active' : ''
        ].join(' ').trim();
        return `<a href="${l.href}" class="${classes}" aria-label="${l.label}"><i class="bx ${l.icon}"></i></a>`;
    }).join('');
}

/* ---------- Helpers ---------- */
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatDateTime(dateStr, timeStr) {
    const d = new Date(`${dateStr}T${timeStr || '00:00'}`);
    const today = isoDate();
    const tomorrow = isoDate(daysFromNow(1));
    const yesterday = isoDate(daysFromNow(-1));
    let day;
    if (dateStr === today) day = 'Today';
    else if (dateStr === tomorrow) day = 'Tomorrow';
    else if (dateStr === yesterday) day = 'Yesterday';
    else day = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    return `${day} · ${time}`;
}

function isOverdue(r) {
    return !r.done && new Date(`${r.date}T${r.time || '23:59'}`) < new Date();
}

const PRIORITY_LABELS = { gentle: 'Gentle', important: 'Important', 'cant-miss': "Can't Miss" };

/* ---------- Toast ---------- */
function toast(message, icon = 'bx-check-circle') {
    let box = document.getElementById('toast-box');
    if (!box) {
        box = document.createElement('div');
        box.id = 'toast-box';
        document.body.appendChild(box);
    }
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<i class="bx ${icon}"></i><span>${escapeHtml(message)}</span>`;
    box.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
        el.classList.remove('show');
        setTimeout(() => el.remove(), 300);
    }, 3500);
}

/* ---------- Reminder notifier (works while a tab is open) ---------- */
function fireTimes(r, now) {
    // Returns the most recent scheduled fire time (ms) that is <= now, plus the grace window.
    const due = new Date(`${r.date}T${r.time || '00:00'}`).getTime();
    const HOUR = 3600e3;
    switch (r.remind) {
        case 'day-before':  return { t: due - 24 * HOUR, window: 15 * 60e3 };
        case 'hour-before': return { t: due - HOUR,      window: 15 * 60e3 };
        case 'nag': {
            const interval = r.priority === 'cant-miss' ? 30 * 60e3 : 3 * HOUR;
            if (now < due) return null;
            const n = Math.floor((now - due) / interval);
            return { t: due + n * interval, window: interval };
        }
        default:            return { t: due,             window: 15 * 60e3 };
    }
}

function checkReminders() {
    const now = Date.now();
    DB.getReminders().forEach(r => {
        if (r.done) return;
        const f = fireTimes(r, now);
        if (!f || f.t > now || now - f.t > f.window) return;
        if (r.lastNotified && r.lastNotified >= f.t) return;

        DB.markNotified(r.id, now);
        const title = `${PRIORITY_LABELS[r.priority] || 'Reminder'} reminder`;
        toast(`${title}: ${r.text}`, 'bx-bell');
        if (DB.getProfile().notifications && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body: r.text });
        }
        document.dispatchEvent(new CustomEvent('reminder-fired'));
    });
}

document.addEventListener('DOMContentLoaded', () => {
    renderNav();
    checkReminders();
    setInterval(checkReminders, 30000);
});
