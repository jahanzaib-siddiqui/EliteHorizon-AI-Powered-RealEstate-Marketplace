"""
==========================================================================
  ELITE HORIZON — Full ML Training Pipeline v2
  Models: XGBoost (Price) + Random Forest (Investment Score)
  Data Source: MongoDB (all 7 cities, all property types)
==========================================================================

ALGORITHM COMPARISON (for your presentation):

XGBoost vs Random Forest:
┌──────────────────────┬───────────────────────┬──────────────────────┐
│ Property             │ XGBoost               │ Random Forest        │
├──────────────────────┼───────────────────────┼──────────────────────┤
│ Boosting type        │ Gradient Boosting     │ Bagging              │
│ Trees are trained    │ Sequentially          │ Independently        │
│ Each tree corrects   │ Previous tree errors  │ Random data subsets  │
│ Final prediction     │ Weighted sum of trees │ Average of all trees │
│ Speed                │ Faster (optimized)    │ Parallelizable       │
│ Best for             │ Regression accuracy   │ ROI/score prediction │
└──────────────────────┴───────────────────────┴──────────────────────┘

Price Prediction Formula:
  Final Price = Σ(i=1 to N) γᵢ × Treeᵢ(x)
  where γᵢ = learning_rate (shrinkage), Treeᵢ = i-th gradient-boosted tree

Investment Score Formula:
  RF_Score    = RandomForest.predict(features) → normalized 0-100
  Loc_Bonus   = location_score × 8             → max 40 pts
  Demand      = city_factor × demand_level      → max 20 pts
  Yield_Score = est_yield_pct × 4              → max 20 pts
  IS = clamp(0.4×RF + 0.35×Loc + 0.15×Demand + 0.10×Yield, 0, 100)
==========================================================================
"""

import pandas as pd
import numpy as np
import os, json, joblib, re, warnings
from pymongo import MongoClient
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import MinMaxScaler
from xgboost import XGBRegressor

warnings.filterwarnings('ignore')

MONGO_URI   = "mongodb://127.0.0.1:27017/elite-horizon"
MODELS_DIR  = os.path.join(os.path.dirname(__file__), 'models')
DATA_DIR    = os.path.join(os.path.dirname(__file__), 'data')
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(DATA_DIR,   exist_ok=True)

# ─── City encoding ───────────────────────────────────────────────────────────
CITY_MAP = {
    'lahore': 0, 'islamabad': 1, 'karachi': 2,
    'multan': 3, 'peshawar': 4, 'sialkot': 5, 'faisalabad': 6,
}

CITY_PREMIUM = {
    'islamabad': 1.30, 'lahore': 1.00, 'karachi': 1.20,
    'multan': 0.90, 'peshawar': 0.90, 'sialkot': 0.80, 'faisalabad': 0.88,
}

CITY_CENTROID = {
    'lahore':     (31.5204, 74.3587),
    'islamabad':  (33.6844, 73.0479),
    'karachi':    (24.8607, 67.0011),
    'multan':     (30.1575, 71.5249),
    'peshawar':   (34.0151, 71.5249),
    'sialkot':    (32.4945, 74.5229),
    'faisalabad': (31.4504, 73.1350),
}

# ─── Location score (1-5) per city ───────────────────────────────────────────
LOCATION_ZONES = {
    'lahore':     {'dha': 5, 'gulberg': 4, 'bahria': 4, 'model town': 4, 'garden town': 3, 'johar town': 3, 'cantt': 3, 'valencia': 3, 'wapda town': 2, 'iqbal town': 2},
    'islamabad':  {'f-6': 5, 'f-7': 5, 'e-7': 5, 'f-8': 4, 'f-10': 4, 'f-11': 4, 'e-11': 4, 'blue area': 5, 'dha': 4, 'g-10': 3, 'g-11': 3, 'i-8': 3},
    'karachi':    {'dha': 5, 'clifton': 5, 'pechs': 4, 'gulshan': 3, 'north nazimabad': 3, 'bahria': 4, 'defence': 5, 'korangi': 2},
    'multan':     {'dha': 5, 'cantt': 4, 'gulgasht': 3, 'wapda town': 3, 'model town': 3, 'bahria': 4, 'bosan': 2},
    'peshawar':   {'hayatabad': 5, 'cantt': 4, 'university town': 4, 'bahria': 4, 'askari': 3, 'gulbahar': 2},
    'sialkot':    {'cantt': 4, 'iqbal town': 3, 'satellite town': 3, 'gulshan': 2, 'paris road': 3},
    'faisalabad': {'gulberg': 4, 'dha': 5, 'canal road': 4, 'madina town': 3, 'peoples colony': 3, 'jinnah town': 3},
}

