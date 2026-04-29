import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import AppProvider from "./context/AppProvider.tsx";

const patchFetchWithOrganization = () => {
  const marker = "__orgFetchPatched";
  const win = window as any;
  if (win[marker]) return;

  const originalFetch = window.fetch.bind(window);
  const apiBase = import.meta.env.VITE_SERVER_URL;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const url = request.url;

    const shouldHandleApi = Boolean(apiBase) && url.startsWith(apiBase);
    const shouldSkip =
      url.includes("/auth/") ||
      url.includes("/user/login") ||
      url.includes("/check-token") ||
      url.includes("/organizations");

    if (!shouldHandleApi || shouldSkip) {
      return originalFetch(input as any, init);
    }

    const rawActiveOrg = localStorage.getItem("activeOrganization");
    let organizationId = "";

    if (rawActiveOrg) {
      try {
        organizationId = JSON.parse(rawActiveOrg)?.organizationId || "";
      } catch {
        organizationId = "";
      }
    }

    if (!organizationId) {
      return originalFetch(input as any, init);
    }

    const headers = new Headers(request.headers);
    headers.set("x-organization-id", organizationId);

    const nextRequest = new Request(request, { headers });
    return originalFetch(nextRequest);
  };

  win[marker] = true;
};

patchFetchWithOrganization();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AppProvider>
  </StrictMode>,
);
