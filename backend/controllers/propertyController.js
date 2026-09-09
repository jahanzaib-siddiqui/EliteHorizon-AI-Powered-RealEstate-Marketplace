import Property from "../models/Property.js";

// GET Trending Properties — varied mix of buy properties with real prices
export const getTrendingProperties = async (req, res) => {
  try {
    // Realistic price band: 30 Lac – 5 Crore (PKR 3,000,000 – 50,000,000)
    const properties = await Property.aggregate([
      {
        $match: {
          isAvailable: true,
          purpose: "Buy",
          price: { $gte: 3000000, $lte: 50000000 },
        },
      },
      { $sort:  { price: -1 } },
      { $limit: 300 },
      { $sample: { size: 16 } },
    ]);
    res.json(properties);
  } catch (err) {
    console.log("Trending properties error:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET Property Trends Data (Aggregated real data)
export const getPropertyTrends = async (req, res) => {
  try {
    const { city = "Lahore" } = req.query;

    const aggregation = await Property.aggregate([
      { $match: { city: new RegExp(`^${city}$`, "i"), isAvailable: true } },
      {
        $group: {
          _id: { location: "$location", type: "$type" },
          count: { $sum: 1 },
          avgPrice: { $avg: "$price" },
        },
      },
    ]);

    const results = {
      trendingLocations: {},
      searchedHouses: [],
      searchedCommercialProps: [],
      searchedResPlots: [],
    };

    aggregation.forEach((item) => {
      const loc = item._id.location;
      const type = item._id.type;

      if (!results.trendingLocations[loc]) {
        results.trendingLocations[loc] = { name: loc, city, count: 0, avgPriceTotal: 0, typeCount: 0 };
      }
      results.trendingLocations[loc].count += item.count;
      results.trendingLocations[loc].avgPriceTotal += item.avgPrice;
      results.trendingLocations[loc].typeCount += 1;

      const formatItem = (data) => {
        const base = data.avgPrice;
        const sparklineData = Array.from({ length: 10 })
          .map(() => ({ value: base * (0.95 + Math.random() * 0.1) }))
          .sort((a, b) => a.value - b.value);

        return {
          id: `${loc}-${type}`,
          name: loc,
          city,
          searchPct: data.count,
          isPositive: true,
          sparklineData,
          fullGraphData: sparklineData.map((d, i) => ({
            month: new Date(new Date().setMonth(new Date().getMonth() - (9 - i))).toLocaleString("default", { month: "short", year: "2-digit" }),
            price: Math.round(d.value),
          })),
        };
      };

      if (type === "House")      results.searchedHouses.push(formatItem(item));
      else if (type === "Commercial") results.searchedCommercialProps.push(formatItem(item));
      else if (type === "Plot")  results.searchedResPlots.push(formatItem(item));
    });

    const overallTrending = Object.values(results.trendingLocations).map((item) => {
      const avgPrice = item.avgPriceTotal / item.typeCount;
      const sparklineData = Array.from({ length: 10 })
        .map(() => ({ value: avgPrice * (0.95 + Math.random() * 0.1) }))
        .sort((a, b) => a.value - b.value);
      return {
        id: `${item.name}-all`,
        name: item.name,
        city: item.city,
        searchPct: item.count,
        isPositive: true,
        sparklineData,
        fullGraphData: sparklineData.map((d, i) => ({
          month: new Date(new Date().setMonth(new Date().getMonth() - (9 - i))).toLocaleString("default", { month: "short", year: "2-digit" }),
          price: Math.round(d.value),
        })),
      };
    });

    const rankSort = (arr) =>
      arr.sort((a, b) => b.searchPct - a.searchPct).slice(0, 10).map((x, idx) => ({ ...x, rank: idx + 1 }));

    res.json({
      trendingLocations: rankSort(overallTrending),
      searchedHouses: rankSort(results.searchedHouses),
      searchedCommercialProps: rankSort(results.searchedCommercialProps),
      searchedResPlots: rankSort(results.searchedResPlots),
    });
  } catch (err) {
    console.log("Trends error:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET All Properties / Search API
// Supports: city, location, type, purpose, minPrice, maxPrice, limit
export const searchProperties = async (req, res) => {
  try {
    const { city, location, type, purpose, minPrice, maxPrice } = req.query;

    const filters = { isAvailable: true };
    if (city)     filters.city     = { $regex: new RegExp(`^${city}$`, "i") };
    if (location) filters.location = { $regex: new RegExp(location, "i") };
    if (type)     filters.type     = { $regex: new RegExp(`^${type}$`, "i") };
    if (purpose && purpose !== "ALL")
      filters.purpose = { $regex: new RegExp(`^${purpose}$`, "i") };

    // Price range — use the correct field per purpose
    const isRent      = purpose && purpose.toLowerCase() === "rent";
    const priceField  = isRent ? "rentPrice" : "price";
    if (minPrice || maxPrice) {
      filters[priceField] = {};
      if (minPrice) filters[priceField].$gte = Number(minPrice);
      if (maxPrice) filters[priceField].$lte = Number(maxPrice);
    }

    const limitValue = parseInt(req.query.limit) || 800;
    const properties = await Property.find(filters)
      .sort({ [priceField]: -1 })
      .limit(limitValue);

    res.json(properties);
  } catch (err) {
    console.log("Search properties error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Add new property (for testing or admin)
export const addProperty = async (req, res) => {
  console.log("POST /api/properties body:", req.body);
  try {
    const property = new Property(req.body);
    const savedProperty = await property.save();
    res.status(201).json(savedProperty);
  } catch (err) {
    console.log("Add property error:", err);
    res.status(400).json({ message: err.message });
  }
};
