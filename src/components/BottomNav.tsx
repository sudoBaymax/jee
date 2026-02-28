import { NavLink, useLocation } from 'react-router-dom';
import { Heart, ClipboardCheck, Calendar, MessageCircle } from 'lucide-react';
import { useAppState } from '@/context/AppContext';

const navItems = [
  { to: '/', icon: Heart, label: 'Start' },
  { to: '/assessment', icon: ClipboardCheck, label: 'Assess' },
  { to: '/coach', icon: Calendar, label: 'Plan' },
  { to: '/practice', icon: MessageCircle, label: 'Practice' },
];

const BottomNav = () => {
  const location = useLocation();
  const { assessment } = useAppState();

  // Hide on onboarding, and on assessment page after quiz is completed
  if (location.pathname === '/') return null;
  if (location.pathname === '/assessment' && assessment) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="max-w-lg mx-auto flex">
        {navItems.map(item => {
          const active = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
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
  );
};

export default BottomNav;