PTYPE_MAP = {
    'house': 0, 'flat': 1, 'upper portion': 2, 'lower portion': 3, 'farm house': 4,
    'room': 5, 'penthouse': 6,
    'residential plot': 0, 'commercial plot': 1, 'plot': 0, 'agricultural land': 2,
    'industrial land': 3, 'plot file': 4,
    'commercial': 0, 'office': 1, 'shop': 2, 'building': 3, 'factory': 4,
    'warehouse': 5, 'other': 6,
}

def get_location_score(location, city):
    if not location:
        return 2
    loc  = str(location).lower()
    city_l = str(city).lower()
    zones  = LOCATION_ZONES.get(city_l, {})
    for k, v in zones.items():
        if k in loc:
            return v
    return 2

# ─── Parse area string → sqft ─────────────────────────────────────────────────
def parse_area_sqft(val):
    try:
        val = str(val).lower().strip()
        # Extract leading number
        m = re.match(r'[\d.]+', val)
        if not m:
            return np.nan
        num = float(m.group())
        if 'kanal' in val:
            return num * 5445.0
        if 'sq. ft' in val or 'sqft' in val or 'sq ft' in val:
            return num
        if 'sq. yd' in val or 'sqyd' in val or 'sq yd' in val:
            return num * 9.0
        # Default: marla
        return num * 272.25
    except Exception:
        return np.nan

# ─── Load from MongoDB ────────────────────────────────────────────────────────
def load_from_mongo(purpose, type_keywords):
    """Fetch properties from MongoDB, clean + feature-engineer, return DataFrame."""
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=8000)
    db     = client['elite-horizon']

    # Build regex for type matching (case-insensitive contains)
    type_regex_list = [{'type': {'$regex': kw, '$options': 'i'}} for kw in type_keywords]
    query = {
        'purpose': purpose,
        '$or': type_regex_list,
    }
    if purpose == 'Buy':
        query['price'] = {'$gt': 100000}
    else:
        query['rentPrice'] = {'$gt': 1000}

    projection = {
        'price': 1, 'rentPrice': 1, 'area': 1,
        'bedrooms': 1, 'bathrooms': 1,
        'city': 1, 'location': 1, 'type': 1,
        'lat': 1, 'lng': 1, '_id': 0,
    }

    docs = list(db.properties.find(query, projection))
    client.close()

    if not docs:
        print(f"  ⚠️  No data for purpose={purpose}, types={type_keywords}")
        return None

    print(f"  ✅ MongoDB ({purpose} | {type_keywords[0]}…): {len(docs)} records fetched")

    df = pd.DataFrame(docs)
    df.rename(columns={'lat': 'latitude', 'lng': 'longitude', 'type': 'property_type'}, inplace=True)

    # Use the right price field
    if purpose == 'Rent':
        df['price'] = pd.to_numeric(df.get('rentPrice', df.get('price', 0)), errors='coerce')
    else:
        df['price'] = pd.to_numeric(df.get('price', 0), errors='coerce')

    return _clean(df)

