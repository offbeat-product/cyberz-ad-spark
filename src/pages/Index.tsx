import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Cpu, Rocket, ShieldCheck, Wand2 } from "lucide-react";
import heroImage from "@/assets/cyber-hero.jpg";

const features = [
  {
    icon: Wand2,
    title: "Neural Ad Forge",
    desc: "Generate scroll-stopping ad creative in seconds with our cyberpunk-trained AI models.",
  },
  {
    icon: Zap,
    title: "Lightspeed Output",
    desc: "From prompt to polished ad in under 10 seconds. Iterate at the speed of thought.",
  },
  {
    icon: Cpu,
    title: "Multi-Channel Sync",
    desc: "One brief, every format. Meta, TikTok, X, YouTube — auto-optimized for each.",
  },
  {
    icon: ShieldCheck,
    title: "Brand-Safe Core",
    desc: "Lock your tone, palette, and rules. Outputs stay on-brand, every single time.",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background bg-hero-glow">
      {/* Nav */}
      <header className="container flex items-center justify-between py-6">
        <a href="#" className="flex items-center gap-2 font-display text-xl font-bold tracking-wider">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-[image:var(--gradient-primary)] shadow-neon">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </span>
          <span className="text-gradient">AD GEN CYBERZ</span>
        </a>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
        </nav>
        <Button variant="cyber" size="sm">Sign in</Button>
      </header>

      {/* Hero */}
      <main>
        <section className="container grid gap-12 py-16 md:grid-cols-2 md:items-center md:py-24">
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs uppercase tracking-widest text-secondary">
              <Rocket className="h-3 w-3" /> v2.077 — Now in Beta
            </div>
            <h1 className="font-display text-5xl font-black leading-[1.05] md:text-7xl">
              Generate ads that <span className="text-gradient">hit different</span>.
            </h1>
            <p className="max-w-lg text-lg text-muted-foreground">
              Ad Gen CyberZ is the AI creative studio for builders, brands, and rebels. Type a prompt — ship a campaign. Welcome to the neon era of advertising.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button variant="neon" size="xl">
                <Sparkles /> Start generating
              </Button>
              <Button variant="cyber" size="xl">Watch demo</Button>
            </div>
            <div className="flex items-center gap-6 pt-4 text-xs uppercase tracking-widest text-muted-foreground">
              <span>★★★★★ 4.9 / 5</span>
              <span className="h-4 w-px bg-border" />
              <span>12,400+ creators</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-2xl bg-[image:var(--gradient-primary)] opacity-30 blur-2xl" />
            <img
              src={heroImage}
              alt="Cyberpunk AI generating neon advertisements"
              width={1536}
              height={1024}
              className="relative rounded-2xl border border-primary/30 shadow-neon animate-float"
            />
          </div>
        </section>

        {/* Features */}
        <section id="features" className="container py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-secondary">// modules</p>
            <h2 className="mt-3 font-display text-4xl font-bold md:text-5xl">
              Built for the <span className="text-gradient">post-feed era</span>
            </h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative rounded-xl border border-border bg-card/60 p-6 backdrop-blur-sm transition-all hover:border-primary/60 hover:-translate-y-1 hover:shadow-card"
              >
                <div className="mb-5 grid h-11 w-11 place-items-center rounded-lg bg-[image:var(--gradient-primary)] shadow-neon">
                  <f.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section id="pricing" className="container py-20">
          <div className="relative overflow-hidden rounded-3xl border border-primary/40 bg-card/60 p-10 text-center backdrop-blur-md md:p-16">
            <div className="absolute inset-0 bg-hero-glow opacity-60" />
            <div className="relative">
              <h2 className="font-display text-4xl font-bold md:text-5xl">
                Jack in. <span className="text-gradient">Ship faster.</span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                Join thousands of operators using Ad Gen CyberZ to dominate the feed. Free forever plan, no card required.
              </p>
              <Button variant="neon" size="xl" className="mt-8">
                <Sparkles /> Generate your first ad
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="container border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Ad Gen CyberZ — Engineered in the neon grid.
      </footer>
    </div>
  );
};

export default Index;
