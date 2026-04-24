import { EquiHireLogo } from "@/components/ui/Icons";
import { Button } from "@/components/ui/button";
import { LogOut, Github } from "lucide-react";
import { useAuthContext } from "@asgardeo/auth-react";
import { motion } from "framer-motion";
import introductionDoc from "../../../doc/introduction.md?raw";
import gettingStartedDoc from "../../../doc/getting-started.md?raw";
import identityLifecycleDoc from "../../../doc/identity-lifecycle.md?raw";
import frontendDesignDoc from "../../../doc/frontend-design.md?raw";
import MarkdownRenderer from "./MarkdownRenderer";
import userGuideSvg from "@/assets/Online document-pana.svg";

const userGuideContent = [
  introductionDoc, 
  gettingStartedDoc, 
  identityLifecycleDoc, 
  frontendDesignDoc
].join('\n\n---\n\n');

export default function UserGuide() {
    const { state, signIn, signOut } = useAuthContext();

  return (
    <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/30"
    >
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center space-x-2 cursor-pointer" onClick={() => window.location.href = '/'}>
                  <EquiHireLogo className="h-10 w-auto md:h-12" />
                  <span className="font-bold text-xl tracking-tight">EquiHire Docs</span>
              </div>

              <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
                  <a href="/documentation/guide" className="text-primary font-semibold relative after:absolute after:-bottom-[21px] after:left-0 after:h-0.5 after:w-full after:bg-primary">User Guide</a>
                  <a href="/documentation/api" className="transition-colors hover:text-primary text-muted-foreground hover:text-foreground">API Reference</a>
                  <a href="https://github.com/HasithaErandika/EquiHire-Core" target="_blank" rel="noopener noreferrer" className="flex items-center transition-colors text-muted-foreground hover:text-foreground">
                    <Github className="mr-1 h-4 w-4" /> GitHub
                  </a>
              </nav>

              <div className="flex items-center space-x-4">
                  {state.isAuthenticated ? (
                      <div className="flex items-center gap-4">
                          <span className="text-sm font-medium hidden sm:block">
                              Hello, {state.username}
                          </span>
                          <Button variant="outline" onClick={() => signOut()}>
                              <LogOut className="mr-2 h-4 w-4" /> Sign Out
                          </Button>
                      </div>
                  ) : (
                      <>
                          <button className="text-sm font-medium hover:underline underline-offset-4 hidden sm:block" onClick={() => signIn()}>
                              Log in
                          </button>
                      </>
                  )}
              </div>
          </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 md:py-24 overflow-hidden border-b border-border/40 bg-zinc-950">
        <div className="container mx-auto px-4 relative z-10 flex flex-col lg:flex-row items-center gap-12 text-zinc-50">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex-1 space-y-6 text-left"
          >
            <div className="inline-flex items-center rounded-full border border-zinc-700/50 px-3 py-1 text-sm font-medium bg-zinc-900/50 backdrop-blur-sm text-zinc-300">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2 shadow-[0_0_8px_var(--theme-primary)]"></span>
              Documentation 2.0
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-zinc-400">
              EquiHire User Guide
            </h1>
            <p className="text-lg md:text-xl text-zinc-400 leading-relaxed max-w-xl">
              Everything you need to set up, manage, and scale your organization using our AI-driven equitable hiring platform.
            </p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex-1 flex justify-center flex-col items-center lg:justify-end"
          >
            <img src={userGuideSvg} alt="User Guide Illustration" className="w-[350px] md:w-[450px] drop-shadow-2xl" />
          </motion.div>
        </div>
        
        {/* Background Gradient matching Landing Page glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
      </section>

      <div className="container mx-auto px-4 flex-1 flex flex-col items-start md:flex-row gap-12 py-12">
        {/* Sidebar */}
        <aside className="w-full md:w-64 shrink-0 space-y-8 hidden md:block sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-muted">
          <div className="space-y-4">
            <h3 className="font-bold text-xs tracking-widest uppercase text-muted-foreground/70">Getting Started</h3>
            <div className="flex flex-col border-l border-border/50">
              <a href="#introduction-to-equihire" className="text-sm font-medium text-muted-foreground hover:text-foreground pl-4 py-2 transition-colors hover:border-l-2 hover:border-foreground/20">Introduction</a>
              <a href="#getting-started-with-equihire" className="text-sm font-medium text-muted-foreground hover:text-foreground pl-4 py-2 transition-colors hover:border-l-2 hover:border-foreground/20">Quick Start</a>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="font-bold text-xs tracking-widest uppercase text-muted-foreground/70">Core Concepts</h3>
            <div className="flex flex-col border-l border-border/50">
              <a href="#system-architecture" className="text-sm font-medium text-muted-foreground hover:text-foreground pl-4 py-2 transition-colors hover:border-l-2 hover:border-foreground/20">System Architecture</a>
              <a href="#phase-1-the-setup-organization-creation" className="text-sm font-medium text-muted-foreground hover:text-foreground pl-4 py-2 transition-colors hover:border-l-2 hover:border-foreground/20">Organizations</a>
              <a href="#the-solution-context-aware-assessment-engine" className="text-sm font-medium text-muted-foreground hover:text-foreground pl-4 py-2 transition-colors hover:border-l-2 hover:border-foreground/20">AI Screening</a>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <motion.main 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex-1 max-w-4xl min-w-0"
        >
          <MarkdownRenderer content={userGuideContent} />
        </motion.main>
      </div>

      <footer className="w-full border-t border-border/40 bg-muted/10 py-10 mt-12 backdrop-blur-md">
        <div className="container mx-auto px-4 flex flex-col items-center justify-center text-center space-y-4">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <EquiHireLogo className="h-8 w-auto opacity-75" />
            <span className="font-semibold tracking-tight">EquiHire Docs</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-md">
            The intelligent platform for equitable, unbiased hiring processes.
          </p>
          <div className="pt-4 w-full">
            <p className="text-xs text-muted-foreground/60 transition-colors">
              <a href="https://storyset.com/people" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-primary transition-colors">
                People illustrations by Storyset
              </a>
            </p>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}
