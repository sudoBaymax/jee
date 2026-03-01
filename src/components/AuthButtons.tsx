import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus } from 'lucide-react';

const AuthButtons = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/login')}
        className="gap-1.5"
      >
        <LogIn className="w-4 h-4" />
        Log in
      </Button>
      <Button
        size="sm"
        onClick={() => navigate('/signup')}
        className="gap-1.5"
      >
        <UserPlus className="w-4 h-4" />
        Sign up
      </Button>
    </div>
  );
};

export default AuthButtons;
