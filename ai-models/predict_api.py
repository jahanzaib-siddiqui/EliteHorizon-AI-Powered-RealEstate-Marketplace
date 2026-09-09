"""
==========================================================================
  ELITE HORIZON — AI Prediction Flask API v2
  Endpoints: Price Prediction + Investment Score + Heatmap Data
==========================================================================
"""

import os, json, math
import numpy as np
import joblib
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

MODELS_DIR = os.path.join(os.path.dirname(__file__), 'models')
DATA_DIR   = os.path.join(os.path.dirname(__file__), 'data')

# ── Loaded objects ──────────────────────────────────────────────────────────
loaded_models = {}
loaded_meta   = {}
heatmap_cache = {}

# ── Encoding maps (must match train.py) ────────────────────────────────────
LAHORE_ZONES = {
    'dha':5,'gulberg':4,'bahria':4,'model town':4,
    'garden town':3,'johar town':3,'cantt':3,'valencia':3,
    'wapda town':2,'iqbal town':2,'faisal town':2,
}
ISLAMABAD_ZONES = {
    'f-6':5,'f-7':5,'e-7':5,'f-8':4,'f-10':4,'f-11':4,
    'e-11':4,'blue area':5,'dha':4,'g-10':3,'g-11':3,
    'i-8':3,'g-13':2,'i-10':2,'i-14':1,
}
AREA_CONV  = {'marla':272.25,'kanal':5445.0,'sqft':1.0}
PTYPE_MAP  = {
    'house':0,'flat':1,'upper portion':2,'lower portion':3,'farm house':4,
    'residential plot':0,'commercial plot':1,
    'office':0,'shop':1,'building':2,'factory':3,
    'warehouse':4,'other':5,
}
CITY_COORDS = {
    'lahore':     {'lat':31.5204,'lng':74.3587},
    'islamabad':  {'lat':33.6844,'lng':73.0479},
}

# ── City-level avg price_per_sqft ──────────────────────────────────────────
# BUY prices (PKR per sqft for sale properties)
CITY_AVG_PPS_BUY  = {'lahore': 25000.0, 'islamabad': 32000.0}
# RENT prices (PKR per sqft PER MONTH for rental properties)
CITY_AVG_PPS_RENT = {'lahore': 68.0, 'islamabad': 95.0}
# Legacy alias (kept for non-predict uses)
CITY_AVG_PPS = CITY_AVG_PPS_BUY

# Category-specific averages for precise predictions
AVG_PPS_MAP = {
    'homes': {
        'buy':  {'lahore': 25000.0, 'islamabad': 32000.0},
        'rent': {'lahore': 68.0,    'islamabad': 95.0}
    },
    'plots': {
        'buy':  {'lahore': 5600.0,  'islamabad': 6400.0}
    },
    'commercial': {
        'buy':  {'lahore': 44000.0, 'islamabad': 60000.0},
        'rent': {'lahore': 122.0,   'islamabad': 238.0}
    }
}

def get_property_category(ptype):
    pt = str(ptype).lower()
    if pt in ('house','flat','home','apartment','upper portion','lower portion','farm house'):
        return 'homes'
    if pt in ('plot','residential plot','commercial plot'):
        return 'plots'
    return 'commercial'

def get_avg_pps(ptype, purpose, city):
    cat = get_property_category(ptype)
    pu = 'rent' if str(purpose).lower() in ('rent', 'rental') else 'buy'
    c = str(city).lower()
    
    p_map = AVG_PPS_MAP.get(cat, AVG_PPS_MAP['homes'])
    if pu not in p_map:
        pu = 'buy'
    
    c_map = p_map.get(pu, p_map['buy'])
    return c_map.get(c, 25000.0 if pu == 'buy' else 68.0)


# Sensible minimum predictions per purpose
MIN_RENT_PKR = 15_000   # Rs 15k/month minimum (studio flat)
MIN_BUY_PKR  = 500_000  # Rs 5 Lac minimum (tiny plot)

def get_location_score(location_zone, city):
    loc = str(location_zone).lower()
    zones = LAHORE_ZONES if city.lower() == 'lahore' else ISLAMABAD_ZONES
    for k, v in zones.items():
        if k in loc: return v
    return 2

