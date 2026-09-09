"""
generate_heatmap_cities.py

Fetches real property coordinates from MongoDB for Karachi, Multan,
Peshawar, Sialkot, and Faisalabad and generates KDE-style heatmap
grid + point data in the same format as the existing heatmap_data.json.

Run once from the ai-models/ directory:
    python3 generate_heatmap_cities.py
"""

import json, math, os, sys
from pymongo import MongoClient

MONGO_URI = "mongodb://127.0.0.1:27017/elite-horizon"
DATA_FILE  = os.path.join(os.path.dirname(__file__), "data", "heatmap_data.json")

# City bounding box centres + spreads for KDE grid
CITY_META = {
    "karachi":     {"lat": 24.8607, "lng": 67.0011, "spread": 0.15},
    "multan":      {"lat": 30.1575, "lng": 71.5249, "spread": 0.12},
    "peshawar":    {"lat": 34.0151, "lng": 71.5249, "spread": 0.12},
    "sialkot":     {"lat": 32.4945, "lng": 74.5229, "spread": 0.10},
    "faisalabad":  {"lat": 31.4504, "lng": 73.1350, "spread": 0.13},
}

GRID_N = 18   # 18×18 = 324 grid points (same as Lahore)

def gaussian_kde_intensity(lat, lng, points, bandwidth=0.04):
    """Simple Gaussian KDE: intensity at (lat,lng) from point cloud."""
    total = 0.0
    for p in points:
        d2 = (lat - p["lat"])**2 + (lng - p["lng"])**2
        total += math.exp(-d2 / (2 * bandwidth**2))
    return total

def min_max(values):
    mn, mx = min(values), max(values)
    r = mx - mn or 1
    return [(v - mn) / r for v in values]

def generate_for_city(city, props, meta):
    if not props:
        print(f"  ⚠️  {city}: no properties with coordinates — skipping")
        return None

    print(f"  {city}: {len(props)} properties")

    cx, cy = meta["lat"], meta["lng"]
    spread  = meta["spread"]
    step    = (spread * 2) / GRID_N

    # Build KDE grid
    grid_raw = []
    for i in range(GRID_N):
        for j in range(GRID_N):
            glat = cx - spread + i * step + step / 2
            glng = cy - spread + j * step + step / 2
            intensity = gaussian_kde_intensity(glat, glng, props, bandwidth=0.03)
            avg_price = 0
            # Estimate price from nearby points (within 0.06 deg)
            nearby = [p for p in props if abs(p["lat"]-glat)<0.06 and abs(p["lng"]-glng)<0.06]
            if nearby:
                avg_price = sum(p["price"] for p in nearby) / len(nearby)
            grid_raw.append({"lat": glat, "lng": glng, "intensity": intensity, "price": avg_price})

    # Normalise KDE intensities 0→1
    raw_vals = [g["intensity"] for g in grid_raw]
    normed   = min_max(raw_vals)
    grid = []
    for g, n in zip(grid_raw, normed):
        grid.append({"lat": round(g["lat"],6), "lng": round(g["lng"],6),
                     "intensity": round(n,4), "price": round(g["price"],0)})

    # Percentile-rank normalise property markers
    prices_sorted = sorted(p["price"] for p in props)
    n = len(prices_sorted)
    rank_map = {}
    for i, prc in enumerate(prices_sorted):
        if prc not in rank_map:
            rank_map[prc] = i

    points = []
    for p in props:
        rank = rank_map.get(p["price"], 0)
        intensity = 0.5 if n <= 1 else rank / (n - 1)
        points.append({
            "lat":       round(p["lat"],  6),
            "lng":       round(p["lng"],  6),
            "price":     p["price"],
            "area":      p.get("area", 0),
            "type":      p.get("type", "House"),
            "location":  p.get("location", ""),
            "intensity": round(intensity, 4),
        })

    prices = [p["price"] for p in props]
    return {
        "grid":        grid,
        "points":      points,
        "count":       len(points),
        "price_range": {"min": min(prices), "max": max(prices)},
    }


def main():
    print(f"\n🔗 Connecting to MongoDB…")
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    db     = client["elite-horizon"]
    col    = db["properties"]
    print("✅ Connected\n")

    # Load existing heatmap_data.json (to preserve lahore / islamabad data)
    existing = {}
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE) as f:
            existing = json.load(f)
        print(f"📂 Loaded existing heatmap_data.json ({list(existing.keys())})\n")

    print("🔄 Generating heatmap data for new cities…")
    for city, meta in CITY_META.items():
        docs = list(col.find(
            {
                "city": city,
                "lat":  {"$ne": None},
                "lng":  {"$ne": None},
                "$or":  [{"price": {"$gt": 0}}, {"rentPrice": {"$gt": 0}}],
            },
            {"lat":1,"lng":1,"price":1,"rentPrice":1,"area":1,"type":1,"location":1,"_id":0}
        ).limit(500))
        # For rent-only records, use rentPrice as the price signal
        for d in docs:
            if not d.get("price") and d.get("rentPrice"):
                d["price"] = d["rentPrice"] * 12  # annualise rent for KDE intensity
        # Convert area to float
        for d in docs:
            try:    d["area"] = float(d.get("area","0") or 0)
            except: d["area"] = 0

        data = generate_for_city(city, docs, meta)
        if data:
            existing[city] = data

    # Save back
    with open(DATA_FILE, "w") as f:
        json.dump(existing, f, separators=(",",":"))

    sizes = {k: len(v.get("points",[])) for k,v in existing.items()}
    print(f"\n✅ heatmap_data.json updated! Cities: {list(existing.keys())}")
    print(f"   Marker counts: {sizes}")
    print(f"\n🔁 Now restart predict_api.py to reload the cache.\n")

if __name__ == "__main__":
    main()
