const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
app.use(express.json());

// Serve static frontend files from 'public' directory
const publicDir = path.join(__dirname, '../public');
app.use(express.static(publicDir));

// In-memory task store with production-like DevOps initial data
let tasks = [
  { id: 1, title: 'Configure Jenkinsfile Declarative Pipeline', category: 'CI/CD', priority: 'High', completed: true },
  { id: 2, title: 'Implement Automated Unit & Integration Tests', category: 'Testing', priority: 'High', completed: true },
  { id: 3, title: 'Setup Multi-Stage Dockerfile Containerization', category: 'Infrastructure', priority: 'Medium', completed: true },
  { id: 4, title: 'Implement Post-Deployment Live Smoke Tests', category: 'Deployment', priority: 'High', completed: true },
  { id: 5, title: 'Integrate Slack/Email Pipeline Alerts', category: 'CI/CD', priority: 'Low', completed: false }
];

// Health check endpoint (Used by CI/CD smoke testing)
app.get('/api/health', (req, res) => {
  const memory = process.memoryUsage();
  res.status(200).json({
    status: 'UP',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    env: process.env.NODE_ENV || 'staging',
    memory: {
      heapUsedMB: (memory.heapUsed / (1024 * 1024)).toFixed(2),
      heapTotalMB: (memory.heapTotal / (1024 * 1024)).toFixed(2)
    }
  });
});

// Pipeline metadata endpoint
app.get('/api/pipeline/info', (req, res) => {
  let buildInfo = null;
  const buildInfoPath = path.join(__dirname, '../dist/build-info.json');
  if (fs.existsSync(buildInfoPath)) {
    try {
      buildInfo = JSON.parse(fs.readFileSync(buildInfoPath, 'utf8'));
    } catch (e) {
      // fallback
    }
  }

  res.json({
    pipeline: 'jenkins-declarative',
    status: 'active',
    stages: ['Checkout', 'Install Dependencies', 'Lint Quality', 'Automated Tests', 'Build Artifact', 'Deploy & Smoke'],
    lastBuild: buildInfo || {
      buildNumber: process.env.BUILD_NUMBER || 'local-dev',
      environment: process.env.NODE_ENV || 'staging',
      builtAt: new Date().toISOString()
    }
  });
});

// GET all tasks (with optional filtering)
app.get('/api/tasks', (req, res) => {
  const { status, category } = req.query;
  let result = [...tasks];

  if (status === 'completed') {
    result = result.filter(t => t.completed);
  } else if (status === 'active') {
    result = result.filter(t => !t.completed);
  }

  if (category) {
    result = result.filter(t => t.category.toLowerCase() === category.toLowerCase());
  }

  res.json({ count: result.length, total: tasks.length, data: result });
});

// POST: Create a new task
app.post('/api/tasks', (req, res) => {
  const { title, category, priority } = req.body;
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required and must be a non-empty string' });
  }

  const validPriorities = ['High', 'Medium', 'Low'];
  const newTask = {
    id: tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1,
    title: title.trim(),
    category: category && typeof category === 'string' ? category.trim() : 'CI/CD',
    priority: validPriorities.includes(priority) ? priority : 'Medium',
    completed: false,
    createdAt: new Date().toISOString()
  };

  tasks.push(newTask);
  res.status(201).json(newTask);
});

// PATCH: Toggle task completion
app.patch('/api/tasks/:id/toggle', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const task = tasks.find(t => t.id === id);

  if (!task) {
    return res.status(404).json({ error: `Task with id ${id} not found` });
  }

  task.completed = !task.completed;
  res.json(task);
});

// DELETE: Remove task
app.delete('/api/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const index = tasks.findIndex(t => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: `Task with id ${id} not found` });
  }

  const removed = tasks.splice(index, 1)[0];
  res.json({ message: 'Task deleted successfully', removed });
});

module.exports = app;
