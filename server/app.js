// server/app.js
import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config({ path: './config.env' });

/**
 * StarStation Server Application
 * 
 * Main Express.js server for the space colony resource management game.
 * Handles authentication, game state management, building system, and space events.
 * 
 * Features:
 * - User authentication (register/login) with bcrypt password hashing
 * - Game state management with MongoDB
 * - Resource harvesting and building construction
 * - Dynamic space events system with production modifiers
 * - Building definitions stored in database
 */

const app = express();
const PORT = process.env.PORT || 5000;

const url = process.env.MONGODB_URI;
const dbName = 'Resource-Management-Web';

const client = new MongoClient(url);

/**
 * MongoDB Connection Setup
 * 
 * - Connects to MongoDB Atlas cluster on server startup.
 * - Uses connection string from environment variables.
 * - Establishes single connection for all requests.
 * - Logs connection status for debugging.
 */
client.connect()
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

app.use(cors());
app.use(express.json());

/**
 * Password hashing utility function.
 * 
 * - Uses bcrypt with 10 salt rounds for security.
 * - Returns hashed password for storage in database.
 * 
 * @param {string} password - Plain text password to hash
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Password verification utility function.
 * 
 * - Compares plain text password with stored hash.
 * - Uses bcrypt for secure comparison.
 * 
 * @param {string} password - Plain text password to verify
 * @param {string} hashedPassword - Stored hashed password
 * @returns {Promise<boolean>} True if password matches, false otherwise
 */
const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * User Registration Endpoint
 * 
 * - Creates new user account with hashed password.
 * - Checks for existing username to prevent duplicates.
 * - Initializes game state with default resources and habitat building.
 * - Sets up event occurrence tracking for new users.
 * 
 * Route: POST /api/auth/register
 * Body: { username: string, password: string }
 */
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
      lastEventOccurrence: {}, // Initialize empty event occurrence tracking
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

/**
 * User Login Endpoint
 * 
 * - Authenticates user with username and password.
 * - Verifies password hash using bcrypt.
 * - Returns user ID and username on successful login.
 * 
 * Route: POST /api/auth/login
 * Body: { username: string, password: string }
 */
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

