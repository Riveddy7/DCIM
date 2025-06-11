'use client';

import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Task {
  id: string; // Changed from number to string for UUIDs from Supabase
  text: string;
  is_completed: boolean;
  user_id?: string; // Optional, assuming tasks are user-specific
}

export function ToDoListWidget() {
  const supabase = createClient();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoading(false);
      // Potentially show a message that user needs to be logged in
      return;
    }

    const { data, error } = await supabase
      .from('todos') // Assuming 'todos' table
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar las tareas.', variant: 'destructive' });
      console.error('Error fetching tasks:', error);
    } else {
      setTasks(data as Task[]);
    }
    setIsLoading(false);
  };

  const handleToggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedStatus = !task.is_completed;
    // Optimistic update
    setTasks(tasks.map(t => t.id === taskId ? { ...t, is_completed: updatedStatus } : t));

    const { error } = await supabase
      .from('todos')
      .update({ is_completed: updatedStatus })
      .match({ id: taskId });

    if (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar la tarea.', variant: 'destructive' });
      // Revert optimistic update
      setTasks(tasks.map(t => t.id === taskId ? { ...t, is_completed: !updatedStatus } : t));
      console.error('Error updating task:', error);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    setIsAdding(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: 'Error', description: 'Debes iniciar sesión para agregar tareas.', variant: 'destructive' });
      setIsAdding(false);
      return;
    }
    
    const { data, error } = await supabase
      .from('todos')
      .insert([{ text: newTaskText, user_id: user.id, is_completed: false }])
      .select()
      .single();

    if (error) {
      toast({ title: 'Error', description: 'No se pudo agregar la tarea.', variant: 'destructive' });
      console.error('Error adding task:', error);
    } else if (data) {
      setTasks([data as Task, ...tasks]);
      setNewTaskText('');
    }
    setIsAdding(false);
  };

  const handleDeleteTask = async (taskId: string) => {
    // Optimistic update
    const originalTasks = tasks;
    setTasks(tasks.filter(t => t.id !== taskId));

    const { error } = await supabase
      .from('todos')
      .delete()
      .match({ id: taskId });

    if (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar la tarea.', variant: 'destructive' });
      // Revert optimistic update
      setTasks(originalTasks);
      console.error('Error deleting task:', error);
    }
  };
  
  return (
    <Card className="glassmorphic-card h-full flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline text-xl text-gray-50">Lista de Pendientes</CardTitle>
        <CardDescription className="text-gray-400">Tus tareas y recordatorios importantes.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col overflow-hidden">
        <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
          <Input 
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="Nueva tarea..."
            className="bg-input border-purple-500/30 text-gray-50 flex-grow"
            disabled={isAdding}
          />
          <Button type="submit" size="icon" className="bg-primary hover:bg-primary/90" disabled={isAdding}>
            {isAdding ? <Loader2 className="h-4 w-4 animate-spin"/> : <PlusCircle className="h-4 w-4"/>}
          </Button>
        </form>

        {isLoading && <div className="flex justify-center items-center flex-grow"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>}
        
        {!isLoading && tasks.length === 0 && (
          <p className="text-center text-gray-500 py-4">No hay tareas pendientes. ¡Buen trabajo!</p>
        )}

        {!isLoading && tasks.length > 0 && (
          <ul className="space-y-3 overflow-y-auto flex-grow pr-1">
            {tasks.map((task) => (
              <li key={task.id} className="flex items-center justify-between group p-2 rounded-md hover:bg-white/5 transition-colors">
                <div className="flex items-center">
                  <Checkbox
                    id={`task-${task.id}`}
                    checked={task.is_completed}
                    onCheckedChange={() => handleToggleTask(task.id)}
                    className="mr-3 border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                  />
                  <label
                    htmlFor={`task-${task.id}`}
                    className={`text-sm cursor-pointer ${
                      task.is_completed ? 'text-gray-500 line-through' : 'text-gray-200'
                    } transition-all duration-300`}
                  >
                    {task.text}
                  </label>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-gray-500 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDeleteTask(task.id)}
                >
                  <Trash2 className="h-4 w-4"/>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// Note: For this component to fully work, a 'todos' table is needed in Supabase
// with columns: id (uuid, primary key), user_id (uuid, foreign key to auth.users),
// text (text), is_completed (boolean), created_at (timestamp with timezone, default now()).
// RLS policies should be enabled for users to only access their own todos.
