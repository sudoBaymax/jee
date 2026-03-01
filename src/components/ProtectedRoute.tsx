import { useEffect, useState, ComponentType } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const ProtectedRoute = (Component: ComponentType<any>) => {
  return function WrappedComponent(props: any) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          navigate("/login", { replace: true });
        } else {
          setAuthenticated(true);
        }
        setLoading(false);
      });
    }, [navigate]);

    if (loading) return null;
    if (!authenticated) return null;
    return <Component {...props} />;
  };
};

export default ProtectedRoute;
