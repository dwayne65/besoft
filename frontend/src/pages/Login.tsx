import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { LogIn } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        toast({
          title: 'Welcome back!',
          description: 'Login successful',
        });
        navigate('/dashboard');
      } else {
        toast({
          title: 'Login failed',
          description: 'Invalid email or password',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred during login',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-2">
            <LogIn className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Welcome to Maisha App</CardTitle>
          <CardDescription>Sign in to manage your groups and members</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md space-y-1">
              <p className="font-semibold mb-2">🔐 Test Login Credentials:</p>
              <div className="space-y-1">
                <p><strong>Super Admin:</strong></p>
                <p className="ml-4">Email: <code className="bg-white px-2 py-0.5 rounded">admin@maisha.com</code></p>
                <p className="ml-4">Password: <code className="bg-white px-2 py-0.5 rounded">admin123</code></p>
                
                <p className="mt-2"><strong>Group Admin (Alpha):</strong></p>
                <p className="ml-4">Email: <code className="bg-white px-2 py-0.5 rounded">alpha@maisha.com</code></p>
                <p className="ml-4">Password: <code className="bg-white px-2 py-0.5 rounded">alpha123</code></p>
                
                <p className="mt-2"><strong>Group User (Alpha):</strong></p>
                <p className="ml-4">Email: <code className="bg-white px-2 py-0.5 rounded">user1@maisha.com</code></p>
                <p className="ml-4">Password: <code className="bg-white px-2 py-0.5 rounded">user123</code></p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:underline font-medium">
                Register here
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
