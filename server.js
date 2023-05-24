import express from 'express';
import https from 'https';
import fs from 'fs';
import pkg from 'pg';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import { WebSocketServer } from 'ws';

const { Pool } = pkg;
dotenv.config({ path: '.dev-env' });

// see
// https://www.section.io/engineering-education/how-to-get-ssl-https-for-localhost/
// Load the SSL/TLS certificate and key
//
// in chrome chrome://flags/#allow-insecure-localhost
const options = {
  key: fs.readFileSync('./certificate/localhost/localhost.decrypted.key'),
  cert: fs.readFileSync('./certificate/localhost/localhost.crt')
};

const app = express();
const server = https.createServer(options, app);
// Create a WebSocket server by attaching it to the HTTPS server
const wss = new WebSocketServer({ server });

// must be defined prior routing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Enable CORS
app.use(cors());

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Create a tables for storing chat messages
const createMessagesTableQuery = `
  CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    userId INTEGER NOT NULL,
    mateId INTEGER NOT NULL,
    text TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

// Create a tables for storing users and their names
const createUsersTableQuery = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(256) NOT NULL UNIQUE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

pool.query(createMessagesTableQuery, (err, res) => {
  if (err) {
    console.error('Error creating table:', err);
  } else {
    console.log('Messages table created successfully');
  }
});

pool.query(createUsersTableQuery, (err, res) => {
  if (err) {
    console.error('Error creating table:', err);
  } else {
    console.log('Users table created successfully');
  }
});

// Status endpoint
app.get('/status', (req, res) => {
    res.send('OK');
});

// Save a new chat message
app.post('/messages', (req, res) => {
  //console.log('req.body:', req.body);
  const { name, text } = req.body;
  const selectQuery = 'SELECT * FROM users WHERE name = $1';
  //console.log('selectQuery=',selectQuery);
  pool.query(selectQuery, [name], (err, result) => {
    if (err) {
      console.error('Error querying user data:', err);
      res.status(500).json({ error: 'Error querying user data' });
      return;
    }
    const row = result.rows[0];
    //console.log('row=', row);
    const userId = row.id;
    const mateId = 999; // placeholder for mutual messages, can be sued later
    const insertQuery = 'INSERT INTO messages (userId, mateId, text, timestamp) VALUES ($1, $2, $3, $4) RETURNING *';
    pool.query(insertQuery, [userId, mateId, text, new Date()], (err, result) => {
      if (err) {
        console.error('Error inserting message:', err);
        res.status(500).json({ error: 'Error inserting message' });
      } else {
        res.status(200).json(result.rows[0]);
      }
    });
  });
});

// Save name
app.post('/name', (req, res) => {
  //console.log('req.body:', req.body);
  const { name } = req.body;
  //console.log(name);

  const checkQuery = 'SELECT 1 FROM users WHERE name = $1';
  pool.query(checkQuery, [name], (err, result) => {
    if (err) {
      console.error('Error checking existing user:', err);
      res.status(500).json({ error: 'Error checking existing user' });
      return;
    }

    if (result.rows.length > 0) {
      // Name already exists, return the existing row
      const insertedRow = result.rows[0];
      res.status(200).json(insertedRow);
      return;
    }
    const insertQuery = 'INSERT INTO users (name, timestamp) VALUES ($1, $2) RETURNING *';
    pool.query(insertQuery, [name, new Date()], (err, result) => {
      if (err) {
        console.error('Error inserting user:', err);
        res.status(500).json({ error: 'Error inserting user' });
      } else {
        const insertedRow = result.rows[0];
        res.status(200).json(insertedRow);
      }
    });
  });
});


// Retrieve all messages
app.get('/messages', (req, res) => {
  const selectQuery = `
      SELECT messages.id, users.name, messages.text
      FROM users
      INNER JOIN messages ON users.id = messages.userId ORDER BY messages.timestamp ASC;
    `;
  pool.query(selectQuery, (err, result) => {
    if (err) {
      console.error('Error retrieving messages:', err);
      res.status(500).json({ error: 'Error retrieving messages' });
    } else {
      res.status(200).json(result.rows);
    }
  });
});

// Define an event listener for WebSocket connections
wss.on('connection', (ws) => {
  // Event listener for receiving messages from clients
  ws.on('message', (messageBuffer) => {
    // console.log('Socket message=', messageBuffer);
    // Broadcast the received message to all connected clients
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        // Convert Buffer to string
        const messageString = messageBuffer.toString('utf8');
        //console.log('client.send=', messageString);
        client.send(messageString);
      }
    });
  });
});

// Start the HTTP server
const port = 3001;
server.listen(port, () => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`Server running on http://localhost:${port}`);
  }
});

// Function to gracefully close the server
const closeServer = () => {
  return new Promise((resolve) => {
    server.close((err) => {
      if (err) {
        console.error('Error closing server:', err);
      } else {
        console.log('Server closed');
      }
      resolve();
    });
  });
};

export { app, server, closeServer };