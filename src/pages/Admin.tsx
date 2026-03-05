import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { LogOut, Shield, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';

interface AppUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  attachment_lean: string | null;
  attachment_scores: any;
  conflict_grade: string | null;
  conflict_summary: string | null;
  created_at: string;
}

const Admin = () => {
  const [session, setSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkAdmin(session.user.email);
      } else {
        setIsAdmin(null);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkAdmin(session.user.email);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdmin = async (email: string | undefined) => {
    if (!email) { setIsAdmin(false); setLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (error) {
        console.error('Admin check error:', error);
        setIsAdmin(false);
      } else {
        setIsAdmin(!!data);
        if (data) fetchUsers();
      }
    } catch {
      setIsAdmin(false);
    }
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch users error:', error);
      toast.error('Failed to load users');
    } else {
      setUsers(data || []);
    }
  };

  const signInWithGoogle = async () => {
    setSigningIn(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin + '/admin',
      });
      if (error) throw error;
    } catch (err) {
      console.error('Sign in error:', err);
      toast.error('Sign in failed');
      setSigningIn(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setIsAdmin(null);
    setUsers([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-calm flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not signed in
  if (!session) {
    return (
      <div className="min-h-screen gradient-calm flex items-center justify-center px-6">
        <motion.div
          className="w-full max-w-sm text-center space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Admin Access</h1>
          <p className="text-muted-foreground text-sm">Sign in with an authorized Google account to access the admin dashboard.</p>
          <button
            onClick={signInWithGoogle}
            disabled={signingIn}
            className="w-full px-6 py-3.5 rounded-xl bg-card border-2 border-border font-semibold hover:border-primary/50 transition-colors flex items-center justify-center gap-3"
          >
            {signingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Sign in with Google
          </button>
        </motion.div>
      </div>
    );
  }

  // Signed in but not admin
  if (isAdmin === false) {
    return (
      <div className="min-h-screen gradient-calm flex items-center justify-center px-6">
        <motion.div className="w-full max-w-sm text-center space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="w-16 h-16 rounded-full bg-destructive/10 mx-auto flex items-center justify-center">
            <Shield className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground text-sm">
            {session.user.email} is not authorized for admin access.
          </p>
          <button onClick={signOut} className="text-sm text-primary underline">Sign out</button>
        </motion.div>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="min-h-screen gradient-calm">
      <div className="max-w-6xl mx-auto p-4 pt-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{session.user.email}</span>
            <button onClick={signOut} className="p-2 rounded-lg hover:bg-muted transition-colors">
              <LogOut className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Users ({users.length})</h2>
            <button onClick={fetchUsers} className="text-sm text-primary hover:underline">Refresh</button>
          </div>

          {users.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">No users yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Name</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Email</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Attachment</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Conflict Grade</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3 font-medium">{u.first_name} {u.last_name}</td>
                      <td className="py-2.5 px-3 text-muted-foreground">{u.email}</td>
                      <td className="py-2.5 px-3">
                        {u.attachment_lean ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {u.attachment_lean}
                          </span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="py-2.5 px-3">
                        {u.conflict_grade ? (
                          <span className="font-semibold">{u.conflict_grade}</span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
