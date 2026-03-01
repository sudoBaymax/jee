import { useAuth0 } from "@auth0/auth0-react";

export default function AuthButtons() {
  const { loginWithRedirect, logout, isAuthenticated, isLoading, user } = useAuth0();

  if (isLoading) return <div>Loading...</div>;

  if (!isAuthenticated) {
    return <button onClick={() => loginWithRedirect()}>Log in</button>;
  }

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <span>{user?.name}</span>
      <button onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>Log out</button>
    </div>
  );
}
