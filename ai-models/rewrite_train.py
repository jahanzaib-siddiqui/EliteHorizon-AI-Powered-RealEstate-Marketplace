import re
with open('train.py', 'r') as f:
    content = f.read()

# 1. Add pymongo import
content = content.replace("from xgboost import XGBRegressor", "from xgboost import XGBRegressor\nfrom pymongo import MongoClient")

# 2. Add load_from_mongo and clean_data functions to replace load_and_clean
mongo_func = """
# ─── Load from MongoDB ───────────────────────────────────────────────────────
MONGO_URI = "mongodb://127.0.0.1:27017/elite-horizon"

def load_from_mongo(purpose, prop_types):
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    db = client["elite-horizon"]
    
    query = {"purpose": purpose, "type": {"$in": prop_types}}
    projection = {"price":1, "rentPrice":1, "area":1, "bedrooms":1, "bathrooms":1, 
                  "city":1, "location":1, "type":1, "lat":1, "lng":1, "_id":0}
                  
    docs = list(db.properties.find(query, projection))
    if not docs: return None
    
    print(f"  ✅ MongoDB ({purpose} - {prop_types}): {len(docs)} rows fetched")
    df = pd.DataFrame(docs)
    df.rename(columns={"type": "property_type", "lat": "latitude", "lng": "longitude"}, inplace=True)
    if purpose == "Rent":
        df["price"] = df["rentPrice"]
    return clean_data(df)

def clean_data(data):
    if data is None or data.empty: return None
    print(f"  📦 Processing: {len(data)} rows")

    for col in ['price','area','bedrooms','bathrooms','latitude','longitude']:
        if col in data.columns:
            data[col] = pd.to_numeric(data[col], errors='coerce')

    data.dropna(subset=['price','area'], inplace=True)
    
    # Area mapping (MongoDB has strings like '5 Marla')
    def parse_area(val):
        try:
            val = str(val).lower().strip()
            num = float(''.join([c for c in val if c.isdigit() or c=='.']))
            if 'kanal' in val: return num * 5445.0
            if 'sq. ft' in val or 'sqft' in val: return num
            if 'sq. yd' in val or 'sqyd' in val: return num * 9.0
            return num * 272.25  # default to marla
        except: return np.nan
        
    data['area_sqft'] = data['area'].apply(parse_area)
    
    data['bedrooms']       = data.get('bedrooms', pd.Series([2]*len(data))).fillna(2)
    data['bathrooms']      = data.get('bathrooms', pd.Series([1]*len(data))).fillna(1)
    data['city']           = data['city'].fillna('Lahore')
    data['location_score'] = data.apply(lambda r: get_location_score(r.get('location',''), r.get('city','')), axis=1)
    
    CITY_MAP = {'lahore':0,'islamabad':1,'karachi':2,'multan':3,'peshawar':4,'sialkot':5,'faisalabad':6}
    data['city_encoded']   = data['city'].str.lower().map(CITY_MAP).fillna(0).astype(int)
    data['ptype_encoded']  = data.get('property_type', pd.Series(['house']*len(data))).str.lower().map(PTYPE_MAP).fillna(0).astype(int)

    data['price_per_sqft'] = data['price'] / data['area_sqft'].replace(0, np.nan)

    # City demand premiums for score
    CITY_PREMIUM = {'islamabad': 1.3, 'lahore': 1.0, 'karachi': 1.2, 'multan': 0.9, 'peshawar': 0.9, 'sialkot': 0.8, 'faisalabad': 0.9}
    city_premium = data['city'].str.lower().map(CITY_PREMIUM).fillna(1.0)
    data['demand_score'] = data['location_score'] * city_premium

    # Fallback coordinates
    CITY_CENTROID = {'lahore': (31.5204, 74.3587), 'islamabad': (33.6844, 73.0479), 'karachi': (24.86, 67.0), 'multan': (30.15, 71.52), 'peshawar': (34.0, 71.5), 'sialkot': (32.49, 74.52), 'faisalabad': (31.45, 73.13)}
    if 'latitude' in data.columns:
        for city_name, (clat, clng) in CITY_CENTROID.items():
            mask = data['city'].str.lower() == city_name
            data.loc[mask & data['latitude'].isna(), 'latitude'] = clat
            data.loc[mask & data['longitude'].isna(), 'longitude'] = clng
        data['latitude']  = data['latitude'].fillna(31.5204)
        data['longitude'] = data['longitude'].fillna(74.3587)
    else:
        data['latitude']  = 31.5204
        data['longitude'] = 74.3587

    # Outliers (remove 1% extremes)
    Q1, Q3 = data['price'].quantile(0.01), data['price'].quantile(0.99)
    IQR = Q3 - Q1
    data = data[(data['price'] >= Q1) & (data['price'] <= Q3)]
    data = data[(data['area_sqft'] > 50) & (data['area_sqft'] < 500000)]
    data = data.dropna(subset=['price_per_sqft'])
    print(f"  🧹 After cleaning: {len(data)} rows")
    return data.reset_index(drop=True)
"""

# Replace old load_and_clean
content = re.sub(r'# ─── Load \+ Clean ───.*?(?=# ─── Train XGBoost)', mongo_func + '\n', content, flags=re.DOTALL)


