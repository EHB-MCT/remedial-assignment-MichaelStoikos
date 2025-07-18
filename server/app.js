// server/app.js
import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config({ path: './config.env' });

const app = express();
const PORT = process.env.PORT || 5000;

const url = process.env.MONGODB_URI;
const dbName = 'Resource-Management-Web';

const client = new MongoClient(url);

// Connect to MongoDB once when server starts
client.connect()
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

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
        oxygen: 100,
        food: 50,
        water: 80,
        energy: 30,
        metal: 20
      },
      buildings: [
        {
          type: 'habitat',
          level: 1,
          lastHarvest: new Date(),
          position: { x: 5, y: 5 }
        }
      ],
      createdAt: new Date()
    };

    await db.collection('games').insertOne(gameState);

    res.status(201).json({ 
      message: 'User registered successfully',
      userId: result.insertedId 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

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
  }
});

// Get user's game state
app.get('/api/game/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const db = client.db(dbName);
    const gamesCollection = db.collection('games');
    
    let gameState = await gamesCollection.findOne({ userId: new ObjectId(userId) });
    
    if (!gameState) {
      // Create new game state if it doesn't exist
      gameState = {
        userId: new ObjectId(userId),
        resources: {
          oxygen: 100,
          food: 50,
          water: 80,
          energy: 30,
          metal: 20
        },
        buildings: [
          {
            type: 'habitat',
            level: 1,
            lastHarvest: new Date(),
            position: { x: 5, y: 5 }
        }
        ],
        createdAt: new Date()
      };
      
      await gamesCollection.insertOne(gameState);
    }

    // Calculate stocked resources (what's available to harvest)
    const now = Date.now();
    let stockedResources = { oxygen: 0, food: 0, water: 0, energy: 0, metal: 0 };

    if (gameState.buildings && Array.isArray(gameState.buildings)) {
      gameState.buildings.forEach(building => {
        const timeDiff = now - new Date(building.lastHarvest).getTime();
        const minutesPassed = Math.floor(timeDiff / (1000 * 60));
        
        if (building.type === 'habitat') {
          const oxygenPer30Sec = 5 * building.level; // 5 oxygen per 30 seconds for testing
          const oxygenStocked = Math.floor(minutesPassed * 2) * oxygenPer30Sec; // 2 intervals per minute (30 seconds each)
          stockedResources.oxygen += oxygenStocked;
        }
      });
    }

    // Add stocked resources to the response
    const responseData = {
      ...gameState,
      stockedResources
    };
    
    res.json(responseData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Harvest resources from buildings
app.post('/api/game/:userId/harvest', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const db = client.db(dbName);
    const gamesCollection = db.collection('games');
    
    // Try to find game state with ObjectId first, then with string
    let gameState = await gamesCollection.findOne({ userId: new ObjectId(userId) });
    
    if (!gameState) {
      // Try with string userId as fallback
      gameState = await gamesCollection.findOne({ userId: userId });
    }
    
    if (!gameState) {
      return res.status(404).json({ error: 'Game state not found' });
    }

    const now = Date.now();
    let totalHarvest = { oxygen: 0, food: 0, water: 0, energy: 0, metal: 0 };

    // Calculate resources from each building
    if (gameState.buildings && Array.isArray(gameState.buildings)) {
      gameState.buildings.forEach(building => {
        const timeDiff = now - new Date(building.lastHarvest).getTime();
        const minutesPassed = Math.floor(timeDiff / (1000 * 60));
        
        if (building.type === 'habitat') {
          const oxygenPer30Sec = 5 * building.level; // 5 oxygen per 30 seconds for testing
          const oxygenHarvested = Math.floor(minutesPassed * 2) * oxygenPer30Sec; // 2 intervals per minute (30 seconds each)
          totalHarvest.oxygen += oxygenHarvested;
          
          if (oxygenHarvested > 0) {
            building.lastHarvest = new Date();
          }
        }
      });
    }

    // Update resources
    Object.keys(totalHarvest).forEach(resource => {
      if (gameState.resources && gameState.resources[resource] !== undefined) {
        gameState.resources[resource] += totalHarvest[resource];
      }
    });

    // Save updated game state
    await gamesCollection.updateOne(
      { _id: gameState._id },
      { $set: gameState }
    );

    res.json({ 
      gameState, 
      harvested: totalHarvest,
      message: 'Resources harvested successfully'
    });
  } catch (error) {
    console.error('Harvest error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all tests (keeping existing endpoint)
app.get('/api/tests', async (req, res) => {
  try {
    const db = client.db(dbName);
    const tests = await db.collection('tests').find({}).toArray();
    res.json(tests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 StarStation server running on port ${PORT}`);
});
