import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
    surname: "",
    firstname: "",
    othername: "",
    email: "",
    phone: "",
    dob: "",
    address: "",
    stateOfOrigin: "",
    lga: "",
    occupation: "",
    hobbies: "",
    serviceUnit: "",
    serviceUnitLove: "",
    bornAgain: "",
    password: "",
    confirmPassword: "",
  });
  const [selectedState, setSelectedState] = useState("");
  const [image, setImage] = useState(null);
  const [terms, setTerms] = useState(false);
  const calculateAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };
  
  const [errors, setErrors] = useState({});
  
  const sanitize = (str) => str.replace(/[<>'"&]/g, "").trim();
  
  const validate = () => {
    const errs = {};
    
    if (!formData.surname.trim()) {
      errs.surname = "Surname is required";
    } else if (!/^[a-zA-Z]+$/.test(formData.surname.trim())) {
      errs.surname = "Surname must be letters only, one word";
    }
    
    if (!formData.firstname.trim()) {
      errs.firstname = "First name is required";
    } else if (!/^[a-zA-Z]+$/.test(formData.firstname.trim())) {
      errs.firstname = "First name must be letters only, one word";
    }
    
    if (!formData.email.trim()) {
      errs.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = "Enter a valid email address";
    }
    
    if (!formData.phone.trim()) {
      errs.phone = "Phone number is required";
    } else if (!/^0\d{10}$/.test(formData.phone.trim())) {
      errs.phone = "Enter 11-digit phone starting with 0";
    }
    
    if (!formData.dob) {
      errs.dob = "Date of birth is required";
    } else {
      const age = calculateAge(formData.dob);
      if (age < 18) {
        errs.dob = "You must be at least 18 years old";
      } else if (age > 45) {
        errs.dob = "You must be 45 years or younger";
      }
    }
    
    if (!formData.password) {
      errs.password = "Password is required";
    } else if (formData.password.length < 6) {
      errs.password = "Password must be at least 6 characters";
    }
    
    if (!formData.address.trim()) {
      errs.address = "Address is required";
    }
    
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
    
    if (name === "phone") {
      value = value.replace(/\D/g, "").slice(0, 11);
    }
    
    if (name === "surname" || name === "firstname" || name === "othername") {
      value = value.toUpperCase();
    }
    
    if (name === "stateOfOrigin") {
      setSelectedState(value);
      setFormData({
        ...formData,
        [name]: value,
        lga: "",
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
    
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
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

      if (image) {
        fd.append("profileImage", image, image.name);
      }

      const response = await API.post("/auth/register", fd);
      
      if (response.data?.message) {
        navigate("/registration-success");
      } else {
        throw new Error("Registration failed. Please try again.");
      }
    } catch (error) {
      setSubmitting(false);
      let msg = "Registration failed. Please try again.";
      
      if (error.response?.data?.message) {
        msg = String(error.response.data.message);
      } else if (error.response?.status === 413) {
        msg = "Image file is too large. Please use a smaller image.";
      } else if (error.message) {
        msg = String(error.message);
      }
      
      setNotification({ open: true, type: "error", message: msg });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4">
      {submitting && <OverlayLoader />}
      <div className="max-w-xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <h2 className="text-xl md:text-2xl font-bold mb-4 text-center text-memberBlue">
            Royal Youth Registration
          </h2>
          <p className="text-center text-gray-500 mb-6 text-sm">
            Please provide the details below
          </p>

          <div className="space-y-4">
            <div>
              <input
                type="text"
                name="surname"
                placeholder="SURNAME *"
                required
                value={formData.surname}
                style={{ textTransform: "uppercase" }}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-memberBlue focus:outline-none ${errors.surname ? "border-red-500" : ""}`}
                onChange={handleChange}
              />
              {errors.surname && <p className="text-red-500 text-sm mt-1">{errors.surname}</p>}
            </div>

            <div>
              <input
                type="text"
                name="firstname"
                placeholder="FIRST NAME *"
                required
                value={formData.firstname}
                style={{ textTransform: "uppercase" }}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-memberBlue focus:outline-none ${errors.firstname ? "border-red-500" : ""}`}
                onChange={handleChange}
              />
              {errors.firstname && <p className="text-red-500 text-sm mt-1">{errors.firstname}</p>}
            </div>

            <input
              type="text"
              name="othername"
              placeholder="OTHER NAME (OPTIONAL)"
              value={formData.othername}
              style={{ textTransform: "uppercase" }}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-memberBlue focus:outline-none"
              onChange={handleChange}
            />

            <div>
              <input
                type="email"
                name="email"
                placeholder="Email *"
                required
                value={formData.email}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-memberBlue focus:outline-none ${errors.email ? "border-red-500" : ""}`}
                onChange={handleChange}
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number (11 digits, starts with 0) *"
                required
                value={formData.phone}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-memberBlue focus:outline-none ${errors.phone ? "border-red-500" : ""}`}
                onChange={handleChange}
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Date of Birth (Age 18-45) *</label>
              <input
                type="date"
                name="dob"
                required
                value={formData.dob}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-memberBlue focus:outline-none ${errors.dob ? "border-red-500" : ""}`}
                onChange={handleChange}
              />
              {errors.dob && <p className="text-red-500 text-sm mt-1">{errors.dob}</p>}
            </div>

            <div>
              <input
                type="text"
                name="address"
                placeholder="Address *"
                required
                value={formData.address}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-memberBlue focus:outline-none ${errors.address ? "border-red-500" : ""}`}
                onChange={handleChange}
              />
              {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
            </div>

            <select
              name="stateOfOrigin"
              required
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-memberBlue focus:outline-none"
              onChange={handleChange}
            >
              <option value="">State of Origin *</option>
              {nigerianStates.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>

            <select
              name="lga"
              required
              disabled={!selectedState}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-memberBlue focus:outline-none disabled:opacity-50"
              onChange={handleChange}
            >
              <option value="">Local Government Area *</option>
              {selectedState && lgaByState[selectedState]?.map((lga) => (
                <option key={lga} value={lga}>{lga}</option>
              ))}
            </select>

            <input
              type="text"
              name="occupation"
              placeholder="Occupation *"
              required
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-memberBlue focus:outline-none"
              onChange={handleChange}
            />

            <input
              type="text"
              name="hobbies"
              placeholder="Hobbies (e.g., Reading, Football, Music)"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-memberBlue focus:outline-none"
              onChange={handleChange}
            />

            <select
              name="serviceUnit"
              required
              value={formData.serviceUnit}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-memberBlue focus:outline-none"
              onChange={handleChange}
            >
              <option value="">Service Unit(s) in Soulwinners Int'l Church? *</option>
              {serviceUnits.map((unit) => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>

            {formData.serviceUnit === "None" && (
              <select
                name="serviceUnitLove"
                value={formData.serviceUnitLove}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-memberBlue focus:outline-none"
                onChange={handleChange}
              >
                <option value="">Select Service Unit to Join *</option>
                {churchServiceUnits.map((unit) => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
                <option value="None">None</option>
              </select>
            )}

            <select
              name="bornAgain"
              required
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-memberBlue focus:outline-none"
              onChange={handleChange}
            >
              <option value="">Born Again? *</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
              <option value="Not sure">Not Sure</option>
            </select>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Profile Image (Optional)</label>
              <input
                type="file"
                name="profileImage"
                accept="image/*"
                className="w-full p-2 border rounded-lg"
                onChange={(e) => setImage(e.target.files[0] || null)}
              />
              {image && <p className="text-sm text-gray-500 mt-1">{image.name} ({(image.size / 1024).toFixed(1)} KB)</p>}
            </div>

            <div>
              <input
                type="password"
                name="password"
                placeholder="Password *"
                required
                value={formData.password}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-memberBlue focus:outline-none ${errors.password ? "border-red-500" : ""}`}
                onChange={handleChange}
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password *"
              required
              value={formData.confirmPassword}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-memberBlue focus:outline-none"
              onChange={handleChange}
            />

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                className="mt-1"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
              />
              <label className="text-sm text-gray-600">
                I agree to the Terms and Conditions
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-memberOrange text-white p-3 rounded-lg font-semibold mt-6 hover:bg-orange-600 transition"
          >
            Create Account
          </button>
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

export default Register;