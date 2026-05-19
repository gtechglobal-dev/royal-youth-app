import FeedSource from "../models/feedSource.js";

const DEFAULT_SOURCES = [
  { sourceId: "verse", url: "https://feeds.feedburner.com/hl-devos-tv-niv", label: "Today's Verse", category: "spiritual", icon: "🙏", order: 1 },
  { sourceId: "jesus", url: "https://feeds.feedburner.com/hl-devos-ywj", label: "A Year with Jesus", category: "spiritual", icon: "✝️", order: 2 },
  { sourceId: "entrepreneur", url: "https://www.entrepreneur.com/feed.rss", label: "Entrepreneur", category: "business", icon: "💡", order: 3 },
  { sourceId: "sidehustle", url: "https://www.sidehustlenation.com/feed/", label: "Side Hustle Nation", category: "business", icon: "🚀", order: 4 },
];

export const seedFeedSources = async () => {
  for (const src of DEFAULT_SOURCES) {
    await FeedSource.findOneAndUpdate(
      { sourceId: src.sourceId },
      { $setOnInsert: src },
      { upsert: true }
    );
  }
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
