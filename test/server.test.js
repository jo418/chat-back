const request = require('supertest');
const { Pool } = require('pg');
const { app, server, closeServer } = require('../server');

test('Example test', () => {
  // Test assertions here
  expect(true).toBe(true);
});

// Mock the Pool query method
jest.mock('pg', () => {
  const mPool = { query: jest.fn() };
  return { Pool: jest.fn(() => mPool) };
});

afterAll(async () => {
  // Close the mock Pool instance
  // TODO X pool.end();
  // Close the mock Pool instance
  // pool.end.mockResolvedValue();
  // Close the server instance
  await closeServer();
});


describe('Server API', () => {
  let pool;

  beforeAll(() => {
    // Create a mock instance of Pool
    pool = new Pool();
    // Provide a mock response for the Pool query method
    pool.query.mockImplementation((query, params, callback) => {
      callback(null, { rows: [] });
    });
  });

  describe('GET /status', () => {
    test('should return 200 OK', async () => {
      const response = await request(app).get('/status');
      expect(response.status).toBe(200);
    });
  });

  describe('POST /name', () => {
    test('should return 200 OK and insert a new user', async () => {
      const name = 'John Doe';
      pool.query.mockImplementationOnce((query, params, callback) => {
        callback(null, { rows: [{ id: 1, name, timestamp: new Date() }] });
      });

      const response = await request(app).post('/name').send({ name });
      expect(response.status).toBe(200);
      expect(response.body.name).toBe(name);
    });
  });

  describe('POST /messages', () => {
    test('should return 200 OK and insert a new message', async () => {
      const name = 'John Doe';
      const text = 'Hello, World!';
      pool.query.mockImplementationOnce((query, params, callback) => {
        callback(null, { rows: [{ id: 1 }] });
      });
      pool.query.mockImplementationOnce((query, params, callback) => {
        callback(null, { rows: [{ id: 1, userId: 1, mateId: 999, text, timestamp: new Date() }] });
      });

      const response = await request(app).post('/messages').send({ name, text });
      expect(response.status).toBe(200);
      expect(response.body.text).toBe(text);
    });
  });

  describe('GET /messages', () => {
    test('should return 200 OK and retrieve all messages', async () => {
      const mockRows = [
        { id: 1, name: 'John Doe', text: 'Hello' },
        { id: 2, name: 'Jane Smith', text: 'Hi' },
      ];
      pool.query.mockImplementationOnce((query, callback) => {
        callback(null, { rows: mockRows });
      });

      const response = await request(app).get('/messages');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockRows);
    });
  });
});
