import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { searchFuneralHomes } from "@/lib/api";
import { SESSION_STORAGE_KEY } from "@/lib/config";

interface FuneralOption {
  name: string;
  price: string | null;
  rating: number | null;
  location: string;
  link: string;
}

interface FuneralResults {
  cremation: {
    price_range: string | null;
    summary: FuneralOption[];
  };
  burial: {
    price_range: string | null;
    summary: FuneralOption[];
  };
  woodland: {
    price_range: string | null;
    summary: FuneralOption[];
  };
  metadata: {
    query_location: string;
    search_timestamp: string;
    currency: string | null;
    notes: string | null;
  };
}

const FuneralArrangement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [location, setLocation] = useState("");
  const [results, setResults] = useState<FuneralResults | null>(null);
  const [selectedType, setSelectedType] = useState<"cremation" | "burial" | "woodland" | null>(null);

  useEffect(() => {
    const storedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    if (storedSessionId) {
      setSessionId(Number.parseInt(storedSessionId, 10));
    }
  }, []);

  const handleSearch = async () => {
    if (!location.trim()) {
      toast({
        title: "Location Required",
        description: "Please enter a location to search for funeral homes.",
        variant: "destructive",
      });
      return;
    }

    if (!sessionId) {
      toast({
        title: "Session Not Found",
        description: "Please complete the survey first.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const response = await searchFuneralHomes(sessionId, { location });
      setResults(response);
      
      toast({
        title: "Search Complete!",
        description: `Found funeral homes near ${location}`,
      });
    } catch (error) {
      console.error("Search failed", error);
      toast({
        title: "Search Failed",
        description: error instanceof Error ? error.message : "Unable to search for funeral homes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const renderFuneralOptions = (options: FuneralOption[], type: string) => {
    if (!options || options.length === 0) {
      return (
        <p className="text-gray-500 text-center py-8">
          No options found for {type}
        </p>
      );
    }

    return (
      <div className="space-y-4">
        {options.map((option, idx) => (
          <div
            key={idx}
            className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{option.name}</h4>
                <p className="text-sm text-gray-600">{option.location}</p>
              </div>
              {option.rating && (
                <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full">
                  <span className="text-yellow-600">⭐</span>
                  <span className="font-semibold text-yellow-700">{option.rating}</span>
                </div>
              )}
            </div>
            
            {option.price && (
              <p className="text-2xl font-bold text-blue-600 mb-3">{option.price}</p>
            )}
            
            {option.link && (
              <a
                href={option.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Visit Website
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
  <div className="min-h-screen py-12 px-4" style={{ background: 'linear-gradient(135deg, #F0F4F8 0%, #E0E7EF 100%)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3" style={{ color: '#364d63' }}>
            Arrange Funeral Services
          </h1>
          <p className="text-lg" style={{ color: '#5c6e85' }}>
            Find and compare funeral homes in your area
          </p>
        </div>

        {/* Search Section */}
        {!results && (
          <div className="rounded-2xl shadow-xl p-8 mb-8" style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid #e0e7ef' }}>
            <h2 className="text-2xl font-semibold mb-6" style={{ color: '#364d63' }}>
              Search for Funeral Homes
            </h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="location" className="block text-sm font-medium mb-2" style={{ color: '#364d63' }}>
                  Location (City or Area)
                </label>
                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Stratford, London"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  style={{ borderColor: '#c3d0e0', color: '#364d63', background: '#f0f4f8' }}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !isSearching) {
                      handleSearch();
                    }
                  }}
                />
              </div>

              <button
                onClick={handleSearch}
                disabled={isSearching || !location.trim()}
                className="w-full px-8 py-4 text-white text-lg font-semibold rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: '#364d63' }}
              >
                {isSearching ? "🔍 Searching..." : "🔍 Search Funeral Homes"}
              </button>
            </div>

            <div className="mt-6 rounded-lg p-4" style={{ background: '#e0e7ef', border: '1px solid #c3d0e0' }}>
              <p className="text-sm" style={{ color: '#364d63' }}>
                <strong>ℹ️ What we'll find:</strong> We'll search for the top funeral homes in your area
                and provide options for cremation, burial, and woodland/natural burial services, including
                pricing and ratings where available.
              </p>
            </div>
          </div>
        )}

        {/* Results Section */}
        {results && (
          <div className="space-y-6">
            {/* Type Selection */}
            <div className="rounded-2xl shadow-xl p-6" style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid #e0e7ef' }}>
              <h2 className="text-2xl font-semibold mb-4" style={{ color: '#364d63' }}>
                Select Service Type
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setSelectedType("cremation")}
                  className={`p-6 rounded-xl border-2 transition ${selectedType === "cremation" ? '' : ''}`}
                  style={{
                    borderColor: selectedType === "cremation" ? '#364d63' : '#e0e7ef',
                    background: selectedType === "cremation" ? '#f0f4f8' : '#fff',
                    color: '#364d63',
                  }}
                >
                  <div className="text-4xl mb-2">⚱️</div>
                  <h3 className="text-lg font-semibold mb-1">Cremation</h3>
                  {results.cremation.price_range && (
                    <p className="text-sm text-gray-600">{results.cremation.price_range}</p>
                  )}
                </button>

                <button
                  onClick={() => setSelectedType("burial")}
                  className={`p-6 rounded-xl border-2 transition ${selectedType === "burial" ? '' : ''}`}
                  style={{
                    borderColor: selectedType === "burial" ? '#364d63' : '#e0e7ef',
                    background: selectedType === "burial" ? '#f0f4f8' : '#fff',
                    color: '#364d63',
                  }}
                >
                  <div className="text-4xl mb-2">⛪</div>
                  <h3 className="text-lg font-semibold mb-1">Burial</h3>
                  {results.burial.price_range && (
                    <p className="text-sm text-gray-600">{results.burial.price_range}</p>
                  )}
                </button>

                <button
                  onClick={() => setSelectedType("woodland")}
                  className={`p-6 rounded-xl border-2 transition ${selectedType === "woodland" ? '' : ''}`}
                  style={{
                    borderColor: selectedType === "woodland" ? '#364d63' : '#e0e7ef',
                    background: selectedType === "woodland" ? '#f0f4f8' : '#fff',
                    color: '#364d63',
                  }}
                >
                  <div className="text-4xl mb-2">🌲</div>
                  <h3 className="text-lg font-semibold mb-1">Woodland/Natural</h3>
                  {results.woodland.price_range && (
                    <p className="text-sm text-gray-600">{results.woodland.price_range}</p>
                  )}
                </button>
              </div>
            </div>

            {/* Selected Type Results */}
            {selectedType && (
              <div className="rounded-2xl shadow-xl p-8" style={{ background: 'rgba(255,255,255,0.97)', border: '1px solid #e0e7ef' }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold" style={{ color: '#364d63' }}>
                    {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Options
                  </h2>
                  <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold">
                    ✓ Results Found
                  </span>
                </div>

                {renderFuneralOptions(results[selectedType].summary, selectedType)}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setResults(null);
                  setSelectedType(null);
                  setLocation("");
                }}
                className="px-6 py-3 border rounded-full transition"
                style={{ borderColor: '#c3d0e0', color: '#364d63', background: '#f0f4f8' }}
              >
                ← New Search
              </button>
              <button
                onClick={() => navigate("/procedure")}
                className="px-6 py-3 rounded-full flex items-center gap-2 transition"
                style={{ background: '#4ADE80', color: '#fff' }}
              >
                <span>✓</span>
                Back to Procedure
              </button>
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate("/procedure")}
            className="transition"
            style={{ color: '#364d63', fontWeight: 500 }}
          >
            ← Back to Procedure
          </button>
        </div>
      </div>
    </div>
  );
};

export default FuneralArrangement;
