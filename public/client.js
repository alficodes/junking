// State
let allTasks = [];
let currentFilter = 'all';
let isRunningPipeline = false;

// DOM Elements
const healthDot = document.getElementById('healthDot');
const healthText = document.getElementById('healthText');
const envBadge = document.getElementById('envBadge');
const statTotal = document.getElementById('statTotal');
const statCompleted = document.getElementById('statCompleted');
const statPending = document.getElementById('statPending');
const statPipelineStatus = document.getElementById('statPipelineStatus');
const taskList = document.getElementById('taskList');
const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const categorySelect = document.getElementById('categorySelect');
const prioritySelect = document.getElementById('prioritySelect');
const btnRunPipeline = document.getElementById('btnRunPipeline');
const pipelineTerminal = document.getElementById('pipelineTerminal');
const terminalLogs = document.getElementById('terminalLogs');

// Diagnostics elements
const diagStatus = document.getElementById('diagStatus');
const diagUptime = document.getElementById('diagUptime');
const diagNode = document.getElementById('diagNode');
const diagMemory = document.getElementById('diagMemory');
const diagEnv = document.getElementById('diagEnv');

// Initialize on Load
document.addEventListener('DOMContentLoaded', () => {
  fetchHealth();
  fetchTasks();
  setupFilterListeners();
  setupFormListener();
  setupPipelineListener();

  // Periodic health check every 4 seconds
  setInterval(fetchHealth, 4000);
});

// Fetch Health Status
async function fetchHealth() {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('Health check non-200');
    const data = await res.json();

    healthDot.className = 'status-dot online pulsing';
    healthText.textContent = `Online (${data.uptime ? Math.floor(data.uptime) + 's' : 'OK'})`;
    diagStatus.textContent = 'ONLINE (HTTP 200)';
    diagStatus.className = 'diag-val text-green';

    if (data.uptime !== undefined) {
      diagUptime.textContent = formatUptime(data.uptime);
    }
    if (data.nodeVersion) diagNode.textContent = data.nodeVersion;
    if (data.memory) diagMemory.textContent = `${data.memory.heapUsedMB} MB / ${data.memory.heapTotalMB} MB`;
    if (data.env) {
      diagEnv.textContent = data.env;
      envBadge.textContent = data.env.toUpperCase();
    }
  } catch (err) {
    healthDot.className = 'status-dot error';
    healthText.textContent = 'Service Disconnected';
    diagStatus.textContent = 'OFFLINE';
    diagStatus.className = 'diag-val text-red';
  }
}

