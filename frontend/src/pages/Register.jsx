import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Notification from "../components/Notification";

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
  "Pastoral", "Prayer Unit", "Altar Ministrations", "Media", "Children Ministry", "None"
];

function Register() {
  const navigate = useNavigate();
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setNotification({ open: true, type: "error", message: "Passwords do not match" });
      return;
    }

    if (!terms) {
      setNotification({ open: true, type: "error", message: "You must accept the terms" });
      return;
    }

    if (formData.dob) {
      const age = calculateAge(formData.dob);
      if (age < 18 || age > 45) {
        setNotification({ 
          open: true, 
          type: "error", 
          message: "You must be between 18 and 45 years old to register in the Royal Youth Community." 
        });
        return;
      }
    }

    try {
      const data = new FormData();

      data.append("surname", formData.surname);
      data.append("firstname", formData.firstname);
      data.append("othername", formData.othername);
      data.append("email", formData.email);
      data.append("phone", formData.phone);
      data.append("dob", formData.dob);
      data.append("address", formData.address);
      data.append("stateOfOrigin", formData.stateOfOrigin);
      data.append("lga", formData.lga);
      data.append("occupation", formData.occupation);
      data.append("hobbies", formData.hobbies);
      data.append("serviceUnit", formData.serviceUnit);
      data.append("serviceUnitLove", formData.serviceUnitLove);
      data.append("bornAgain", formData.bornAgain);
      data.append("password", formData.password);

      if (image) {
        data.append("profileImage", image);
      }

      await API.post("/auth/register", data);

      navigate("/registration-success");
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Registration failed";
      setNotification({ open: true, type: "error", message: errorMsg });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4">
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
            <input
              type="text"
              name="surname"
              placeholder="Surname *"
              required
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-memberBlue focus:outline-none"
              onChange={handleChange}
            />

            <input
              type="text"
              name="firstname"
              placeholder="First Name *"
              required
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-memberBlue focus:outline-none"
              onChange={handleChange}
            />

            <input
              type="text"
              name="othername"
              placeholder="Other Name (Optional)"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-memberBlue focus:outline-none"
              onChange={handleChange}
            />

            <input
              type="email"
              name="email"
              placeholder="Email (Optional)"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-memberBlue focus:outline-none"
              onChange={handleChange}
            />

            <input
              type="tel"
              name="phone"
              placeholder="Phone Number *"
              required
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-memberBlue focus:outline-none"
              onChange={handleChange}
            />

            <div>
              <label className="block text-sm text-gray-600 mb-1">Date of Birth *</label>
              <input
                type="date"
                name="dob"
                required
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-memberBlue focus:outline-none"
                onChange={handleChange}
              />
            </div>

            <input
              type="text"
              name="address"
              placeholder="Address (Optional)"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-memberBlue focus:outline-none"
              onChange={handleChange}
            />

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
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-memberBlue focus:outline-none"
              onChange={handleChange}
            >
              <option value="">What service Unit(s) do you belong to in Royal Youth? *</option>
              {serviceUnits.map((unit) => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>

            {formData.serviceUnit === "None" && (
              <input
                type="text"
                name="serviceUnitLove"
                placeholder="What service unit would you love to join in Royal Youth Department?"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-memberBlue focus:outline-none"
                onChange={handleChange}
              />
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
                accept="image/*"
                className="w-full p-2 border rounded-lg"
                onChange={(e) => setImage(e.target.files[0])}
              />
            </div>

            <input
              type="password"
              name="password"
              placeholder="Password *"
              required
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-memberBlue focus:outline-none"
              onChange={handleChange}
            />

            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password *"
              required
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