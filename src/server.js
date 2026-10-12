const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[CI/CD Service] Server is running on port ${PORT}`);
  console.log(`[CI/CD Service] Health check available at http://localhost:${PORT}/api/health`);
});
