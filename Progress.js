function render() {
    const s = DB.stats();
    const goal = DB.getProfile().dailyGoal || 3;

    document.getElementById('s-streak').textContent = s.streak;
    document.getElementById('s-done').textContent = s.totalDone;
    document.getElementById('s-open').textContent = s.totalOpen;
    document.getElementById('s-rate').textContent = s.rate + '%';

    // Daily goal ring
    const pct = Math.min(100, Math.round((s.today / goal) * 100));
    document.getElementById('ring').style.setProperty('--pct', pct);
    document.getElementById('ring-text').textContent = `${s.today}/${goal}`;
    document.getElementById('goal-msg').textContent =
        s.today >= goal ? 'Goal crushed! Treat yourself 🎉'
        : `${goal - s.today} more to hit your goal.`;

    document.getElementById('cheer').textContent =
        s.streak >= 3 ? `${s.streak} days in a row. You're on fire!`
        : s.streak > 0 ? 'Nice start, keep the streak going!'
        : 'Finish one thing today to start a streak.';

    // Weekly bar chart
    const max = Math.max(s.best, 1);
    document.getElementById('bars').innerHTML = s.last7.map(d => `
        <div class="bar-col">
            <div class="v">${d.count}</div>
            <div class="bar ${d.isToday ? 'today' : ''}" style="height:${Math.round((d.count / max) * 100)}px"></div>
            <div class="d">${d.isToday ? 'Today' : d.label}</div>
        </div>`).join('');

    // Priority breakdown
    const total = Object.values(s.byPriority).reduce((a, b) => a + b, 0) || 1;
    document.getElementById('prio').innerHTML = Object.entries(PRIORITY_LABELS).map(([key, label]) => `
        <div class="prio-row" style="margin-top:10px">
            <div class="name">${label}</div>
            <div class="prio-track"><div class="prio-fill" style="width:${(s.byPriority[key] / total) * 100}%"></div></div>
            <div class="cnt">${s.byPriority[key]}</div>
        </div>`).join('');
}

render();