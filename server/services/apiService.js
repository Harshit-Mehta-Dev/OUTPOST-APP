// Forward to Monolithic Server to ensure all services (Auth, Chat, API) run on a single Render instance
const { server } = require('../server');

const PORT = process.env.PORT || process.env.PORT_API || 5002;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Monolithic Server (via apiService) running on port ${PORT}`);
});
