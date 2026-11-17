/**
 * seed_training_log.js
 * Run once to save the last local training results to MongoDB so Vercel can display them.
 * Usage: node seed_training_log.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import TrainingLog from './models/TrainingLog.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://jahanzaibstudy559_db_user:siddiqui789@elite-horizon.ol74uro.mongodb.net/elite-horizon';

const logs = [
  "============================================================",
  "  ELITE HORIZON — Full ML Training Pipeline v2",
  "  XGBoost (Price) + Random Forest (Investment Score)",
  "============================================================",
  "",
  "Data Source: MongoDB (all 7 cities, all property types)",
  "",
  "📂 Homes for Sale",
  "  ✅ MongoDB (Buy | House…): 2010 records fetched",
  "     → 1930 clean rows",
  "",
  "============================================================",
  "  XGBoost: homes_buy_model",
  "============================================================",
  "  Train: 1544 | Test: 386",
  "",
  "  METRICS:",
  "     MAE  : PKR 4,637,919",
  "     RMSE : PKR 18,525,372",
  "     R2   : 0.9388  (93.9%)",
  "",
  "  FEATURE IMPORTANCE:",
  "     area_sqft             : ████████████████████ 0.5022",
  "     price_per_sqft        : █████ 0.1416",
  "     demand_score          : ████ 0.1107",
  "     location_score        : ██ 0.0699",
  "     bedrooms              : ██ 0.0686",
  "     city_encoded          : █ 0.0378",
  "     latitude              : █ 0.0339",
  "     longitude             :  0.0180",
  "     bathrooms             :  0.0175",
  "     ptype_encoded         :  0.0000",
  "",
  "  Saved -> ai-models/models/homes_buy_model.pkl",
  "",
  "📂 Homes for Rent",
  "  ✅ MongoDB (Rent | House…): 1145 records fetched",
  "     → 1099 clean rows",
  "",
  "============================================================",
  "  XGBoost: homes_rent_model",
  "============================================================",
  "  Train: 879 | Test: 220",
  "",
  "  METRICS:",
  "     MAE  : PKR 27,796",
  "     RMSE : PKR 86,441",
  "     R2   : 0.9573  (95.7%)",
  "",
  "  FEATURE IMPORTANCE:",
  "     area_sqft             : ██████████████ 0.3729",
  "     demand_score          : ██████████ 0.2705",
  "     price_per_sqft        : █████ 0.1333",
  "     bedrooms              : ███ 0.0842",
  "     city_encoded          : █ 0.0418",
  "     latitude              : █ 0.0318",
  "     longitude             : █ 0.0286",
  "     bathrooms             : █ 0.0277",
  "     location_score        :  0.0091",
  "     ptype_encoded         :  0.0000",
  "",
  "  Saved -> ai-models/models/homes_rent_model.pkl",
  "",
  "📂 Plots for Sale",
  "  ✅ MongoDB (Buy | Plot…): 1600 records fetched",
  "     → 1534 clean rows",
  "",
  "============================================================",
  "  XGBoost: plots_buy_model",
  "============================================================",
  "  Train: 1227 | Test: 307",
  "",
  "  METRICS:",
  "     MAE  : PKR 3,629,065",
  "     RMSE : PKR 9,257,831",
  "     R2   : 0.9566  (95.7%)",
  "",
  "  FEATURE IMPORTANCE:",
  "     area_sqft             : █████████████████ 0.4271",
  "     price_per_sqft        : ████████████ 0.3142",
  "     demand_score          : ██ 0.0644",
  "     latitude              : ██ 0.0535",
  "     city_encoded          : █ 0.0494",
  "     location_score        : █ 0.0483",
  "     longitude             : █ 0.0431",
  "     ptype_encoded         :  0.0000",
  "",
  "  Saved -> ai-models/models/plots_buy_model.pkl",
  "",
  "📂 Commercial for Sale",
  "  ✅ MongoDB (Buy | Commercial…): 1378 records fetched",
  "     → 1251 clean rows",
  "",
  "============================================================",
  "  XGBoost: commercial_buy_model",
  "============================================================",
  "  Train: 1000 | Test: 251",
  "",
  "  METRICS:",
  "     MAE  : PKR 18,782,215",
  "     RMSE : PKR 62,068,713",
  "     R2   : 0.8932  (89.3%)",
  "",
  "  FEATURE IMPORTANCE:",
  "     area_sqft             : ██████████████████ 0.4555",
  "     price_per_sqft        : █████████ 0.2488",
  "     latitude              : ███ 0.0774",
  "     city_encoded          : ██ 0.0733",
  "     demand_score          : ██ 0.0618",
  "     longitude             : █ 0.0463",
  "     location_score        : █ 0.0370",
  "     ptype_encoded         :  0.0000",
  "",
  "  Saved -> ai-models/models/commercial_buy_model.pkl",
  "",
  "📂 Commercial for Rent",
  "  ✅ MongoDB (Rent | Commercial…): 1241 records fetched",
  "     → 1193 clean rows",
  "",
  "============================================================",
  "  XGBoost: commercial_rent_model",
  "============================================================",
  "  Train: 954 | Test: 239",
  "",
  "  METRICS:",
  "     MAE  : PKR 106,546",
  "     RMSE : PKR 284,357",
  "     R2   : 0.9363  (93.6%)",
  "",
  "  FEATURE IMPORTANCE:",
  "     area_sqft             : ███████████████████ 0.4937",
  "     price_per_sqft        : █████ 0.1414",
  "     demand_score          : ████ 0.1118",
  "     city_encoded          : ██ 0.0787",
  "     latitude              : ██ 0.0632",
  "     longitude             : █ 0.0632",
  "     location_score        : █ 0.0479",
  "     ptype_encoded         :  0.0000",
  "",
  "  Saved -> ai-models/models/commercial_rent_model.pkl",
  "",
  "============================================================",
  "  ✅ All models trained and saved successfully!",
  "  Total training time: ~3 minutes",
  "============================================================",
  "",
  "[Training completed] ✅ Training completed successfully!"
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Remove old logs (keep only last one)
    await TrainingLog.deleteMany({});

    await TrainingLog.create({
      logs,
      status: 'done',
      startedAt: new Date('2026-11-17T08:00:00.000Z'),
      finishedAt: new Date('2026-11-17T08:03:00.000Z'),
    });

    console.log('✅ Training log seeded to MongoDB successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

seed();
