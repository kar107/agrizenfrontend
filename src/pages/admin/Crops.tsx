import axios from "axios";
import Papa from "papaparse";
import { createContext, useContext, useEffect, useState } from "react";
import Swal from "sweetalert2";
import DashboardSidebar from "../../components/DashboardSidebar";

// Define interfaces for type safety
interface Crop {
  id: number;
  name: string;
  variety: string;
  season: string;
  duration_days: number;
  region: string;
  soil_type: string;
  sowing_method: string;
  yield_kg_per_hectare: number;
  description: string;
  image: string;
}

interface CropContextType {
  crops: Crop[];
  fetchCrops: () => Promise<void>;
}

interface FormData {
  name: string;
  variety: string;
  season: string;
  duration_days: number;
  region: string;
  soil_type: string;
  sowing_method: string;
  yield_kg_per_hectare: number;
  description: string;
  image: File | null;
  existingImage: string;
}

// Create context with proper typing
const CropContext = createContext<CropContextType>({
  crops: [],
  fetchCrops: async () => {},
});

const useCropContext = () => useContext(CropContext);

const CropProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [crops, setCrops] = useState<Crop[]>([]);
  const API_URL =
    "https://agrigenapi.sarangartstudio.com/adminController/cropController.php";

  const fetchCrops = async () => {
    try {
      const res = await axios.get<{ data: Crop[] }>(API_URL);
      setCrops(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch crops", err);
    }
  };

  useEffect(() => {
    fetchCrops();
  }, []);

  return (
    <CropContext.Provider value={{ crops, fetchCrops }}>
      {children}
    </CropContext.Provider>
  );
};

