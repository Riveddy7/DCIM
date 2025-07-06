'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, User, Send, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { askAssistant } from '@/ai/flows/assistant-flow';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIAssistantWidgetProps {
  tenantId: string;
}

export function AIAssistantWidget({ tenantId }: AIAssistantWidgetProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hola! Soy tu asistente de Zionary. Pregúntame sobre tu infraestructura, como '¿cuántos racks tenemos?'",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom on new message
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await askAssistant({ query: input, tenantId });
      const assistantMessage: Message = { role: 'assistant', content: result.response };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error asking assistant:', error);
      toast({
        title: 'Error de IA',
        description: 'No se pudo obtener una respuesta del asistente.',
        variant: 'destructive',
      });
       const errorMessage: Message = { role: 'assistant', content: "Lo siento, tuve un problema para procesar tu solicitud." };
       setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="glassmorphic-card flex flex-col h-full">
      <CardHeader>
        <CardTitle className="font-headline text-xl text-gray-50 flex items-center">
          <Sparkles className="mr-2 h-5 w-5 text-primary" />
          Asistente IA
        </CardTitle>
        <CardDescription className="text-gray-400">
          Obtén información sobre tu infraestructura en tiempo real.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden flex flex-col">
        <ScrollArea className="flex-grow" ref={scrollAreaRef}>
          <div className="space-y-4 pr-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-start gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8 bg-primary/20">
                    <AvatarFallback>
                      <Sparkles className="h-5 w-5 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-xs rounded-lg p-3 text-sm lg:max-w-md',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-input text-foreground'
                  )}
                >
                  {message.content}
                </div>
                 {message.role === 'user' && (
                   <Avatar className="h-8 w-8 bg-gray-600/50">
                     <AvatarFallback>
                       <User className="h-5 w-5 text-gray-300" />
                     </AvatarFallback>
                   </Avatar>
                )}
              </div>
            ))}
             {isLoading && (
                <div className="flex items-start gap-3 justify-start">
                    <Avatar className="h-8 w-8 bg-primary/20">
                        <AvatarFallback>
                            <Loader2 className="h-5 w-5 text-primary animate-spin" />
                        </AvatarFallback>
                    </Avatar>
                    <div className="max-w-xs rounded-lg p-3 text-sm bg-input text-foreground">
                        Pensando...
                    </div>
                </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="¿Cuántos activos tengo sin asignar?"
            className="bg-background/50 flex-grow"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