# 3. Update main() 
main_func = """
# ─── MAIN ────────────────────────────────────────────────────────────────────
def main():
    print("\\n" + "="*60)
    print("  ELITE HORIZON — Full ML Training Pipeline v2")
    print("  XGBoost (Price) + Random Forest (Investment Score)")
    print("="*60)

    print("\\n📂 Loading ALL datasets from MongoDB...")
    
    # ── Enhanced features for XGBoost ──
    FEAT_HOMES     = ['area_sqft','bedrooms','bathrooms','city_encoded','ptype_encoded',
                      'location_score','price_per_sqft','demand_score','latitude','longitude']
    FEAT_PLOTS     = ['area_sqft','city_encoded','ptype_encoded',
                      'location_score','price_per_sqft','demand_score','latitude','longitude']
    FEAT_COMMERCIAL= ['area_sqft','city_encoded','ptype_encoded',
                      'location_score','price_per_sqft','demand_score','latitude','longitude']

    all_meta = {}
    dfs = []

    # ── Model 1: Homes Buy ──
    print("\\n📂 Homes for Sale")
    d_hb = load_from_mongo("Buy", ["House", "Flat", "Upper Portion", "Lower Portion", "Farm House", "Room", "Penthouse"])
    if d_hb is not None and len(d_hb) > 20:
        _, meta = train_xgboost(d_hb, [f for f in FEAT_HOMES if f in d_hb.columns], 'homes_buy_model')
        all_meta['homes_buy'] = meta
        dfs.append(d_hb)

    # ── Model 2: Homes Rent ──
    print("\\n📂 Homes for Rent")
    d_hr = load_from_mongo("Rent", ["House", "Flat", "Upper Portion", "Lower Portion", "Farm House", "Room", "Penthouse"])
    if d_hr is not None and len(d_hr) > 20:
        _, meta = train_xgboost(d_hr, [f for f in FEAT_HOMES if f in d_hr.columns], 'homes_rent_model')
        all_meta['homes_rent'] = meta
        dfs.append(d_hr)

    # ── Model 3: Plots Buy ──
    print("\\n📂 Plots for Sale")
    d_pb = load_from_mongo("Buy", ["Plot", "Residential Plot", "Commercial Plot", "Agricultural Land", "Industrial Land", "Plot File"])
    if d_pb is not None and len(d_pb) > 20:
        _, meta = train_xgboost(d_pb, [f for f in FEAT_PLOTS if f in d_pb.columns], 'plots_buy_model')
        all_meta['plots_buy'] = meta
        dfs.append(d_pb)

    # ── Model 4: Commercial Buy ──
    print("\\n📂 Commercial for Sale")
    d_cb = load_from_mongo("Buy", ["Commercial", "Office", "Shop", "Building", "Factory", "Warehouse"])
    if d_cb is not None and len(d_cb) > 20:
        _, meta = train_xgboost(d_cb, [f for f in FEAT_COMMERCIAL if f in d_cb.columns], 'commercial_buy_model')
        all_meta['commercial_buy'] = meta
        dfs.append(d_cb)

    # ── Model 5: Commercial Rent ──
    print("\\n📂 Commercial for Rent")
    d_cr = load_from_mongo("Rent", ["Commercial", "Office", "Shop", "Building", "Factory", "Warehouse"])
    if d_cr is not None and len(d_cr) > 20:
        _, meta = train_xgboost(d_cr, [f for f in FEAT_COMMERCIAL if f in d_cr.columns], 'commercial_rent_model')
        all_meta['commercial_rent'] = meta
        dfs.append(d_cr)

    ALL_DATA = pd.concat(dfs, ignore_index=True) if dfs else pd.DataFrame()
    print(f"\\n📦 TOTAL CLEAN DATA: {len(ALL_DATA)} rows")

    # ── Model 6: Investment Score (Random Forest) ──
    if len(ALL_DATA) > 50:
        rf_model, rf_meta, rf_feats = train_investment_score_model(ALL_DATA)
        all_meta['investment_score'] = rf_meta

        # ── Export Heatmap Data ──
        homes_model_path = os.path.join(MODELS_DIR, 'homes_buy_model.pkl')
        if os.path.exists(homes_model_path):
            homes_model = joblib.load(homes_model_path)
            homes_meta  = json.load(open(os.path.join(MODELS_DIR, 'homes_buy_model_meta.json')))
            export_heatmap_data(ALL_DATA, homes_model, homes_meta['features'])

    # ── Save combined meta ──
    json.dump(all_meta, open(os.path.join(MODELS_DIR, 'all_models_meta.json'), 'w'), indent=2)

    print("\\n" + "="*60)
    print("  ✅ TRAINING COMPLETE — SUMMARY")
    print("="*60)
    for k, m in all_meta.items():
        alg = m.get('algorithm', 'XGBoost')
        r2  = m.get('r2', 0)
        mae = m.get('mae', 0)
        n   = m.get('train_samples', 0)
        print(f"\\n  [{k}] ({alg})")
        print(f"    R² = {r2:.4f}  ({r2*100:.1f}%)")
        print(f"    MAE = {mae:,.0f}")
        print(f"    Trained on {n} samples")

"""

content = re.sub(r'# ─── MAIN ───.*', main_func + '\n\nif __name__ == "__main__":\n    main()\n', content, flags=re.DOTALL)

with open('train.py', 'w') as f:
    f.write(content)
