import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

// Pages
import Home from "./pages/Home";
import InstallmentCalculator from "./pages/InstallmentCalculator";
import SmartAffordabilityCalculator from "./pages/SmartAffordabilityCalculator";
import PlotFinder from "./pages/PlotFinder";
import PropertyTrends from "./pages/PropertyTrends";
import CityPage from "./pages/CityPage";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ListProperty from "./pages/ListProperty";
import SellerDashboard from "./pages/SellerDashboard";
import EditProperty from "./pages/EditProperty";
import ListedProperties from "./pages/ListedProperties";
import PropertyDetail from "./pages/PropertyDetail";
import MyChats from "./pages/MyChats";
import BuyerDashboard from "./pages/BuyerDashboard";

// Category Pages
import Houses from "./pages/Houses";
import Commercial from "./pages/Commercial";
import Plots from "./pages/Plots";

// Property Comparison Page
import PropertyComparison from "./pages/PropertyComparison";

// AI Price Prediction
import AIPricePrediction from "./pages/AIPricePrediction";

// Area Heatmap
import AreaHeatmap from "./pages/AreaHeatmap";

// Investment Score
import InvestmentScore from "./pages/InvestmentScore";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/list-property" element={<ListProperty />} />
        <Route path="/seller-dashboard" element={<SellerDashboard />} />
        <Route path="/edit-property/:id" element={<EditProperty />} />
        <Route path="/properties" element={<ListedProperties />} />
        <Route path="/properties/:id" element={<PropertyDetail />} />
        <Route path="/my-chats" element={<MyChats />} />
        <Route path="/buyer-dashboard" element={<BuyerDashboard />} />

        {/* Tools */}
        <Route path="/installment-calculator" element={<InstallmentCalculator />} />
        <Route path="/smart-affordability-calculator" element={<SmartAffordabilityCalculator />} />
        <Route path="/plot-finder" element={<PlotFinder />} />
        <Route path="/property-trends" element={<PropertyTrends />} />

        {/* City Pages */}
        <Route path="/city/:city" element={<CityPage />} />

        {/* Category Pages */}
        <Route path="/category/house" element={<Houses />} />
        <Route path="/category/commercial" element={<Commercial />} />
        <Route path="/category/plot" element={<Plots />} />

        {/* Property Comparison Tool */}
        <Route path="/property-comparison" element={<PropertyComparison />} />

        {/* AI Price Prediction */}
        <Route path="/ai-price-prediction" element={<AIPricePrediction />} />

        {/* Area Heatmap */}
        <Route path="/area-heatmap" element={<AreaHeatmap />} />

        {/* Investment Score */}
        <Route path="/investment-score" element={<InvestmentScore />} />

        {/* Fallback for unknown paths */}
        <Route path="*" element={<h1>404 - Page Not Found</h1>} />
      </Routes>
    </Router>
  );
}

export default App;
