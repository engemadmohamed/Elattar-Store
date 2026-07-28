// Drops every collection in the connected database.
// Use this once, when pointing the app at a Mongo URI that has old/unrelated
// data in it (e.g. from a previous project), before running `npm run seed`.
//
// Usage:  npm run db:reset

import "./env.js";

import mongoose, { connectDB } from "./db.js";

async function resetDb() {
  await connectDB();
  const db = mongoose.connection.db;
  if (!db) throw new Error("No database connection");

  const collections = await db.listCollections().toArray();
  if (collections.length === 0) {
    console.log("ℹ️  Database is already empty.");
  }
  for (const { name } of collections) {
    await db.dropCollection(name);
    console.log(`🗑️  Dropped collection: ${name}`);
  }

  console.log("✅ Database reset complete. Run `npm run seed` next to add El Attar's categories and admin account.");
  process.exit(0);
}

resetDb().catch((e) => {
  console.error(e);
  process.exit(1);
});
