const express = require('express');

const app = express();
app.use(express.json());

// In-memory store for demonstration
let tasks = [
  { id: 1, title: 'Setup Jenkins Server', completed: true },
  { id: 2, title: 'Configure CI Pipeline', completed: true },
  { id: 3, title: 'Automate Deployment', completed: false }
];

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Jenkins CI/CD Mini Project API!',
    version: '1.0.0',
    status: 'online',
    docs: '/api/health, /api/tasks'
  });
});

// Health check endpoint (vital for CI/CD smoke tests)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Task collection
app.get('/api/tasks', (req, res) => {
  res.json({ count: tasks.length, data: tasks });
});

// Create task
app.post('/api/tasks', (req, res) => {
  const { title } = req.body;
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required and must be a non-empty string' });
  }

  const newTask = {
    id: tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1,
    title: title.trim(),
    completed: false
  };

  tasks.push(newTask);
  res.status(201).json(newTask);
});

module.exports = app;
