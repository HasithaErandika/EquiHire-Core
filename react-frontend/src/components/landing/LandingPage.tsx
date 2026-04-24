import { EquiHireLogo, LandingPageIllustration } from "@/components/ui/Icons";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, BarChart3, ShieldCheck, Zap, LogOut, Github } from "lucide-react"
import { useAuthContext } from "@asgardeo/auth-react";
import { motion } from "framer-motion";
import automatedSvg from "@/assets/automated-pana.svg";
import biasSvg from "@/assets/bias-elimination-pana.svg";
import analyticsSvg from "@/assets/Setup Analytics-rafiki.svg";
import docBroSvg from "@/assets/Online document-bro.svg";

const FadeInWhenVisible = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay }}
    >
        {children}
    </motion.div>
);

export default function LandingPageComponent() {
    const { state, signIn, signOut } = useAuthContext();

    return (
        <>

        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen bg-background text-foreground flex flex-col font-sans"
        >
            {/* Navigation */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <EquiHireLogo className="h-10 w-auto md:h-12" />
                        <span className="font-bold text-xl tracking-tight">EquiHire</span>
                    </div>

                    <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
                        <a href="#features" className="transition-colors hover:text-primary">Features</a>
                        <a href="#solutions" className="transition-colors hover:text-primary">Solutions</a>
                        <a href="#docs" className="transition-colors hover:text-primary">Documentation</a>
                        <a href="https://github.com/HasithaErandika/EquiHire-Core" target="_blank" rel="noopener noreferrer" className="flex items-center transition-colors hover:text-primary">
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
                                <Button onClick={() => signIn({ prompt: "create" })}>Get Started</Button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative py-20 md:py-32 overflow-hidden">
                    <div className="container mx-auto px-4 relative z-10">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            <motion.div 
                                initial={{ opacity: 0, x: -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="space-y-8 text-left"
                            >
                                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                    <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
                                    Powered by Ballerina & Advanced AI
                                </div>

                                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
                                    AI-Powered Hiring. <br />
                                    <span className="text-primary">Fair, Efficient, Intelligent.</span>
                                </h1>

                                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
                                    Orchestrate your recruitment process with advanced AI agents.
                                    Eliminate bias, automate screening, and identify top talent with
                                    EquiHire's intelligent core engine.
                                </p>

                                <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4 pt-4">
                                    {state.isAuthenticated ? (
                                        <Button size="lg" className="w-full sm:w-auto text-lg px-8 h-12">
                                            Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    ) : (
                                        <Button size="lg" className="w-full sm:w-auto text-lg px-8 h-12" onClick={() => signIn({ prompt: "create" })}>
                                            Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    )}
                                    <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 h-12">
                                        View Demo
                                    </Button>
                                </div>
                            </motion.div>

                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                                className="flex justify-center flex-col items-center lg:justify-end"
                            >
                                <LandingPageIllustration width="500" height="400" />
                            </motion.div>
                        </div>
                    </div>

                    {/* Background Gradient */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl -z-10 pointer-events-none" />
                </section>

                {/* Features Grid */}
                <section id="features" className="py-24 relative overflow-hidden bg-background">
                    {/* Background accoutrements */}
                    <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />
                    <div className="absolute left-0 top-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
                    
                    <div className="container mx-auto px-4 relative z-10">
                        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
                            <FadeInWhenVisible>
                                <div className="inline-flex items-center rounded-full border border-primary/20 px-3 py-1 text-sm font-medium bg-primary/5 backdrop-blur-sm text-primary shadow-sm mb-4">
                                    <span className="flex h-2 w-2 rounded-full bg-primary mr-2 shadow-[0_0_8px_var(--theme-primary)]"></span>
                                    Core Engine
                                </div>
                                <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">Why EquiHire?</h2>
                                <p className="text-muted-foreground text-lg mt-4">
                                    Built on a robust Ballerina orchestrator and intelligent AI engine,
                                    we deliver a seamless recruitment experience.
                                </p>
                            </FadeInWhenVisible>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {/* Feature 1 */}
                            <FadeInWhenVisible delay={0.1}>
                                <Card className="relative overflow-hidden border border-border/50 shadow-2xl bg-card/40 backdrop-blur-xl hover:bg-card/60 hover:-translate-y-2 hover:shadow-primary/5 transition-all duration-500 group h-full">
                                    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <CardHeader className="relative z-10">
                                        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 shadow-inner ring-1 ring-primary/20 group-hover:scale-110 transition-transform duration-500">
                                            <Zap className="h-7 w-7 text-primary drop-shadow-[0_0_8px_var(--theme-primary)]" />
                                        </div>
                                        <CardTitle className="text-xl">Automated Screening</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4 relative z-10">
                                        <CardDescription className="text-base text-foreground/70 leading-relaxed">
                                            Instantly parse, rank, and analyze thousands of resumes using
                                            our advanced AI intelligence engine.
                                        </CardDescription>
                                        <div className="mt-8 flex justify-center py-6 bg-background/50 rounded-xl border border-border/50 shadow-sm group-hover:border-primary/20 transition-colors">
                                            <img src={automatedSvg} alt="Automated Screening Illustration" className="h-40 w-full object-contain opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </FadeInWhenVisible>

                            {/* Feature 2 */}
                            <FadeInWhenVisible delay={0.2}>
                                <Card className="relative overflow-hidden border border-border/50 shadow-2xl bg-card/40 backdrop-blur-xl hover:bg-card/60 hover:-translate-y-2 hover:shadow-primary/5 transition-all duration-500 group h-full">
                                    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <CardHeader className="relative z-10">
                                        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 shadow-inner ring-1 ring-primary/20 group-hover:scale-110 transition-transform duration-500">
                                            <ShieldCheck className="h-7 w-7 text-primary drop-shadow-[0_0_8px_var(--theme-primary)]" />
                                        </div>
                                        <CardTitle className="text-xl">Bias Elimination</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4 relative z-10">
                                        <CardDescription className="text-base text-foreground/70 leading-relaxed">
                                            Our AI models are trained to redact personal information and
                                            focus solely on skills and experience, ensuring fair hiring.
                                        </CardDescription>
                                        <div className="mt-8 flex justify-center py-6 bg-background/50 rounded-xl border border-border/50 shadow-sm group-hover:border-primary/20 transition-colors">
                                            <img src={biasSvg} alt="Bias Elimination Illustration" className="h-40 w-full object-contain opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </FadeInWhenVisible>

                            {/* Feature 3 */}
                            <FadeInWhenVisible delay={0.3}>
                                <Card className="relative overflow-hidden border border-border/50 shadow-2xl bg-card/40 backdrop-blur-xl hover:bg-card/60 hover:-translate-y-2 hover:shadow-primary/5 transition-all duration-500 group h-full">
                                    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <CardHeader className="relative z-10">
                                        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 shadow-inner ring-1 ring-primary/20 group-hover:scale-110 transition-transform duration-500">
                                            <BarChart3 className="h-7 w-7 text-primary drop-shadow-[0_0_8px_var(--theme-primary)]" />
                                        </div>
                                        <CardTitle className="text-xl">Real-time Analytics</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4 relative z-10">
                                        <CardDescription className="text-base text-foreground/70 leading-relaxed">
                                            Visualize hiring pipelines, candidate drop-off rates, and
                                            time-to-hire metrics with our comprehensive dashboards.
                                        </CardDescription>
                                        <div className="mt-8 flex justify-center py-6 bg-background/50 rounded-xl border border-border/50 shadow-sm group-hover:border-primary/20 transition-colors">
                                            <img src={analyticsSvg} alt="Analytics Illustration" className="h-40 w-full object-contain opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </FadeInWhenVisible>
                        </div>
                    </div>
                </section>

                {/* Solutions Section */}
                <section id="solutions" className="py-24 relative overflow-hidden border-t border-border/40 bg-muted/10">
                    <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:64px_64px]" />
                    <div className="container mx-auto px-4 relative z-10">
                        <div className="text-center max-w-3xl mx-auto space-y-8 p-12 rounded-[2.5rem] bg-background/40 backdrop-blur-2xl border border-border/50 shadow-2xl">
                            <FadeInWhenVisible>
                                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">What is EquiHire For?</h2>
                                <p className="text-lg text-muted-foreground leading-relaxed mt-6">
                                    EquiHire is designed to revolutionize the recruitment process by leveraging the power of AI.
                                    It serves as a bridge between talented candidates and forward-thinking companies, ensuring
                                    every application is evaluated virtually and efficiently. Whether you are a startup looking for
                                    your first engineer or an enterprise scaling your team, EquiHire automates the heavy lifting
                                    of resume screening and bias elimination.
                                </p>
                            </FadeInWhenVisible>
                        </div>
                    </div>
                </section>

                {/* Documentation Section */}
                <section id="docs" className="py-24 relative overflow-hidden border-t border-border/40 bg-background">
                    <div className="absolute left-0 bottom-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
                    
                    <div className="container mx-auto px-4 relative z-10">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            
                            <div className="space-y-12">
                                <FadeInWhenVisible>
                                    <div className="text-left space-y-4">
                                        <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">Documentation</h2>
                                        <p className="text-muted-foreground text-lg">
                                            Everything you need to know about integrating and using EquiHire.
                                        </p>
                                    </div>
                                </FadeInWhenVisible>

                                <div className="space-y-6 max-w-xl">
                                    <FadeInWhenVisible delay={0.1}>
                                        <Card className="border border-border/50 shadow-xl bg-card/40 backdrop-blur-md hover:border-primary/40 hover:shadow-primary/10 transition-all cursor-pointer group hover:bg-card/80 overflow-hidden relative">
                                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                            <CardHeader className="relative z-10">
                                                <CardTitle className="flex items-center text-xl group-hover:text-primary transition-colors">
                                                    <Zap className="mr-3 h-6 w-6 text-primary/80 group-hover:text-primary group-hover:scale-110 transition-all" /> User Guide
                                                </CardTitle>
                                                <CardDescription className="text-base pt-2">
                                                    Step-by-step guides to setting up your first job posting and configuring AI parameters.
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="relative z-10 mt-2">
                                                <Button variant="link" className="p-0 h-auto font-semibold text-primary/80 group-hover:text-primary" onClick={() => window.location.href = '/documentation/guide'}>
                                                    Read the guide <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    </FadeInWhenVisible>

                                    <FadeInWhenVisible delay={0.2}>
                                        <Card className="border border-border/50 shadow-xl bg-card/40 backdrop-blur-md hover:border-primary/40 hover:shadow-primary/10 transition-all cursor-pointer group hover:bg-card/80 overflow-hidden relative">
                                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                            <CardHeader className="relative z-10">
                                                <CardTitle className="flex items-center text-xl group-hover:text-primary transition-colors">
                                                    <BarChart3 className="mr-3 h-6 w-6 text-primary/80 group-hover:text-primary group-hover:scale-110 transition-all" /> API Reference
                                                </CardTitle>
                                                <CardDescription className="text-base pt-2">
                                                    Comprehensive API documentation for integrating EquiHire with your existing HR stack.
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="relative z-10 mt-2">
                                                <Button variant="link" className="p-0 h-auto font-semibold text-primary/80 group-hover:text-primary" onClick={() => window.location.href = '/documentation/api'}>
                                                    View API docs <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    </FadeInWhenVisible>
                                </div>
                            </div>
                            
                            <motion.div 
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: 0.3 }}
                                className="flex justify-center flex-col items-center lg:items-end w-full"
                            >
                                <div className="relative w-full max-w-lg aspect-square">
                                    <div className="absolute inset-0 bg-primary/10 rounded-full blur-[80px]" />
                                    <img src={docBroSvg} alt="Documentation Illustration" className="relative z-10 w-full h-full object-contain drop-shadow-2xl hover:scale-[1.02] transition-transform duration-700" />
                                </div>
                            </motion.div>
                            
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-24 relative overflow-hidden border-t border-border/40">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent -z-10" />
                    <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px] -z-10" />
                    <div className="container mx-auto px-4 text-center space-y-8 relative z-10">
                        <FadeInWhenVisible>
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">Ready to transform your hiring?</h2>
                            <p className="text-muted-foreground max-w-2xl mx-auto text-lg mb-8 mt-4">
                                Join thousands of companies using EquiHire to build diverse, high-performing teams.
                            </p>
                            <p className="text-sm text-muted-foreground/80 mt-8 font-medium bg-muted/50 inline-block px-4 py-2 rounded-full border border-border/50">
                                Free community edition.
                            </p>
                        </FadeInWhenVisible>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-muted/10 border-t border-border/40 py-16 text-sm text-muted-foreground backdrop-blur-md">
                <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
                    <div className="space-y-4">
                        <h3 className="font-bold text-foreground text-base">Product</h3>
                        <ul className="space-y-3">
                            <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Integrations</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Security</a></li>
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h3 className="font-bold text-foreground text-base">Resources</h3>
                        <ul className="space-y-3">
                            <li><a href="/documentation/guide" className="hover:text-primary transition-colors">Documentation</a></li>
                            <li><a href="/documentation/api" className="hover:text-primary transition-colors">API Reference</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Community</a></li>
                        </ul>
                    </div>
                    <div className="space-y-4 hidden md:block col-span-2">
                        <div className="flex items-center space-x-3 mb-4">
                            <EquiHireLogo className="h-8 w-auto opacity-90 drop-shadow-[0_0_8px_var(--theme-primary)]" />
                            <span className="font-bold text-xl text-foreground tracking-tight">EquiHire</span>
                        </div>
                        <p className="max-w-sm text-muted-foreground/80 leading-relaxed text-base">
                            The intelligent hiring platform for modern teams. Built with love using Ballerina and React.
                        </p>
                    </div>
                </div>
                <div className="container mx-auto px-4 pt-8 border-t border-border/40 flex flex-col md:flex-row items-center justify-between">
                    <p className="text-muted-foreground/80 font-medium">© 2026 EquiHire. All rights reserved.</p>
                    <div className="flex space-x-6 mt-4 md:mt-0 font-medium">
                        <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
                    </div>
                </div>
            </footer>
        </motion.div>
        </>
    )
}
