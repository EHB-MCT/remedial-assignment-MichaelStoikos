// init-events.js - Script to initialize space events in the database
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: './config.env' });

const url = process.env.MONGODB_URI;
const dbName = 'Resource-Management-Web';

async function initEvents() {
  const client = new MongoClient(url);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(dbName);
    const eventsCollection = db.collection('spaceEvents');
    
    // Clear existing events
    await eventsCollection.deleteMany({});
    console.log('🗑️ Cleared existing events');
    
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
    console.log(`✅ Successfully initialized ${result.insertedCount} space events`);
    
    // Display the events that were created
    console.log('\n📋 Space Events Created:');
    eventTypes.forEach(event => {
      console.log(`  ${event.icon} ${event.name} (${event.rarity})`);
    });
    
  } catch (error) {
    console.error('❌ Error initializing events:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the initialization
initEvents(); 