def _clean(data):
    if data is None or data.empty:
        return None

    for col in ['price', 'bedrooms', 'bathrooms', 'latitude', 'longitude']:
        if col in data.columns:
            data[col] = pd.to_numeric(data[col], errors='coerce')

    data = data.dropna(subset=['price'])
    data = data[data['price'] > 0]

    # Parse area
    data['area_sqft'] = data['area'].apply(parse_area_sqft)
    data = data.dropna(subset=['area_sqft'])
    data = data[data['area_sqft'] > 10]

    # Fill optional numeric cols
    for col in ['bedrooms', 'bathrooms']:
        if col in data.columns:
            med = data[col].median()
            data[col] = data[col].fillna(med if not np.isnan(med) else 2)
        else:
            data[col] = 2.0

    data['city'] = data.get('city', 'Lahore').fillna('Lahore')

    # Encodings
    data['city_lower']     = data['city'].str.lower()
    data['location_score'] = data.apply(lambda r: get_location_score(r.get('location', ''), r.get('city', '')), axis=1)
    data['city_encoded']   = data['city_lower'].map(CITY_MAP).fillna(0).astype(int)
    data['ptype_encoded']  = data.get('property_type', pd.Series(['house'] * len(data))).str.lower().map(PTYPE_MAP).fillna(0).astype(int)

    # Demand score
    city_prem = data['city_lower'].map(CITY_PREMIUM).fillna(1.0)
    data['demand_score'] = data['location_score'] * city_prem

    # Price per sqft
    data['price_per_sqft'] = data['price'] / data['area_sqft'].replace(0, np.nan)

    # Lat/lng fallback
    if 'latitude' in data.columns:
        for city_name, (clat, clng) in CITY_CENTROID.items():
            mask = data['city_lower'] == city_name
            data.loc[mask & data['latitude'].isna(), 'latitude']  = clat
            data.loc[mask & data['longitude'].isna(), 'longitude'] = clng
        data['latitude']  = data['latitude'].fillna(31.5204)
        data['longitude'] = data['longitude'].fillna(74.3587)
    else:
        data['latitude']  = 31.5204
        data['longitude'] = 74.3587

    # Remove price outliers (clip to 2nd–98th percentile)
    lo, hi = data['price'].quantile(0.02), data['price'].quantile(0.98)
    data = data[(data['price'] >= lo) & (data['price'] <= hi)]
    data = data.dropna(subset=['price_per_sqft'])
    data = data[data['area_sqft'] < 500000]

    print(f"     → {len(data)} clean rows")
    return data.reset_index(drop=True)

# ─── Train XGBoost ───────────────────────────────────────────────────────────
def train_xgboost(data, features, model_name):
    print(f"\n{'='*60}\n  XGBoost: {model_name}\n{'='*60}")
    X = data[features].fillna(0)
    y = data['price']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42)
    print(f"  Train: {len(X_train)} | Test: {len(X_test)}")

    model = XGBRegressor(
        n_estimators=500, max_depth=6, learning_rate=0.04,
        subsample=0.8, colsample_bytree=0.8,
        reg_alpha=0.1, reg_lambda=1.5,
        min_child_weight=3, gamma=0.1,
        random_state=42, n_jobs=-1, verbosity=0,
    )
    model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)

    y_pred = model.predict(X_test)
    mae    = mean_absolute_error(y_test, y_pred)
    rmse   = np.sqrt(mean_squared_error(y_test, y_pred))
    r2     = r2_score(y_test, y_pred)

    print(f"\n  METRICS:")
    print(f"     MAE  : PKR {mae:,.0f}")
    print(f"     RMSE : PKR {rmse:,.0f}")
    print(f"     R2   : {r2:.4f}  ({r2*100:.1f}%)")

    fi = dict(zip(features, model.feature_importances_))
    print(f"\n  FEATURE IMPORTANCE:")
    for feat, imp in sorted(fi.items(), key=lambda x: -x[1]):
        bar = chr(9608) * int(imp * 40)
        print(f"     {feat:22s}: {bar} {imp:.4f}")

    path = os.path.join(MODELS_DIR, f'{model_name}.pkl')
    joblib.dump(model, path)
    print(f"\n  Saved -> {path}")

    meta = {
        'model_name': model_name, 'algorithm': 'XGBoost',
        'features': features, 'mae': float(mae), 'rmse': float(rmse), 'r2': float(r2),
        'feature_importances': {k: float(v) for k, v in fi.items()},
        'train_samples': int(len(X_train)), 'test_samples': int(len(X_test)),
        'y_mean': float(y.mean()), 'y_std': float(y.std()),
        'cities': list(data['city'].value_counts().to_dict().keys())[:10],
        'formula': 'Final Prediction = Sum(gamma_i * Tree_i(x)) for i=1..N_estimators',
    }
    json.dump(meta, open(os.path.join(MODELS_DIR, f'{model_name}_meta.json'), 'w'), indent=2)
    return model, meta

