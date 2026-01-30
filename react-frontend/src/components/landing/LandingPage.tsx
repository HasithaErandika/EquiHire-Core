import { EquiHireLogo, LandingPageIllustration } from "@/components/ui/Icons";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowRight, BarChart3, ShieldCheck, Users, Zap, LogOut } from "lucide-react"
import { useAuthContext } from "@asgardeo/auth-react";

export default function LandingPageComponent() {
    const { state, signIn, signOut } = useAuthContext();

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
            {/* Navigation */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <EquiHireLogo className="w-8 h-8" />
                        <span className="font-bold text-xl tracking-tight">EquiHire-Core</span>
                    </div>

                    <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
                        <a href="#features" className="transition-colors hover:text-primary">Features</a>
                        <a href="#solutions" className="transition-colors hover:text-primary">Solutions</a>
                        <a href="#pricing" className="transition-colors hover:text-primary">Pricing</a>
                        <a href="#docs" className="transition-colors hover:text-primary">Documentation</a>
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
                                <Button variant="outline" className="hidden sm:flex border-primary text-primary hover:bg-primary/10" onClick={() => signIn({ prompt: "create" } as any)}>
                                    Register Organization
                                </Button>
                                <Button onClick={() => signIn()}>Get Started</Button>
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
                            <div className="space-y-8 text-left">
                                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                    <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
                                    Now within Ballerina & Python Ecosystem
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
                                        <Button size="lg" className="w-full sm:w-auto text-lg px-8 h-12" onClick={() => signIn()}>
                                            Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    )}
                                    <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 h-12">
                                        View Demo
                                    </Button>
                                </div>
                            </div>

                            <div className="flex justify-center lg:justify-end animate-fade-in-up">
                                <LandingPageIllustration width="500" height="400" />
                            </div>
                        </div>
                    </div>

                    {/* Background Gradient */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl -z-10 pointer-events-none" />
                </section>

                {/* Clients / Trust Section */}
                <section className="py-12 border-y bg-muted/30">
                    <div className="container mx-auto px-4 text-center">
                        <p className="text-sm font-semibold text-muted-foreground mb-8 uppercase tracking-wider">Trusted by next-gen hiring teams</p>
                        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                            {/* Placeholders for logos */}
                            <div className="text-xl font-bold flex items-center gap-2"><Zap className="h-6 w-6" /> TechCorp</div>
                            <div className="text-xl font-bold flex items-center gap-2"><Users className="h-6 w-6" /> HireSmart</div>
                            <div className="text-xl font-bold flex items-center gap-2"><ShieldCheck className="h-6 w-6" /> SafeRecruit</div>
                            <div className="text-xl font-bold flex items-center gap-2"><BarChart3 className="h-6 w-6" /> DataHire</div>
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section id="features" className="py-24 bg-background">
                    <div className="container mx-auto px-4">
                        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Why EquiHire-Core?</h2>
                            <p className="text-muted-foreground text-lg">
                                Built on a robust Ballerina orchestrator and Python AI engine,
                                we deliver a seamless recruitment experience.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {/* Feature 1 */}
                            <Card className="border-none shadow-lg bg-card/50 hover:bg-card transition-colors">
                                <CardHeader>
                                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                                        <Zap className="h-6 w-6 text-primary" />
                                    </div>
                                    <CardTitle>Automated Screening</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription className="text-base">
                                        Instantly parse, rank, and analyze thousands of resumes using
                                        our advanced Python intelligence engine.
                                    </CardDescription>
                                </CardContent>
                            </Card>

                            {/* Feature 2 */}
                            <Card className="border-none shadow-lg bg-card/50 hover:bg-card transition-colors">
                                <CardHeader>
                                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                                        <ShieldCheck className="h-6 w-6 text-primary" />
                                    </div>
                                    <CardTitle>Bias Elimination</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription className="text-base">
                                        Our AI models are trained to redact personal information and
                                        focus solely on skills and experience, ensuring fair hiring.
                                    </CardDescription>
                                </CardContent>
                            </Card>

                            {/* Feature 3 */}
                            <Card className="border-none shadow-lg bg-card/50 hover:bg-card transition-colors">
                                <CardHeader>
                                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                                        <BarChart3 className="h-6 w-6 text-primary" />
                                    </div>
                                    <CardTitle>Real-time Analytics</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription className="text-base">
                                        Visualize hiring pipelines, candidate drop-off rates, and
                                        time-to-hire metrics with our comprehensive dashboards.
                                    </CardDescription>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* Solutions Section */}
                <section id="solutions" className="py-24 bg-muted/30">
                    <div className="container mx-auto px-4">
                        <div className="text-center max-w-3xl mx-auto space-y-8">
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">What is EquiHire For?</h2>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                EquiHire is designed to revolutionize the recruitment process by leveraging the power of AI.
                                It serves as a bridge between talented candidates and forward-thinking companies, ensuring
                                every application is evaluated fairly and efficiently. Whether you are a startup looking for
                                your first engineer or an enterprise scaling your team, EquiHire automates the heavy lifting
                                of resume screening and bias elimination.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Pricing Section */}
                <section id="pricing" className="py-24 bg-background">
                    <div className="container mx-auto px-4 text-center">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-12">Simple, Transparent Pricing</h2>
                        <div className="max-w-md mx-auto">
                            <Card className="border-2 border-primary shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                                    POPULAR
                                </div>
                                <CardHeader>
                                    <CardTitle className="text-2xl">Community Edition</CardTitle>
                                    <CardDescription>Everything you need to hire fairly</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="text-5xl font-extrabold text-primary">Free</div>
                                    <p className="text-muted-foreground">
                                        EquiHire is totally free to use. We believe in democratizing access to unbiased hiring tools for everyone.
                                    </p>
                                    <ul className="space-y-3 text-sm text-left mx-auto max-w-[220px]">
                                        <li className="flex items-center"><ShieldCheck className="mr-2 h-5 w-5 text-green-500" /> Unlimited Job Postings</li>
                                        <li className="flex items-center"><ShieldCheck className="mr-2 h-5 w-5 text-green-500" /> Unlimited Candidates</li>
                                        <li className="flex items-center"><ShieldCheck className="mr-2 h-5 w-5 text-green-500" /> Advanced AI Analysis</li>
                                        <li className="flex items-center"><ShieldCheck className="mr-2 h-5 w-5 text-green-500" /> Bias Elimination</li>
                                    </ul>
                                    <Button className="w-full" size="lg" onClick={() => signIn()}>Get Started Now</Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* Documentation Section */}
                <section id="docs" className="py-24 bg-muted/30">
                    <div className="container mx-auto px-4">
                        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Documentation</h2>
                            <p className="text-muted-foreground text-lg">
                                Everything you need to know about integrating and using EquiHire.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                            <Card className="hover:border-primary/50 transition-all cursor-pointer group">
                                <CardHeader>
                                    <CardTitle className="flex items-center group-hover:text-primary transition-colors">
                                        <Zap className="mr-3 h-6 w-6" /> Quick Start Guide
                                    </CardTitle>
                                    <CardDescription>
                                        Step-by-step guides to setting up your first job posting and configuring AI parameters.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button variant="link" className="p-0 h-auto group-hover:underline">Read the guide <ArrowRight className="ml-1 h-4 w-4" /></Button>
                                </CardContent>
                            </Card>

                            <Card className="hover:border-primary/50 transition-all cursor-pointer group">
                                <CardHeader>
                                    <CardTitle className="flex items-center group-hover:text-primary transition-colors">
                                        <BarChart3 className="mr-3 h-6 w-6" /> API Reference
                                    </CardTitle>
                                    <CardDescription>
                                        Comprehensive API documentation for integrating EquiHire with your existing HR stack.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button variant="link" className="p-0 h-auto group-hover:underline">View API docs <ArrowRight className="ml-1 h-4 w-4" /></Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                </section>

                {/* CTA Section */}
                <section className="py-24 bg-primary text-primary-foreground">
                    <div className="container mx-auto px-4 text-center space-y-8">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to transform your hiring?</h2>
                        <p className="text-primary-foreground/80 max-w-2xl mx-auto text-lg">
                            Join thousands of companies using EquiHire to build diverse, high-performing teams.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 max-w-md mx-auto">
                            <Input
                                type="email"
                                placeholder="Enter your work email"
                                className="bg-background text-foreground h-12"
                            />
                            <Button size="lg" variant="secondary" className="w-full sm:w-auto h-12">
                                Get Started
                            </Button>
                        </div>
                        <p className="text-xs text-primary-foreground/60">
                            No credit card required. 14-day free trial.
                        </p>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-background border-t py-12 text-sm text-muted-foreground">
                <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
                    <div className="space-y-4">
                        <h3 className="font-bold text-foreground">Product</h3>
                        <ul className="space-y-2">
                            <li><a href="#" className="hover:text-primary">Features</a></li>
                            <li><a href="#" className="hover:text-primary">Integrations</a></li>
                            <li><a href="#" className="hover:text-primary">Pricing</a></li>
                            <li><a href="#" className="hover:text-primary">Security</a></li>
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h3 className="font-bold text-foreground">Resources</h3>
                        <ul className="space-y-2">
                            <li><a href="#" className="hover:text-primary">Documentation</a></li>
                            <li><a href="#" className="hover:text-primary">API Reference</a></li>
                            <li><a href="#" className="hover:text-primary">Blog</a></li>
                            <li><a href="#" className="hover:text-primary">Community</a></li>
                        </ul>
                    </div>
                    <div className="space-y-4 hidden md:block col-span-2">
                        <h3 className="font-bold text-foreground">EquiHire-Core</h3>
                        <p className="max-w-xs">
                            The intelligent hiring platform for modern teams. Built with love using Ballerina, Python, and React.
                        </p>
                    </div>
                </div>
                <div className="container mx-auto px-4 pt-8 border-t flex flex-col md:flex-row items-center justify-between">
                    <p>© 2026 EquiHire. All rights reserved.</p>
                    <div className="flex space-x-4 mt-4 md:mt-0">
                        <a href="#" className="hover:text-primary">Privacy Policy</a>
                        <a href="#" className="hover:text-primary">Terms of Service</a>
                    </div>
                </div>
            </footer>
        </div>
    )
}
