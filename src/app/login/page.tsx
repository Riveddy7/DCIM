'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AtSign, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: 'Error de inicio de sesión',
        description: error.message || 'Email o contraseña incorrectos.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Inicio de sesión exitoso',
        description: 'Redirigiendo al dashboard...',
      });
      // Primero, refresca el estado del servidor. Esto permite que el middleware
      // o los componentes del servidor reconozcan la nueva sesión.
      router.refresh();
      // Luego, intenta la navegación al dashboard.
      // Si router.refresh() hace que el middleware redirija (porque ahora hay una sesión
      // y el usuario está en /login), este push podría incluso ser redundante,
      // pero es una buena medida.
      router.push('/dashboard');
    }
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 login-gradient">
      <Card className="w-full max-w-md glassmorphic-card">
        <CardHeader className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 neon-glow-primary">
            <svg
              className="h-8 w-8 text-primary"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 0L15.27 8.73L24 12L15.27 15.27L12 24L8.73 15.27L0 12L8.73 8.73L12 0Z" />
            </svg>
          </div>
          <CardTitle className="font-headline text-3xl font-bold text-gray-50">
            Zionary
          </CardTitle>
          <CardDescription className="text-gray-400">
            Ingresa para gestionar tu infraestructura.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 bg-input border-purple-500/30 focus:ring-primary focus:border-primary text-gray-50"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 bg-input border-purple-500/30 focus:ring-primary focus:border-primary text-gray-50"
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(168,85,247,0.7)] transition-all duration-300 ease-in-out neon-glow-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                'Ingresar'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      <p className="mt-8 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Zionary. Todos los derechos reservados.
      </p>
    </div>
  );
}
