import { useState } from "react";
import API from "../services/api";
import Notification from "../components/Notification";

const contactTypes = [
  {
    id: "prayer",
    title: "Send Prayer Request",
    subtitle: "We stand with you in faith",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4c-1.5 2-4 4-4 7a4 4 0 108 0c0-3-2.5-5-4-7zM8 14c-2 1-4 3-4 6a2 2 0 002 2h12a2 2 0 002-2c0-3-2-5-4-6" />
      </svg>
    ),
  },
  {
    id: "testimony",
    title: "Share Testimony",
    subtitle: "Has God been good to you? Pls share",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
      </svg>
    ),
  },
  {
    id: "complaint",
    title: "Complaint / Suggestion",
    subtitle: "Help us improve",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
    <section className="py-16 md:py-24 px-4 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <span className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-semibold tracking-wide">
              GET IN TOUCH
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Connect With Us
          </h2>
          <p className="text-indigo-600 font-medium">We'd love to hear from you</p>
        </div>

        {activeForm ? (
          <div className="bg-white rounded-3xl shadow-2xl shadow-indigo-200/50 p-8 md:p-10 max-w-lg mx-auto relative">
            <button
              onClick={() => setActiveForm(null)}
              className="absolute left-4 top-4 text-indigo-500 hover:text-indigo-700 transition"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h3 className="text-2xl font-bold text-gray-800 text-center mb-8">
              {contactTypes.find((c) => c.id === activeForm)?.title}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              {activeForm !== "complaint" && (
                <div>
                  <input
                    type="text"
                    placeholder="Your Name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full p-4 rounded-xl border-2 transition-all focus:outline-none focus:border-indigo-500 ${
                      errors.name ? "border-red-500" : "border-gray-200"
                    }`}
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-2">{errors.name}</p>}
                </div>
              )}
              {activeForm === "complaint" && (
                <p className="text-sm text-gray-500 italic bg-gray-50 p-3 rounded-lg">This submission is anonymous</p>
              )}
              <div>
                <input
                  type="tel"
                  placeholder="Phone Number (11 digits, optional)"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  className={`w-full p-4 rounded-xl border-2 transition-all focus:outline-none focus:border-indigo-500 ${
                    errors.phone ? "border-red-500" : "border-gray-200"
                  }`}
                />
                {errors.phone && <p className="text-red-500 text-sm mt-2">{errors.phone}</p>}
              </div>
              <div>
                <input
                  type="text"
                  placeholder={activeForm === "complaint" ? "Email Address (optional)" : "Email Address"}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full p-4 rounded-xl border-2 transition-all focus:outline-none focus:border-indigo-500 ${
                    errors.email ? "border-red-500" : "border-gray-200"
                  }`}
                />
                {errors.email && <p className="text-red-500 text-sm mt-2">{errors.email}</p>}
              </div>
              <div>
                <textarea
                  placeholder="Your Message"
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className={`w-full p-4 rounded-xl border-2 transition-all focus:outline-none focus:border-indigo-500 resize-none ${
                    errors.message ? "border-red-500" : "border-gray-200"
                  }`}
                />
                {errors.message && <p className="text-red-500 text-sm mt-2">{errors.message}</p>}
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Send Message
              </button>
            </form>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {contactTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setActiveForm(type.id)}
                className="group bg-white p-8 rounded-3xl shadow-lg shadow-gray-200/50 hover:shadow-2xl hover:shadow-indigo-200/50 transition-all hover:-translate-y-2 border-2 border-indigo-100 hover:border-indigo-300 cursor-pointer text-left w-full"
              >
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/25">
                  {type.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">{type.title}</h3>
                <p className="text-gray-500 text-sm text-center mb-4">{type.subtitle}</p>
                <div className="flex items-center justify-center gap-1.5 text-indigo-600 font-semibold text-sm group-hover:gap-3 transition-all">
                  <span>Open</span>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
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
