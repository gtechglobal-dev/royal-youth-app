import { createRequire } from "module";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const NodeMediaServer = require("node-media-server");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mediaRoot = path.join(__dirname, "../media");
const hlsDir = path.join(mediaRoot, "live");
fs.mkdirSync(hlsDir, { recursive: true });

const config = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60,
  },
  http: {
    port: 8000,
    allow_origin: "*",
    mediaroot: mediaRoot,
  },
  hls: {
    enabled: true,
    hlsPath: hlsDir,
    hlsFragment: 2,
    hlsListSize: 6,
    hlsFlags: "[hls_time=2:hls_list_size=6:hls_flags=delete_segments]",
  },
};

const nms = new NodeMediaServer(config);

let streamActiveCallback = null;
let streamDoneCallback = null;

nms.on("postPublish", (id, StreamPath, args) => {
  const streamKey = StreamPath.split("/").pop();
  console.log(`[RTMP] Stream started: ${streamKey}`);
  if (streamActiveCallback) streamActiveCallback(streamKey);
});

nms.on("donePublish", (id, StreamPath, args) => {
  const streamKey = StreamPath.split("/").pop();
  console.log(`[RTMP] Stream ended: ${streamKey}`);
  if (streamDoneCallback) streamDoneCallback(streamKey);
});

export function startRtmpServer() {
  try {
    nms.run();
    console.log(`[RTMP] Server listening on port ${config.rtmp.port} (HTTP stats on ${config.http.port})`);
  } catch (err) {
    console.error("[RTMP] Failed to start RTMP server — external software streaming unavailable:", err.message);
  }
}

export const getHlsDir = () => hlsDir;

export function onStreamActive(cb) {
  streamActiveCallback = cb;
}

export function onStreamDone(cb) {
  streamDoneCallback = cb;
}
