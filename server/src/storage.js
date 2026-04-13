import { MongoClient } from "mongodb";

const connectionString = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DB_NAME || "anonymous_repo_browser";
const collectionName = process.env.MONGODB_COLLECTION_NAME || "shared_snapshots";

let clientPromise;

function getClient() {
  if (!connectionString) {
    throw new Error("MONGODB_URI is not configured.");
  }

  if (!clientPromise) {
    const client = new MongoClient(connectionString);
    clientPromise = client.connect();
  }

  return clientPromise;
}

async function getCollection() {
  const client = await getClient();
  return client.db(databaseName).collection(collectionName);
}

async function saveSnapshot(id, snapshot) {
  const collection = await getCollection();
  await collection.updateOne(
    { _id: id },
    {
      $set: {
        ...snapshot,
        updatedAt: new Date().toISOString()
      }
    },
    { upsert: true }
  );
}

async function readSnapshot(id) {
  const collection = await getCollection();
  const snapshot = await collection.findOne({ _id: id });

  if (!snapshot) {
    throw new Error("Snapshot not found.");
  }

  return {
    ...snapshot,
    shareId: snapshot.shareId || snapshot._id
  };
}

async function isStorageConfigured() {
  return Boolean(connectionString);
}

export { isStorageConfigured, readSnapshot, saveSnapshot };
