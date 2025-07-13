// server/app.js
import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config({ path: './config.env' });

const app = express();
const PORT = process.env.PORT || 5000;

const url = process.env.MONGODB_URI;
const dbName = 'Resource-Management-Web';

const client = new MongoClient(url);

app.use(cors());
app.use(express.json());

// Simple password hashing function
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Simple password verification function
const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    await client.connect();
    const db = client.db(dbName);
    const usersCollection = db.collection('users');
    
    // Check if user already exists
    const existingUser = await usersCollection.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const newUser = {
      username,
      password: hashedPassword,
      createdAt: new Date()
    };

    const result = await usersCollection.insertOne(newUser);
    
    // Create initial game state for the user
    const gameState = {
      userId: result.insertedId,
      resources: {
        energy: 100,
        minerals: 50,
        food: 30,
        credits: 200
      },
      buildings: [],
      createdAt: new Date()
    };

    await db.collection('games').insertOne(gameState);

    res.status(201).json({ 
      message: 'User registered successfully',
      userId: result.insertedId 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await client.close();
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    await client.connect();
    const db = client.db(dbName);
    const usersCollection = db.collection('users');
    
    // Find user
    const user = await usersCollection.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    res.json({ 
      message: 'Login successful',
      userId: user._id,
      username: user.username
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await client.close();
  }
});

// Get user's game state
app.get('/api/game/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    await client.connect();
    const db = client.db(dbName);
    const gamesCollection = db.collection('games');
    
    let gameState = await gamesCollection.findOne({ userId: new MongoClient.ObjectId(userId) });
    
    if (!gameState) {
      // Create new game state if it doesn't exist
      gameState = {
        userId: new MongoClient.ObjectId(userId),
        resources: {
          energy: 100,
          minerals: 50,
          food: 30,
          credits: 200
        },
        buildings: [],
        createdAt: new Date()
      };
      
      await gamesCollection.insertOne(gameState);
    }
    
    res.json(gameState);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await client.close();
  }
});

// Get all tests (keeping existing endpoint)
app.get('/api/tests', async (req, res) => {
  try {
    await client.connect();
    const db = client.db(dbName);
    const tests = await db.collection('tests').find({}).toArray();
    res.json(tests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await client.close();
  }
});

app.listen(PORT, () => {
  console.log(`🚀 StarStation server running on port ${PORT}`);
});
