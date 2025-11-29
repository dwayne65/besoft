import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { Search, Sun, Moon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import CommandPalette from '@/components/CommandPalette';

export const DashboardLayout = () => {
  const [isPaletteOpen, setPaletteOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const dark = stored ? stored === 'dark' : window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(dark);
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, []);

  const toggleTheme = (value: boolean) => {
    setIsDark(value);
    const root = document.documentElement;
    if (value) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
            <h2 className="text-lg font-semibold">Maisha App Management System</h2>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" onClick={() => setPaletteOpen(true)} className="hidden md:flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search
                <span className="ml-2 rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">Ctrl K</span>
              </Button>
              <div className="flex items-center gap-2">
                <Sun className={`h-4 w-4 ${isDark ? 'text-muted-foreground' : 'text-foreground'}`} />
                <Switch checked={isDark} onCheckedChange={toggleTheme} aria-label="Toggle theme" />
                <Moon className={`h-4 w-4 ${isDark ? 'text-foreground' : 'text-muted-foreground'}`} />
              </div>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
      <CommandPalette open={isPaletteOpen} onOpenChange={setPaletteOpen} />
    </SidebarProvider>
  );
};
