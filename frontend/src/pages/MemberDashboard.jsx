import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useNavigate, Link, useLocation, useSearchParams } from "react-router-dom";
import API from "../services/api";
import CreatePost from "../components/CreatePost";
import PostCard from "../components/PostCard";
import RssCard from "../components/RssCard";
import { optimizeImage } from "../utils/cloudinary";
import ConfirmModal from "../components/ConfirmModal";
import { displayName, displayNameFull } from "../utils/displayName";
import { timeAgo, formatDate } from "../utils/formatTime";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import LiveFeedSection from "../components/LiveFeedSection";
import GoLiveModal from "../components/GoLiveModal";
import LiveRoom from "../components/LiveRoom";
import { useLive } from "../contexts/LiveContext";
import { PageLoader, Spinner } from "../components/Loaders";

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

const linkifyText = (text) => {
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  return text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-500 underline break-all">$1</a>');
};
import { connectSocket, getSocket } from "../services/socket";

function MemberDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { liveRoom, showGoLiveModal, setShowGoLiveModal } = useLive();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "community");
  const switchTab = useCallback((tab) => {
    setActiveTab(tab);
    if (persistableTabs.includes(tab)) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", tab);
        next.delete("post");
        return next;
      }, { replace: true });
    }
  }, [setSearchParams]);
  const persistableTabs = useMemo(() => ["feed", "hub-connect", "community", "inspiration", "leaderboard", "statistics", "profile", "dues", "attendance"], []);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);

  // Feed state
  const [posts, setPosts] = useState([]);
  const [pinnedPosts, setPinnedPosts] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedPage, setFeedPage] = useState(1);
  const [feedHasMore, setFeedHasMore] = useState(false);
  const [feedLoadingMore, setFeedLoadingMore] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [expandedNotif, setExpandedNotif] = useState(null);
  const [showAllNotifs, setShowAllNotifs] = useState(false);
  const [clearAllConfirm, setClearAllConfirm] = useState(false);
  const [showNicknamePrompt, setShowNicknamePrompt] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");
  const [genderInput, setGenderInput] = useState("");
  const [stateOfOriginInput, setStateOfOriginInput] = useState("");
  const [lgaInput, setLgaInput] = useState("");
  const [selectedPromptState, setSelectedPromptState] = useState("");

  // Friends
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const shuffledSuggested = useMemo(() => [...suggested].sort(() => Math.random() - 0.5), [suggested]);
  const [friendLoading, setFriendLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [leaderboardView, setLeaderboardView] = useState("list");
  const [lbMemberPosts, setLbMemberPosts] = useState([]);
  const [lbMemberPostsLoading, setLbMemberPostsLoading] = useState(false);
  const [hubPosts, setHubPosts] = useState([]);
  const [hubPostsLoading, setHubPostsLoading] = useState(false);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsYear, setStatsYear] = useState(new Date().getFullYear());
  const [communityPosts, setCommunityPosts] = useState([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [communityPage, setCommunityPage] = useState(1);
  const [communityHasMore, setCommunityHasMore] = useState(false);
  const [communityLoadingMore, setCommunityLoadingMore] = useState(false);
  const fetchCommunityFeed = async (p = 1, reset = false) => {
    if (reset) setCommunityLoading(true); else setCommunityLoadingMore(true);
    try {
      const res = await API.get(`/posts/feed?page=${p}&limit=20`);
      if (reset) setCommunityPosts(res.data.posts);
      else setCommunityPosts(prev => [...prev, ...res.data.posts]);
      setCommunityHasMore(res.data.hasMore);
      setCommunityPage(p);
    } catch (err) { console.error("Community feed error:", err); }
    finally { setCommunityLoading(false); setCommunityLoadingMore(false); }
  };

  useEffect(() => {
    if (activeTab === "community") {
      fetchCommunityFeed(1, true);
    }
  }, [activeTab]);

  const [availableSources, setAvailableSources] = useState([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [showAllFeeds, setShowAllFeeds] = useState(false);
  const shuffledSources = useMemo(() => [...availableSources].sort(() => Math.random() - 0.5), [availableSources]);
  const [externalFeed, setExternalFeed] = useState([]);
  const [externalLoading, setExternalLoading] = useState(false);
  const [feedCategory, setFeedCategory] = useState("all");

  // Existing features state
  const [attendance, setAttendance] = useState([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [viewingImage, setViewingImage] = useState(null);
  const [viewingMemberId, setViewingMemberId] = useState(null);
  const [viewedMember, setViewedMember] = useState(null);
  const [viewingMemberLoading, setViewingMemberLoading] = useState(false);
  const [viewedMemberPosts, setViewedMemberPosts] = useState([]);
  const [viewedMemberPostsLoading, setViewedMemberPostsLoading] = useState(false);
  const [viewingPost, setViewingPost] = useState(null);
  const [viewingPostLoading, setViewingPostLoading] = useState(false);
  const [showHandbookModal, setShowHandbookModal] = useState(false);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [showSpecialModal, setShowSpecialModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);
  const hasShownBirthday = useRef(false);
  const [selectedResponse, setSelectedResponse] = useState("");
  const [pendingResponse, setPendingResponse] = useState("");
  const [responseSubmitted, setResponseSubmitted] = useState(false);
  const [specialPayments, setSpecialPayments] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [specialPurpose, setSpecialPurpose] = useState("");
  const [specialAmount, setSpecialAmount] = useState("");
  const [selectedYear, setSelectedYear] = useState("2026");
  const [showMore2027, setShowMore2027] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    const fetchData = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const ref = params.get("reference");
        const trx = params.get("trx");
        const purpose = params.get("purpose");
        const amount = params.get("amount");
        const month = params.get("month");

        if (trx === "success" && ref) {
          const verifyData = { reference: ref };
          if (month) verifyData.month = month;
          if (purpose) { verifyData.purpose = purpose; verifyData.amount = amount; await API.post("/payment/special-verify", verifyData); }
          else { await API.post("/payment/verify", verifyData); }
          window.history.replaceState({}, "", "/dashboard");
        }

        const userRes = await API.get("/auth/me");
        if (userRes.data._id === "admin" && userRes.data.role === "admin") { navigate("/admin"); return; }
        setUser(userRes.data);
        if (!userRes.data.nickname || !userRes.data.gender || !userRes.data.stateOfOrigin || !userRes.data.lga) { setNicknameInput(userRes.data.nickname || ""); setGenderInput(userRes.data.gender || ""); setStateOfOriginInput(userRes.data.stateOfOrigin || ""); setLgaInput(userRes.data.lga || ""); setSelectedPromptState(userRes.data.stateOfOrigin || ""); setShowNicknamePrompt(true); }

        const cutoffDate = new Date(2026, 4, 4, 17, 0, 0);
        if (new Date() < cutoffDate) {
          setShowReminderModal(true);
          document.body.style.overflow = 'hidden';
          try {
            const responsesRes = await API.get("/meeting-responses/meeting?title=" + encodeURIComponent("Family Meeting - 4th May 2026 by 5pm"));
            const userResponse = responsesRes.data?.find(r => r.user?._id === userRes.data?._id);
            if (userResponse) { setSelectedResponse(userResponse.response); setResponseSubmitted(true); }
          } catch (e) { console.error(e); }
        }

        try { const attendRes = await API.get("/attendance/my-attendance"); setAttendance(attendRes.data || []); } catch (e) { setAttendance([]); }
        try { const specialRes = await API.get("/payment/special-payments"); setSpecialPayments(specialRes.data || []); } catch (e) { setSpecialPayments([]); }
      } catch (error) {
        if (error.response?.status === 401) { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/login"); return; }
        setUser({ firstname: "", surname: "", profileImage: "" });
        setAttendance([]);
        setSpecialPayments([]);
      } finally { setLoading(false); }
    };

    fetchData();
  }, [navigate]);

  useEffect(() => {
    if (!loading && !user) setUser({ firstname: "", surname: "", profileImage: "" });
  }, [loading, user]);

  useEffect(() => {
    if (showReminderModal) { document.body.style.overflow = 'hidden'; }
    else { document.body.style.overflow = 'unset'; }
    return () => { document.body.style.overflow = 'unset'; };
  }, [showReminderModal]);

  useEffect(() => {
    if (!user?._id) return;
    fetchCommunityFeed(1, true);
    fetchFeed(1, true);
    fetchPinnedPosts();
    fetchFriendData();
    fetchNotifications();
    fetchLeaderboard();
  }, [user?._id]);

  useEffect(() => {
    if (activeTab === "statistics") fetchMonthlyStats(statsYear);
  }, [activeTab, statsYear]);

  useEffect(() => {
    if (activeTab === "inspiration") fetchExternalFeed();
    if (activeTab === "feed" || activeTab === "community") fetchAvailableSources();
  }, [activeTab]);

  useEffect(() => {
    if (!user?._id) return;
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user?._id]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const notifId = params.get("notif");
    if (notifId) {
      setShowRightPanel(true);
      setExpandedNotif(notifId);
      const url = new URL(window.location);
      url.searchParams.delete("notif");
      window.history.replaceState({}, "", url);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const postId = params.get("post");
    if (postId) {
      setActiveTab("viewing-post");
      setViewingPostLoading(true);
      API.get(`/posts/public/${postId}`)
        .then((res) => setViewingPost(res.data))
        .catch(() => setViewingPost(null))
        .finally(() => setViewingPostLoading(false));
    }
  }, [location.search]);

  useEffect(() => {
    if (!user?._id) return;
    connectSocket();
    const socket = getSocket();
    if (!socket) return;

      const handleNewPost = (post) => {
        const isFriend = friends.some((f) => f._id === post.userId?._id);
        const isAnnouncement = post.isPinned && post.pinnedAt;
        if (isFriend || isAnnouncement) {
          setPosts((prev) => {
            if (prev.some((p) => p._id === post._id)) return prev;
            return [post, ...prev];
          });
        }
        setCommunityPosts((prev) => {
          if (prev.some((p) => p._id === post._id)) return prev;
          return [post, ...prev];
        });
      };

     const handlePostDeleted = ({ postId }) => {
       setPosts((prev) => prev.filter((p) => p._id !== postId));
       setHubPosts((prev) => prev.filter((p) => p._id !== postId));
       setCommunityPosts((prev) => prev.filter((p) => p._id !== postId));
     };

    const handleAnnouncementEvent = () => { fetchPinnedPosts(); };

    const handleNewNotification = () => { fetchNotifications(); };

    const handleFriendUpdate = () => { fetchFriendData(); };

    socket.on("newPost", handleNewPost);
    socket.on("postDeleted", handlePostDeleted);
    socket.on("newAnnouncement", handleAnnouncementEvent);
    socket.on("announcementUpdated", handleAnnouncementEvent);
    socket.on("announcementDeleted", handleAnnouncementEvent);
    socket.on("announcementUnpinned", handleAnnouncementEvent);
    socket.on("newNotification", handleNewNotification);
    socket.on("friendRequestUpdate", handleFriendUpdate);

    return () => {
      socket.off("newAnnouncement", handleAnnouncementEvent);
      socket.off("announcementUpdated", handleAnnouncementEvent);
      socket.off("announcementDeleted", handleAnnouncementEvent);
      socket.off("announcementUnpinned", handleAnnouncementEvent);
      socket.off("newNotification", handleNewNotification);
      socket.off("friendRequestUpdate", handleFriendUpdate);
    };
  }, [user?._id, friends]);

  useEffect(() => {
    if (!loading && user && isBirthday) {
      hasShownBirthday.current = true;
    }
  }, [loading, user]);

  const fetchFeed = async (p = 1, reset = false) => {
    if (reset) setFeedLoading(true); else setFeedLoadingMore(true);
    try {
      const res = await API.get(`/posts/friends-feed?page=${p}&limit=20`);
      if (reset) setPosts(res.data.posts);
      else setPosts(prev => [...prev, ...res.data.posts]);
      setFeedHasMore(res.data.hasMore);
      setFeedPage(p);
    } catch (err) { console.error("Feed error:", err); }
    finally { setFeedLoading(false); setFeedLoadingMore(false); }
  };

  const fetchPinnedPosts = async () => {
    try {
      const res = await API.get("/posts/pinned");
      setPinnedPosts(res.data.posts || []);
    } catch (err) { console.error("Pinned posts error:", err); }
  };

  const fetchFriendData = async () => {
    setFriendLoading(true);
    try {
      const [reqRes, sugRes, friendsRes] = await Promise.all([
        API.get("/friends/requests"),
        API.get("/friends/suggested"),
        API.get("/friends/list"),
      ]);
      setFriendRequests(reqRes.data);
      setSuggested(sugRes.data);
      setFriends(friendsRes.data);
    } catch (err) { console.error("Friend data error:", err); }
    finally { setFriendLoading(false); }
  };

  const fetchHubPosts = async () => {
    setHubPostsLoading(true);
    try {
      const res = await API.get("/posts/friends-feed?page=1&limit=10");
      setHubPosts(res.data.posts || []);
    } catch (err) {
      console.error("Hub posts error:", err);
    }
    setHubPostsLoading(false);
  };

  useEffect(() => {
    if (activeTab === "hub-connect") {
      fetchHubPosts();
    }
  }, [activeTab]);

  const fetchLeaderboard = async () => {
    setLeaderboardLoading(true);
    try {
      const res = await API.get("/leaderboard");
      setLeaderboard(res.data);
    } catch (err) {
      console.error("Leaderboard error:", err);
    }
    setLeaderboardLoading(false);
  };

  const fetchMonthlyStats = async (year) => {
    setStatsLoading(true);
    try {
      const res = await API.get(`/stats/monthly?year=${year || statsYear}`);
      setMonthlyStats(res.data);
    } catch (err) {
      console.error("Monthly stats error:", err);
    }
    setStatsLoading(false);
  };

  const fetchExternalFeed = async () => {
    setExternalLoading(true);
    try {
      const res = await API.get("/feeds/external");
      setExternalFeed(res.data.posts || []);
    } catch (err) {
      console.error("External feed error:", err);
    }
    setExternalLoading(false);
  };

  const fetchAvailableSources = async () => {
    setSourcesLoading(true);
    try {
      const res = await API.get("/feeds/available");
      setAvailableSources(res.data || []);
    } catch (err) {
      console.error("Available sources error:", err);
    }
    setSourcesLoading(false);
  };

  const handleFollowSource = async (sourceId) => {
    try {
      await API.post(`/feeds/follow/${sourceId}`);
      setAvailableSources((prev) => prev.map((s) => s.sourceId === sourceId ? { ...s, following: true } : s));
      if (activeTab === "community") fetchCommunityFeed(1, true);
    } catch (err) { console.error(err); }
  };

  const handleUnfollowSource = async (sourceId) => {
    try {
      await API.delete(`/feeds/follow/${sourceId}`);
      setAvailableSources((prev) => prev.map((s) => s.sourceId === sourceId ? { ...s, following: false } : s));
      if (activeTab === "community") fetchCommunityFeed(1, true);
    } catch (err) { console.error(err); }
  };

  const fetchLbMemberPosts = async (userId) => {
    setLbMemberPostsLoading(true);
    try {
      const res = await API.get(`/posts/user/${userId}`);
      setLbMemberPosts(res.data.posts || res.data || []);
    } catch (err) {
      console.error("LB member posts error:", err);
      setLbMemberPosts([]);
    }
    setLbMemberPostsLoading(false);
  };

  const updateBadge = (count) => {
    if (count > 0) { try { navigator.setAppBadge?.(count); } catch (_) {} } else { try { navigator.clearAppBadge?.(); } catch (_) {} }
    navigator.serviceWorker?.ready?.then(r => r.active?.postMessage({ type: "SET_BADGE", count })).catch(() => {});
  };

  const fetchNotifications = async () => {
    try {
      const res = await API.get("/notifications");
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
      updateBadge(res.data.unreadCount);
    } catch (err) { console.error("Notif error:", err); }
  };

  const markNotifRead = async () => {
    try { await API.put("/notifications/read"); setUnreadCount(0); setNotifications(prev => prev.map(n => ({ ...n, read: true }))); updateBadge(0); }
    catch (err) { console.error(err); }
  };

  const deleteNotif = async (id, e) => {
    e.stopPropagation();
    try {
      await API.delete(`/notifications/${id}`);
      setNotifications(prev => { const next = prev.filter(n => n._id !== id); updateBadge(next.filter(n => !n.read).length); return next; });
    } catch (err) { console.error(err); }
  };

  const handlePostCreated = useCallback((post) => { setPosts(prev => [post, ...prev]); }, []);
  const handleCommunityPostCreated = useCallback((post) => { setCommunityPosts(prev => [post, ...prev]); }, []);
  const handleDeletePost = useCallback((postId) => {
    setPosts(prev => prev.filter(p => p._id !== postId));
    setHubPosts(prev => prev.filter(p => p._id !== postId));
  }, []);

  const handleShare = useCallback((post) => {
    navigate("/messages", { state: { sharedPost: { _id: post._id, text: post.text, imageUrl: post.imageUrl } } });
  }, [navigate]);

  const handleViewMember = (id) => {
    setViewingMemberId(id);
    setViewedMember(null);
    setActiveTab("viewing-member");
  };

  const closeViewMember = () => {
    setViewingMemberId(null);
    setViewedMember(null);
    if (activeTab === "viewing-member") switchTab("community");
  };

  const closeViewPost = () => {
    setViewingPost(null);
    if (activeTab === "viewing-post") switchTab("community");
    const url = new URL(window.location);
    url.searchParams.delete("post");
    window.history.replaceState({}, "", url);
  };

  useEffect(() => {
    if (!viewingMemberId) return;
    setViewingMemberLoading(true);
    API.get(`/auth/member/${viewingMemberId}`)
      .then((res) => setViewedMember(res.data))
      .catch(() => setViewedMember(null))
      .finally(() => setViewingMemberLoading(false));
    setViewedMemberPostsLoading(true);
    API.get(`/posts/user/${viewingMemberId}`)
      .then((res) => setViewedMemberPosts(res.data.posts || []))
      .catch(() => setViewedMemberPosts([]))
      .finally(() => setViewedMemberPostsLoading(false));
  }, [viewingMemberId]);

  const handleAcceptRequest = async (id) => {
    try { await API.put(`/friends/accept/${id}`); fetchFriendData(); }
    catch (err) { console.error(err); }
  };

  const handleRejectRequest = async (id) => {
    try { await API.put(`/friends/reject/${id}`); fetchFriendData(); }
    catch (err) { console.error(err); }
  };

  const handleSendRequest = async (userId) => {
    try { await API.post("/friends/request", { userId }); fetchFriendData(); }
    catch (err) { console.error(err); }
  };

  const handleCancelRequest = async (userId) => {
    try { await API.put("/friends/cancel", { userId }); fetchFriendData(); }
    catch (err) { console.error(err); }
  };

  const handleMessageFriend = (friendId) => {
    navigate("/messages", { state: { directUserId: friendId } });
  };

  const handleLogout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/"); };

  const calculateAge = (dob) => {
    if (!dob) return 0;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const mdiff = today.getMonth() - birth.getMonth();
    if (mdiff < 0 || (mdiff === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const isBirthday = (() => {
    try {
      if (!user?.dob) return false;
      const today = new Date();
      const birth = new Date(user.dob);
      if (isNaN(birth.getTime())) return false;
      return today.getDate() === birth.getDate() && today.getMonth() === birth.getMonth();
    } catch { return false; }
  })();

  const months = ["May","June","July","August","September","October","November","December"];
  const allMonths = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  const handlePayOffline = (month, year = "2026") => { setSelectedMonth(month); setSelectedYear(year); setShowOfflineModal(true); };
  const handleSpecialPayOffline = () => { if (!specialPurpose || !specialAmount) { alert("Please enter purpose and amount"); return; } setShowSpecialModal(false); setShowOfflineModal(true); };
  const refreshSpecialPayments = async () => { try { const r = await API.get("/payment/special-payments"); setSpecialPayments(r.data || []); } catch (e) { console.error(e); } };

  if (loading) {
    return <PageLoader />;
  }

  const renderLeftSidebar = () => (
    <div className="space-y-4">
      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
        <div className="w-16 h-16 rounded-full bg-purple-100 mx-auto flex items-center justify-center overflow-hidden cursor-pointer" onClick={() => user.profileImage && setShowImageModal(true)}>
          {user.profileImage ? <img src={optimizeImage(user.profileImage, 96)} alt="" className="w-full h-full object-cover" loading="lazy" /> : <span className="text-purple-600 font-bold text-xl">{user.firstname?.[0]}{user.surname?.[0]}</span>}
        </div>
        <p className="font-semibold mt-2">{displayNameFull(user)}</p>
        <p className="text-gray-400 text-xs">{user.branch}</p>
        <p className={`text-xs mt-1 font-medium ${user.membershipStatus === "Active Member" ? "text-green-600" : "text-red-500"}`}>{user.membershipStatus}</p>
        <p className={`text-xs mt-0.5 font-medium ${
          user.role === "youth_president" ? "text-yellow-600" :
          user.role === "admin" ? "text-purple-600" : "text-gray-500"
        }`}>{user.role === "youth_president" ? "Youth President" : user.role === "admin" ? "Admin" : "Member"}</p>
      </div>

      {/* Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2">
        <button onClick={() => { switchTab("community"); setShowMobileNav(false); }} className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition ${activeTab === "community" ? "bg-purple-100 text-purple-700" : "text-gray-600 hover:bg-gray-50"}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
          Community
        </button>
        <button onClick={() => { switchTab("feed"); setShowMobileNav(false); }} className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition ${activeTab === "feed" ? "bg-purple-100 text-purple-700" : "text-gray-600 hover:bg-gray-50"}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
          Feed
        </button>
        <button onClick={() => { switchTab("hub-connect"); setShowMobileNav(false); }} className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition ${activeTab === "hub-connect" ? "bg-purple-100 text-purple-700" : "text-gray-600 hover:bg-gray-50"}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
          Hub-Connect
        </button>
        <button onClick={() => { switchTab("inspiration"); setShowMobileNav(false); }} className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition ${activeTab === "inspiration" ? "bg-purple-100 text-purple-700" : "text-gray-600 hover:bg-gray-50"}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
          Inspiration
        </button>
        <Link to="/messages" className="flex items-center gap-3 p-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          Messages
        </Link>
        <button onClick={() => { switchTab("leaderboard"); setShowMobileNav(false); }} className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition ${activeTab === "leaderboard" ? "bg-purple-100 text-purple-700" : "text-gray-600 hover:bg-gray-50"}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          Leaderboard
        </button>
        <button onClick={() => { switchTab("statistics"); setShowMobileNav(false); }} className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition ${activeTab === "statistics" ? "bg-purple-100 text-purple-700" : "text-gray-600 hover:bg-gray-50"}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
          Statistics
        </button>
      </div>

      {/* Account Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2">
        <p className="px-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Account</p>
        <button onClick={() => { switchTab("profile"); setShowMobileNav(false); }} className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition ${activeTab === "profile" ? "bg-purple-100 text-purple-700" : "text-gray-600 hover:bg-gray-50"}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          My Profile
        </button>
        <Link to="/edit-profile" className="flex items-center gap-3 p-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          Edit Profile
        </Link>
        <button onClick={() => { switchTab("dues"); setShowMobileNav(false); }} className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition ${activeTab === "dues" ? "bg-purple-100 text-purple-700" : "text-gray-600 hover:bg-gray-50"}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Dues & Finance
        </button>
        <button onClick={() => { switchTab("attendance"); setShowMobileNav(false); }} className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition ${activeTab === "attendance" ? "bg-purple-100 text-purple-700" : "text-gray-600 hover:bg-gray-50"}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Attendance
        </button>
        <button onClick={() => setShowHandbookModal(true)} className="w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 whitespace-nowrap">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          <span>Download Handbook</span>
        </button>
      </div>

      {/* Logout */}
      <button onClick={handleLogout} className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex items-center gap-3 text-sm font-medium text-red-500 hover:bg-red-50 transition">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
        Logout
      </button>
    </div>
  );

  const renderRightPanel = () => (
    <div className="space-y-4">
      {/* Notifications */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm">Notifications</h3>
          <div className="flex items-center gap-3">
            {notifications.length > 0 && <button onClick={() => setClearAllConfirm(true)} className="text-xs text-red-500 hover:underline">Clear all</button>}
            {unreadCount > 0 && <button onClick={markNotifRead} className="text-xs text-purple-600 hover:underline">Mark all read</button>}
          </div>
        </div>
        {notifications.length === 0 && <p className="text-gray-400 text-xs text-center py-3">No notifications</p>}
        <div className="space-y-1">
          {(showAllNotifs ? notifications : notifications.slice(0, 2)).map((n) => {
            const isExpanded = expandedNotif === n._id;
            return (
              <div
                key={n._id}
                className={`rounded-lg text-sm cursor-pointer hover:bg-gray-100 overflow-hidden ${n.read ? "" : "bg-purple-50"}`}
              >
                <div className="p-2.5">
                  <div className="flex items-start gap-2" onClick={() => { if (n.type === "reminder") { setExpandedNotif(isExpanded ? null : n._id); } else { if (!n.read) { API.put(`/notifications/read/${n._id}`).then(() => { setUnreadCount(prev => { const next = Math.max(0, prev - 1); updateBadge(next); return next; }); setNotifications(prev => prev.map(x => x._id === n._id ? { ...x, read: true } : x)); }).catch(() => {}); } navigate(n.type === "message" ? "/messages" : n.type === "friend_request" || n.type === "friend_accept" ? "/dashboard" : `/dashboard?post=${n.referenceId}`); } }}>
                    <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {n.type === "reminder" ? (
                        <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                      ) : n.fromUserId?.profileImage ? (
                        <img src={optimizeImage(n.fromUserId.profileImage, 32)} alt="" className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <span className="text-purple-600 font-bold text-xs">{n.fromUserId?.firstname?.[0]}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {n.type === "reminder" ? (
                        <div>
                          <p className={`truncate ${n.read ? "text-gray-600" : "text-gray-900 font-semibold"}`}><span className="font-semibold">Royal Youth Hub</span></p>
                          {n.referenceId && <p className={`text-xs truncate ${n.read ? "text-gray-400" : "text-gray-500"}`}>{n.referenceId}</p>}
                          <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                        </div>
                      ) : (
                        <><p className={`${n.read ? "text-gray-600" : "text-gray-900 font-semibold"}`}><span className="font-semibold">{n.fromUserId?.firstname}</span> {n.type === "like" ? "liked your post" : n.type === "comment" ? "commented on your post" : n.type === "friend_accept" ? "accepted your friend request" : n.type === "friend_request" ? "sent you a friend request" : "sent you a message"}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p></>
                      )}
                    </div>
                    <button onClick={(e) => deleteNotif(n._id, e)} className="p-1 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  {isExpanded && n.image && (
                    <div className="mt-2">
                      <img src={n.image} alt="" className="w-full h-auto max-h-56 object-contain rounded-lg" loading="lazy" />
                    </div>
                  )}
                  {isExpanded && (
                    <div className="mt-2">
                      <p className="text-gray-500 text-sm whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{ __html: n.body ? linkifyText(n.body) : "No additional details" }} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {notifications.length > 2 && (
          <button onClick={() => setShowAllNotifs(!showAllNotifs)} className="text-purple-600 text-xs font-semibold mt-2 hover:underline">
            {showAllNotifs ? "Show less" : `Show more (${notifications.length - 2} more)`}
          </button>
        )}
      </div>

      {/* Friend Requests */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h3 className="font-bold text-sm mb-3">Friend Requests</h3>
        {friendLoading && <div className="animate-pulse h-12 bg-gray-100 rounded-lg" />}
        {!friendLoading && friendRequests.length === 0 && <p className="text-gray-400 text-xs text-center py-3">No pending requests</p>}
        <div className="space-y-2">
          {friendRequests.map((r) => (
            <div key={r._id} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {r.from?.profileImage ? <img src={optimizeImage(r.from.profileImage, 48)} alt="" className="w-full h-full object-cover" loading="lazy" /> : <span className="text-purple-600 font-bold text-xs">{r.from?.firstname?.[0]}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{displayName(r.from)}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleAcceptRequest(r._id)} className="bg-purple-600 text-white text-[10px] px-2 py-1 rounded hover:bg-purple-700">Accept Royalty</button>
                <button onClick={() => handleRejectRequest(r._id)} className="bg-gray-200 text-gray-600 text-[10px] px-2 py-1 rounded hover:bg-gray-300">Reject Royalty</button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );

  const handleBirthdayConfirm = () => setShowBirthdayModal(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowMobileNav(!showMobileNav)} className="lg:hidden text-gray-600 hover:text-purple-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showMobileNav ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} /></svg>
            </button>
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">RY</span>
              </div>
              <span className="font-bold text-sm sm:text-base md:text-lg text-gray-800 whitespace-nowrap">Royal Youth Hub</span>
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 ml-2 sm:ml-4">
            <Link to="/messages" className="relative p-2 text-gray-500 hover:text-purple-600 rounded-lg hover:bg-gray-100">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            </Link>
            <button onClick={() => { setShowRightPanel(true); if (unreadCount > 0) markNotifRead(); else updateBadge(0); }} className="relative p-2 text-gray-500 hover:text-purple-600 rounded-lg hover:bg-gray-100">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              {unreadCount > 0 && <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">{unreadCount}</span>}
            </button>
            <button onClick={() => setShowRightPanel(!showRightPanel)} className="lg:hidden flex items-center gap-1 px-2.5 py-1.5 text-gray-500 hover:text-purple-600 rounded-lg hover:bg-gray-100">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
              </svg>
              <span className="text-xs font-medium">More</span>
              {unreadCount > 0 && <span className="bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">{unreadCount > 9 ? "9+" : unreadCount}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* Birthday Banner */}
      {isBirthday && (
        <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-yellow-500 py-1.5 overflow-hidden shadow-md">
          <div className="inline-flex whitespace-nowrap" style={{ animation: "marquee 80s linear infinite" }}>
            {[...Array(6)].map((_, i) => (
              <span key={i} className="text-white text-sm md:text-base font-bold mx-4 flex-shrink-0">
                🎉 Happy Birthday {user?.firstname}! 🎂 Today we celebrate the gift that you are to the Royal Youth Hub family. May this new year of your life be filled with purpose, grace, and remarkable achievements. Have a truly wonderful birthday! 🎁✨
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-4 flex gap-6">
        {/* Left Sidebar backdrop */}
        {showMobileNav && (
          <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setShowMobileNav(false)} />
        )}
        {/* Left Sidebar - hidden on mobile unless toggled */}
        <aside className={`w-64 flex-shrink-0 ${showMobileNav ? "block" : "hidden"} lg:block fixed lg:static left-0 top-0 h-full lg:h-auto z-40 lg:z-auto bg-gray-50 lg:bg-transparent p-4 lg:p-0 pt-16 lg:pt-0 overflow-y-auto shadow-xl lg:shadow-none`}>
          <div className="lg:hidden flex justify-end mb-4">
            <button onClick={() => setShowMobileNav(false)} className="text-gray-500 hover:text-gray-700"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
          {renderLeftSidebar()}
        </aside>

        {/* Main Feed */}
        <main className="flex-1 min-w-0">
          {/* Quick Navigation - permanent */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1.5 sm:p-2 mb-4 flex items-center justify-between gap-0.5 sm:gap-1">
            <button onClick={() => switchTab("community")} className={`flex flex-col items-center gap-0.5 p-1.5 sm:p-2 rounded-lg flex-1 transition ${activeTab === "community" ? "bg-purple-100 text-purple-700" : "text-gray-500 hover:bg-gray-100"}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
              <span className="text-[9px] sm:text-[10px] font-medium">Community</span>
            </button>
            <button onClick={() => setShowGoLiveModal(true)} className="flex flex-col items-center gap-0.5 p-1.5 sm:p-2 rounded-lg flex-1 transition text-red-500 hover:bg-red-50">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              <span className="text-[9px] sm:text-[10px] font-medium">Go Live</span>
            </button>
            <button onClick={() => switchTab("feed")} className={`flex flex-col items-center gap-0.5 p-1.5 sm:p-2 rounded-lg flex-1 transition ${activeTab === "feed" ? "bg-purple-100 text-purple-700" : "text-gray-500 hover:bg-gray-100"}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
              <span className="text-[9px] sm:text-[10px] font-medium">Feed</span>
            </button>
            <button onClick={() => switchTab("hub-connect")} className={`flex flex-col items-center gap-0.5 p-1.5 sm:p-2 rounded-lg flex-1 transition ${activeTab === "hub-connect" ? "bg-purple-100 text-purple-700" : "text-gray-500 hover:bg-gray-100"}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
              <span className="text-[9px] sm:text-[10px] font-medium">Hub</span>
            </button>

            <button onClick={() => switchTab("leaderboard")} className={`flex flex-col items-center gap-0.5 p-1.5 sm:p-2 rounded-lg flex-1 transition ${activeTab === "leaderboard" ? "bg-purple-100 text-purple-700" : "text-gray-500 hover:bg-gray-100"}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              <span className="text-[9px] sm:text-[10px] font-medium">Leaderboard</span>
            </button>
          </div>
          {activeTab === "feed" && (
            <>
              {pinnedPosts.length > 0 && (
                <div className="space-y-3 mb-4">
                  {pinnedPosts.map((post) => (
                    <div key={post._id} className="border-2 border-yellow-300 rounded-xl overflow-hidden">
                      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 px-4 py-2 flex items-center gap-2 border-b border-yellow-200">
                        <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20"><path d="M5 5a2 2 0 012-2h6a2 2 0 012 2v10l-5-3-5 3V5z" /></svg>
                        <span className="text-xs font-bold text-yellow-700 uppercase tracking-wide">Pinned Announcement</span>
                        <span className="text-[10px] text-yellow-500 ml-auto">{new Date(post.pinnedAt).toLocaleString()}</span>
                      </div>
                      <PostCard post={post} currentUserId={user._id} />
                    </div>
                  ))}
                </div>
              )}
              <CreatePost onPostCreated={handlePostCreated} placeholder="Share something with your friends..." />
              {feedLoading && (
                <div className="space-y-4">
                  {Array.from({length:3}).map((_,i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-pulse">
                      <div className="flex items-start gap-3"><div className="w-10 h-10 bg-gray-200 rounded-full" /><div className="flex-1 space-y-2"><div className="h-4 bg-gray-200 rounded w-1/3" /><div className="h-3 bg-gray-100 rounded w-3/4" /><div className="h-3 bg-gray-100 rounded w-1/2" /></div></div>
                    </div>
                  ))}
                </div>
              )}
              {!feedLoading && posts.length === 0 && (
                <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
                  <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                  <p className="text-gray-400 mt-4">No posts from friends yet</p>
                  <p className="text-gray-400 text-sm">Add friends and share something!</p>
                </div>
              )}
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard key={post._id} post={post} currentUserId={user._id} onDelete={handleDeletePost} onShare={handleShare} />
                ))}
              </div>
              {feedHasMore && (
                <div className="text-center py-6">
                  <button onClick={() => fetchFeed(feedPage + 1)} disabled={feedLoadingMore} className="bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-50">
                    {feedLoadingMore ? "Loading..." : "Load More"}
                  </button>
                </div>
              )}
            </>
          )}

          {activeTab === "community" && (
            <>
              <LiveFeedSection user={user} />
              {/* Suggested Feeds */}
              {!sourcesLoading && availableSources.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mt-4">
                  <h3 onClick={() => setShowAllFeeds(!showAllFeeds)} className="text-sm font-bold text-gray-700 mb-3 cursor-pointer hover:text-purple-600 flex items-center gap-2">
                    {showAllFeeds ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    )}
                    News, business, relationships, lifestyle...Follow for UPDATES
                  </h3>
                  {showAllFeeds ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {shuffledSources.map((s) => (
                        <div key={s.sourceId} className="flex flex-col items-center gap-1.5 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-purple-50 transition">
                          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-lg">
                            {s.icon || s.label[0]}
                          </div>
                          <span className="text-xs font-semibold text-gray-700 text-center truncate max-w-full">{s.label}</span>
                          <span className="text-[10px] text-gray-400 capitalize">{s.category}</span>
                          {s.following ? (
                            <button onClick={() => handleUnfollowSource(s.sourceId)} className="mt-1 w-full text-[10px] bg-purple-100 text-purple-700 px-2.5 py-1.5 rounded-lg font-semibold hover:bg-purple-200 transition">
                              Following
                            </button>
                          ) : (
                            <button onClick={() => handleFollowSource(s.sourceId)} className="mt-1 w-full text-[10px] bg-purple-600 text-white px-2.5 py-1.5 rounded-lg font-semibold hover:bg-purple-700 transition">
                              Follow
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-thin" style={{ scrollbarWidth: 'thin' }}>
                      {shuffledSources.map((s) => (
                        <div key={s.sourceId} className="flex flex-col items-center gap-1.5 min-w-[130px] p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-purple-50 transition flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-lg">
                            {s.icon || s.label[0]}
                          </div>
                          <span className="text-xs font-semibold text-gray-700 text-center truncate max-w-[130px]">{s.label}</span>
                          <span className="text-[10px] text-gray-400 capitalize">{s.category}</span>
                          {s.following ? (
                            <button onClick={() => handleUnfollowSource(s.sourceId)} className="mt-1 w-full text-[10px] bg-purple-100 text-purple-700 px-2.5 py-1.5 rounded-lg font-semibold hover:bg-purple-200 transition">
                              Following
                            </button>
                          ) : (
                            <button onClick={() => handleFollowSource(s.sourceId)} className="mt-1 w-full text-[10px] bg-purple-600 text-white px-2.5 py-1.5 rounded-lg font-semibold hover:bg-purple-700 transition">
                              Follow
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <CreatePost onPostCreated={handleCommunityPostCreated} />
              {/* Suggested Royalties */}
              {suggested.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mt-4">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">Meet Royalties of the Hub</h3>
                  <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-thin" style={{ scrollbarWidth: 'thin' }}>
                      {shuffledSuggested.map((s) => (
                        <div key={s._id} onClick={() => handleViewMember(s._id)} className="flex flex-col items-center gap-1.5 min-w-[150px] p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-purple-50 transition cursor-pointer">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-[2px]">
                            <div className="w-full h-full rounded-full bg-white p-[2px]">
                              <div className="block w-full h-full rounded-full bg-purple-100 overflow-hidden">
                                {s.profileImage ? (
                                  <img src={optimizeImage(s.profileImage, 80)} alt="" className="w-full h-full object-cover" loading="lazy" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-purple-600 font-bold text-xs">
                                    {s.firstname?.[0]}{s.surname?.[0]}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-gray-700 truncate max-w-[150px] text-center">
                            {displayName(s)}
                          </span>
                        {s.branch && (
                          <span className="text-[10px] text-purple-500 truncate max-w-[150px] text-center">{s.branch}</span>
                        )}
                        <span className={`text-[10px] font-medium ${
                          s.role === "youth_president" ? "text-yellow-600" :
                          s.role === "admin" ? "text-purple-600" : "text-gray-400"
                        }`}>{s.role === "youth_president" ? "Youth President" : s.role === "admin" ? "Admin" : "Member"}</span>
                        {s.friendStatus === "none" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSendRequest(s._id); }}
                            className="mt-1 w-full text-[11px] bg-purple-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-purple-700 transition"
                          >
                            Add Royalty
                          </button>
                        )}
                        {s.friendStatus === "pending_sent" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCancelRequest(s._id); }}
                            className="mt-1 w-full text-[11px] bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-orange-200 transition"
                          >
                            Pending
                          </button>
                        )}
                        {s.friendStatus === "pending_received" && (
                          <div className="mt-1 flex gap-1.5 w-full">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleAcceptRequest(s.requestId); }}
                              className="flex-1 text-[10px] bg-purple-600 text-white px-2 py-1.5 rounded-lg font-semibold hover:bg-purple-700 transition"
                            >
                              Accept Royalty
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRejectRequest(s.requestId); }}
                              className="flex-1 text-[10px] bg-gray-200 text-gray-600 px-2 py-1.5 rounded-lg font-semibold hover:bg-gray-300 transition"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {friendLoading && suggested.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mt-4">
                  <div className="h-4 w-36 bg-gray-200 rounded mb-3 animate-pulse" />
                  <div className="flex gap-4">
                    {Array.from({length:5}).map((_,i) => (
                      <div key={i} className="flex flex-col items-center gap-1.5 min-w-[150px] p-3 bg-gray-50 rounded-xl animate-pulse">
                        <div className="w-14 h-14 rounded-full bg-gray-200" />
                        <div className="h-3 w-20 bg-gray-200 rounded" />
                        <div className="h-2 w-16 bg-gray-100 rounded" />
                        <div className="h-6 w-full bg-gray-200 rounded-lg" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {pinnedPosts.length > 0 && (
                <div className="space-y-3 mt-4">
                  {pinnedPosts.map((post) => (
                    <div key={post._id} className="border-2 border-yellow-300 rounded-xl overflow-hidden">
                      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 px-4 py-2 flex items-center gap-2 border-b border-yellow-200">
                        <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20"><path d="M5 5a2 2 0 012-2h6a2 2 0 012 2v10l-5-3-5 3V5z" /></svg>
                        <span className="text-xs font-bold text-yellow-700 uppercase tracking-wide">Pinned Announcement</span>
                        <span className="text-[10px] text-yellow-500 ml-auto">{new Date(post.pinnedAt).toLocaleString()}</span>
                      </div>
                      <PostCard post={post} currentUserId={user._id} />
                    </div>
                  ))}
                </div>
              )}
              {communityLoading ? (
                <div className="space-y-4 mt-4">
                  {Array.from({length:3}).map((_,i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-pulse">
                      <div className="flex items-start gap-3"><div className="w-10 h-10 bg-gray-200 rounded-full" /><div className="flex-1 space-y-2"><div className="h-4 bg-gray-200 rounded w-1/3" /><div className="h-3 bg-gray-100 rounded w-3/4" /><div className="h-3 bg-gray-100 rounded w-1/2" /></div></div>
                    </div>
                  ))}
                </div>
              ) : communityPosts.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100 mt-4">
                  <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                  <p className="text-gray-400 mt-4">No posts in the community yet</p>
                  <p className="text-gray-400 text-sm">Be the first to share something!</p>
                </div>
              ) : (
                <div className="space-y-4 mt-4">
                  {communityPosts.map((post) =>
                    post._isRss ? (
                      <RssCard key={post.id || post._id} item={post} />
                    ) : (
                      <PostCard key={post._id} post={post} currentUserId={user._id} onDelete={handleDeletePost} onShare={handleShare} />
                    )
                  )}
                </div>
              )}
              {communityHasMore && (
                <div className="text-center py-6">
                  <button onClick={() => fetchCommunityFeed(communityPage + 1)} disabled={communityLoadingMore} className="bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-50">
                    {communityLoadingMore ? "Loading..." : "Load More"}
                  </button>
                </div>
              )}
            </>
          )}

          {activeTab === "viewing-member" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-purple-700">Member Profile</h2>
                <button onClick={closeViewMember} className="text-sm text-purple-600 hover:text-purple-800 font-semibold">&larr; Back to Feed</button>
              </div>
              {viewingMemberLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="flex items-center gap-4"><div className="w-20 h-20 rounded-full bg-gray-200" /><div className="h-5 w-48 bg-gray-200 rounded" /></div>
                  <div className="h-4 w-32 bg-gray-200 rounded" /><div className="h-4 w-24 bg-gray-200 rounded" />
                </div>
              ) : viewedMember ? (
                <>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden cursor-pointer" onClick={() => viewedMember.profileImage && setViewingImage({ url: viewedMember.profileImage, firstname: viewedMember.firstname, surname: viewedMember.surname })}>
                      {viewedMember.profileImage ? <img src={optimizeImage(viewedMember.profileImage, 128)} alt="" className="w-full h-full object-cover" loading="lazy" /> : <span className="text-purple-600 font-bold text-2xl">{viewedMember.firstname?.[0]}{viewedMember.surname?.[0]}</span>}
                    </div>
                    <div>
                      <p className="text-lg font-bold">{displayNameFull(viewedMember)}</p>
                      <p className="text-gray-500">{viewedMember.occupation || "Not specified"}</p>
                      <p className="text-gray-400 text-sm">{viewedMember.branch || "Plot C4/C5 Owerri"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div><span className="font-semibold text-gray-600">Phone:</span> {viewedMember.phone}</div>
                    <div><span className="font-semibold text-gray-600">Email:</span> {viewedMember.email || "Not provided"}</div>
                    <div><span className="font-semibold text-gray-600">Occupation:</span> {viewedMember.occupation || "Not specified"}</div>
                    <div><span className="font-semibold text-gray-600">Born Again:</span> {viewedMember.bornAgain}</div>
                    <div><span className="font-semibold text-gray-600">Membership:</span> <span className={viewedMember.membershipStatus === "Active Member" ? "text-green-600 font-medium" : "text-red-500 font-medium"}>{viewedMember.membershipStatus}</span></div>
                    <div><span className="font-semibold text-gray-600">Role:</span> <span className={`font-medium ${viewedMember.role === "youth_president" ? "text-yellow-600" : viewedMember.role === "admin" ? "text-purple-600" : ""}`}>{viewedMember.role === "youth_president" ? "Youth President" : viewedMember.role === "admin" ? "Admin" : "Member"}</span></div>
                    <div><span className="font-semibold text-gray-600">State of Origin:</span> {viewedMember.stateOfOrigin || "N/A"}</div>
                    <div><span className="font-semibold text-gray-600">LGA:</span> {viewedMember.lga || "N/A"}</div>
                    <div><span className="font-semibold text-gray-600">Date Joined:</span> {viewedMember.createdAt ? formatDate(viewedMember.createdAt, true) : "N/A"}</div>
                    <div><span className="font-semibold text-gray-600">Last Seen:</span> <span className="text-gray-500">{viewedMember.lastLogin ? formatDate(viewedMember.lastLogin) : "Unknown"}</span></div>
                  </div>
                  <div className="mt-8">
                    <h3 className="text-lg font-bold mb-4">Posts</h3>
                    {viewedMemberPostsLoading ? (
                      <div className="flex justify-center py-6">
                        <Spinner size="md" />
                      </div>
                    ) : viewedMemberPosts.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-6">No posts yet</p>
                    ) : (
                      <div className="space-y-4">
                        {viewedMemberPosts.map((post) => (
                          <PostCard key={post._id} post={post} currentUserId={user?._id} onDelete={handleDeletePost} onShare={handleShare} />
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-gray-400 text-center py-8">Member not found</p>
              )}
            </div>
          )}

          {activeTab === "viewing-post" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-purple-700">Post</h2>
                <button onClick={closeViewPost} className="text-sm text-purple-600 hover:text-purple-800 font-semibold">&larr; Back to Feed</button>
              </div>
              {viewingPostLoading ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-pulse">
                  <div className="flex items-start gap-3"><div className="w-10 h-10 bg-gray-200 rounded-full" /><div className="flex-1 space-y-2"><div className="h-4 bg-gray-200 rounded w-1/3" /><div className="h-3 bg-gray-100 rounded w-3/4" /><div className="h-3 bg-gray-100 rounded w-1/2" /></div></div>
                </div>
              ) : viewingPost ? (
                <PostCard post={viewingPost} currentUserId={user?._id} />
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                  <p className="text-gray-400">Post not found</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "profile" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold mb-4 text-purple-700">My Profile</h2>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden cursor-pointer" onClick={() => user.profileImage && setShowImageModal(true)}>
                  {user.profileImage ? <img src={optimizeImage(user.profileImage, 128)} alt="" className="w-full h-full object-cover" loading="lazy" /> : <span className="text-purple-600 font-bold text-2xl">{user.firstname?.[0]}{user.surname?.[0]}</span>}
                </div>
                <div>
                  <p className="text-lg font-bold">{displayNameFull(user)}</p>
                  <p className="text-gray-500">{user.occupation || "Not specified"}</p>
                  <Link to="/edit-profile" className="text-purple-600 text-sm hover:underline">Edit Profile</Link>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><span className="font-semibold text-gray-600">Age:</span> {calculateAge(user.dob)} years</div>
                <div><span className="font-semibold text-gray-600">Born Again:</span> {user.bornAgain}</div>
                <div><span className="font-semibold text-gray-600">Phone:</span> {user.phone}</div>
                <div><span className="font-semibold text-gray-600">Email:</span> {user.email || "Not provided"}</div>
                <div><span className="font-semibold text-gray-600">Address:</span> {user.address || "Not provided"}</div>
                <div><span className="font-semibold text-gray-600">Branch:</span> {user.branch || "Plot C4/C5 Owerri"}</div>
                {user.hobbies?.length > 0 && <div className="md:col-span-2"><span className="font-semibold text-gray-600">Hobbies:</span> {user.hobbies.join(", ")}</div>}
                <div><span className="font-semibold text-gray-600">Membership:</span> <span className={user.membershipStatus === "Active Member" ? "text-green-600 font-medium" : "text-red-500 font-medium"}>{user.membershipStatus}</span></div>
                <div><span className="font-semibold text-gray-600">Role:</span> <span className={`font-medium ${
                  user.role === "youth_president" ? "text-yellow-600" :
                  user.role === "admin" ? "text-purple-600" : ""
                }`}>{user.role === "youth_president" ? "Youth President" : user.role === "admin" ? "Admin" : "Member"}</span></div>
                <div><span className="font-semibold text-gray-600">Last Login:</span> {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "First login"}</div>
                <div><span className="font-semibold text-gray-600">Registered:</span> {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}</div>
              </div>
            </div>
          )}

          {activeTab === "dues" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-purple-700">2026 Dues Record</h2>
                <button onClick={() => setShowSpecialModal(true)} className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-semibold">Make Special Payment/Donations</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm"><thead><tr className="bg-gray-100"><th className="border p-2 text-left">Month</th><th className="border p-2 text-left">Status</th><th className="border p-2 text-left">Amount</th><th className="border p-2 text-left">Date Paid</th><th className="border p-2 text-left">Pay Offline</th></tr></thead><tbody>
                  {months.map((m) => (
                    <tr key={m}><td className="border p-2">{m}</td>
                      <td className="border p-2"><span className={`px-2 py-1 rounded ${user.dues[m]?.status === "Paid" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{user.dues[m]?.status || "Unpaid"}</span></td>
                      <td className="border p-2">N{user.dues[m]?.amount || 1000}</td>
                      <td className="border p-2">{user.dues[m]?.status === "Paid" && user.dues[m]?.date ? new Date(user.dues[m].date).toLocaleDateString('en-GB') : "-"}</td>
                      <td className="border p-2">{user.dues[m]?.status !== "Paid" ? <button onClick={() => handlePayOffline(m)} className="bg-gray-600 text-white px-2 py-1 rounded text-xs hover:bg-gray-700">Pay Offline</button> : <span className="text-gray-400">-</span>}</td>
                    </tr>
                  ))}
                </tbody></table>
              </div>
              <div className="text-center mt-4">
                <button onClick={() => setShowMore2027(!showMore2027)} className="text-sm text-purple-600 hover:text-purple-800 font-semibold underline">{showMore2027 ? "Show Less" : "Show More →"}</button>
              </div>
              {showMore2027 && (
                <><hr className="my-4 border-gray-300" /><h3 className="text-lg font-bold text-purple-700 mb-4">2027 Dues Record</h3>
                <div className="overflow-x-auto"><table className="w-full border-collapse text-sm"><thead><tr className="bg-gray-100"><th className="border p-2 text-left">Month</th><th className="border p-2 text-left">Status</th><th className="border p-2 text-left">Amount</th><th className="border p-2 text-left">Date Paid</th><th className="border p-2 text-left">Pay Offline</th></tr></thead><tbody>
                  {allMonths.map((m) => (
                    <tr key={m}><td className="border p-2">{m}</td>
                      <td className="border p-2"><span className={`px-2 py-1 rounded ${user.dues2027?.[m]?.status === "Paid" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{user.dues2027?.[m]?.status || "Unpaid"}</span></td>
                      <td className="border p-2">N{user.dues2027?.[m]?.amount || 1000}</td>
                      <td className="border p-2">{user.dues2027?.[m]?.status === "Paid" && user.dues2027?.[m]?.date ? new Date(user.dues2027[m].date).toLocaleDateString('en-GB') : "-"}</td>
                      <td className="border p-2">{user.dues2027?.[m]?.status !== "Paid" ? <button onClick={() => handlePayOffline(m, "2027")} className="bg-gray-600 text-white px-2 py-1 rounded text-xs hover:bg-gray-700">Pay Offline</button> : <span className="text-gray-400">-</span>}</td>
                    </tr>
                  ))}
                </tbody></table></div></>
              )}

              {/* Special Payments */}
              <div className="mt-6"><hr className="mb-4" /><h3 className="text-lg font-bold text-purple-700 mb-4">Special Payments/Donations</h3>
                {specialPayments.length === 0 ? <p className="text-gray-600">No special payments yet.</p> : (
                  <table className="w-full border-collapse text-sm"><thead><tr className="bg-gray-100"><th className="border p-2 text-left">Purpose</th><th className="border p-2 text-left">Amount</th><th className="border p-2 text-left">Date</th></tr></thead><tbody>
                    {specialPayments.map((p, i) => (<tr key={p._id || i}><td className="border p-2">{p.purpose}</td><td className="border p-2">N{p.amount?.toLocaleString()}</td><td className="border p-2">{new Date(p.date).toLocaleDateString()}</td></tr>))}
                  </tbody></table>
                )}
              </div>
            </div>
          )}

          {activeTab === "attendance" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold mb-4 text-purple-700">Meeting Attendance</h2>
              {attendance.length === 0 ? <p className="text-gray-600">No meetings recorded yet.</p> : (
                <div className="overflow-x-auto"><table className="w-full border-collapse text-sm"><thead><tr className="bg-gray-100"><th className="border p-2 text-left">S/N</th><th className="border p-2 text-left">Meeting Title</th><th className="border p-2 text-left">Date</th><th className="border p-2 text-left">Status</th></tr></thead><tbody>
                  {attendance.map((r, i) => (<tr key={r._id}><td className="border p-2">{i+1}</td><td className="border p-2">{r.meetingTitle}</td><td className="border p-2">{new Date(r.meetingDate).toLocaleDateString()}</td><td className="border p-2"><span className={`px-2 py-1 rounded ${r.status === "Present" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{r.status}</span></td></tr>))}
                </tbody></table></div>
              )}
            </div>
          )}

          {activeTab === "leaderboard" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              {leaderboardView === "list" ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-purple-700">Leaderboard</h2>
                    <span className="text-sm text-gray-500">Top 10 Active Members</span>
                  </div>
                  {leaderboardLoading ? (
                    <div className="space-y-3">
                      {Array.from({length:5}).map((_,i) => (
                        <div key={i} className="flex items-center gap-3 animate-pulse p-2"><div className="w-8 h-8 rounded-full bg-gray-200" /><div className="h-4 w-32 bg-gray-200 rounded" /><div className="flex-1" /><div className="h-4 w-10 bg-gray-100 rounded" /></div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {leaderboard.map((u) => {
                        const badge = u.rank === 1 ? "🥇" : u.rank === 2 ? "🥈" : u.rank === 3 ? "🥉" : "⭐";
                        return (
                          <button
                            key={u._id}
                            onClick={() => { setLeaderboardView(u._id); fetchLbMemberPosts(u._id); }}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-purple-50 transition text-left border border-gray-100"
                          >
                            <span className="text-xl shrink-0">{badge}</span>
                            <span className="text-sm font-bold text-purple-600 shrink-0">#{u.rank}</span>
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden shrink-0">
                              {u.profileImage ? (
                                <img src={optimizeImage(u.profileImage, 64)} alt="" className="w-full h-full object-cover" loading="lazy" />
                              ) : (
                                <span className="text-purple-600 font-bold text-xs">{u.firstname?.[0]}{u.surname?.[0]}</span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-700 truncate">{displayName(u)}</p>
                              <p className="text-[11px] text-gray-400">Posts: {u.posts} · Attendance: {u.attendance}</p>
                            </div>
                            <span className="text-sm font-bold text-purple-600">{u.score}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={() => setLeaderboardView("list")}
                    className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 mb-4"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Back to Leaderboard
                  </button>
                  {(() => {
                    const user = leaderboard.find((u) => u._id === leaderboardView);
                    if (!user) return null;
                    const badge = user.rank === 1 ? "🥇" : user.rank === 2 ? "🥈" : user.rank === 3 ? "🥉" : "⭐";
                    return (
                      <>
                        <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-[2px]">
                            <div className="w-full h-full rounded-full bg-white p-[2px]">
                              <div className="w-full h-full rounded-full bg-purple-100 flex items-center justify-center overflow-hidden">
                                {user.profileImage ? (
                                  <img src={optimizeImage(user.profileImage, 96)} alt="" className="w-full h-full object-cover" loading="lazy" />
                                ) : (
                                  <span className="text-purple-600 font-bold text-lg">{user.firstname?.[0]}{user.surname?.[0]}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-lg font-bold text-gray-800">{displayNameFull(user)}</p>
                              <span className="text-2xl">{badge}</span>
                            </div>
                            <p className="text-sm text-gray-500">Rank #{user.rank} · Score: {user.score}</p>
                            <p className="text-xs text-gray-400">Posts: {user.posts} · Attendance: {user.attendance}</p>
                          </div>
                        </div>
                        <h3 className="text-md font-bold text-purple-700 mb-3">Recent Posts</h3>
                        {lbMemberPostsLoading ? (
                          <div className="space-y-3">
                            {Array.from({length:2}).map((_,i) => (
                              <div key={i} className="bg-gray-50 rounded-xl p-4 animate-pulse"><div className="h-4 w-3/4 bg-gray-200 rounded mb-2" /><div className="h-16 bg-gray-200 rounded-xl" /></div>
                            ))}
                          </div>
                        ) : lbMemberPosts.length === 0 ? (
                          <p className="text-gray-400 text-sm text-center py-6">No posts yet</p>
                        ) : (
                          <div className="space-y-4">
                            {lbMemberPosts.map((post) => (
                              <PostCard key={post._id} post={post} currentUserId={user?._id} onDelete={() => {}} onShare={handleShare} />
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          )}

          {activeTab === "statistics" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-purple-700">Page Statistics</h2>
                <select value={statsYear} onChange={e => setStatsYear(Number(e.target.value))} className="text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500">
                  {[2026, 2025].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              {statsLoading ? (
                <div className="flex justify-center py-16">
                  <Spinner size="md" />
                </div>
              ) : monthlyStats.length > 0 ? (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-3">Posts per Month</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyStats} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="posts" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Posts" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-3">New Registrations per Month</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyStats} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="registrations" fill="#0891b2" radius={[4, 4, 0, 0]} name="Registrations" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-3">Attendance per Month</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyStats} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="attendance" fill="#16a34a" radius={[4, 4, 0, 0]} name="Attendance" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-sm text-center py-16">No data available for {statsYear}</p>
              )}
            </div>
          )}

          {activeTab === "inspiration" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-purple-700">Inspiration</h2>
              </div>
              <div className="flex gap-2 mb-6 flex-wrap">
                {["all", "spiritual", "business", "nigeria", "africa"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFeedCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition capitalize ${
                      feedCategory === cat
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {cat === "all" ? "All" : cat}
                  </button>
                ))}
              </div>
              {externalLoading ? (
                <div className="space-y-4">
                  {Array.from({length:4}).map((_,i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-4 animate-pulse">
                      <div className="h-3 w-24 bg-gray-200 rounded mb-2" />
                      <div className="h-4 w-3/4 bg-gray-200 rounded mb-2" />
                      <div className="h-3 w-full bg-gray-200 rounded" />
                    </div>
                  ))}
                </div>
              ) : externalFeed.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-16">No inspiration posts available right now.</p>
              ) : (
                <div className="space-y-3">
                  {externalFeed
                    .filter((p) => feedCategory === "all" || p.category === feedCategory)
                    .map((post, i) => (
                      <a
                        key={post.id || i}
                        href={post.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block bg-gray-50 rounded-xl p-4 hover:bg-purple-50 transition border border-gray-100"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm">{post.sourceIcon}</span>
                          <span className="text-[11px] font-semibold text-purple-600 uppercase tracking-wide">{post.sourceLabel}</span>
                          {post.date && (
                            <span className="text-[10px] text-gray-400 ml-auto">{new Date(post.date).toLocaleDateString()}</span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-gray-800 mb-1 line-clamp-2">{post.title}</h3>
                        <p className="text-xs text-gray-500 line-clamp-3">{post.content}</p>
                      </a>
                    ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "hub-connect" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-purple-700">Hub-Connect</h2>
                <span className="text-sm text-gray-500">{friends.length} {friends.length === 1 ? "friend" : "friends"}</span>
              </div>
              {friendLoading && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from({length:4}).map((_,i) => (
                    <div key={i} className="animate-pulse bg-gray-100 rounded-xl p-4 flex flex-col items-center gap-2">
                      <div className="w-16 h-16 rounded-full bg-gray-200" />
                      <div className="h-3 w-20 bg-gray-200 rounded" />
                      <div className="h-2 w-16 bg-gray-100 rounded" />
                    </div>
                  ))}
                </div>
              )}
              {!friendLoading && friends.length === 0 && (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <p className="text-gray-400 mt-4">No friends yet</p>
                  <p className="text-gray-400 text-sm">Add friends from suggested members above!</p>
                </div>
              )}
              {!friendLoading && friends.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {friends.map((f) => (
                    <div key={f._id} className="bg-gray-50 rounded-xl p-4 flex flex-col items-center gap-2 hover:shadow-sm transition h-full">
                      <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer" onClick={() => f.profileImage && setViewingImage({ url: f.profileImage, firstname: f.firstname, surname: f.surname })}>
                        {f.profileImage ? <img src={optimizeImage(f.profileImage, 96)} alt="" className="w-full h-full object-cover" loading="lazy" /> : <span className="text-purple-600 font-bold text-lg">{f.firstname?.[0]}{f.surname?.[0]}</span>}
                      </div>
                      <span onClick={() => handleViewMember(f._id)} className="font-semibold text-sm text-center hover:text-purple-600 cursor-pointer truncate w-full">{displayName(f)}</span>
                      <p className="text-gray-400 text-[10px] text-center">{f.branch}</p>
                      <div className="flex flex-col gap-1.5 w-full mt-auto">
                        <button onClick={() => handleMessageFriend(f._id)} className="w-full text-[11px] bg-purple-600 text-white px-2.5 py-1.5 rounded-lg font-semibold hover:bg-purple-700 text-center transition">Send Message</button>
                        <button onClick={() => handleSendRequest(f._id)} className="w-full text-[11px] bg-red-500 text-white px-2.5 py-1.5 rounded-lg font-semibold hover:bg-red-600 text-center transition">Remove Friend</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!friendLoading && friends.length > 0 && (
                <div className="mt-6">
                  <hr className="mb-4 border-gray-200" />
                  <h3 className="text-lg font-bold text-purple-700 mb-4">Recent Friend Posts</h3>
                  {hubPostsLoading ? (
                    <div className="space-y-4">
                      {Array.from({length:2}).map((_,i) => (
                        <div key={i} className="bg-gray-50 rounded-xl p-4 animate-pulse">
                          <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 bg-gray-200 rounded-full" /><div className="h-4 w-32 bg-gray-200 rounded" /></div>
                          <div className="h-20 bg-gray-200 rounded-xl" />
                        </div>
                      ))}
                    </div>
                  ) : hubPosts.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-6">No recent posts from friends</p>
                  ) : (
                    <div className="space-y-4">
                      {hubPosts.map((post) => (
                        <PostCard key={post._id} post={post} currentUserId={user._id} onDelete={handleDeletePost} onShare={handleShare} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>

        {/* Right Panel backdrop */}
        {showRightPanel && (
          <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setShowRightPanel(false)} />
        )}
        {/* Right Panel - hidden on mobile unless toggled */}
        <aside className={`w-72 flex-shrink-0 ${showRightPanel ? "block" : "hidden"} lg:block fixed lg:static right-0 top-0 h-full lg:h-auto z-40 lg:z-auto bg-gray-50 lg:bg-transparent p-4 lg:p-0 pt-16 lg:pt-0 overflow-y-auto shadow-xl lg:shadow-none`}>
          <div className="lg:hidden flex justify-end mb-4">
            <button onClick={() => setShowRightPanel(false)} className="text-gray-500 hover:text-gray-700"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
          {renderRightPanel()}
        </aside>
      </div>

      {showGoLiveModal && <GoLiveModal onClose={() => setShowGoLiveModal(false)} />}
      {liveRoom && <LiveRoom />}

      {/* Modals - Offline Payment */}
      {showOfflineModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowOfflineModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">Pay Offline - {selectedMonth} {selectedYear}</h3>
            <p className="text-gray-600 mb-4">Kindly make dues payment to <br /><span className="font-bold text-purple-600">6337423425 Moniepoint - Royal Youth Concepts</span></p>
            <p className="text-gray-600 mb-4">Send payment receipt to group chat for necessary updates.</p>
            <button onClick={() => setShowOfflineModal(false)} className="w-full bg-purple-600 text-white p-3 rounded-lg font-semibold hover:bg-purple-700">OK</button>
          </div>
        </div>
      )}

      {/* Special Payment Modal */}
      {showSpecialModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSpecialModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">Make Special Payment</h3>
            <div className="mb-4"><label className="block text-sm text-gray-600 mb-1">Purpose of Payment</label><input type="text" value={specialPurpose} onChange={(e) => setSpecialPurpose(e.target.value)} placeholder="e.g., Donation, Building Fund, Event" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" /></div>
            <div className="mb-4"><label className="block text-sm text-gray-600 mb-1">Amount (N)</label><input type="number" value={specialAmount} onChange={(e) => setSpecialAmount(e.target.value)} placeholder="Enter amount" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" min="100" /></div>
            <div className="flex gap-3">
              <button onClick={() => setShowSpecialModal(false)} className="flex-1 bg-gray-500 text-white p-3 rounded-lg font-semibold">Cancel</button>
              <button onClick={handleSpecialPayOffline} className="flex-1 bg-gray-600 text-white p-3 rounded-lg font-semibold hover:bg-gray-700">Pay Offline</button>
            </div>
          </div>
        </div>
      )}

      {/* Handbook Modal */}
      {showHandbookModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={() => setShowHandbookModal(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4 text-purple-600">Royal Youth Handbook</h3>
            <p className="mb-4 text-gray-600">Please Note the password of this document is <span className="font-bold">royal</span></p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowHandbookModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={() => { setShowHandbookModal(false); window.open("https://drive.google.com/file/d/1sg1_Vfv_CzF7ToCp0JK2ssvUF-YiZObq/view?usp=drivesdk", "_blank"); }} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">OK</button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {(showImageModal || viewingImage) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onClick={() => { setShowImageModal(false); setViewingImage(null); }}>
          <div className="relative max-w-3xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { setShowImageModal(false); setViewingImage(null); }} className="absolute top-0 right-0 bg-white rounded-full p-2 hover:bg-gray-100 z-10"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            <img src={optimizeImage(viewingImage ? viewingImage.url : user.profileImage, 800)} alt="Profile" className="max-w-full max-h-[80vh] object-contain" loading="lazy" />
            {!viewingImage && (
              <button onClick={() => { const a = document.createElement('a'); a.href = user.profileImage; a.download = `${user.firstname}_${user.surname}_profile.jpg`; a.click(); }} className="mt-4 flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Download Image
              </button>
            )}
          </div>
        </div>
      )}
      {showNicknamePrompt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Complete Your Profile</h3>
               <p className="text-sm text-gray-500 mb-4">Please fill in the missing details below.</p>
               <input type="text" placeholder="Nickname *" title="Name you want others to see in Chats/Posts" value={nicknameInput} onChange={e => setNicknameInput(e.target.value)} className="w-full p-3 border rounded-xl mb-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
               <p className="text-[11px] text-gray-400 mb-3 text-left w-full">Name you want others to see in Chats/Posts</p>
              <select value={genderInput} onChange={e => setGenderInput(e.target.value)} className="w-full p-3 border rounded-xl mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white">
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              <select value={stateOfOriginInput} onChange={e => { setStateOfOriginInput(e.target.value); setSelectedPromptState(e.target.value); setLgaInput(""); }} className="w-full p-3 border rounded-xl mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white">
                <option value="">State of Origin</option>
                {nigerianStates.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={lgaInput} onChange={e => setLgaInput(e.target.value)} disabled={!selectedPromptState} className="w-full p-3 border rounded-xl mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white disabled:opacity-50">
                <option value="">Local Government Area</option>
                {selectedPromptState && lgaByState[selectedPromptState]?.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <button onClick={async () => { try { await API.put("/auth/profile", { nickname: nicknameInput.trim(), gender: genderInput, stateOfOrigin: stateOfOriginInput.trim(), lga: lgaInput.trim() }); setUser(prev => ({ ...prev, nickname: nicknameInput.trim(), gender: genderInput, stateOfOrigin: stateOfOriginInput.trim(), lga: lgaInput.trim() })); setShowNicknamePrompt(false); } catch (e) { console.error(e); } }} className="w-full px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors">Save</button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        open={clearAllConfirm}
        title="Clear All Notifications"
        message="Are you sure you want to delete all notifications? This action cannot be undone."
        onConfirm={() => { API.delete("/notifications/clear-all").then(() => { setNotifications([]); setUnreadCount(0); updateBadge(0); }).catch(() => {}); setClearAllConfirm(false); }}
        onCancel={() => setClearAllConfirm(false)}
      />
    </div>
  );
}

export default MemberDashboard;
