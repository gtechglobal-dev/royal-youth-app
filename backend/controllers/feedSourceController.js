import FeedSource from "../models/feedSource.js";

const DEFAULT_SOURCES = [
  { sourceId: "verse", url: "https://dailyverses.net/rss.xml", label: "Daily Verses", category: "spiritual", icon: "🙏", order: 1 },
  { sourceId: "gospel-coalition", url: "https://www.thegospelcoalition.org/feed/", label: "The Gospel Coalition", category: "spiritual", icon: "✝️", order: 2 },
  { sourceId: "christian-today", url: "https://www.christiantoday.com/rss/feed.xml", label: "Christian Today", category: "spiritual", icon: "📖", order: 3 },
  { sourceId: "church-leaders", url: "https://feeds.feedburner.com/churchleaders", label: "ChurchLeaders", category: "spiritual", icon: "⛪", order: 4 },
  { sourceId: "forbes-innovation", url: "https://www.forbes.com/innovation/feed/", label: "Forbes Innovation", category: "business", icon: "💡", order: 5 },
  { sourceId: "inc", url: "https://www.inc.com/rss/", label: "Inc.com", category: "business", icon: "📈", order: 6 },
  { sourceId: "smallbiz-trends", url: "https://smallbiztrends.com/feed", label: "Small Business Trends", category: "business", icon: "🚀", order: 7 },
];

export const seedFeedSources = async () => {
  const ids = DEFAULT_SOURCES.map((s) => s.sourceId);
  for (const src of DEFAULT_SOURCES) {
    await FeedSource.findOneAndUpdate(
      { sourceId: src.sourceId },
      {
        $set: {
          url: src.url,
          label: src.label,
          category: src.category,
          icon: src.icon,
          order: src.order,
        },
        $setOnInsert: { enabled: true },
      },
      { upsert: true }
    );
  }
  await FeedSource.deleteMany({ sourceId: { $nin: ids } });
};

export const getFeedSources = async (req, res) => {
  try {
    const sources = await FeedSource.find().sort({ order: 1 });
    res.json(sources);
  } catch (err) {
    console.error("Get feed sources error:", err);
    res.status(500).json({ message: "Failed to get feed sources" });
  }
};

export const toggleFeedSource = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "youth_president") {
      return res.status(403).json({ message: "Admin access required" });
    }
    const { id } = req.params;
    const source = await FeedSource.findById(id);
    if (!source) return res.status(404).json({ message: "Source not found" });
    source.enabled = !source.enabled;
    await source.save();
    res.json(source);
  } catch (err) {
    console.error("Toggle feed source error:", err);
    res.status(500).json({ message: "Failed to toggle feed source" });
  }
};
