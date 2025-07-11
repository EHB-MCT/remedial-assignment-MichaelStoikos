// server/app.js
import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: './config.env' });

const app = express();
const PORT = process.env.PORT || 5000;

const url = process.env.MONGODB_URI; // Should include credentials and cluster, but NOT the db name
const dbName = 'Resource-Management-Web'; // Your actual database name
const collectionName = 'tests';

const client = new MongoClient(url);

app.use(cors());
app.use(express.json());

// Get all tests
app.get('/api/tests', async (req, res) => {
  try {
    await client.connect();
    const db = client.db(dbName);
    const tests = await db.collection(collectionName).find({}).toArray();
    res.json(tests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await client.close();
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
