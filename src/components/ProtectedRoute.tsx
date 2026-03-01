import { withAuthenticationRequired } from "@auth0/auth0-react";
import type { ComponentType } from "react";

export default function ProtectedRoute(Component: ComponentType) {
  return withAuthenticationRequired(Component, {
    onRedirecting: () => <div>Loading...</div>,
  });
}