/**
 * Get Game State Endpoint
 * 
 * - Retrieves current game state for authenticated user.
 * - Calculates stocked resources based on building production and time.
 * - Applies active space event modifiers to production calculations.
 * - Creates new game state if none exists for the user.
 * 
 * Route: GET /api/game/:userId
 * Params: userId - User's unique identifier
 */
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
        lastEventOccurrence: {}, // Initialize empty event occurrence tracking
        createdAt: new Date()
      };
      
      await gamesCollection.insertOne(gameState);
    }

    // Calculate stocked resources (what's available to harvest)
    const now = Date.now();
    let stockedResources = { oxygen: 0, food: 0, water: 0, energy: 0, metal: 0 };

    if (gameState.buildings && Array.isArray(gameState.buildings)) {
      const buildingsCollection = db.collection('buildings');
      
      // Check for active space event
      let productionModifiers = { oxygen: 1.0, food: 1.0, water: 1.0, energy: 1.0, metal: 1.0 };
      if (gameState.activeEvent && gameState.activeEvent.endTime > now) {
        productionModifiers = { ...productionModifiers, ...gameState.activeEvent.effects.productionModifiers };
      }
      
      for (const building of gameState.buildings) {
        const buildingDefinition = await buildingsCollection.findOne({ type: building.type });
        if (!buildingDefinition) continue;
        
        const timeDiff = now - new Date(building.lastHarvest).getTime();
        const minutesPassed = Math.floor(timeDiff / (1000 * 60));
        
        // Calculate stocked resources based on building definition and active events
        Object.entries(buildingDefinition.production).forEach(([resource, baseAmount]) => {
          if (baseAmount > 0) {
            let stocked = 0;
            
            if (buildingDefinition.productionRate === 30) {
              // 30-second production rate (like habitat)
              const intervalsPerMinute = 2;
              stocked = Math.floor(minutesPassed * intervalsPerMinute) * baseAmount * building.level;
            } else {
              // 60-second production rate (like other buildings)
              stocked = minutesPassed * baseAmount * building.level;
            }
            
            // Apply event modifiers
            stocked = Math.floor(stocked * productionModifiers[resource]);
            
            stockedResources[resource] += stocked;
          }
        });
      }
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

/**
 * Harvest Resources Endpoint
 * 
 * - Calculates and collects accumulated resources from all buildings.
 * - Applies active space event modifiers to production.
 * - Updates building last harvest timestamps.
 * - Adds harvested resources to user's current resources.
 * 
 * Route: POST /api/game/:userId/harvest
 * Params: userId - User's unique identifier
 */
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
      const buildingsCollection = db.collection('buildings');
      
      // Check for active space event
      let productionModifiers = { oxygen: 1.0, food: 1.0, water: 1.0, energy: 1.0, metal: 1.0 };
      if (gameState.activeEvent && gameState.activeEvent.endTime > now) {
        productionModifiers = { ...productionModifiers, ...gameState.activeEvent.effects.productionModifiers };
      }
      
      for (const building of gameState.buildings) {
        const buildingDefinition = await buildingsCollection.findOne({ type: building.type });
        if (!buildingDefinition) continue;
        
        const timeDiff = now - new Date(building.lastHarvest).getTime();
        const minutesPassed = Math.floor(timeDiff / (1000 * 60));
        
        // Calculate production based on building definition and active events
        Object.entries(buildingDefinition.production).forEach(([resource, baseAmount]) => {
          if (baseAmount > 0) {
            let harvested = 0;
            
            if (buildingDefinition.productionRate === 30) {
              // 30-second production rate (like habitat)
              const intervalsPerMinute = 2;
              harvested = Math.floor(minutesPassed * intervalsPerMinute) * baseAmount * building.level;
            } else {
              // 60-second production rate (like other buildings)
              harvested = minutesPassed * baseAmount * building.level;
            }
            
            // Apply event modifiers
            harvested = Math.floor(harvested * productionModifiers[resource]);
            
            if (harvested > 0) {
              totalHarvest[resource] += harvested;
              building.lastHarvest = new Date();
            }
          }
        });
      }
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

/**
 * Build Building Endpoint
 * 
 * - Constructs new buildings using available resources.
 * - Validates resource costs against user's current resources.
 * - Deducts required resources and adds building to game state.
 * - Assigns random position coordinates for the new building.
 * 
 * Route: POST /api/game/:userId/build
 * Params: userId - User's unique identifier
 * Body: { buildingType: string }
 */
app.post('/api/game/:userId/build', async (req, res) => {
  try {
    const { userId } = req.params;
    const { buildingType } = req.body;
    
    if (!buildingType) {
      return res.status(400).json({ error: 'Building type is required' });
    }

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

    // Get building definition from database
    const buildingsCollection = db.collection('buildings');
    const buildingDefinition = await buildingsCollection.findOne({ type: buildingType });
    
    if (!buildingDefinition) {
      return res.status(400).json({ error: 'Invalid building type' });
    }

    const buildingCost = buildingDefinition.cost;

    // Check if player has enough resources
    const canAfford = Object.keys(buildingCost).every(resource => 
      gameState.resources[resource] >= buildingCost[resource]
    );

    if (!canAfford) {
      return res.status(400).json({ error: 'Insufficient resources to build this structure' });
    }

    // Deduct resources
    Object.keys(buildingCost).forEach(resource => {
      gameState.resources[resource] -= buildingCost[resource];
    });

    // Add the new building
    const newBuilding = {
      type: buildingType,
      level: 1,
      lastHarvest: new Date(),
      position: { x: Math.floor(Math.random() * 10), y: Math.floor(Math.random() * 10) }
    };

    if (!gameState.buildings) {
      gameState.buildings = [];
    }
    gameState.buildings.push(newBuilding);

    // Save updated game state
    await gamesCollection.updateOne(
      { _id: gameState._id },
      { $set: gameState }
    );

    res.json({ 
      gameState,
      message: `Successfully built ${buildingType}!`,
      newBuilding
    });
  } catch (error) {
    console.error('Build error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Initialize Buildings Endpoint
 * 
 * - Populates the buildings collection with predefined building types.
 * - Sets up building costs, production rates, and descriptions.
 * - Only runs once to prevent duplicate initialization.
 * 
 * Route: POST /api/init-buildings
 */
app.post('/api/init-buildings', async (req, res) => {
  try {
    const db = client.db(dbName);
    const buildingsCollection = db.collection('buildings');
    
    // Check if buildings already exist
    const existingBuildings = await buildingsCollection.find({}).toArray();
    if (existingBuildings.length > 0) {
      return res.json({ message: 'Buildings already initialized' });
    }
    
    const buildingTypes = [
      {
        type: 'habitat',
        name: 'Basic Habitat',
        icon: '🏠',
        description: 'Produces oxygen for your colony',
        cost: { oxygen: 0, food: 0, water: 0, energy: 0, metal: 0 },
        production: { oxygen: 5, food: 0, water: 0, energy: 0, metal: 0 },
        productionRate: 30, // seconds
        unlocked: true,
        maxLevel: 10,
        upgradeCostMultiplier: 1.5
      },
      {
        type: 'farm',
        name: 'Hydroponic Farm',
        icon: '🌾',
        description: 'Grows food in controlled environments',
        cost: { oxygen: 20, food: 0, water: 30, energy: 10, metal: 15 },
        production: { oxygen: 0, food: 3, water: 0, energy: 0, metal: 0 },
        productionRate: 60, // seconds
        unlocked: true,
        maxLevel: 10,
        upgradeCostMultiplier: 1.5
      },
      {
        type: 'water',
        name: 'Water Purifier',
        icon: '💧',
        description: 'Purifies and produces clean water',
        cost: { oxygen: 15, food: 0, water: 0, energy: 25, metal: 20 },
        production: { oxygen: 0, food: 0, water: 4, energy: 0, metal: 0 },
        productionRate: 60, // seconds
        unlocked: true,
        maxLevel: 10,
        upgradeCostMultiplier: 1.5
      },
      {
        type: 'generator',
        name: 'Solar Generator',
        icon: '⚡',
        description: 'Generates energy from solar radiation',
        cost: { oxygen: 10, food: 0, water: 0, energy: 0, metal: 30 },
        production: { oxygen: 0, food: 0, water: 0, energy: 6, metal: 0 },
        productionRate: 60, // seconds
        unlocked: true,
        maxLevel: 10,
        upgradeCostMultiplier: 1.5
      },
      {
        type: 'mine',
        name: 'Metal Mine',
        icon: '⛏️',
        description: 'Extracts metal from the planet surface',
        cost: { oxygen: 25, food: 10, water: 15, energy: 20, metal: 0 },
        production: { oxygen: 0, food: 0, water: 0, energy: 0, metal: 2 },
        productionRate: 60, // seconds
        unlocked: true,
        maxLevel: 10,
        upgradeCostMultiplier: 1.5
      }
    ];
    
    const result = await buildingsCollection.insertMany(buildingTypes);
    res.json({ 
      message: 'Buildings initialized successfully',
      insertedCount: result.insertedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get Buildings Endpoint
 * 
 * - Retrieves all available building types and their definitions.
 * - Returns building costs, production rates, and descriptions.
 * 
 * Route: GET /api/buildings
 */
app.get('/api/buildings', async (req, res) => {
  try {
    const db = client.db(dbName);
    const buildingsCollection = db.collection('buildings');
    
    const buildingTypes = await buildingsCollection.find({}).toArray();
    res.json(buildingTypes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Initialize Space Events Endpoint
 * 
 * - Populates the spaceEvents collection with predefined event types.
 * - Sets up event effects, durations, cooldowns, and rarity weights.
 * - Only runs once to prevent duplicate initialization.
 * 
 * Route: POST /api/init-events
 */
app.post('/api/init-events', async (req, res) => {
  try {
    const db = client.db(dbName);
    const eventsCollection = db.collection('spaceEvents');
    
    // Clear existing events
    await eventsCollection.deleteMany({});
    
    const eventTypes = [
      {
        type: 'solar_eclipse',
        name: 'Solar Eclipse',
        icon: '🌑',
        description: 'A solar eclipse blocks sunlight, reducing energy production',
        duration: 300000, // 5 minutes in milliseconds
        effects: {
          productionModifiers: { energy: 0.5 }, // 50% reduction
          message: 'Solar eclipse detected! Energy production reduced by 50% for 5 minutes.'
        },
        rarity: 'common',
        cooldown: 600000 // 10 minutes between occurrences
      },
      {
        type: 'meteor_shower',
        name: 'Meteor Shower',
        icon: '☄️',
        description: 'Meteor shower provides extra metal resources',
        duration: 180000, // 3 minutes in milliseconds
        effects: {
          productionModifiers: { metal: 2.0 }, // 200% boost
          message: 'Meteor shower detected! Metal production doubled for 3 minutes.'
        },
        rarity: 'uncommon',
        cooldown: 900000 // 15 minutes between occurrences
      },
      {
        type: 'cosmic_radiation',
        name: 'Cosmic Radiation',
        icon: '☢️',
        description: 'High cosmic radiation boosts all production temporarily',
        duration: 240000, // 4 minutes in milliseconds
        effects: {
          productionModifiers: { 
            oxygen: 1.5, 
            food: 1.5, 
            water: 1.5, 
            energy: 1.5, 
            metal: 1.5 
          }, // 50% boost to all
          message: 'Cosmic radiation surge! All production increased by 50% for 4 minutes.'
        },
        rarity: 'rare',
        cooldown: 1200000 // 20 minutes between occurrences
      },
      {
        type: 'solar_flare',
        name: 'Solar Flare',
        icon: '🔥',
        description: 'Solar flare disrupts all production temporarily',
        duration: 120000, // 2 minutes in milliseconds
        effects: {
          productionModifiers: { 
            oxygen: 0.3, 
            food: 0.3, 
            water: 0.3, 
            energy: 0.3, 
            metal: 0.3 
          }, // 70% reduction to all
          message: 'Solar flare detected! All production reduced by 70% for 2 minutes.'
        },
        rarity: 'rare',
        cooldown: 1800000 // 30 minutes between occurrences
      },
      {
        type: 'nebula_passage',
        name: 'Nebula Passage',
        icon: '🌌',
        description: 'Passing through a nebula enhances oxygen production',
        duration: 360000, // 6 minutes in milliseconds
        effects: {
          productionModifiers: { oxygen: 3.0 }, // 300% boost
          message: 'Nebula passage detected! Oxygen production tripled for 6 minutes.'
        },
        rarity: 'uncommon',
        cooldown: 900000 // 15 minutes between occurrences
      }
    ];
    
    const result = await eventsCollection.insertMany(eventTypes);
    res.json({ 
      message: 'Space events initialized successfully',
      insertedCount: result.insertedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get Space Events Endpoint
 * 
 * - Retrieves all available space event types and their definitions.
 * - Returns event effects, durations, cooldowns, and rarity information.
 * 
 * Route: GET /api/events
 */
app.get('/api/events', async (req, res) => {
  try {
    const db = client.db(dbName);
    const eventsCollection = db.collection('spaceEvents');
    
    const eventTypes = await eventsCollection.find({}).toArray();
    res.json(eventTypes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Trigger Space Event Endpoint
 * 
 * - Randomly selects and activates a space event for the user.
 * - Checks event cooldowns to prevent spam triggering.
 * - Applies production modifiers based on event effects.
 * - Updates game state with active event and cooldown tracking.
 * 
 * Route: POST /api/game/:userId/trigger-event
 * Params: userId - User's unique identifier
 */
app.post('/api/game/:userId/trigger-event', async (req, res) => {
  try {
    const { userId } = req.params;
    const db = client.db(dbName);
    const gamesCollection = db.collection('games');
    const eventsCollection = db.collection('spaceEvents');
    
    let gameState = await gamesCollection.findOne({ userId: new ObjectId(userId) });
    if (!gameState) {
      gameState = await gamesCollection.findOne({ userId: userId });
    }
    if (!gameState) {
      return res.status(404).json({ error: 'Game state not found' });
    }
    
    // Get all available events
    const availableEvents = await eventsCollection.find({}).toArray();
    
    // Check cooldowns and select a random event
    const now = Date.now();
    const eligibleEvents = availableEvents.filter(event => {
      const lastOccurrence = gameState.lastEventOccurrence?.[event.type] || 0;
      // If lastOccurrence is 0, it means the event has never been triggered
      // So it should be eligible (no cooldown for new events)
      if (lastOccurrence === 0) return true;
      return (now - lastOccurrence) >= event.cooldown;
    });
    
    if (eligibleEvents.length === 0) {
      // Calculate when the next event will be available
      const nextEventTimes = availableEvents.map(e => {
        const lastOccurrence = gameState.lastEventOccurrence?.[e.type] || 0;
        if (lastOccurrence === 0) return 0; // Event never triggered, available now
        return Math.max(0, e.cooldown - (now - lastOccurrence));
      });
      
      const nextEventIn = Math.min(...nextEventTimes.filter(time => time > 0));
      
      return res.json({ 
        message: 'No events available at this time',
        nextEventIn: nextEventIn || 0,
        debug: {
          totalEvents: availableEvents.length,
          eligibleEvents: eligibleEvents.length,
          lastEventOccurrence: gameState.lastEventOccurrence || 'none'
        }
      });
    }
    
    // Select random event based on rarity
    const selectedEvent = selectRandomEvent(eligibleEvents);
    
    // Apply event effects
    const eventStart = new Date();
    const eventEnd = new Date(eventStart.getTime() + selectedEvent.duration);
    
    const activeEvent = {
      type: selectedEvent.type,
      name: selectedEvent.name,
      icon: selectedEvent.icon,
      description: selectedEvent.description,
      effects: selectedEvent.effects,
      startTime: eventStart,
      endTime: eventEnd,
      duration: selectedEvent.duration
    };
    
    // Update game state with active event
    const updateData = {
      activeEvent: activeEvent,
      lastEventOccurrence: {
        ...gameState.lastEventOccurrence,
        [selectedEvent.type]: now
      }
    };
    
    await gamesCollection.updateOne(
      { _id: gameState._id },
      { $set: updateData }
    );
    
    res.json({
      message: 'Space event triggered successfully',
      event: activeEvent
    });
    
  } catch (error) {
    console.error('Trigger event error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Helper function to select random event based on rarity weights.
 * 
 * - Applies weighted selection based on event rarity.
 * - Common events have 50% chance, uncommon 30%, rare 20%.
 * - Uses random number generation for fair selection.
 * 
 * @param {Array} events - Array of eligible events to choose from
 * @returns {Object} Selected event object
 */
function selectRandomEvent(events) {
  const rarityWeights = {
    'common': 0.5,
    'uncommon': 0.3,
    'rare': 0.2
  };
  
  const weightedEvents = events.map(event => ({
    ...event,
    weight: rarityWeights[event.rarity] || 0.1
  }));
  
  const totalWeight = weightedEvents.reduce((sum, event) => sum + event.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const event of weightedEvents) {
    random -= event.weight;
    if (random <= 0) {
      return event;
    }
  }
  
  return weightedEvents[0]; // Fallback
}

/**
 * Get Tests Endpoint (Legacy)
 * 
 * - Keeps existing test endpoint for compatibility.
 * - Returns all documents from tests collection.
 * 
 * Route: GET /api/tests
 */
app.get('/api/tests', async (req, res) => {
  try {
    const db = client.db(dbName);
    const tests = await db.collection('tests').find({}).toArray();
    res.json(tests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Server Startup
 * 
 * - Starts Express server on configured port.
 * - Logs server status and port information.
 */
app.listen(PORT, () => {
  console.log(`🚀 StarStation server running on port ${PORT}`);
});
