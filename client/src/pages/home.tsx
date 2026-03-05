import { useHello } from "@/hooks/use-examples";
import { Loader2, Code2, Server } from "lucide-react";

export default function Home() {
  const { data: helloData, isLoading, error } = useHello();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/[0.03] via-background to-background" />

      <main className="max-w-2xl w-full z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out flex flex-col items-center text-center space-y-12">
        
        <div className="h-16 w-16 bg-primary/5 rounded-2xl flex items-center justify-center shadow-sm border border-primary/10 mb-4 hover-elevate">
          <Code2 className="w-8 h-8 text-primary" strokeWidth={1.5} />
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-light text-foreground tracking-tight">
            Your empty template is ready.
          </h1>
          <p className="text-xl text-muted-foreground font-light max-w-lg mx-auto">
            A clean, minimal starting point for your next great application. Start coding!
          </p>
        </div>

        <div className="w-full max-w-md p-6 bg-card rounded-2xl border shadow-sm flex flex-col items-center space-y-4 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center space-x-2 text-sm font-medium text-foreground mb-2">
            <Server className="w-4 h-4 text-muted-foreground" />
            <span>Backend Connection Check</span>
          </div>

          <div className="w-full flex items-center justify-center p-4 bg-secondary/50 rounded-xl font-mono text-sm">
            {isLoading ? (
              <div className="flex items-center space-x-3 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Pinging /api/hello...</span>
              </div>
            ) : error ? (
              <div className="flex items-center space-x-2 text-destructive">
                <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                <span>API offline or error occurred</span>
              </div>
            ) : helloData ? (
              <div className="flex items-center space-x-3 text-primary">
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                <span>{`{ message: "${helloData.message}" }`}</span>
              </div>
            ) : null}
          </div>
        </div>
      </main>
      
      <footer className="absolute bottom-8 text-sm text-muted-foreground font-mono">
        Edit <span className="text-foreground">client/src/pages/home.tsx</span> to get started
      </footer>
    </div>
  );
}
