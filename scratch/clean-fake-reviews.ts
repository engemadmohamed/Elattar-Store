import mongoose from "mongoose";

const mongoUri = process.env.MONGO_URI || "mongodb+srv://emadmohamedemadarefabdelhamid_db_user:lnJ10XdpT97jm6ki@cluster0.dspopxc.mongodb.net/el-attar?appName=Cluster0";

async function cleanFakeReviews() {
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB.");
  const db = mongoose.connection.db!;

  // Delete all seeded/fake reviews that have no real customerId (ObjectId pointing to a real customer)
  // The seeded reviews have random ObjectIds as customerId that don't correspond to real customers
  const customers = await db.collection("customers").find({}).project({ _id: 1 }).toArray();
  const realCustomerIds = customers.map(c => c._id);
  
  console.log(`Found ${realCustomerIds.length} real customers in DB.`);

  // Delete reviews whose customerId is NOT in the real customers list
  const result = await db.collection("reviews").deleteMany({
    $or: [
      { customerId: { $nin: realCustomerIds } },
      { customerId: null },
      { customerId: { $exists: false } }
    ]
  });

  console.log(`Deleted ${result.deletedCount} fake/seeded reviews.`);

  // Show remaining real reviews
  const remaining = await db.collection("reviews").find({}).toArray();
  console.log(`Remaining real reviews: ${remaining.length}`);
  remaining.forEach(r => {
    console.log(`  - "${r.customerName}" rated ${r.rating}★: "${r.comment?.substring(0, 50)}..."`);
  });

  await mongoose.disconnect();
}

cleanFakeReviews().catch(console.error);
