import "./env.js";

import { connectDB } from "./db.js";
import { Category } from "./models/Category.js";
import { Admin } from "./models/Admin.js";

async function seed() {
  await connectDB();

  // Seed admin — credentials come from .env, never hardcoded or printed
  const adminEmail = (process.env.ADMIN_SEED_EMAIL || "").toLowerCase();
  const adminPassword = process.env.ADMIN_SEED_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.warn(
      "⚠️  ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD not set in .env — skipping admin creation."
    );
  } else {
    const adminExists = await Admin.findOne({ email: adminEmail });
    if (!adminExists) {
      await Admin.create({
        name: "المهندس",
        email: adminEmail,
        password: adminPassword,
        role: "superadmin",
      });
      console.log(`✅ Admin account created (${adminEmail}). Use the password you set in .env to log in.`);
    } else {
      console.log("ℹ️  Admin account already exists, skipping.");
    }
  }

  // Seed categories
  const categoriesData = [
    { name: "Pens & Writing", nameAr: "أقلام وأدوات الكتابة", slug: "pens-writing", icon: "✒️", image: "https://images.pexels.com/photos/164645/pexels-photo-164645.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" },
    { name: "Notebooks & Paper", nameAr: "دفاتر وأوراق", slug: "notebooks-paper", icon: "📓", image: "https://images.pexels.com/photos/7657382/pexels-photo-7657382.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" },
    { name: "Art Supplies", nameAr: "أدوات الرسم والفن", slug: "art-supplies", icon: "🎨", image: "https://images.pexels.com/photos/38807889/pexels-photo-38807889.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" },
    { name: "Office Supplies", nameAr: "مستلزمات المكتب", slug: "office-supplies", icon: "📎", image: "https://images.pexels.com/photos/8251060/pexels-photo-8251060.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" },
    { name: "School Bags", nameAr: "حقائب مدرسية", slug: "school-bags", icon: "🎒", image: "https://images.pexels.com/photos/37580640/pexels-photo-37580640.jpeg?auto=compress&cs=tinysrgb&h=650&w=940" },
    { name: "Calculators", nameAr: "آلات حاسبة", slug: "calculators", icon: "🧮", image: "https://images.pexels.com/photos/5775/calculator-scientific.jpg?auto=compress&cs=tinysrgb&h=650&w=940" },
  ];

  for (const cat of categoriesData) {
    const exists = await Category.findOne({ slug: cat.slug });
    if (!exists) {
      const parent = await Category.create({ ...cat, parentId: null });
      console.log(`✅ Category created: ${cat.name}`);

      // Add subcategories for pens
      if (cat.slug === "pens-writing") {
        const subCategories = [
          { name: "Ballpoint Pens", nameAr: "أقلام حبر جاف", slug: "ballpoint-pens", icon: "🖊️" },
          { name: "Gel Pens", nameAr: "أقلام جيل", slug: "gel-pens", icon: "✏️" },
          { name: "Markers", nameAr: "ماركر وفلوماستر", slug: "markers", icon: "🖍️" },
          { name: "Pencils", nameAr: "أقلام رصاص", slug: "pencils", icon: "✏️" },
        ];
        for (const sub of subCategories) {
          const subExists = await Category.findOne({ slug: sub.slug });
          if (!subExists) {
            await Category.create({ ...sub, parentId: parent._id });
          }
        }
      }
    }
  }

  console.log("✅ Seed complete");
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
