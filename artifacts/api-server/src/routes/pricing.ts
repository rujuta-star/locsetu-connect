import { Router } from "express";
import { db, servicePricingTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const DEFAULT_PRICING = [
  { skill: "electrician", serviceName: "Fan Repair", serviceNameHi: "पंखा मरम्मत", serviceNameMr: "पंखा दुरुस्ती", minPrice: 100, avgPrice: 175, maxPrice: 250, unit: "per visit" },
  { skill: "electrician", serviceName: "House Wiring", serviceNameHi: "घर की वायरिंग", serviceNameMr: "घरातील वायरिंग", minPrice: 500, avgPrice: 2750, maxPrice: 5000, unit: "per room" },
  { skill: "electrician", serviceName: "Switch/Socket Repair", serviceNameHi: "स्विच/सॉकेट मरम्मत", serviceNameMr: "स्विच/सॉकेट दुरुस्ती", minPrice: 80, avgPrice: 140, maxPrice: 200, unit: "per unit" },
  { skill: "electrician", serviceName: "MCB/Fuse Replacement", serviceNameHi: "MCB/फ्यूज बदलना", serviceNameMr: "MCB/फ्यूज बदलणे", minPrice: 150, avgPrice: 250, maxPrice: 400, unit: "per unit" },
  { skill: "plumber", serviceName: "Tap Repair", serviceNameHi: "नल मरम्मत", serviceNameMr: "नळ दुरुस्ती", minPrice: 150, avgPrice: 225, maxPrice: 300, unit: "per tap" },
  { skill: "plumber", serviceName: "Pipe Leakage Fix", serviceNameHi: "पाइप लीकेज ठीक", serviceNameMr: "पाईप गळती दुरुस्ती", minPrice: 200, avgPrice: 400, maxPrice: 800, unit: "per point" },
  { skill: "plumber", serviceName: "Toilet Repair", serviceNameHi: "टॉयलेट मरम्मत", serviceNameMr: "टॉयलेट दुरुस्ती", minPrice: 250, avgPrice: 450, maxPrice: 700, unit: "per visit" },
  { skill: "plumber", serviceName: "Water Pump Installation", serviceNameHi: "वॉटर पंप इंस्टॉलेशन", serviceNameMr: "वॉटर पंप इन्स्टॉलेशन", minPrice: 500, avgPrice: 1000, maxPrice: 2000, unit: "per unit" },
  { skill: "carpenter", serviceName: "Door/Window Repair", serviceNameHi: "दरवाज़ा/खिड़की मरम्मत", serviceNameMr: "दरवाजा/खिडकी दुरुस्ती", minPrice: 200, avgPrice: 450, maxPrice: 800, unit: "per item" },
  { skill: "carpenter", serviceName: "Furniture Polish", serviceNameHi: "फर्नीचर पॉलिश", serviceNameMr: "फर्निचर पॉलिश", minPrice: 300, avgPrice: 600, maxPrice: 1200, unit: "per piece" },
  { skill: "carpenter", serviceName: "Bed Assembly", serviceNameHi: "बेड असेंबली", serviceNameMr: "बेड असेंब्ली", minPrice: 300, avgPrice: 500, maxPrice: 800, unit: "per piece" },
  { skill: "painter", serviceName: "Room Painting", serviceNameHi: "कमरे की पेंटिंग", serviceNameMr: "खोली रंगकाम", minPrice: 800, avgPrice: 2000, maxPrice: 5000, unit: "per room" },
  { skill: "painter", serviceName: "Wall Putty", serviceNameHi: "वॉल पुट्टी", serviceNameMr: "वॉल पुट्टी", minPrice: 10, avgPrice: 18, maxPrice: 30, unit: "per sq ft" },
  { skill: "mechanic", serviceName: "Bike Service", serviceNameHi: "बाइक सर्विस", serviceNameMr: "बाईक सर्व्हिस", minPrice: 300, avgPrice: 600, maxPrice: 1200, unit: "per service" },
  { skill: "mechanic", serviceName: "Car Service", serviceNameHi: "कार सर्विस", serviceNameMr: "कार सर्व्हिस", minPrice: 800, avgPrice: 2000, maxPrice: 5000, unit: "per service" },
  { skill: "mechanic", serviceName: "Oil Change", serviceNameHi: "तेल बदलना", serviceNameMr: "तेल बदलणे", minPrice: 200, avgPrice: 400, maxPrice: 800, unit: "per visit" },
  { skill: "tailor", serviceName: "Shirt Stitching", serviceNameHi: "शर्ट सिलाई", serviceNameMr: "शर्ट शिवणे", minPrice: 200, avgPrice: 350, maxPrice: 600, unit: "per piece" },
  { skill: "tailor", serviceName: "Alteration", serviceNameHi: "बदलाव", serviceNameMr: "बदल", minPrice: 50, avgPrice: 150, maxPrice: 300, unit: "per piece" },
  { skill: "maid", serviceName: "House Cleaning", serviceNameHi: "घर की सफाई", serviceNameMr: "घर साफसफाई", minPrice: 300, avgPrice: 600, maxPrice: 1200, unit: "per visit" },
  { skill: "maid", serviceName: "Utensil Washing", serviceNameHi: "बर्तन धोना", serviceNameMr: "भांडी घासणे", minPrice: 500, avgPrice: 1000, maxPrice: 2000, unit: "per month" },
  { skill: "tutor", serviceName: "Home Tuition (1 student)", serviceNameHi: "होम ट्यूशन (1 छात्र)", serviceNameMr: "होम ट्यूशन (1 विद्यार्थी)", minPrice: 1500, avgPrice: 3000, maxPrice: 8000, unit: "per month" },
  { skill: "tutor", serviceName: "Group Tuition", serviceNameHi: "ग्रुप ट्यूशन", serviceNameMr: "ग्रुप ट्यूशन", minPrice: 500, avgPrice: 1200, maxPrice: 3000, unit: "per month" },
];

router.get("/pricing", async (req, res): Promise<void> => {
  const { skill } = req.query as Record<string, string>;

  // Ensure seed data is available
  const existing = await db.select().from(servicePricingTable).limit(1);
  if (existing.length === 0) {
    await db.insert(servicePricingTable).values(DEFAULT_PRICING);
  }

  let query = db.select().from(servicePricingTable).$dynamic();
  if (skill) {
    query = query.where(eq(servicePricingTable.skill, skill));
  }

  const pricing = await query;
  res.json(pricing);
});

export default router;
