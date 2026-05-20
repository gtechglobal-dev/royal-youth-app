import Parser from "rss-parser";
import FeedSource from "../models/feedSource.js";
import User from "../models/user.js";

const parser = new Parser({
  timeout: 10000,
  headers: { "User-Agent": "RoyalYouthHub/1.0" },
});

let cachedFeed = null;
let cacheTime = 0;
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

export const getExternalFeed = async (req, res) => {
  try {
    const now = Date.now();
    if (cachedFeed && now - cacheTime < CACHE_TTL) {
      return res.json(cachedFeed);
    }

    const sources = await FeedSource.find({ enabled: true }).sort({ order: 1 });
    const results = [];

    for (const source of sources) {
      try {
        const feed = await parser.parseURL(source.url);
        const posts = (feed.items || []).slice(0, 5).map((item) => ({
          id: `${source.sourceId}-${item.guid || item.link || item.title}`,
          sourceId: source.sourceId,
          sourceLabel: source.label,
          sourceIcon: source.icon,
          category: source.category,
          title: item.title || "Untitled",
          link: item.link || "#",
          content: item.contentSnippet || item.content || "",
          date: item.isoDate || item.pubDate || null,
          image: item.enclosure?.url ||
                 item["media:thumbnail"]?.$?.url ||
                 item["media:content"]?.$?.url ||
                 null,
        }));
        results.push(...posts);
      } catch (err) {
        console.error(`RSS fetch error for ${source.sourceId}:`, err.message);
      }
    }

    results.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    const output = { posts: results.slice(0, 30) };
    cachedFeed = output;
    cacheTime = now;

    res.json(output);
  } catch (err) {
    console.error("External feed error:", err);
    res.status(500).json({ message: "Failed to fetch external feed" });
  }
};

export const getFollowedFeedPosts = async (userId) => {
  try {
    const user = await User.findById(userId);
    const followedIds = user?.followedFeeds || [];
    if (followedIds.length === 0) return [];

    const sources = await FeedSource.find({ sourceId: { $in: followedIds }, enabled: true });
    if (sources.length === 0) return [];

    const results = [];
    for (const source of sources) {
      try {
        const feed = await parser.parseURL(source.url);
        const posts = (feed.items || []).slice(0, 3).map((item) => ({
          id: `${source.sourceId}-${item.guid || item.link || item.title}`,
          sourceId: source.sourceId,
          sourceLabel: source.label,
          sourceIcon: source.icon,
          category: source.category,
          title: item.title || "Untitled",
          link: item.link || "#",
          content: item.contentSnippet || item.content || "",
          date: item.isoDate || item.pubDate || null,
          image: item.enclosure?.url ||
                 item["media:thumbnail"]?.$?.url ||
                 item["media:content"]?.$?.url ||
                 null,
          _isRss: true,
        }));
        results.push(...posts);
      } catch (err) {
        console.error(`Followed RSS fetch error for ${source.sourceId}:`, err.message);
      }
    }
    return results;
  } catch (err) {
    console.error("getFollowedFeedPosts error:", err);
    return [];
  }
};

export const getAvailableSources = async (req, res) => {
  try {
    const sources = await FeedSource.find({ enabled: true }).sort({ order: 1 });
    const user = await User.findById(req.user._id);
    const followedIds = user?.followedFeeds || [];

    const result = sources.map((s) => ({
      _id: s._id,
      sourceId: s.sourceId,
      label: s.label,
      category: s.category,
      icon: s.icon,
      url: s.url,
      following: followedIds.includes(s.sourceId),
    }));

    res.json(result);
  } catch (err) {
    console.error("getAvailableSources error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const followSource = async (req, res) => {
  try {
    const { sourceId } = req.params;
    const source = await FeedSource.findOne({ sourceId, enabled: true });
    if (!source) return res.status(404).json({ message: "Feed source not found" });

    await User.findByIdAndUpdate(req.user._id, { $addToSet: { followedFeeds: sourceId } });
    res.json({ message: "Following feed source" });
  } catch (err) {
    console.error("followSource error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const unfollowSource = async (req, res) => {
  try {
    const { sourceId } = req.params;
    await User.findByIdAndUpdate(req.user._id, { $pull: { followedFeeds: sourceId } });
    res.json({ message: "Unfollowed feed source" });
  } catch (err) {
    console.error("unfollowSource error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
