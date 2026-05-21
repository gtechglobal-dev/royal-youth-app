import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

let needsRefresh = false;

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    needsRefresh = true;
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

window.addEventListener("load", () => {
  if (needsRefresh) {
    window.location.reload();
  }
});
