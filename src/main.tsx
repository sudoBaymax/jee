import { createRoot } from "react-dom/client";
import { Auth0Provider } from "@auth0/auth0-react";
import App from "./App.tsx";
import "./index.css";

const domain = "dev-n87jx5rxhd38nj1m.us.auth0.com";
const clientId = "1q4o7k4uiJ5ZVmZ0QYwNaOvMCwtElz81";

const Root = () => {
  if (!domain || !clientId) {
    return (
      <div style={{ padding: 24, fontFamily: "sans-serif" }}>
        <h2>Auth0 config missing</h2>
        <p>
          Add <b>VITE_AUTH0_DOMAIN</b> and <b>VITE_AUTH0_CLIENT_ID</b> to your environment variables (or .env file).
        </p>
        <pre style={{ background: "#f4f4f4", padding: 12, borderRadius: 8 }}>
          VITE_AUTH0_DOMAIN=dev-xxxxx.us.auth0.com VITE_AUTH0_CLIENT_ID=xxxxxxxxxxxxxxxxxxxx
        </pre>
      </div>
    );
  }

  return (
    <Auth0Provider domain={domain} clientId={clientId} authorizationParams={{ redirect_uri: window.location.origin }}>
      <App />
    </Auth0Provider>
  );
};

createRoot(document.getElementById("root")!).render(<Root />);