function formatUptime(seconds) {
  const s = Math.floor(seconds);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m ${s % 60}s`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

// Fetch Tasks
async function fetchTasks() {
  try {
    const res = await fetch('/api/tasks');
    const data = await res.json();
    allTasks = data.data || [];
    renderTasks();
    updateStats();
  } catch (err) {
    taskList.innerHTML = `<div class="empty-state">Failed to load tasks: ${err.message}</div>`;
  }
}

// Render Tasks based on filter
function renderTasks() {
  let filtered = allTasks;
  if (currentFilter === 'active') filtered = allTasks.filter(t => !t.completed);
  if (currentFilter === 'completed') filtered = allTasks.filter(t => t.completed);

  if (filtered.length === 0) {
    taskList.innerHTML = `<div class="empty-state">No ${currentFilter === 'all' ? '' : currentFilter} tasks found.</div>`;
    return;
  }

  taskList.innerHTML = filtered.map(task => `
    <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
      <div class="task-left">
        <button class="task-checkbox" onclick="toggleTask(${task.id})" title="${task.completed ? 'Mark pending' : 'Mark complete'}">
          ${task.completed ? '✓' : ''}
        </button>
        <div class="task-details">
          <span class="task-title">${escapeHtml(task.title)}</span>
          <div class="task-meta">
            <span class="tag-badge">${escapeHtml(task.category || 'CI/CD')}</span>
            <span class="priority-badge priority-${task.priority || 'Medium'}">${task.priority || 'Medium'}</span>
          </div>
        </div>
      </div>
      <button class="task-delete-btn" onclick="deleteTask(${task.id})" title="Delete task">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    </div>
  `).join('');
}

// Update Dashboard Statistics
function updateStats() {
  const total = allTasks.length;
  const completed = allTasks.filter(t => t.completed).length;
  const pending = total - completed;

  statTotal.textContent = total;
  statCompleted.textContent = completed;
  statPending.textContent = pending;
}

// Setup Filters
function setupFilterListeners() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderTasks();
    });
  });
}

// Add Task Form Handler
function setupFormListener() {
  taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = taskInput.value.trim();
    if (!title) return;

    const category = categorySelect.value;
    const priority = prioritySelect.value;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category, priority })
      });

      if (!res.ok) throw new Error('Failed to create task');
      const newTask = await res.json();
      allTasks.unshift(newTask);
      taskInput.value = '';
      renderTasks();
      updateStats();
    } catch (err) {
      alert(`Error creating task: ${err.message}`);
    }
  });
}

// Toggle Task
window.toggleTask = async function(id) {
  try {
    const res = await fetch(`/api/tasks/${id}/toggle`, { method: 'PATCH' });
    if (!res.ok) throw new Error('Failed to toggle task');
    const updated = await res.json();

    const idx = allTasks.findIndex(t => t.id === id);
    if (idx !== -1) {
      allTasks[idx] = updated;
      renderTasks();
      updateStats();
    }
  } catch (err) {
    alert(`Error updating task: ${err.message}`);
  }
};

// Delete Task
window.deleteTask = async function(id) {
  if (!confirm('Are you sure you want to delete this task?')) return;

  try {
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete task');

    allTasks = allTasks.filter(t => t.id !== id);
    renderTasks();
    updateStats();
  } catch (err) {
    alert(`Error deleting task: ${err.message}`);
  }
};

// Pipeline Simulator
function setupPipelineListener() {
  btnRunPipeline.addEventListener('click', runSimulatedPipeline);
}

async function runSimulatedPipeline() {
  if (isRunningPipeline) return;
  isRunningPipeline = true;
  btnRunPipeline.disabled = true;

  pipelineTerminal.style.display = 'block';
  terminalLogs.textContent = '🚀 Initializing Jenkins Pipeline job: task-tracker-cicd #local\n';

  const stages = [
    { num: 1, name: 'Checkout', cmd: 'git pull origin main', msg: 'Checking out branch main (commit 0d47c2e)...' },
    { num: 2, name: 'Dependencies', cmd: 'npm install', msg: 'Audited 69 packages with 0 vulnerabilities.' },
    { num: 3, name: 'Lint Quality', cmd: 'node scripts/lint.js', msg: 'Syntax analysis passed for all JS modules.' },
    { num: 4, name: 'Automated Tests', cmd: 'npm test', msg: 'Ran 5 unit & integration tests -> 5 passed (100%).' },
    { num: 5, name: 'Build Artifact', cmd: 'node scripts/build.js', msg: 'Generated distribution bundle in dist/ with build-info.json.' },
    { num: 6, name: 'Deploy & Smoke', cmd: 'node scripts/deploy.js', msg: 'Deployed to STAGING. Verified GET /api/health -> 200 UP.' }
  ];

  // Reset steps
  const steps = document.querySelectorAll('.stage-step');
  const connectors = document.querySelectorAll('.stage-connector');
  steps.forEach(s => {
    s.className = 'stage-step';
    const num = s.dataset.stage;
    s.querySelector('.stage-icon').textContent = num;
  });
  connectors.forEach(c => c.classList.remove('active'));

  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i];
    const stepEl = document.querySelector(`.stage-step[data-stage="${stage.num}"]`);
    
    // Mark active
    stepEl.classList.add('active');
    appendLog(`[Stage ${stage.num}: ${stage.name}] Executing: ${stage.cmd}`);

    await delay(700);

    // Complete active
    stepEl.classList.remove('active');
    stepEl.classList.add('success');
    stepEl.querySelector('.stage-icon').textContent = '✓';
    appendLog(`  ✅ ${stage.msg}\n`);

    if (i < connectors.length) {
      connectors[i].classList.add('active');
    }
  }

  appendLog('🎉 [SUCCESS] Pipeline execution finished with status SUCCESS in 4.2s.');
  statPipelineStatus.textContent = 'PASSING';
  statPipelineStatus.className = 'stat-value text-green';

  btnRunPipeline.disabled = false;
  isRunningPipeline = false;
  fetchHealth();
}

function appendLog(text) {
  terminalLogs.textContent += text + '\n';
  terminalLogs.scrollTop = terminalLogs.scrollHeight;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
