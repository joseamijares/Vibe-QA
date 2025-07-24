import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import {
  ArrowRight,
  Check,
  MessageSquare,
  Bug,
  Camera,
  Monitor,
  Shield,
  Zap,
  Users,
  BarChart,
  Sparkles,
  FileText,
  Globe,
  Star,
  Github,
  Mic,
  Video,
  Code,
  Clock,
  ChevronDown,
} from 'lucide-react';
import { HeroMockup, DashboardMockup, FeatureMockup } from '@/components/Mockups';
import {
  AnimatedBackground,
  FloatingElements,
  DataVisualization,
} from '@/components/AnimatedBackground';
import { useEffect, useState } from 'react';

export function LandingPage() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header with modern glass effect */}
      <header className="fixed top-0 w-full z-50 px-4 py-4">
        <div className="container mx-auto">
          <nav className="glass-modern-light rounded-2xl px-8 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-12">
              <Link href="/" className="flex items-center space-x-2">
                <img src="/src/assets/vibe-code-logo.svg" alt="VibeQA" className="h-9" />
              </Link>
              <div className="hidden md:flex items-center space-x-8">
                <a
                  href="#features"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  How it Works
                </a>
                <a
                  href="#pricing"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Pricing
                </a>
                <a
                  href="#testimonials"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Testimonials
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" className="text-gray-700 hover:text-gray-900">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="magnetic-button rounded-full px-6">Get Started Free</Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section with animated background */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        <AnimatedBackground variant="orbs" />

        <div className="container mx-auto relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 space-y-6">
              <Badge className="bg-[#FF6B35]/10 text-[#FF6B35] border-[#FF6B35]/20 px-4 py-2">
                <Sparkles className="w-4 h-4 mr-2" />
                Trusted by 500+ development teams
              </Badge>

              <h1 className="text-6xl lg:text-7xl font-bold leading-tight">
                <span className="block">QA feedback that</span>
                <span className="gradient-text-modern">developers love</span>
              </h1>

              <p className="text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Your testers hate filing bugs. You hate missing them. We fixed both with the
                simplest bug reporting tool ever made.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link href="/register">
                  <Button size="lg" className="magnetic-button rounded-full px-8 py-6 text-lg">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-8 py-6 text-lg border-gray-300 hover:border-gray-400"
                >
                  Watch Demo (2 min)
                  <Video className="ml-2 h-5 w-5" />
                </Button>
              </div>

              <div className="flex items-center justify-center gap-8 text-sm text-gray-600 pt-4">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Setup in 60 seconds</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>14-day free trial</span>
                </div>
              </div>
            </div>

            {/* Hero mockup with floating elements */}
            <div className="relative max-w-5xl mx-auto">
              <div
                className="parallax-slow"
                style={{ transform: `translateY(${scrollY * 0.1}px)` }}
              >
                <div className="card-modern rounded-2xl p-2 shadow-2xl">
                  <div className="aspect-video bg-gray-50 rounded-xl overflow-hidden">
                    <HeroMockup />
                  </div>
                </div>
              </div>

              {/* Floating stats */}
              <div
                className="absolute -left-20 top-20 parallax-medium"
                style={{ transform: `translateY(${scrollY * 0.15}px)` }}
              >
                <div className="glass-modern-light rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                      <Bug className="w-7 h-7 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">247</p>
                      <p className="text-sm text-gray-600">Bugs reported today</p>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="absolute -right-20 bottom-20 parallax-fast"
                style={{ transform: `translateY(${scrollY * 0.2}px)` }}
              >
                <div className="glass-modern-light rounded-2xl p-4 shadow-xl">
                  <DataVisualization className="w-48" />
                  <p className="text-sm text-gray-600 mt-2 text-center">Response time analytics</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="scroll-indicator">
            <ChevronDown className="w-6 h-6 text-gray-400" />
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="relative py-24 px-4 bg-gray-50">
        <FloatingElements />

        <div className="container mx-auto relative z-10">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-5xl font-bold">
              Bug reporting in <span className="gradient-text-accent">10 seconds</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Add one line of code. Your testers do the rest. It's that simple.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            {/* Steps */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <div className="text-center space-y-4 reveal-up">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-[#094765] to-[#3387a7] rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  1
                </div>
                <h3 className="text-xl font-semibold">Add to your site</h3>
                <p className="text-gray-600">One line of code. Works with any framework.</p>
              </div>

              <div className="text-center space-y-4 reveal-up" style={{ animationDelay: '0.1s' }}>
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-[#3387a7] to-[#66a5bd] rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  2
                </div>
                <h3 className="text-xl font-semibold">Testers report bugs</h3>
                <p className="text-gray-600">No login needed. Just click and describe.</p>
              </div>

              <div className="text-center space-y-4 reveal-up" style={{ animationDelay: '0.2s' }}>
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-[#FF6B35] to-[#FFB39A] rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  3
                </div>
                <h3 className="text-xl font-semibold">You fix them</h3>
                <p className="text-gray-600">Get everything needed to reproduce instantly.</p>
              </div>
            </div>

            {/* Code example */}
            <div className="card-modern rounded-2xl p-8 max-w-3xl mx-auto">
              <div className="bg-gray-900 rounded-xl p-6 font-mono text-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <code className="text-gray-300">
                  <span className="text-gray-500">&lt;</span>
                  <span className="text-purple-400">script</span>
                  <span className="text-green-400"> src</span>
                  <span className="text-gray-500">=</span>
                  <span className="text-yellow-400">"https://cdn.vibe.qa/widget.js"</span>
                  <br />
                  <span className="text-green-400 ml-8">data-project</span>
                  <span className="text-gray-500">=</span>
                  <span className="text-yellow-400">"your-project-id"</span>
                  <span className="text-gray-500">&gt;&lt;/</span>
                  <span className="text-purple-400">script</span>
                  <span className="text-gray-500">&gt;</span>
                </code>
              </div>
              <p className="text-center mt-6 text-gray-600">
                That's it. Works with React, Vue, Angular, or vanilla HTML.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 px-4">
        <AnimatedBackground variant="gradient" />

        <div className="container mx-auto relative z-10">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-5xl font-bold">
              Everything to <span className="gradient-text-modern">fix bugs fast</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Stop playing detective. Get all the context automatically.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Camera,
                title: 'Smart Screenshots',
                description: 'Annotate directly on the page with drawings and notes',
                gradient: 'from-[#094765] to-[#3387a7]',
              },
              {
                icon: Mic,
                title: 'Voice Notes',
                description: 'Explain bugs faster with quick voice recordings',
                gradient: 'from-[#3387a7] to-[#66a5bd]',
              },
              {
                icon: Code,
                title: 'Console Logs',
                description: 'JavaScript errors and network requests captured',
                gradient: 'from-[#FF6B35] to-[#FFB39A]',
              },
              {
                icon: Monitor,
                title: 'Full Context',
                description: 'Browser, OS, screen size, and session data',
                gradient: 'from-[#0a5878] to-[#3f90b3]',
              },
            ].map((feature, index) => (
              <div key={index} className="group">
                <div className="card-modern rounded-2xl p-8 h-full space-y-4">
                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
                  >
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                  <div className="pt-4">
                    <div className="h-32 bg-gray-50 rounded-lg overflow-hidden">
                      <FeatureMockup
                        type={
                          index === 0
                            ? 'screenshot'
                            : index === 1
                              ? 'recording'
                              : index === 2
                                ? 'console'
                                : 'browser'
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual Product Section */}
      <section className="relative py-24 px-4 bg-gradient-to-br from-[#094765] via-[#156c8b] to-[#3387a7] text-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <div className="space-y-8">
              <h2 className="text-5xl font-bold">Built for modern development teams</h2>

              <div className="space-y-6">
                {[
                  {
                    icon: Users,
                    title: 'For Testers',
                    description: 'Report bugs without leaving the page. No accounts, no friction.',
                  },
                  {
                    icon: Zap,
                    title: 'For Developers',
                    description: 'Get everything needed to reproduce and fix bugs instantly.',
                  },
                  {
                    icon: BarChart,
                    title: 'For Managers',
                    description: 'Track bug trends, resolution times, and team performance.',
                  },
                ].map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="w-14 h-14 glass-modern rounded-xl flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-1">{item.title}</h3>
                      <p className="text-white/80">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="glass-modern rounded-2xl p-2 shadow-2xl">
                <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden">
                  <DashboardMockup />
                </div>
              </div>

              {/* Floating metric */}
              <div className="absolute -bottom-8 -left-8 glass-modern rounded-2xl p-6 shadow-xl">
                <div className="flex items-center gap-4">
                  <Clock className="w-8 h-8 text-white" />
                  <div>
                    <p className="text-2xl font-bold">-70%</p>
                    <p className="text-sm text-white/80">Bug fix time</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative py-24 px-4 bg-gray-50">
        <FloatingElements />

        <div className="container mx-auto relative z-10">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-5xl font-bold">
              Teams <span className="gradient-text-accent">love VibeQA</span>
            </h2>
            <p className="text-xl text-gray-600">
              Join 500+ teams who actually enjoy their QA process
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: 'Sarah Chen',
                role: 'CTO at Hyperloop',
                quote:
                  'Our bug reports went from 5 per sprint to 50. Turns out testers were just avoiding our old system.',
                gradient: 'from-[#094765] to-[#3387a7]',
              },
              {
                name: 'Marcus Wei',
                role: 'Lead Dev at Flux',
                quote:
                  'Added it Monday. Fixed 12 bugs by Friday. The voice notes feature is genius.',
                gradient: 'from-[#3387a7] to-[#66a5bd]',
              },
              {
                name: 'Jordan Park',
                role: 'PM at Render',
                quote: 'QA used to feel like paperwork. Now it feels like Slack. Game changer.',
                gradient: 'from-[#FF6B35] to-[#FFB39A]',
              },
            ].map((testimonial, index) => (
              <div key={index} className="group">
                <div className="testimonial-modern rounded-2xl p-8 h-full space-y-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-14 h-14 bg-gradient-to-br ${testimonial.gradient} rounded-full`}
                    ></div>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 text-lg">{testimonial.quote}</p>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative py-24 px-4">
        <AnimatedBackground variant="mesh" />

        <div className="container mx-auto relative z-10">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-5xl font-bold">Simple, transparent pricing</h2>
            <p className="text-xl text-gray-600">Start free. Upgrade when you need more.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="card-modern rounded-2xl p-8 h-full">
              <h3 className="text-2xl font-bold mb-2">Free</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold">$0</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                {['1 project', '100 bug reports/month', '7-day history', 'Basic support'].map(
                  (feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  )
                )}
              </ul>
              <Button variant="outline" className="w-full rounded-full border-gray-300">
                Start Free
              </Button>
            </div>

            {/* Pro Plan */}
            <div className="pricing-recommended card-modern rounded-2xl p-8 h-full">
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold gradient-text-accent">$29</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  '5 projects',
                  '1,000 bug reports/month',
                  '90-day history',
                  'Priority support',
                  'API access',
                  'Team collaboration',
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full magnetic-button rounded-full">Start Free Trial</Button>
            </div>

            {/* Team Plan */}
            <div className="card-modern rounded-2xl p-8 h-full">
              <h3 className="text-2xl font-bold mb-2">Team</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold">$99</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  'Unlimited projects',
                  '10,000 bug reports/month',
                  'Unlimited history',
                  'Dedicated support',
                  'SSO & SAML',
                  'Custom integrations',
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full rounded-full border-gray-300">
                Contact Sales
              </Button>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              Need more? Looking for custom limits, on-premise, or enterprise features?
            </p>
            <Button variant="outline" size="lg" className="rounded-full border-gray-300">
              Talk to Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="relative py-24 px-4 bg-gradient-to-br from-[#094765] to-[#156c8b] text-white">
        <div className="container mx-auto relative z-10">
          <div className="glass-modern rounded-3xl p-12 text-center max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-12">Enterprise-grade security</h2>

            <div className="grid md:grid-cols-4 gap-8">
              {[
                { icon: Shield, title: 'SOC2 Compliant', desc: 'Security-first architecture' },
                { icon: Globe, title: 'GDPR Ready', desc: 'Privacy by design' },
                { icon: Monitor, title: 'Self-host Option', desc: 'Keep data in-house' },
                { icon: FileText, title: 'Data Export', desc: 'Your data, always' },
              ].map((item, index) => (
                <div key={index} className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 glass-modern rounded-2xl flex items-center justify-center">
                    <item.icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-white/80">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-24 px-4">
        <AnimatedBackground variant="orbs" />

        <div className="container mx-auto text-center relative z-10">
          <div className="max-w-4xl mx-auto space-y-8">
            <Badge className="bg-[#FF6B35]/10 text-[#FF6B35] border-[#FF6B35]/20 px-4 py-2">
              <Sparkles className="w-4 h-4 mr-2" />
              Over 10,000 bugs fixed this month
            </Badge>

            <h2 className="text-5xl lg:text-6xl font-bold">
              Ready to <span className="gradient-text-accent">fix bugs faster?</span>
            </h2>

            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join 500+ teams using VibeQA to ship better software with confidence
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/register">
                <Button size="lg" className="magnetic-button rounded-full px-10 py-6 text-lg">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-10 py-6 text-lg border-gray-300"
              >
                Schedule Demo
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-12">
              <div className="text-center">
                <div className="text-4xl font-bold gradient-text-modern">500+</div>
                <div className="text-sm text-gray-600">Happy Teams</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold gradient-text-modern">50k+</div>
                <div className="text-sm text-gray-600">Bugs Fixed</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold gradient-text-modern">99.9%</div>
                <div className="text-sm text-gray-600">Uptime</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="glass-modern-light rounded-3xl p-10">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <img src="/src/assets/vibe-code-logo.svg" alt="VibeQA" className="h-10 mb-4" />
                <p className="text-sm text-gray-600 mb-6">
                  QA feedback that developers love. Made with care for modern teams.
                </p>
                <div className="flex gap-3">
                  <a
                    href="#"
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    <span className="text-sm font-bold">𝕏</span>
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    <Github className="w-5 h-5" />
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </a>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Product</h3>
                <ul className="space-y-2">
                  {['Features', 'Pricing', 'API Docs', 'Changelog'].map((item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Company</h3>
                <ul className="space-y-2">
                  {['About', 'Blog', 'Careers', 'Contact'].map((item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Legal</h3>
                <ul className="space-y-2">
                  {['Privacy', 'Terms', 'Security', 'GDPR'].map((item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-gray-600">© 2024 VibeQA. All rights reserved.</p>
              <p className="text-sm text-gray-600 mt-4 md:mt-0">
                Made with ❤️ by developers, for developers
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
