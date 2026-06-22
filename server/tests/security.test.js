const request = require('supertest');
const { app, server } = require('../server');
const mongoose = require('mongoose');

describe('Security Automation Test Suite', () => {
  afterAll(async () => {
    // Close connections to prevent open handle errors in Jest
    if (server) server.close();
    await mongoose.connection.close();
  });

  describe('JWT Enforcement on Critical Routes', () => {
    it('should block unauthenticated users from creating campsites (401/403)', async () => {
      const response = await request(app)
        .post('/api/campsites')
        .send({
          name: 'Hacker Camp',
          isPublic: true,
          adminUsername: 'Hacker',
          adminEmail: 'hacker@hack.com'
        });
      
      // Should be blocked by requireAuth middleware
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should block unauthenticated users from deleting users (401/403)', async () => {
      const response = await request(app)
        .delete('/api/users/someuser@email.com');
      
      // Should be blocked by requireAuth middleware
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('API Health', () => {
    it('should allow public access to the health check endpoint', async () => {
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'Operational');
    });
  });
});
