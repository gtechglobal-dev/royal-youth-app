import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import Notification from "../components/Notification";
import { OverlayLoader, PageLoader } from "../components/Loaders";

const nigerianStates = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo",
  "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos",
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Sokoto",
  "Taraba", "Yobe", "Zamfara"
];

const lgaByState = {
  "Abia": ["Aba North", "Aba South", "Arochukwu", "Bende", "Ikwuano", "Isiala Ngwa North", "Isiala Ngwa South", "Isuikwuato", "Obingwa", "Ohafia", "Osisioma", "Ugwunagbo", "Ukwa East", "Ukwa West", "Umuahia North", "Umuahia South", "Umu-Nneochi"],
  "Adamawa": ["Adamawa", "Ajingami", "Bangure", "Bewete", "Dambazau", "Fufore", "Ganye", "Girei", "Gombi", "Guyuk", "Hong", "Jada", "Kabure", "Kaltungo", "Karaye", "Kiri", "Koma", "Kumun", "Madagali", "Maiha", "Mayo Belwa", "Michika", "Mubi North", "Mubi South", "Numan", "Shelleng", "Song", "Toungo", "Yola"],
  "Akwa Ibom": ["Abak", "Eastern Obolo", "Essien Udim", "Etim Ekpo", "Etinan", "Ibeno", "Ibesikpo Asutan", "Ibiono-Ibom", "Ikot Abasi", "Ikot Ekpene", "Ini", "Itu", "Mbiabong", "Mkpat-Enin", "Nsit-Atai", "Nsit-Ibom", "Nsit-Ubium", "Obot-Akara", "Okobo", "Onna", "Oruk Anam", "Oron", "Oruk-Anam", "Udung-Uko", "Ukanafun", "Uquo", "Uruah"],
  "Anambra": ["Aguata", "Anambra East", "Anambra West", "Anaocha", "Awka North", "Awka South", "Ayamelum", "Dunukofia", "Ekwusigo", "Idemili North", "Idemili South", "Ihiala", "Njikoka", "Nnewi North", "Nnewi South", "Ogbaru", "Onitsha North", "Onitsha South", "Orumba North", "Orumba South", "Oyi"],
  "Bauchi": ["Alagarn", "Bauchi", "Bogoro", "Damban", "Darako", "Gamawa", "Ganjuwa", "Giade", "Itas-Gadau", "Jamaare", "Katagum", "Misau", "Ningi", "Shira", "Tafawa-Balewa", "Toro", "Warji", "Zaki"],
  "Bayelsa": ["Brass", "Ekeremor", "Kolokuma-Opokuma", "Nembe", "Ogbia", "Sagbama", "Southern Ijaw", "Yenagoa"],
  "Benue": ["Ado", "Agatu", "Apa", "Buruku", "Gboko", "Guma", "Gwer-East", "Gwer-West", "Katsina-Ala", "Konshisha", "Kwande", "Logo", "Makurdi", "Obi", "Ogbadibo", "Oju", "Okpokwu", "Oturkpo", "Tarka", "Ukum", "Ushongo", "Vandeikya"],
  "Borno": ["Abadam", "Askira-Uba", "Bama", "Bayo", "Bijo", "Chibok", "Damboa", "Dikwa", "Gubio", "Gwagwalada", "Gwoza", "Kala-Balge", "Kukawa", "Kwaya-Kusar", "Maduguri", "Maiduguri", "Marte", "Misa", "Mobar", "Shani"],
  "Cross River": ["Abi", "Akamkpa", "Akpabuyo", "Bakassi", "Bekwarra", "Biasi", "Calabar Municipal", "Calabar South", "Etung", "Ikom", "Obanliku", "Obubra", "Obudu", "Odot", "Okpoma", "Ugep", "Yakurr"],
  "Delta": ["Aniocha North", "Aniocha South", "Bomadi", "Burutu", "Delta", "Ethiope East", "Ethiope West", "Ika North East", "Ika South", "Isoko North", "Isoko South", "Ndokwa East", "Ndokwa West", "Okpe", "Oshimili North", "Oshimili South", "Patani", "Sapele", "Udu", "Ughelli North", "Ughelli South", "Uvwie", "Warri North", "Warri South", "Warri South West"],
  "Ebonyi": ["Abakaliki", "Afikpo North", "Afikpo South", "Ebonyi", "Ezza", "Ezza North", "Ezza South", "Ikwo", "Ishielu", "Ivo", "Izzi", "Ohahua", "Onicha", "Ohaozara", "Ukaba", "Ukwara"],
  "Edo": ["Akoko-Edo", "Egor", "Esan Central", "Esan North-East", "Esan South-East", "Esan West", "Etsuna Central", "Etsuan West", "Igueben", "Ikpoba-Okha", "Orhionmwon", "Oredo", "Uhunmwonde"],
  "Ekiti": ["Ado-Ekiti", "Aiyekire", "Efon", "Ekiti East", "Ekiti South-West", "Ekiti West", "Emure", "Ido-Osi", "Ijero", "Ikole", "Ilejemeje", "Irepodun", "Irolu", "Oye", "Oyebanji"],
  "Enugu": ["Aninri", "Awgu", "Enugu East", "Enugu North", "Enugu South", "Ezeagu", "Igbo-Etiti", "Igbo-Eze North", "Igbo-Eze South", "Isi-Uzo", "Nkanu East", "Nkanu West", "Nsukka", "Oji River", "Udenu", "Udi", "Uzo-Nyi"],
  "Gombe": ["Akko", "Balanga", "Billiri", "Dukku", "Funakaye", "Gombe", "Kaltungo", "Kwami", "Nafada", "Shongom", "Yeme"],
  "Imo": ["Aboh-Mbaise", "Ahiazu-Mbaise", "Ehime-Mbano", "Ezuah", "Ideato North", "Ideato South", "Ihitte-Uboma", "Ikeduru", "Isu", "Mbaitoli", "Ngor-Okpala", "Njaba", "Nkwerre", "Obowo", "Oguta", "Ohaji-Egbema", "Okigwe", "Orlu", "Orsu", "Oru East", "Oru West", "Owerri Municipal", "Owerri North", "Owerri West"],
  "Jigawa": ["Auyo", "Babura", "Birnin Kudu", "Birniwa", "Buji", "Dutse", "Gagarawa", "Garki", "Gumel", "Gwiwa", "Hadejia", "Jahun", "Kafin Madaki", "Kaugama", "Kazaure", "Kiyawa", "Maigatari", "Malam Madori", "Ringim", "Roni", "Sabon-Taura", "Sankargo", "Suletaryu", "Taura"],
  "Kaduna": ["Birnin-Gwari", "Chikun", "Giwa", "Ikara", "Jaba", "Jemaa", "Kaduna North", "Kaduna South", "Kagarko", "Kajuru", "Kaura", "Kubau", "Kudan", "Lere", "Makarfi", "Sabon-Gari", "Sanga", "Soba", "Zangon-Keteng", "Zaria"],
  "Kano": ["Aleiru", "Bebe", "Bichi", "Bunkure", "Dambatta", "Dawakin Kudu", "Dawakin Tofa", "Dunbulin", "Gabas", "Gaya", "Gwarzo", "Kabo", "Kano Municipal", "Karaye", "Kibiya", "Kiru", "Kumbotso", "Kura", "Madobi", "Makoda", "Minjibir", "Nasarawa", "Rano", "Rimin Gada", "Rogo", "Shanono", "Sumbure", "Takai", "Tarauni", "Tofa", "Tsanyawa", "Tudun Wada", "Ungogo", "Warawa", "Wudil"],
  "Katsina": ["Bakori", "Batagarawa", "Batsari", "Baure", "Bindawa", "Charanchi", "Dandume", "Danja", "Dan Musa", "Daura", "Dilimi", "Faskari", "Funtua", "Indivara", "Jibia", "Kafur", "Kaita", "Kankara", "Kankiya", "Katsina", "Kurfi", "Kusada", "Mai'Aduwa", "Malumfashi", "Mani", "Maru", "Mashi", "Mikinti", "Madura", "Musawa", "Rimi", "Sabuwa", "Safana", "Sandamu", "Yashaka", "Zango"],
  "Kebbi": ["Aleiro", "Arewa-Dandi", "Argungu", "Augie", "Bagudo", "Birnin Kebbi", "Bunza", "Dandi", "Danko", "Fakai", "Gwandu", "Jega", "Kalgo", "Koko/Besse", "Maiyama", "Ngaski", "Sakaba", "Shanga", "Suru", "Wasagu", "Yauri", "Zuru"],
  "Kogi": ["Adavi", "Ajaokuta", "Ankpa", "Bassa", "Dekina", "Ibaji", "Idah", "Igalamela-Odulo", "Ijumu", "Kabba/Bunu", "Koton Karfe", "Lokoja", "Ofu", "Ogori/Mangongo", "Okehi", "Okene", "Olamabolo", "Omala", "Yagba East", "Yagba West"],
  "Kwara": ["Baruten", "Edu", "Ekiti", "Ilorin East", "Ilorin South", "Ilorin West", "Irepodun", "Isin", "Kaiama", "Moro", "Offa", "Oke-Ero", "Omu-Aran", "Pategi"],
  "Lagos": ["Agege", "Ajeromi-Ifelodun", "Alimosh", "Amuwo-Odofin", "Apapa", "Badagry", "Epe", "Eti-Osa", "Ibeju-Lekki", "Ifako-Ijaye", "Ikeja", "Ikorodu", "Kosofe", "Lagos Island", "Lagos Mainland", "Mushin", "Ojo", "Oshodi-Isolo", "Shomolu", "Surulere"],
  "Nasarawa": ["Awe", "Doma", "Karu", "Keana", "Keffi", "Kokona", "Lafia", "Nasarawa", "Nasarawa Egon", "Obi", "Toto", "Wamba"],
  "Niger": ["Agwara", "Bida", "Borgu", "Chanchaga", "Edati", "Gbako", "Gwagwalada", "Ilorin", "Katcha", "Kontagora", "Lapai", "Lavun", "Magama", "Mariga", "Mashegu", "Mokwa", "Moya", "Paikoro", "Rafi", "Rijau", "Shiroro", "Suleja", "Tafa", "Wushishi"],
  "Ogun": ["Abeokuta North", "Abeokuta South", "Ado-Odo/Ota", "Ewekoro", "Ikenne", "Imeko-Afon", "Ipokia", "Obafemi Owode", "Odogbolu", "Ogun Waterside", "Remo North", "Remo South", "Sagamu", "Yewa"],
  "Ondo": ["Akoko North", "Akoko South", "Akure North", "Akure South", "Odigbo", "Oke-Oro", "Ose", "Owo"],
  "Osun": ["Aiyedaade", "Aiyegbele", "Atakumosa East", "Atakumosa West", "Boluwaduro", "Boripe", "Ede North", "Ede South", "Egbedore", "Ejigbo", "Ife Central", "Ife East", "Ife North", "Ife South", "Ila", "Ilesha East", "Ilesha West", "Irepodun", "Irewole", "Isokan", "Iwo", "Obong", "Ola- Oluwa", "Olorunda", "Oriade", "Orolu", "Osogbo"],
  "Oyo": ["Afijio", "Akinyele", "Atibo", "Atisbo", "Egbeda", "Ibadan North", "Ibadan South-East", "Ibadan South-West", "Ibarapa Central", "Ibarapa East", "Ibarapa North", "Ido", "Iseyin", "Itesiwaju", "Iwajowa", "Kajola", "Lagelu", "O gbomose", "Oderu", "Oluyole", "Ona-Ara", "Orire", "Oyo East", "Oyo West", "Saki East", "Saki West", "Surulere"],
  "Plateau": ["Barkin-Ladi", "Bassa", "Bukuru", "Jos East", "Jos North", "Jos South", "Kanam", "Kanke", "Langtang North", "Langtang South", "Mangu", "Mikang", "Pankshin", "Qua'an Pan", "Riyom", "Shendam", "Wase"],
  "Sokoto": ["Binani", "Bodinga", "Dange", "Gada", "Goronyo", "Gudu", "Gwadabawa", "Illela", "Isa", "Kebbe", "Kware", "Rabah", "Sabon Birni", "Shagari", "Sokoto North", "Sokoto South", "Tambuwal", "Tangaza", "Turefna", "Wamako", "Wara"],
  "Taraba": ["Ardo-Kola", "Bali", "Donga", "Gashaka", "Gassol", "Ibi", "Jalingo", "Karaye", "Kurfi", "Lau", "Sardauna", "Takum", "Ussa", "Wukari", "Yorro", "Zing"],
  "Yobe": ["Bade", "Borsari", "Damaturu", "Fika", "Fune", "Geidam", "Gujba", "Gulani", "Kukawa", "Machina", "Nangere", "Potiskum", "Tarmu", "Yunusuri", "Yusufari"],
  "Zamfara": ["Anka", "Bakura", "Birnin Magaji", "Bukuyyumi", "Bungudu", "Gummi", "Gusau", "Kaura Namoda", "Maradun", "Maru", "Shinkafi", "Talata Mafara", "Tsafe", "Zurmi"]
};

