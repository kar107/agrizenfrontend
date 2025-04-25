import axios from "axios";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Crop {
  id: number;
  name: string;
  variety: string;
  season: string;
  duration_days: number;
  image: string;
  description: string;
}

const CropManagement = () => {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [filteredCrops, setFilteredCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [seasonFilter, setSeasonFilter] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    const fetchCrops = async () => {
      try {
        const response = await axios.get(
          "https://agrigenapi.sarangartstudio.com/adminController/cropController.php"
        );
        if (response.data.status === 200) {
          setCrops(response.data.data);
          setFilteredCrops(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch crops", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCrops();
  }, []);

  useEffect(() => {
    let filtered = [...crops];

    // Filter by season
    if (seasonFilter !== "All") {
      filtered = filtered.filter(
        (crop) =>
          crop.season.trim().toLowerCase() === seasonFilter.trim().toLowerCase()
      );
    }

    // Filter by search term
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(
        (crop) =>
          crop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          crop.variety.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCrops(filtered);
  }, [seasonFilter, searchTerm, crops]);

  if (loading) {
    return (
      <div className="text-center mt-20 text-gray-500">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-green-500 mx-auto mb-4"></div>
        Loading crops...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-4xl font-bold mb-10 text-center text-green-700">
        Crop Management
      </h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <input
          type="text"
          placeholder="Search by name or variety..."
          className="border border-gray-300 px-4 py-2 rounded-md w-full sm:w-1/2"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          value={seasonFilter}
          onChange={(e) => setSeasonFilter(e.target.value)}
          className="border border-gray-300 px-4 py-2 rounded-md"
        >
          <option value="All">All Seasons</option>
          <option value="Winter Season (Oct–March)">
            Winter Season (Oct–March)
          </option>
          <option value="Monsoon Season (June–Oct)">
            Monsoon Season (June–Oct)
          </option>
          <option value="Grown all year (long-duration crop)">
            Grown all year (long-duration crop)
          </option>
        </select>
      </div>

      {/* Crop Cards */}
      {filteredCrops.length === 0 ? (
        <p className="text-center text-gray-500">No crops found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {filteredCrops.map((crop) => (
            <motion.div
              key={crop.id}
              whileHover={{ scale: 1.03 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden transition-transform duration-300"
            >
              <img
                src={`https://agrigenapi.sarangartstudio.com/uploads/crops/${crop.image}`}
                alt={crop.name}
                className="h-48 w-full object-cover"
              />
              <div className="p-5">
                <h2 className="text-2xl font-semibold text-green-700 mb-1">
                  {crop.name}
                </h2>
                <p className="text-gray-600 text-sm italic mb-2">
                  {crop.variety}
                </p>
                <div className="flex flex-wrap gap-2 mb-2 text-sm text-gray-500">
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    {crop.season}
                  </span>
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    {crop.duration_days} days
                  </span>
                </div>
                <p className="text-gray-600 text-sm line-clamp-3">
                  {crop.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CropManagement;
