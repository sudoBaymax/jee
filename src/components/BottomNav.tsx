import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Heart, ClipboardCheck, Calendar, MessageCircle, Users } from 'lucide-react';
import { useAppState } from '@/context/AppContext';

const navItems = [
  { to: '/', icon: Heart, label: 'Start', stage: 1 },
  { to: '/assessment', icon: ClipboardCheck, label: 'Assess', stage: 2 },
  { to: '/coach', icon: Calendar, label: 'Plan', stage: 3 },
  { to: '/practice', icon: MessageCircle, label: 'Practice', stage: 4 },
  { to: '/couples', icon: Users, label: 'Couples', stage: 5 },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { assessment, chatActive, currentStage } = useAppState();
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingNav, setPendingNav] = useState<string | null>(null);

  // Hide on certain pages
  if (location.pathname === '/') return null;
  if (location.pathname === '/register') return null;
  if (location.pathname === '/admin') return null;
  if (location.pathname === '/assessment' && assessment) return null;
  if (location.pathname.startsWith('/couples/chat')) return null;
  if (chatActive) return null;

  const handleNavClick = (e: React.MouseEvent, to: string, stage: number) => {
    // If user is at stage 3+ and tries to go to stage 1 or 2, show confirmation
    if (currentStage >= 3 && stage <= 2) {
      e.preventDefault();
      setPendingNav(to);
      setShowConfirm(true);
      return;
    }
  };

  const confirmRedo = () => {
    setShowConfirm(false);
    if (pendingNav) {
      navigate(pendingNav);
      setPendingNav(null);
    }
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
        <div className="max-w-lg mx-auto flex">
          {navItems.map(item => {
            const active = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={(e) => handleNavClick(e, item.to, item.stage)}
                className={`flex-1 flex flex-col items-center py-2.5 text-xs font-medium transition-colors ${
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <item.icon className="w-5 h-5 mb-0.5" />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/40 px-6">
          <div className="bg-card rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4">
            <h3 className="text-lg font-bold">Redo the attachment quiz?</h3>
            <p className="text-sm text-muted-foreground">
              Going back will let you retake the assessment. Your current results will be replaced.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowConfirm(false); setPendingNav(null); }}
                className="flex-1 px-4 py-2.5 rounded-xl border-2 border-border text-sm font-medium hover:border-primary/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRedo}
                className="flex-1 px-4 py-2.5 rounded-xl gradient-hero text-primary-foreground text-sm font-semibold shadow-glow hover:opacity-90 transition-opacity"
              >
                Yes, redo it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BottomNav;
