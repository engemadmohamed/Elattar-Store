import mongoose from "mongoose";

const mongoUri = process.env.MONGO_URI || "mongodb+srv://emadmohamedemadarefabdelhamid_db_user:lnJ10XdpT97jm6ki@cluster0.dspopxc.mongodb.net/el-attar?appName=Cluster0";

async function clean() {
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB.");

  const db = mongoose.connection.db;
  if (!db) {
    console.error("No DB connection.");
    process.exit(1);
  }

  const res = await db.collection("customers").deleteMany({
    $or: [
      { phone: "01552625158" },
      { phone: "+201552625158" },
      { phone: "201552625158" }
    ]
  });

  console.log(`Deleted ${res.deletedCount} existing test customer records for 01552625158.`);
  await mongoose.disconnect();
}

clean().catch(console.error);
