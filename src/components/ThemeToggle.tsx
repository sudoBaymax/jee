import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = () => {
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark(d => !d)}
      className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shadow-soft hover:shadow-glow transition-all"
      aria-label="Toggle theme"
    >
      {dark ? <Sun className="w-5 h-5 text-accent" /> : <Moon className="w-5 h-5 text-muted-foreground" />}
    </button>
  );
};

export default ThemeToggle;
