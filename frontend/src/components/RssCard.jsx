import { useState } from "react";
import { timeAgo } from "../utils/formatTime";

function RssCard({ item }) {
  const domain = item.link ? new URL(item.link).hostname.replace("www.", "") : "";
  const [iconError, setIconError] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden flex-shrink-0">
          {iconError ? (
            <span className="text-purple-600 font-bold text-sm">{(item.sourceLabel || "R")[0]}</span>
          ) : (
            <img
              src={item.sourceIcon || `https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
              onError={() => setIconError(true)}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="font-semibold text-sm text-purple-700">{item.sourceLabel || domain}</span>
              {item.category && (
                <span className="ml-1.5 text-[10px] font-medium text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded whitespace-nowrap">{item.category}</span>
              )}
            </div>
            <span className="text-gray-400 text-xs whitespace-nowrap shrink-0">{timeAgo(item.date)}</span>
          </div>
          {item.image && !imgError && (
            <img
              src={item.image}
              alt=""
              className="mt-3 rounded-lg max-h-48 w-full object-cover"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          )}
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-2 block"
          >
            <h3 className="text-sm font-bold text-gray-800 group-hover:text-purple-600 transition-colors line-clamp-2">{item.title}</h3>
          </a>
          {item.content && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-3">{item.content.replace(/<[^>]*>/g, "")}</p>
          )}
          <div className="mt-2 flex items-center gap-1 text-[11px] text-gray-400">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            <span>{domain}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RssCard;