# ─── Train Random Forest (Investment Score) ──────────────────────────────────
def train_investment_score_model(all_data):
    print(f"\n{'='*60}\n  Random Forest: investment_score_model\n{'='*60}")

    features = ['area_sqft', 'bedrooms', 'bathrooms', 'city_encoded',
                'location_score', 'price_per_sqft', 'demand_score', 'latitude', 'longitude']
    feats = [f for f in features if f in all_data.columns]

    X = all_data[feats].fillna(0)
    y = all_data['price']

    # Normalize to 0-100 score
    scaler = MinMaxScaler(feature_range=(0, 100))
    y_norm = scaler.fit_transform(y.values.reshape(-1, 1)).ravel()

    X_train, X_test, y_train, y_test = train_test_split(X, y_norm, test_size=0.20, random_state=42)
    print(f"  Train: {len(X_train)} | Test: {len(X_test)}")

    model = RandomForestRegressor(
        n_estimators=200, max_depth=8, min_samples_leaf=5,
        n_jobs=-1, random_state=42,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    mae    = mean_absolute_error(y_test, y_pred)
    r2     = r2_score(y_test, y_pred)
    print(f"  MAE  : {mae:.2f} score pts")
    print(f"  R2   : {r2:.4f}  ({r2*100:.1f}%)")

    joblib.dump(model,  os.path.join(MODELS_DIR, 'investment_score_model.pkl'))
    joblib.dump(scaler, os.path.join(MODELS_DIR, 'investment_score_scaler.pkl'))

    meta = {
        'model_name': 'investment_score_model', 'algorithm': 'Random Forest',
        'features': feats, 'mae': float(mae), 'r2': float(r2),
        'train_samples': int(len(X_train)), 'test_samples': int(len(X_test)),
        'formula': 'IS = 0.4*RF + 0.35*Loc + 0.15*Demand + 0.10*Yield  (clamped 0-100)',
    }
    json.dump(meta, open(os.path.join(MODELS_DIR, 'investment_score_model_meta.json'), 'w'), indent=2)
    return model, meta, feats

# ─── Export Heatmap Data ──────────────────────────────────────────────────────
def export_heatmap_data(all_data, xgb_model, features):
    print(f"\n{'='*60}\n  Exporting Heatmap Data\n{'='*60}")

    CITY_BOUNDS = {
        'lahore':     {'lat': [31.35, 31.65], 'lng': [74.20, 74.55], 'steps': 18},
        'islamabad':  {'lat': [33.60, 33.78], 'lng': [72.95, 73.22], 'steps': 18},
        'karachi':    {'lat': [24.75, 24.97], 'lng': [66.88, 67.18], 'steps': 18},
        'multan':     {'lat': [30.10, 30.25], 'lng': [71.42, 71.62], 'steps': 18},
        'peshawar':   {'lat': [33.95, 34.10], 'lng': [71.44, 71.62], 'steps': 18},
        'sialkot':    {'lat': [32.44, 32.55], 'lng': [74.48, 74.58], 'steps': 18},
        'faisalabad': {'lat': [31.38, 31.52], 'lng': [73.06, 73.21], 'steps': 18},
    }

    # Load existing to preserve any old city data
    heatmap_path = os.path.join(DATA_DIR, 'heatmap_data.json')
    heatmap_out  = {}
    if os.path.exists(heatmap_path):
        try:
            heatmap_out = json.load(open(heatmap_path))
        except Exception:
            pass

    for city_name, bounds in CITY_BOUNDS.items():
        city_data = all_data[all_data['city_lower'] == city_name].copy()
        if len(city_data) < 5:
            print(f"  {city_name}: insufficient data, skipping")
            continue

        city_data = city_data.dropna(subset=['latitude', 'longitude', 'price'])

        # Real property points
        real_pts = []
        for _, row in city_data.iterrows():
            real_pts.append({
                'lat':      round(float(row['latitude']), 6),
                'lng':      round(float(row['longitude']), 6),
                'price':    int(row['price']),
                'area':     float(row.get('area_sqft', 0)),
                'type':     str(row.get('property_type', '')),
                'location': str(row.get('location', ''))[:60],
            })

        # Grid predictions
        lats = np.linspace(bounds['lat'][0], bounds['lat'][1], bounds['steps'])
        lngs = np.linspace(bounds['lng'][0], bounds['lng'][1], bounds['steps'])

        city_med     = city_data['area_sqft'].median()
        city_enc     = CITY_MAP.get(city_name, 0)
        city_avg_pps = city_data['price_per_sqft'].median()

        grid_pts = []
        for lat in lats:
            for lng in lngs:
                loc_score = 3
                demand    = loc_score * CITY_PREMIUM.get(city_name, 1.0)
                feat_vals = {
                    'area_sqft': city_med, 'bedrooms': 4, 'bathrooms': 3,
                    'city_encoded': city_enc, 'ptype_encoded': 0,
                    'location_score': loc_score, 'price_per_sqft': city_avg_pps,
                    'demand_score': demand, 'latitude': lat, 'longitude': lng,
                }
                vec  = np.array([[feat_vals.get(f, 0) for f in features]])
                pred = float(xgb_model.predict(vec)[0])
                grid_pts.append({'lat': round(lat, 5), 'lng': round(lng, 5), 'price': max(int(pred), 0)})

        # Normalize intensity
        prices = [p['price'] for p in grid_pts]
        p_min, p_max = min(prices), max(prices)
        for p in grid_pts:
            p['intensity'] = round((p['price'] - p_min) / max(p_max - p_min, 1), 3)

        rprice = [r['price'] for r in real_pts]
        rp_min, rp_max = (min(rprice), max(rprice)) if rprice else (0, 1)
        for r in real_pts:
            r['intensity'] = round((r['price'] - rp_min) / max(rp_max - rp_min, 1), 3)

        heatmap_out[city_name] = {
            'grid':        grid_pts,
            'points':      real_pts[:500],
            'bounds':      bounds,
            'count':       len(real_pts),
            'price_range': {'min': int(rp_min), 'max': int(rp_max)},
        }
        print(f"     {city_name}: {len(grid_pts)} grid pts + {min(len(real_pts), 500)} real pts")

    json.dump(heatmap_out, open(heatmap_path, 'w'), separators=(',', ':'))
    print(f"\n  Heatmap data saved -> {heatmap_path}")
    return heatmap_out

# ─── MAIN ────────────────────────────────────────────────────────────────────
def main():
    print("\n" + "="*60)
    print("  ELITE HORIZON — Full ML Training Pipeline v2")
    print("  XGBoost (Price) + Random Forest (Investment Score)")
    print("="*60)
    print("\nData Source: MongoDB (all 7 cities, all property types)")

    FEAT_HOMES      = ['area_sqft', 'bedrooms', 'bathrooms', 'city_encoded', 'ptype_encoded',
                       'location_score', 'price_per_sqft', 'demand_score', 'latitude', 'longitude']
    FEAT_PLOTS      = ['area_sqft', 'city_encoded', 'ptype_encoded',
                       'location_score', 'price_per_sqft', 'demand_score', 'latitude', 'longitude']
    FEAT_COMMERCIAL = ['area_sqft', 'city_encoded', 'ptype_encoded',
                       'location_score', 'price_per_sqft', 'demand_score', 'latitude', 'longitude']

    all_meta = {}
    dfs      = []

    # ── Model 1: Homes Buy ──────────────────────────────────────────────────
    print("\n📂 Homes for Sale")
    d = load_from_mongo('Buy', ['House', 'Flat', 'Upper Portion', 'Lower Portion',
                                'Farm House', 'Room', 'Penthouse'])
    if d is not None and len(d) > 20:
        feats = [f for f in FEAT_HOMES if f in d.columns]
        _, meta = train_xgboost(d, feats, 'homes_buy_model')
        all_meta['homes_buy'] = meta
        dfs.append(d)
    else:
        print("  Skipped: insufficient data")

    # ── Model 2: Homes Rent ─────────────────────────────────────────────────
    print("\n📂 Homes for Rent")
    d = load_from_mongo('Rent', ['House', 'Flat', 'Upper Portion', 'Lower Portion',
                                  'Farm House', 'Room', 'Penthouse'])
    if d is not None and len(d) > 20:
        feats = [f for f in FEAT_HOMES if f in d.columns]
        _, meta = train_xgboost(d, feats, 'homes_rent_model')
        all_meta['homes_rent'] = meta
        dfs.append(d)
    else:
        print("  Skipped: insufficient data")

    # ── Model 3: Plots Buy ──────────────────────────────────────────────────
    print("\n📂 Plots for Sale")
    d = load_from_mongo('Buy', ['Plot', 'Residential Plot', 'Commercial Plot',
                                 'Agricultural Land', 'Industrial Land', 'Plot File'])
    if d is not None and len(d) > 20:
        feats = [f for f in FEAT_PLOTS if f in d.columns]
        _, meta = train_xgboost(d, feats, 'plots_buy_model')
        all_meta['plots_buy'] = meta
        dfs.append(d)
    else:
        print("  Skipped: insufficient data")

    # ── Model 4: Commercial Buy ─────────────────────────────────────────────
    print("\n📂 Commercial for Sale")
    d = load_from_mongo('Buy', ['Commercial', 'Office', 'Shop', 'Building',
                                 'Factory', 'Warehouse'])
    if d is not None and len(d) > 20:
        feats = [f for f in FEAT_COMMERCIAL if f in d.columns]
        _, meta = train_xgboost(d, feats, 'commercial_buy_model')
        all_meta['commercial_buy'] = meta
        dfs.append(d)
    else:
        print("  Skipped: insufficient data")

    # ── Model 5: Commercial Rent ────────────────────────────────────────────
    print("\n📂 Commercial for Rent")
    d = load_from_mongo('Rent', ['Commercial', 'Office', 'Shop', 'Building',
                                  'Factory', 'Warehouse'])
    if d is not None and len(d) > 20:
        feats = [f for f in FEAT_COMMERCIAL if f in d.columns]
        _, meta = train_xgboost(d, feats, 'commercial_rent_model')
        all_meta['commercial_rent'] = meta
        dfs.append(d)
    else:
        print("  Skipped: insufficient data")

    # ── All data combined ───────────────────────────────────────────────────
    ALL_DATA = pd.concat(dfs, ignore_index=True) if dfs else pd.DataFrame()
    print(f"\n📦 TOTAL CLEAN DATA: {len(ALL_DATA)} rows across {ALL_DATA['city'].nunique() if not ALL_DATA.empty else 0} cities")

    if not ALL_DATA.empty:
        city_counts = ALL_DATA['city'].value_counts().to_dict()
        for city, count in city_counts.items():
            print(f"     {city}: {count} rows")

    # ── Model 6: Investment Score (Random Forest) ───────────────────────────
    if len(ALL_DATA) > 50:
        print("\n📂 Investment Score Model")
        _, rf_meta, rf_feats = train_investment_score_model(ALL_DATA)
        all_meta['investment_score'] = rf_meta

        # ── Export Heatmap Data ─────────────────────────────────────────────
        homes_model_path = os.path.join(MODELS_DIR, 'homes_buy_model.pkl')
        if os.path.exists(homes_model_path):
            homes_model = joblib.load(homes_model_path)
            homes_meta  = json.load(open(os.path.join(MODELS_DIR, 'homes_buy_model_meta.json')))
            export_heatmap_data(ALL_DATA, homes_model, homes_meta['features'])
    else:
        print("\nSkipping Investment Score and Heatmap — not enough combined data")

    # ── Save combined meta ──────────────────────────────────────────────────
    json.dump(all_meta, open(os.path.join(MODELS_DIR, 'all_models_meta.json'), 'w'), indent=2)

    print("\n" + "="*60)
    print("  TRAINING COMPLETE — SUMMARY")
    print("="*60)
    for k, m in all_meta.items():
        alg = m.get('algorithm', 'XGBoost')
        r2  = m.get('r2', 0)
        mae = m.get('mae', 0)
        n   = m.get('train_samples', 0)
        cities = m.get('cities', [])
        print(f"\n  [{k}] ({alg})")
        print(f"    R2  = {r2:.4f}  ({r2*100:.1f}%)")
        print(f"    MAE = PKR {mae:,.0f}")
        print(f"    Trained on {n} samples")
        if cities:
            print(f"    Cities: {', '.join(cities[:5])}")

    print("\n  Start Flask API: python3 predict_api.py")
    print("="*60)

if __name__ == '__main__':
    main()