def fmt_pkr(v):
    if not v or v <= 0: return 'N/A'
    if v >= 10_000_000: return f"PKR {v/10_000_000:.2f} Crore"
    if v >= 100_000:    return f"PKR {v/100_000:.2f} Lakh"
    return f"PKR {v:,.0f}"

def select_model_key(ptype, purpose):
    cat = get_property_category(ptype)
    pu = str(purpose).lower()
    is_rent = pu in ('rent', 'rental')
    
    if cat == 'homes':
        return 'homes_rent' if is_rent else 'homes_buy'
    elif cat == 'plots':
        return 'plots_buy'
    else:
        return 'commercial_rent' if is_rent else 'commercial_buy'

# ── Startup loader ───────────────────────────────────────────────────────────
def load_all():
    files = {
        'homes_buy':        'homes_buy_model.pkl',
        'homes_rent':       'homes_rent_model.pkl',
        'plots_buy':        'plots_buy_model.pkl',
        'commercial_buy':   'commercial_buy_model.pkl',
        'commercial_rent':  'commercial_rent_model.pkl',
        'investment_score': 'investment_score_model.pkl',
    }
    for key, fname in files.items():
        p = os.path.join(MODELS_DIR, fname)
        if os.path.exists(p):
            loaded_models[key] = joblib.load(p)
            print(f"  ✅ {key}")
        else:
            print(f"  ⚠️  {fname} not found")

    combined = os.path.join(MODELS_DIR, 'all_models_meta.json')
    if os.path.exists(combined):
        loaded_meta.update(json.load(open(combined)))

    # Load heatmap cache
    hp = os.path.join(DATA_DIR, 'heatmap_data.json')
    if os.path.exists(hp):
        heatmap_cache.update(json.load(open(hp)))
        print(f"  ✅ Heatmap data loaded")

    print(f"\n  🚀 {len(loaded_models)} models ready.\n")

# ══════════════════════════════════════════════════════════════════════════════
#  ROUTES
# ══════════════════════════════════════════════════════════════════════════════

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'models_loaded': list(loaded_models.keys()),
        'heatmap_cities': list(heatmap_cache.keys()),
        'message': 'Elite Horizon AI API v2 running'
    })


