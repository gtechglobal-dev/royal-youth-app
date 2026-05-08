import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Notification from "../components/Notification";

function EditProfile() {
  const navigate = useNavigate();
  const [notification, setNotification] = useState({ open: false, type: "", message: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    occupation: "",
    hobbies: "",
    address: "",
    email: "",
    phone: "",
    branch: "",
  });

  const [image, setImage] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await API.get("/auth/me");
        const user = res.data;
        setFormData({
          occupation: user.occupation || "",
          hobbies: user.hobbies ? user.hobbies.join(", ") : "",
          address: user.address || "",
          email: user.email || "",
          phone: user.phone || "",
          branch: user.branch || "Plot C4/C5 Owerri",
        });
        setCurrentImage(user.profileImage);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = new FormData();

      data.append("occupation", formData.occupation);
      
      if (formData.hobbies) {
        data.append("hobbies", formData.hobbies);
      }
      
      data.append("address", formData.address);
      data.append("email", formData.email);
      data.append("phone", formData.phone);

      if (image) {
        data.append("profileImage", image);
      }

      await API.put("/auth/profile", data);

      setNotification({ open: true, type: "success", message: "Profile updated successfully!" });
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to update profile";
      setNotification({ open: true, type: "error", message: errorMsg });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4">
      <div className="max-w-xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <h2 className="text-xl md:text-2xl font-bold mb-4 text-center text-memberBlue">
            Edit Profile
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Profile Picture</label>
              {currentImage && (
                <img
                   src={currentImage}
                   alt="Current Profile"
                   className="w-20 h-20 rounded-full object-cover mb-2"
                 />
              )}
              <input
                type="file"
                accept="image/*"
                className="w-full p-2 border rounded-lg"
                onChange={(e) => setImage(e.target.files[0])}
              />
            </div>

            <input
              type="text"
              name="occupation"
              placeholder="Occupation *"
              required
              value={formData.occupation}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-memberBlue focus:outline-none"
              onChange={handleChange}
            />

            <input
              type="text"
              name="hobbies"
              placeholder="Hobbies (comma separated, e.g., Reading, Football, Music)"
              value={formData.hobbies}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-memberBlue focus:outline-none"
              onChange={handleChange}
            />

            <input
              type="text"
              name="address"
              placeholder="Address"
              value={formData.address}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-memberBlue focus:outline-none"
              onChange={handleChange}
            />

            <div className="p-3 border rounded-lg bg-gray-100">
              <p className="text-sm text-gray-500">Soulwinners Branch</p>
              <p className="font-medium">{formData.branch || "Plot C4/C5 Owerri"}</p>
            </div>

            <div className="p-3 border rounded-lg bg-gray-100">
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{formData.email || "Not provided"}</p>
            </div>

            <div className="p-3 border rounded-lg bg-gray-100">
              <p className="text-sm text-gray-500">Phone Number</p>
              <p className="font-medium">{formData.phone}</p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="flex-1 bg-gray-500 text-white p-3 rounded-lg font-semibold hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-memberOrange text-white p-3 rounded-lg font-semibold hover:bg-orange-600 transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      <Notification
        type={notification.type}
        message={notification.message}
        isOpen={notification.open}
        onClose={() => setNotification({ ...notification, open: false })}
      />
    </div>
  );
}

export default EditProfile;