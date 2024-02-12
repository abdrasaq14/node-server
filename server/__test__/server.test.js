const request = require('supertest');
const server = require('../lib/app');
const database = require('../database.json');
const { ServerResponse } = require('http');
 // Replace with the path to your server file

describe('Server', () => {
  test('GET request to the root route', async () => {
    const response = await request.get('http://localhost:3005');
    expect(ServerResponse.status).toBe(200);
    expect(response.body).toEqual(database);
  });
});