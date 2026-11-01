import app from './app.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` CIT CampusOS API Gateway listening on port ${PORT}`);
  console.log(` Health: http://localhost:${PORT}/api/health`);
  console.log(` AI Endpoints: /api/ai/booking-intake, /api/ai/schedule-change, /api/ai/decision-explainer`);
  console.log(`====================================================`);
});