const serviceUnits = [
  "Choir", "Sanctuary", "Protocol", "Ushers", "Lighthouse", "Security",
  "Pastoral", "Prayer Unit", "Altar Ministrations", "Media", "Children Ministry", "Evangelism/Follow Up", "None"
];

const churchServiceUnits = [
  "Choir", "Sanctuary", "Protocol", "Ushers", "Lighthouse", "Security",
  "Pastoral", "Prayer Unit", "Altar Ministrations", "Media", "Children Ministry", "Evangelism/Follow Up"
];

function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState({ open: false, type: "", message: "" });
  const [formData, setFormData] = useState({
    surname: "", firstname: "", othername: "", email: "", phone: "",
    dob: "", address: "", stateOfOrigin: "", lga: "", occupation: "",
    hobbies: "", serviceUnit: "", serviceUnitLove: "", bornAgain: "",
    password: "", confirmPassword: "",
  });
  const [selectedState, setSelectedState] = useState("");
  const [image, setImage] = useState(null);
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState({});

  const calculateAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const sanitize = (str) => str.replace(/[<>'"&]/g, "").trim();

  const validate = () => {
    const errs = {};
    if (!formData.surname.trim()) errs.surname = "Surname is required";
    else if (!/^[a-zA-Z'-]+$/.test(formData.surname.trim().replace(/ /g, ""))) errs.surname = "Surname must contain letters only";
    if (!formData.firstname.trim()) errs.firstname = "First name is required";
    else if (!/^[a-zA-Z'-]+$/.test(formData.firstname.trim().replace(/ /g, ""))) errs.firstname = "First name must contain letters only";
    if (!formData.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = "Enter a valid email";
    if (!formData.phone.trim()) errs.phone = "Phone number is required";
    else if (!/^0\d{10}$/.test(formData.phone.trim())) errs.phone = "Enter 11-digit phone";
    if (!formData.dob) errs.dob = "Date of birth is required";
    else {
      const age = calculateAge(formData.dob);
      if (age < 18 || age > 45) errs.dob = "You must be 18-45 years old";
    }
    if (!formData.password) errs.password = "Password is required";
    else if (formData.password.length < 6) errs.password = "Password must be at least 6 characters";
    if (!formData.address.trim()) errs.address = "Address is required";
    if (!formData.stateOfOrigin) errs.stateOfOrigin = "State of Origin is required";
    if (!formData.lga) errs.lga = "Local Government Area is required";
    if (!formData.occupation.trim()) errs.occupation = "Occupation is required";
    if (!formData.serviceUnit) errs.serviceUnit = "Service Unit is required";
    if (formData.serviceUnit === "None" && !formData.serviceUnitLove) errs.serviceUnitLove = "Please select a service unit to join";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <PageLoader />;

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === "phone") value = value.replace(/\D/g, "").slice(0, 11);
    if (name === "surname" || name === "firstname" || name === "othername") value = value.toUpperCase();
    if (name === "stateOfOrigin") {
      setSelectedState(value);
      setFormData({ ...formData, [name]: value, lga: "" });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (formData.password !== formData.confirmPassword) {
      setNotification({ open: true, type: "error", message: "Passwords do not match" });
      return;
    }
    if (!terms) {
      setNotification({ open: true, type: "error", message: "You must accept the terms" });
      return;
    }
    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append("surname", sanitize(formData.surname));
      fd.append("firstname", sanitize(formData.firstname));
      fd.append("othername", sanitize(formData.othername) || "");
      fd.append("email", sanitize(formData.email));
      fd.append("phone", sanitize(formData.phone));
      fd.append("dob", formData.dob);
      fd.append("address", sanitize(formData.address));
      fd.append("stateOfOrigin", formData.stateOfOrigin || "");
      fd.append("lga", formData.lga || "");
      fd.append("occupation", sanitize(formData.occupation) || "");
      fd.append("hobbies", formData.hobbies || "");
      fd.append("serviceUnit", formData.serviceUnit || "");
      fd.append("serviceUnitLove", formData.serviceUnitLove || "");
      fd.append("bornAgain", formData.bornAgain || "Yes");
      fd.append("password", formData.password);
      if (image) fd.append("profileImage", image);

      console.log("Submitting registration...");
      for (let [key, value] of fd.entries()) {
        console.log(key, value instanceof File ? value.name : value);
      }

      const response = await API.post("/auth/register", fd);
      console.log("Registration response:", response.data);
      if (response.data?.message) {
        setSubmitting(false);
        navigate("/registration-success");
      } else throw new Error("Registration failed");
    } catch (error) {
      console.error("Registration error:", error);
      console.error("Error response:", error.response?.data);
      setSubmitting(false);
      let msg = "Registration failed. Please try again.";
      if (error.response?.data?.message) msg = String(error.response.data.message);
      else if (error.response?.status === 413) msg = "Image file is too large";
      setNotification({ open: true, type: "error", message: msg });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-4">
      {submitting && <OverlayLoader />}
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6 font-medium transition-colors">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>

        <div className="bg-white rounded-3xl shadow-2xl shadow-indigo-200/50 p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-600/25">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-800">Royal Youth Registration</h2>
            <p className="text-gray-500 mt-2">Please provide the details below</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <input type="text" name="surname" placeholder="SURNAME *" required value={formData.surname} style={{ textTransform: "uppercase" }} className={`w-full p-4 rounded-xl border-2 transition-all focus:outline-none focus:border-indigo-500 ${errors.surname ? "border-red-500" : "border-gray-200"}`} onChange={handleChange} />
                {errors.surname && <p className="text-red-500 text-sm mt-1">{errors.surname}</p>}
              </div>
              <div>
                <input type="text" name="firstname" placeholder="FIRST NAME *" required value={formData.firstname} style={{ textTransform: "uppercase" }} className={`w-full p-4 rounded-xl border-2 transition-all focus:outline-none focus:border-indigo-500 ${errors.firstname ? "border-red-500" : "border-gray-200"}`} onChange={handleChange} />
                {errors.firstname && <p className="text-red-500 text-sm mt-1">{errors.firstname}</p>}
              </div>
            </div>

            <input type="text" name="othername" placeholder="OTHER NAME (OPTIONAL)" value={formData.othername} style={{ textTransform: "uppercase" }} className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none transition-all" onChange={handleChange} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <input type="email" name="email" placeholder="Email *" required value={formData.email} className={`w-full p-4 rounded-xl border-2 transition-all focus:outline-none focus:border-indigo-500 ${errors.email ? "border-red-500" : "border-gray-200"}`} onChange={handleChange} />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
              <div>
                <input type="tel" name="phone" placeholder="Phone (11 digits) *" required value={formData.phone} className={`w-full p-4 rounded-xl border-2 transition-all focus:outline-none focus:border-indigo-500 ${errors.phone ? "border-red-500" : "border-gray-200"}`} onChange={handleChange} />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm text-gray-600 mb-1 font-medium">Date of Birth (Age 18-45) *</label>
                <input type="date" name="dob" required value={formData.dob} className={`w-full p-4 rounded-xl border-2 transition-all focus:outline-none focus:border-indigo-500 ${errors.dob ? "border-red-500" : "border-gray-200"}`} onChange={handleChange} />
                {errors.dob && <p className="text-red-500 text-sm mt-1">{errors.dob}</p>}
              </div>
              <div>
                <input type="text" name="occupation" placeholder="Occupation *" required className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none transition-all" onChange={handleChange} />
              </div>
            </div>

            <input type="text" name="address" placeholder="Address *" required className={`w-full p-4 rounded-xl border-2 transition-all focus:outline-none focus:border-indigo-500 ${errors.address ? "border-red-500" : "border-gray-200"}`} onChange={handleChange} />
            {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <select name="stateOfOrigin" required className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none transition-all" onChange={handleChange}>
                <option value="">State of Origin *</option>
                {nigerianStates.map((state) => (<option key={state} value={state}>{state}</option>))}
              </select>
              <select name="lga" required disabled={!selectedState} className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none transition-all disabled:opacity-50">
                <option value="">Local Government Area *</option>
                {selectedState && lgaByState[selectedState]?.map((lga) => (<option key={lga} value={lga}>{lga}</option>))}
              </select>
            </div>

            <input type="text" name="hobbies" placeholder="Hobbies (e.g., Reading, Football, Music)" className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none transition-all" onChange={handleChange} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <select name="serviceUnit" required value={formData.serviceUnit} className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none transition-all" onChange={handleChange}>
                <option value="">Service Unit in Church *</option>
                {serviceUnits.map((unit) => (<option key={unit} value={unit}>{unit}</option>))}
              </select>

              {formData.serviceUnit === "None" && (
                <select name="serviceUnitLove" value={formData.serviceUnitLove} className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none transition-all" onChange={handleChange}>
                  <option value="">Select Unit to Join *</option>
                  {churchServiceUnits.map((unit) => (<option key={unit} value={unit}>{unit}</option>))}
                  <option value="None">None</option>
                </select>
              )}
            </div>

            <select name="bornAgain" required className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none transition-all" onChange={handleChange}>
              <option value="">Born Again? *</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
              <option value="Not sure">Not Sure</option>
            </select>

            <div>
              <label className="block text-sm text-gray-600 mb-1 font-medium">Profile Image (Optional)</label>
              <input type="file" name="profileImage" accept="image/*" className="w-full p-3 rounded-xl border-2 border-gray-200" onChange={(e) => setImage(e.target.files[0] || null)} />
              {image && <p className="text-sm text-gray-500 mt-1">{image.name} ({(image.size / 1024).toFixed(1)} KB)</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <input type="password" name="password" placeholder="Password *" required className={`w-full p-4 rounded-xl border-2 transition-all focus:outline-none focus:border-indigo-500 ${errors.password ? "border-red-500" : "border-gray-200"}`} onChange={handleChange} />
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>
              <input type="password" name="confirmPassword" placeholder="Confirm Password *" required className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none transition-all" onChange={handleChange} />
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <input type="checkbox" className="mt-1 w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
              <label className="text-sm text-gray-600">I agree to abide by the Terms and Conditions of the Royal Youth Community</label>
            </div>

            <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]">
              Create Account
            </button>
          </form>
        </div>
      </div>

      <Notification type={notification.type} message={notification.message} isOpen={notification.open} onClose={() => setNotification({ ...notification, open: false })} />
    </div>
  );
}

export default Register;