# ── Price Prediction ─────────────────────────────────────────────────────────
@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        d             = request.get_json()
        area          = float(d.get('area', 5))
        area_unit     = d.get('area_unit', 'marla').lower()
        bedrooms      = int(d.get('bedrooms', 3))
        bathrooms     = int(d.get('bathrooms', 2))
        city          = d.get('city', 'Lahore').lower()
        location_zone = d.get('location_zone', '')
        property_type = d.get('property_type', 'house').lower()
        purpose       = d.get('purpose', 'sale').lower()
        lat           = float(d.get('latitude',  CITY_COORDS.get(city, CITY_COORDS['lahore'])['lat']))
        lng           = float(d.get('longitude', CITY_COORDS.get(city, CITY_COORDS['lahore'])['lng']))

        is_rent = purpose in ('rent', 'rental')

        area_sqft      = area * AREA_CONV.get(area_unit, 272.25)
        city_enc       = 1 if city == 'islamabad' else 0
        ptype_enc      = PTYPE_MAP.get(property_type, 0)
        loc_score      = get_location_score(location_zone, city)
        city_prem      = 1.3 if city == 'islamabad' else 1.0
        demand_score   = loc_score * city_prem

        # Use RENT price-per-sqft for rental, BUY for sale — critical distinction
        price_per_sqft = get_avg_pps(property_type, purpose, city) * (loc_score / 3.0)

        model_key = select_model_key(property_type, purpose)
        if model_key not in loaded_models:
            model_key = list(loaded_models.keys())[0]

        meta     = loaded_meta.get(model_key, {})
        features = meta.get('features', ['area_sqft','bedrooms','bathrooms',
                                          'city_encoded','ptype_encoded','location_score'])
        feat_map = {
            'area_sqft': area_sqft, 'bedrooms': bedrooms, 'bathrooms': bathrooms,
            'city_encoded': city_enc, 'ptype_encoded': ptype_enc,
            'location_score': loc_score, 'price_per_sqft': price_per_sqft,
            'demand_score': demand_score, 'latitude': lat, 'longitude': lng,
        }
        vec  = np.array([[feat_map.get(f, 0) for f in features]])
        pred = float(loaded_models[model_key].predict(vec)[0])

        # Apply purpose-appropriate minimum (not a universal 300k floor)
        min_floor = MIN_RENT_PKR if is_rent else MIN_BUY_PKR
        pred = max(pred, min_floor)

        # Confidence band: ±15% for rent (small dataset), ±12% for buy
        margin_pct = 0.15 if is_rent else 0.12
        rmse = meta.get('rmse', pred * margin_pct)
        # For rent, cap rmse so the band doesn't explode from large-sale-trained values
        if is_rent:
            rmse = min(rmse, pred * margin_pct)
        lo   = max(pred - 0.6 * rmse, pred * 0.78)
        hi   = pred + 0.6 * rmse

        return jsonify({
            'success': True, 'model_used': model_key,
            'prediction': {
                'raw': pred, 'formatted': fmt_pkr(pred),
                'low': lo, 'low_formatted': fmt_pkr(lo),
                'high': hi, 'high_formatted': fmt_pkr(hi),
            },
            'model_stats': {
                'r2': meta.get('r2', 0), 'mae': meta.get('mae', 0),
                'mae_formatted': fmt_pkr(meta.get('mae', 0)),
                'trained_on': meta.get('train_samples', 0),
                'algorithm': meta.get('algorithm', 'XGBoost'),
                'formula': meta.get('formula', ''),
            },
            'feature_importances': meta.get('feature_importances', {}),
            'inputs_used': {
                'area_sqft': round(area_sqft, 1), 'bedrooms': bedrooms,
                'bathrooms': bathrooms, 'city': city,
                'location_score': loc_score, 'property_type': property_type,
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


# ── Investment Score ─────────────────────────────────────────────────────────
@app.route('/api/investment-score', methods=['POST'])
def investment_score():
    """
    CONCEPT: Investment Score = RF prediction + domain formula
    
    Formula:
      IS = 0.40 × RF_Score        (data-driven ROI proxy)
         + 0.35 × Location_Score  (premium zone factor)
         + 0.15 × Demand_Factor   (city + market demand)
         + 0.10 × Yield_Score     (estimated rental yield)
      → clamp(0, 100)

    Tier classification:
      81-100 → Prime Investment  🏆
      66-80  → Good Investment   ✅
      51-65  → Fair              🟡
      31-50  → Below Average     🟠
      0-30   → Avoid             🔴
    """
    try:
        d             = request.get_json()
        area          = float(d.get('area', 5))
        area_unit     = d.get('area_unit', 'marla').lower()
        city          = d.get('city', 'Lahore').lower()
        location_zone = d.get('location_zone', '')
        property_type = d.get('property_type', 'house').lower()
        lat           = float(d.get('latitude',  CITY_COORDS.get(city, CITY_COORDS['lahore'])['lat']))
        lng           = float(d.get('longitude', CITY_COORDS.get(city, CITY_COORDS['lahore'])['lng']))

        area_sqft     = area * AREA_CONV.get(area_unit, 272.25)
        city_enc      = 1 if city == 'islamabad' else 0
        ptype_enc     = PTYPE_MAP.get(property_type, 0)
        loc_score     = get_location_score(location_zone, city)
        city_prem     = 1.3 if city == 'islamabad' else 1.0
        demand_score  = loc_score * city_prem
        price_per_sqft = get_avg_pps(property_type, 'buy', city) * (loc_score / 3.0)

        if 'investment_score' in loaded_models:
            meta     = loaded_meta.get('investment_score', {})
            features = meta.get('features', ['area_sqft','location_score','city_encoded',
                                              'ptype_encoded','price_per_sqft','demand_score',
                                              'latitude','longitude'])
            feat_map = {
                'area_sqft': area_sqft, 'location_score': loc_score,
                'city_encoded': city_enc, 'ptype_encoded': ptype_enc,
                'price_per_sqft': price_per_sqft, 'demand_score': demand_score,
                'latitude': lat, 'longitude': lng,
            }
            vec      = np.array([[feat_map.get(f, 0) for f in features]])
            rf_score = float(loaded_models['investment_score'].predict(vec)[0])
            rf_score = float(np.clip(rf_score, 0, 100))
        else:
            rf_score = loc_score * 15.0  # fallback

        # ── Component scores ──────────────────────────────────────────────
        location_score_100 = (loc_score / 5.0) * 100          # 0-100
        demand_score_100   = min((demand_score / 6.5) * 100, 100)
        # Yield proxy: higher location + Islamabad → better yield
        est_yield_pct      = 4.0 + (loc_score - 1) * 0.8 + (1.0 if city == 'islamabad' else 0)
        yield_score_100    = min(est_yield_pct * 10, 100)
        # Market trend: islamabad > lahore; premium zones trend higher
        market_score       = min(60 + loc_score * 6 + (10 if city == 'islamabad' else 0), 100)

        # ── Composite formula ─────────────────────────────────────────────
        final_score = (
            0.40 * rf_score +
            0.25 * location_score_100 +
            0.15 * demand_score_100 +
            0.10 * yield_score_100 +
            0.10 * market_score
        )
        final_score = float(np.clip(final_score, 0, 100))

        # ── Tier ──────────────────────────────────────────────────────────
        if   final_score >= 81: tier, verdict = 'prime',        'Prime Investment 🏆'
        elif final_score >= 66: tier, verdict = 'good',         'Good Investment ✅'
        elif final_score >= 51: tier, verdict = 'fair',         'Fair Investment 🟡'
        elif final_score >= 31: tier, verdict = 'below_average','Below Average 🟠'
        else:                   tier, verdict = 'avoid',        'Avoid 🔴'

        # ── Comparable scores ─────────────────────────────────────────────
        city_avg = 58.0 if city == 'islamabad' else 52.0
        top_zone = 88.0 if city == 'islamabad' else 84.0

        return jsonify({
            'success': True,
            'score': round(final_score, 1),
            'tier': tier,
            'verdict': verdict,
            'breakdown': {
                'rf_score':         round(rf_score, 1),
                'location_score':   round(location_score_100, 1),
                'demand_score':     round(demand_score_100, 1),
                'yield_score':      round(yield_score_100, 1),
                'market_score':     round(market_score, 1),
            },
            'comparisons': {
                'city_average': city_avg,
                'top_zone':     top_zone,
                'your_score':   round(final_score, 1),
            },
            'details': {
                'location_zone': location_zone,
                'loc_score_raw': loc_score,
                'est_yield_pct': round(est_yield_pct, 1),
                'demand_raw':    round(demand_score, 2),
                'city':          city,
                'property_type': property_type,
                'area_sqft':     round(area_sqft, 1),
            },
            'formula': 'IS = 0.40×RF + 0.25×Location + 0.15×Demand + 0.10×Yield + 0.10×Market',
            'model_info': {
                'algorithm': 'Random Forest (300 trees)',
                'r2': loaded_meta.get('investment_score', {}).get('r2', 0),
                'trained_on': loaded_meta.get('investment_score', {}).get('train_samples', 0),
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


# ── Heatmap Data ─────────────────────────────────────────────────────────────
@app.route('/api/heatmap-data/<city>', methods=['GET'])
def get_heatmap(city):
    city = city.lower()
    if city in heatmap_cache:
        return jsonify({'success': True, 'city': city, 'data': heatmap_cache[city]})
    return jsonify({'success': False, 'error': f'No heatmap data for {city}'}), 404

@app.route('/api/models/meta', methods=['GET'])
def get_meta():
    return jsonify(loaded_meta)


# ── Start ─────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    print("\n" + "="*60)
    print("  ELITE HORIZON — AI Prediction API v2")
    print("="*60)
    load_all()
    print("  http://localhost:5002")
    print("  POST /api/predict")
    print("  POST /api/investment-score")
    print("  GET  /api/heatmap-data/<city>")
    print("="*60 + "\n")
    app.run(host='0.0.0.0', port=5002, debug=False)
