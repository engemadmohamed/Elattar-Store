import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function copyDatabase() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("❌ MONGO_URI environment variable is missing in .env");
    process.exit(1);
  }

  // Derive source URI (el-attar) and target URI (almohandes)
  const sourceUri = uri.replace(/\/[^/?]+(\?|$)/, "/el-attar$1");
  const targetUri = uri.replace(/\/[^/?]+(\?|$)/, "/almohandes$1");

  console.log("⏳ الاتصال بقاعدة البيانات المصدر (el-attar)...");
  const sourceConn = await mongoose.createConnection(sourceUri).asPromise();
  console.log("✅ تم الاتصال بـ (el-attar)");

  console.log("⏳ الاتصال بقاعدة البيانات الجديدة (almohandes)...");
  const targetConn = await mongoose.createConnection(targetUri).asPromise();
  console.log("✅ تم الاتصال بـ (almohandes)");

  const collections = await sourceConn.db.listCollections().toArray();
  console.log(`📋 تم العثور على ${collections.length} جداول في el-attar:`, collections.map((c) => c.name));

  for (const col of collections) {
    const colName = col.name;
    if (colName.startsWith("system.")) continue;

    console.log(`🚀 نقل البيانات في جدول: ${colName}...`);
    const docs = await sourceConn.db.collection(colName).find({}).toArray();

    if (docs.length > 0) {
      await targetConn.db.collection(colName).deleteMany({});
      await targetConn.db.collection(colName).insertMany(docs);
      console.log(`  ✓ تم نقل ${docs.length} عنصر إلى ${colName} بنجاح!`);
    } else {
      console.log(`  ℹ️ الجدول ${colName} فارغ.`);
    }
  }

  console.log("\n🎉 تم بنجاح نقل كافة المنتجات والفئات والبيانات كاملة من el-attar إلى almohandes!");
  await sourceConn.close();
  await targetConn.close();
  process.exit(0);
}

copyDatabase().catch((err) => {
  console.error("❌ حدث خطأ أثناء نقل البيانات:", err);
  process.exit(1);
});
