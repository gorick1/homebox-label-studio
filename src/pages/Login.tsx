import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Loader2, Eye, EyeOff, Sparkles, Server } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function LoginPage() {
  const { login, loginAsDemo, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    
    if (!email.trim() || !password.trim()) {
      setLocalError('Please enter both username and password');
      return;
    }
    
    try {
      await login(email, password);
    } catch (err) {
      // Error is handled by auth context
    }
  };

  const handleDemoMode = () => {
    loginAsDemo();
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/10" />
      
      {/* Decorative floating shapes */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
      <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-primary/5 rounded-full blur-2xl animate-float" style={{ animationDelay: '-1.5s' }} />

      <Card className="w-full max-w-md glass-card animate-fade-in-up relative z-10 border-0 shadow-elevation-xl">
        <CardHeader className="text-center space-y-6 pb-2">
          {/* Logo with gradient background */}
          <div className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center shadow-elevation-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80 transition-transform group-hover:scale-105" />
            <Package className="w-10 h-10 text-primary-foreground relative z-10" />
          </div>
          
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Label Studio
            </CardTitle>
            <CardDescription className="text-base">
              Design labels for your Homebox inventory
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Demo Mode Button - prominently placed */}
          <Button 
            type="button"
            variant="outline" 
            className="w-full h-12 gap-3 text-base border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-all group"
            onClick={handleDemoMode}
          >
            <Sparkles className="h-5 w-5 text-primary group-hover:animate-pulse-soft" />
            Try Demo Mode
          </Button>

          <div className="flex items-center gap-4">
            <Separator className="flex-1" />
            <span className="text-sm text-muted-foreground">or sign in</span>
            <Separator className="flex-1" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Username</Label>
              <Input
                id="email"
                type="text"
                placeholder="your_username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                autoComplete="username"
                autoFocus
                className="h-12 text-base bg-background/50 border-border/50 focus:border-primary/50 transition-colors"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="h-12 text-base pr-12 bg-background/50 border-border/50 focus:border-primary/50 transition-colors"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
            
            {displayError && (
              <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20 animate-scale-in">
                {displayError}
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-medium shadow-elevation-md hover:shadow-elevation-lg transition-all"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
          
          {/* Connection status indicator */}
          <div className="flex items-center justify-center gap-2 pt-4">
            <Server className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              homebox.garrettorick.com
            </span>
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse-soft" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
