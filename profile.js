const AVATARS = ['🧠', '🦄', '🐱', '🐼', '🦊', '🌸', '🚀', '⭐'];
const nameEl = document.getElementById('name');
const goalEl = document.getElementById('goal');
const notifEl = document.getElementById('notif');
const bigEl = document.getElementById('avatar-big');
const pickerEl = document.getElementById('avatar-picker');

function render() {
    const p = DB.getProfile();
    bigEl.textContent = p.avatar;
    nameEl.value = p.name;
    notifEl.checked = !!p.notifications;

    goalEl.innerHTML = [1, 2, 3, 4, 5, 7, 10].map(n =>
        `<option value="${n}" ${n === p.dailyGoal ? 'selected' : ''}>${n} thing${n > 1 ? 's' : ''} a day</option>`).join('');

    pickerEl.innerHTML = AVATARS.map(a =>
        `<button type="button" data-a="${a}" class="${a === p.avatar ? 'selected' : ''}">${a}</button>`).join('');
}

pickerEl.addEventListener('click', e => {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    DB.updateProfile({ avatar: b.dataset.a });
    render();
});

nameEl.addEventListener('change', () => {
    DB.updateProfile({ name: nameEl.value.trim() || 'Friend' });
    toast('Name saved', 'bx-face');
});

goalEl.addEventListener('change', () => {
    DB.updateProfile({ dailyGoal: Number(goalEl.value) });
    toast('Goal updated', 'bx-target-lock');
});

notifEl.addEventListener('change', async () => {
    if (!notifEl.checked) { DB.updateProfile({ notifications: false }); return; }
    if (!('Notification' in window)) {
        toast('Notifications not supported here', 'bx-error');
        notifEl.checked = false;
        return;
    }
    const perm = await Notification.requestPermission();
    const ok = perm === 'granted';
    notifEl.checked = ok;
    DB.updateProfile({ notifications: ok });
    toast(ok ? 'Notifications on' : 'Permission was blocked', ok ? 'bx-bell' : 'bx-error');
});

document.getElementById('export').addEventListener('click', () => {
    const blob = new Blob([DB.export()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'adhd-planner-data.json';
    a.click();
    URL.revokeObjectURL(a.href);
});

document.getElementById('reseed').addEventListener('click', () => {
    if (!confirm('Replace everything with fresh demo data?')) return;
    DB.reset();
    toast('Demo data reloaded', 'bx-refresh');
    render();
});

document.getElementById('clear').addEventListener('click', () => {
    if (!confirm('Delete all tasks, notes and reminders?')) return;
    DB.clearAll();
    toast('All cleared', 'bx-trash');
});

render();