const Crops: React.FC = () => {
  const { crops, fetchCrops } = useCropContext();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    variety: "",
    season: "",
    duration_days: 0,
    region: "",
    soil_type: "",
    sowing_method: "",
    yield_kg_per_hectare: 0,
    description: "",
    image: null,
    existingImage: "",
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const itemsPerPage = 5;
  const API_URL =
    "https://agrigenapi.sarangartstudio.com/adminController/cropController.php";

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: Number(value) }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, image: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = new FormData();

    // Append all form data
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "image" && value) {
        payload.append("image", value);
      } else if (key !== "existingImage" && key !== "image") {
        payload.append(key, value.toString());
      }
    });

    if (editingId) {
      payload.append("id", editingId.toString());
      if (formData.existingImage) {
        payload.append("existingImage", formData.existingImage);
      }
    }

    try {
      let response;
      if (editingId) {
        response = await axios.post(`${API_URL}?_method=PUT`, payload, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        response = await axios.post(API_URL, payload, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      if (response.data.status === 200) {
        Swal.fire(
          "Success",
          editingId ? "Crop updated successfully" : "Crop added successfully",
          "success"
        );
        fetchCrops();
        resetForm();
      } else {
        Swal.fire(
          "Error",
          response.data.message || "Something went wrong",
          "error"
        );
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to submit crop data", "error");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      variety: "",
      season: "",
      duration_days: 0,
      region: "",
      soil_type: "",
      sowing_method: "",
      yield_kg_per_hectare: 0,
      description: "",
      image: null,
      existingImage: "",
    });
    setEditingId(null);
  };

  const handleEdit = (crop: Crop) => {
    setFormData({
      ...crop,
      duration_days: crop.duration_days || 0,
      yield_kg_per_hectare: crop.yield_kg_per_hectare || 0,
      image: null,
      existingImage: crop.image || "",
    });
    setEditingId(crop.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_URL}?id=${id}`);
        fetchCrops();
        Swal.fire("Deleted!", "Crop has been deleted.", "success");
      } catch (error) {
        Swal.fire("Error", "Failed to delete crop", "error");
      }
    }
  };

  const handleExport = () => {
    const csv = Papa.unparse(crops);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "crops.csv";
    link.click();
  };

  const filteredCrops = crops.filter((crop) =>
    crop.name.toLowerCase().includes(search.toLowerCase())
  );
  const indexOfLast = currentPage * itemsPerPage;
  const currentCrops = filteredCrops.slice(
    indexOfLast - itemsPerPage,
    indexOfLast
  );
  const totalPages = Math.ceil(filteredCrops.length / itemsPerPage);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <DashboardSidebar type="admin" />
      <div className="flex-1 ml-[280px] p-6">
        <h1 className="text-3xl font-bold mb-4">Crop Management</h1>

        <form
          className="bg-white p-4 shadow rounded mb-6"
          onSubmit={handleSubmit}
        >
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={formData.name}
              onChange={handleInputChange}
              className="border p-2 rounded"
              required
            />
            <input
              type="text"
              name="variety"
              placeholder="Variety"
              value={formData.variety}
              onChange={handleInputChange}
              className="border p-2 rounded"
              required
            />
            <input
              type="text"
              name="season"
              placeholder="Season"
              value={formData.season}
              onChange={handleInputChange}
              className="border p-2 rounded"
            />
            <input
              type="number"
              name="duration_days"
              placeholder="Duration (Days)"
              value={formData.duration_days}
              onChange={handleNumberInputChange}
              className="border p-2 rounded"
            />
            <input
              type="text"
              name="region"
              placeholder="Region"
              value={formData.region}
              onChange={handleInputChange}
              className="border p-2 rounded"
            />
            <input
              type="text"
              name="soil_type"
              placeholder="Soil Type"
              value={formData.soil_type}
              onChange={handleInputChange}
              className="border p-2 rounded"
            />
            <input
              type="text"
              name="sowing_method"
              placeholder="Sowing Method"
              value={formData.sowing_method}
              onChange={handleInputChange}
              className="border p-2 rounded"
            />
            <input
              type="number"
              name="yield_kg_per_hectare"
              placeholder="Yield (kg/ha)"
              value={formData.yield_kg_per_hectare}
              onChange={handleNumberInputChange}
              className="border p-2 rounded"
            />
            <textarea
              name="description"
              placeholder="Description"
              value={formData.description}
              onChange={handleInputChange}
              className="border p-2 rounded col-span-2"
            />
            <div className="col-span-2">
              <label className="block mb-2">Crop Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="border p-2 rounded"
              />
              {editingId && formData.existingImage && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">Current Image:</p>
                  <img
                    src={`https://agrigenapi.sarangartstudio.com/uploads/crops/${formData.existingImage}`}
                    alt="Crop"
                    className="h-20 w-20 object-cover mt-1"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              {editingId ? "Update Crop" : "Add Crop"}
            </button>
            {editingId && (
              <button
                onClick={resetForm}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="flex justify-between items-center mb-4">
          <input
            type="text"
            placeholder="Search by name..."
            className="border p-2 rounded w-1/3"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            onClick={handleExport}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Export to CSV
          </button>
        </div>

        <div className="bg-white p-4 shadow rounded">
          <table className="w-full border">
            <thead className="bg-gray-200">
              <tr>
                <th className="border p-2">ID</th>
                <th className="border p-2">Name</th>
                <th className="border p-2">Image</th>
                <th className="border p-2">Variety</th>
                <th className="border p-2">Season</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentCrops.map((crop) => (
                <tr key={crop.id}>
                  <td className="border p-2">{crop.id}</td>
                  <td className="border p-2">{crop.name}</td>
                  <td className="border p-2">
                    {crop.image ? (
                      <img
                        src={`https://agrigenapi.sarangartstudio.com/uploads/crops/${crop.image}`}
                        alt={crop.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      "No Image"
                    )}
                  </td>
                  <td className="border p-2">{crop.variety}</td>
                  <td className="border p-2">{crop.season}</td>
                  <td className="border p-2">
                    <button
                      onClick={() => handleEdit(crop)}
                      className="bg-yellow-500 text-white px-2 py-1 rounded mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(crop.id)}
                      className="bg-red-500 text-white px-2 py-1 rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-center mt-4 gap-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`px-3 py-1 rounded ${
                  p === currentPage ? "bg-blue-700 text-white" : "bg-blue-200"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CropManagement: React.FC = () => (
  <CropProvider>
    <Crops />
  </CropProvider>
);

export default CropManagement;
