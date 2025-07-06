'use client';

import { useRouter } from 'next/navigation';
import { Sparkles, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function AIAssistantWidget() {
  const router = useRouter();

  // Placeholder for assistant interaction. For now, opens a dialog.
  // Could navigate to /assistant page: router.push('/assistant');
  const handleAssistantClick = () => {
    // This function body is inside the DialogTrigger and DialogContent,
    // so actual navigation would be done by a button inside the Dialog if needed.
    // Or, remove Dialog and make the Card itself a button/link.
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="glassmorphic-card col-span-1 md:col-span-2 row-span-2 flex flex-col items-center justify-center text-center p-6 cursor-pointer hover:border-purple-400/50 transition-all duration-300 ease-in-out animated-gradient-bg h-full">
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-primary opacity-30 blur-2xl animate-pulse"></div>
            <div className="relative w-32 h-32 rounded-full bg-primary/30 flex items-center justify-center animate-orb-pulse">
              <Sparkles className="h-16 w-16 text-primary-foreground drop-shadow-[0_0_8px_hsl(var(--primary))]" />
            </div>
          </div>
          <CardTitle className="font-headline text-3xl mb-2 text-gray-50">Asistente IA</CardTitle>
          <CardDescription className="text-gray-400 mb-4 max-w-xs">
            Optimiza tu centro de datos con la ayuda de nuestra IA. Pregunta, analiza y gestiona.
          </CardDescription>
          <Button variant="secondary" size="lg" className="bg-purple-500 hover:bg-purple-400 text-primary-foreground neon-glow-primary">
            <MessageCircle className="mr-2 h-5 w-5" />
            Iniciar Asistente
          </Button>
        </Card>
      </DialogTrigger>
      <DialogContent className="glassmorphic-card border-purple-500/40 text-gray-50">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Asistente IA de Zionary</DialogTitle>
          <DialogDescription className="text-gray-400">
            Interfaz de chat con el asistente IA (Próximamente).
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p>Aquí iría la interfaz de chat con el asistente.</p>
          <p className="mt-2 text-sm text-gray-500">Por ahora, esta es una demostración. La navegación a <code>/assistant</code> o una funcionalidad de chat completa se implementaría aquí.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
