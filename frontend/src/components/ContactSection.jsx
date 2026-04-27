import { useState } from "react";
import API from "../services/api";
import Notification from "../components/Notification";

const contactTypes = [
  {
    id: "prayer",
    title: "Send Prayer Request",
    subtitle: "We stand with you in faith",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l6.364-6.364a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    id: "testimony",
    title: "Share Testimony",
    subtitle: "Have a story to share?",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 001.38 0l4.674-4.674a1 1 0 000-1.902l-4.674-4.674a1 1 0 00-1.902 0l-4.674 4.674a1 1 0 000 1.902l1.674 4.674z" />
      </svg>
    ),
  },
  {
    id: "complaint",
    title: "Complaint / Suggestion",
    subtitle: "Help us improve",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    ),
  },
];

function ContactSection() {
  const [activeForm, setActiveForm] = useState(null);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", message: "" });
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ open: false, type: "", message: "" });

  const sanitize = (str) => str.replace(/[<>'"&]/g, "").trim();

  const validate = () => {
    const errs = {};
    if (activeForm !== "complaint" && !formData.name.trim()) {
      errs.name = "Name is required";
    }
    if (formData.phone && !/^0\d{10}$/.test(formData.phone.trim())) {
      errs.phone = "Enter 11-digit phone number starting with 0";
    }
    if (activeForm !== "complaint" && !formData.email.trim()) {
      errs.email = "Address is required";
    }
    if (!formData.message.trim()) {
      errs.message = "Message is required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 11);
    setFormData({ ...formData, phone: val });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const payload = {
        ...formData,
        type: activeForm,
        name: activeForm === "complaint" ? "Anonymous" : sanitize(formData.name),
        phone: sanitize(formData.phone),
        email: sanitize(formData.email),
        message: sanitize(formData.message),
      };
      await API.post("/contact", payload);
      setNotification({ open: true, type: "success", message: "Submitted successfully!" });
      setFormData({ name: "", phone: "", email: "", message: "" });
      setErrors({});
      setActiveForm(null);
    } catch (err) {
      console.error(err);
      setNotification({ open: true, type: "error", message: err.response?.data?.error || "Submission failed" });
    }
  };

  return (
    <section className="py-12 md:py-16 px-2 md:px-4 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Connect With Us</h2>
          <p className="text-orange-600">We'd love to hear from you</p>
        </div>

        {activeForm ? (
          <div className="bg-white rounded-2xl shadow-lg p-4 md:p-8 max-w-lg mx-auto text-center">
            <div className="flex items-center justify-center mb-6">
              <button onClick={() => setActiveForm(null)} className="text-orange-500 hover:text-orange-600 absolute left-4 md:static">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h3 className="text-lg md:text-xl font-bold text-gray-800 flex-1 text-center">
                {contactTypes.find((c) => c.id === activeForm)?.title}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {activeForm !== "complaint" && (
                <div>
                  <input
                    type="text"
                    placeholder="Your Name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full border p-3 rounded-xl focus:outline-none focus:border-orange-400 ${errors.name ? "border-red-500" : "border-orange-200"}`}
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>
              )}
              {activeForm === "complaint" && (
                <p className="text-sm text-gray-500 italic">This submission is anonymous</p>
              )}
              <div>
                <input
                  type="tel"
                  placeholder="Phone Number (11 digits, optional)"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  className={`w-full border p-3 rounded-xl focus:outline-none focus:border-orange-400 ${errors.phone ? "border-red-500" : "border-orange-200"}`}
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>
              <div>
                <input
                  type="text"
                  placeholder={activeForm === "complaint" ? "Email Address (optional)" : "Address"}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full border p-3 rounded-xl focus:outline-none focus:border-orange-400 ${errors.email ? "border-red-500" : "border-orange-200"}`}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
              <div>
                <textarea
                  placeholder="Your Message"
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className={`w-full border p-3 rounded-xl focus:outline-none focus:border-orange-400 resize-none ${errors.message ? "border-red-500" : "border-orange-200"}`}
                />
                {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message}</p>}
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-amber-600 transition"
              >
                Send Message
              </button>
            </form>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 text-center md:text-left">
            {contactTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setActiveForm(type.id)}
                className="group bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all border border-orange-100 hover:border-orange-300"
              >
                <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
                  {type.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">{type.title}</h3>
                <p className="text-gray-500 text-sm">{type.subtitle}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <Notification
        type={notification.type}
        message={notification.message}
        isOpen={notification.open}
        onClose={() => setNotification({ ...notification, open: false })}
      />
    </section>
  );
}

export default ContactSection;