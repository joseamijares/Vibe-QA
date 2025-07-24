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
} from 'lucide-react';
import { HeroMockup, DashboardMockup, FeatureMockup } from '@/components/Mockups';
import {
  FloatingHexagon,
  FloatingCircle,
  GridPattern,
  DotPattern,
  GradientBlob,
  NoiseTexture,
  GrainTexture,
} from '@/components/Shapes';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Gradient background elements */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-vibe-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-vibe-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-vibe-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 px-4 py-4">
        <div className="container mx-auto">
          <nav className="glass rounded-2xl px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-2">
                <img src="/src/assets/vibe-code-logo.svg" alt="VibeQA" className="h-8" />
              </Link>
              <div className="hidden md:flex items-center space-x-6">
                <a
                  href="#features"
                  className="text-sm font-medium text-gray-700 hover:text-vibe-600 transition-colors"
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className="text-sm font-medium text-gray-700 hover:text-vibe-600 transition-colors"
                >
                  How it Works
                </a>
                <a
                  href="#pricing"
                  className="text-sm font-medium text-gray-700 hover:text-vibe-600 transition-colors"
                >
                  Pricing
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" className="text-gray-700">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-vibe-600 hover:bg-vibe-700">Get Started Free</Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-vibe-50/30">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-vibe-100/20 via-transparent to-transparent"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-vibe-200/20 via-transparent to-transparent"></div>
        </div>
        <NoiseTexture opacity={0.03} />
        <DotPattern className="opacity-40" />
        <FloatingHexagon className="top-20 left-10 animate-float" />
        <FloatingCircle className="bottom-20 right-20 animate-float-delayed" size={150} />
        <div className="container mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-vibe-100 text-vibe-700 border-vibe-200">
                <Sparkles className="w-3 h-3 mr-1" />
                Loved by 500+ development teams
              </Badge>
              <h1 className="text-5xl lg:text-7xl font-bold mb-6">
                QA feedback that
                <span className="gradient-text"> doesn't suck</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Your testers hate filing bugs. You hate missing them. We fixed both with the
                simplest bug reporting tool ever made.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/register">
                  <Button size="lg" className="bg-vibe-600 hover:bg-vibe-700 text-white px-8">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="border-gray-300">
                  Watch Demo (2 min)
                </Button>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Check className="w-4 h-4 text-green-500" />
                  No credit card required
                </div>
                <div className="flex items-center gap-1">
                  <Check className="w-4 h-4 text-green-500" />
                  Setup in 60 seconds
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="glass rounded-2xl p-8 shadow-2xl backdrop-blur-xl border border-white/20">
                <div className="aspect-video bg-white rounded-lg overflow-hidden">
                  <HeroMockup />
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 glass rounded-xl p-4 shadow-lg backdrop-blur-xl border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Bug className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold">12 bugs reported</p>
                    <p className="text-sm text-gray-600">in the last hour</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section
        id="how-it-works"
        className="relative py-20 px-4 overflow-hidden bg-gradient-to-b from-vibe-50/50 to-white"
      >
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,_var(--tw-gradient-stops))] from-vibe-100/30 via-vibe-50/20 to-transparent"></div>
        </div>
        <GridPattern className="opacity-20" />
        <FloatingCircle className="top-40 left-20 animate-float" size={80} />
        <GradientBlob className="top-20 right-0 opacity-30" />
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              Bug reporting in <span className="gradient-text">10 seconds</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Add ?qa=on to any URL. Click the widget. Report the bug. That's literally it.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="w-20 h-20 bg-vibe-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-vibe-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Add to your site</h3>
              <p className="text-gray-600">One line of code. Works with any framework.</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-vibe-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-vibe-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Testers report bugs</h3>
              <p className="text-gray-600">No login needed. Just click and describe.</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-vibe-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-vibe-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">You fix them</h3>
              <p className="text-gray-600">Get everything needed to reproduce instantly.</p>
            </div>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="glass rounded-2xl p-8">
                <div className="bg-gray-900 rounded-lg p-6 font-mono text-sm">
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
                    <span className="text-yellow-400">"https://vibe.qa/widget.js"</span>
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
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">No authentication required</h4>
                    <p className="text-sm text-gray-600">Testers can report bugs instantly</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Automatic context capture</h4>
                    <p className="text-sm text-gray-600">All technical details included</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Real-time notifications</h4>
                    <p className="text-sm text-gray-600">
                      Get alerted instantly when bugs are reported
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 via-white to-vibe-50/30">
          <div className="absolute top-0 right-0 w-96 h-96 bg-vibe-100/20 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-vibe-200/20 rounded-full filter blur-3xl"></div>
        </div>
        <DotPattern className="opacity-30" />
        <GridPattern className="opacity-10" />
        <FloatingHexagon className="bottom-20 left-40 animate-float-delayed opacity-30" />
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              Everything needed to <span className="gradient-text">fix bugs fast</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Stop playing detective. Get all the context automatically.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="glass border-0 p-6 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-vibe-100 rounded-lg flex items-center justify-center mb-4">
                <Camera className="w-6 h-6 text-vibe-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Annotated Screenshots</h3>
              <p className="text-gray-600 text-sm mb-4">
                Testers can draw, highlight, and add notes directly on the page
              </p>
              <div className="w-full h-32 bg-gray-50 rounded overflow-hidden">
                <FeatureMockup type="screenshot" />
              </div>
            </Card>

            <Card className="glass border-0 p-6 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-vibe-100 rounded-lg flex items-center justify-center mb-4">
                <Bug className="w-6 h-6 text-vibe-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Console Logs</h3>
              <p className="text-gray-600 text-sm mb-4">
                JavaScript errors and warnings captured automatically
              </p>
              <div className="w-full h-32 bg-gray-50 rounded overflow-hidden">
                <FeatureMockup type="console" />
              </div>
            </Card>

            <Card className="glass border-0 p-6 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-vibe-100 rounded-lg flex items-center justify-center mb-4">
                <Monitor className="w-6 h-6 text-vibe-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Browser Details</h3>
              <p className="text-gray-600 text-sm mb-4">
                OS, browser, screen size, and device info included
              </p>
              <div className="w-full h-32 bg-gray-50 rounded overflow-hidden">
                <FeatureMockup type="browser" />
              </div>
            </Card>

            <Card className="glass border-0 p-6 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-vibe-100 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-vibe-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Screen Recordings</h3>
              <p className="text-gray-600 text-sm mb-4">
                Record interactions to show exactly what happened
              </p>
              <div className="w-full h-32 bg-gray-50 rounded overflow-hidden">
                <FeatureMockup type="recording" />
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Visual Product Section */}
      <section
        className="relative py-20 px-4"
        style={{ background: 'linear-gradient(135deg, #094765 0%, #156C8B 50%, #3387A7 100%)' }}
      >
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center text-white">
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                Built for modern development teams
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-1">For Testers</h3>
                    <p className="text-white/80">
                      Report bugs without leaving the page. No accounts, no friction.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-1">For Developers</h3>
                    <p className="text-white/80">
                      Get everything needed to reproduce and fix bugs instantly.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BarChart className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-1">For Managers</h3>
                    <p className="text-white/80">
                      Track bug trends, resolution times, and team performance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="glass-dark rounded-2xl p-8">
                <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                  <DashboardMockup />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50/50 to-gray-100/50">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-vibe-100/10 via-transparent to-transparent"></div>
        </div>
        <NoiseTexture opacity={0.02} />
        <FloatingCircle className="top-20 right-10 animate-float" size={120} />
        <DotPattern className="opacity-30" />
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              Teams <span className="gradient-text">love VibeQA</span>
            </h2>
            <p className="text-xl text-gray-600">
              Join 500+ teams who actually enjoy their QA process
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="glass border-0 p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div>
                  <p className="font-semibold">Sarah Chen</p>
                  <p className="text-sm text-gray-600">CTO at Hyperloop</p>
                </div>
              </div>
              <p className="text-gray-700">
                "Our bug reports went from 5 per sprint to 50. Turns out testers were just avoiding
                our old system."
              </p>
              <div className="mt-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-5 h-5 bg-yellow-400 rounded-full"></div>
                ))}
              </div>
            </Card>

            <Card className="glass border-0 p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div>
                  <p className="font-semibold">Marcus Wei</p>
                  <p className="text-sm text-gray-600">Lead Dev at Flux</p>
                </div>
              </div>
              <p className="text-gray-700">
                "Added it Monday. Fixed 12 bugs by Friday. The voice notes feature is genius."
              </p>
              <div className="mt-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-5 h-5 bg-yellow-400 rounded-full"></div>
                ))}
              </div>
            </Card>

            <Card className="glass border-0 p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div>
                  <p className="font-semibold">Jordan Park</p>
                  <p className="text-sm text-gray-600">PM at Render</p>
                </div>
              </div>
              <p className="text-gray-700">
                "QA used to feel like paperwork. Now it feels like Slack."
              </p>
              <div className="mt-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-5 h-5 bg-yellow-400 rounded-full"></div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-white via-vibe-50/20 to-white">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_80%_20%,_var(--tw-gradient-stops))] from-vibe-100/20 via-transparent to-transparent"></div>
        </div>
        <GridPattern className="opacity-10" />
        <FloatingHexagon className="top-40 right-20 animate-float opacity-20 -z-10" />
        <GradientBlob className="bottom-0 left-0 opacity-20 -z-10" />
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-xl text-gray-600">Start free. Upgrade when you need more.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="p-8 border-gray-200">
              <h3 className="text-2xl font-bold mb-2">Free</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>1 project</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>100 bug reports/month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>7-day history</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full">
                Start Free
              </Button>
            </Card>

            <Card className="p-8 border-vibe-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-vibe-500 text-white px-3 py-1 text-sm rounded-bl-lg">
                Popular
              </div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">$29</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Unlimited projects</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>1,000 bug reports/month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>90-day history</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>API access</span>
                </li>
              </ul>
              <Button className="w-full bg-vibe-600 hover:bg-vibe-700">Start Free Trial</Button>
            </Card>

            <Card className="p-8 border-gray-200">
              <h3 className="text-2xl font-bold mb-2">Team</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">$99</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>10,000 bug reports/month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>1-year history</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>SSO & custom branding</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Priority support</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full">
                Contact Sales
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="relative py-20 px-4 overflow-hidden bg-gradient-to-br from-vibe-700 via-vibe-600 to-vibe-800 text-white">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-vibe-500/20 via-transparent to-transparent"></div>
        </div>
        <NoiseTexture opacity={0.04} />
        <GridPattern className="opacity-20" />
        <DotPattern className="opacity-10" />
        <FloatingCircle className="top-20 left-20 animate-float opacity-10" size={200} />
        <div className="container mx-auto relative z-10">
          <div
            className="glass-dark rounded-2xl p-12 text-center backdrop-blur-xl border border-white/10 shadow-2xl"
            style={{ background: 'rgba(255, 255, 255, 0.08)' }}
          >
            <h2 className="text-3xl font-bold mb-8">Enterprise-grade security</h2>
            <div className="grid md:grid-cols-4 gap-8">
              <div className="flex flex-col items-center">
                <Shield className="w-12 h-12 text-vibe-300 mb-4" />
                <h3 className="font-semibold mb-1">SOC2 Compliant</h3>
                <p className="text-sm text-gray-300">Security-first architecture</p>
              </div>
              <div className="flex flex-col items-center">
                <Globe className="w-12 h-12 text-vibe-300 mb-4" />
                <h3 className="font-semibold mb-1">GDPR Ready</h3>
                <p className="text-sm text-gray-300">Privacy by design</p>
              </div>
              <div className="flex flex-col items-center">
                <Monitor className="w-12 h-12 text-vibe-300 mb-4" />
                <h3 className="font-semibold mb-1">Self-host Option</h3>
                <p className="text-sm text-gray-300">Keep data in-house</p>
              </div>
              <div className="flex flex-col items-center">
                <FileText className="w-12 h-12 text-vibe-300 mb-4" />
                <h3 className="font-semibold mb-1">Data Export</h3>
                <p className="text-sm text-gray-300">Your data, always</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 gradient-animated">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_var(--tw-gradient-stops))] from-vibe-400/30 via-transparent to-transparent"></div>
        </div>
        <NoiseTexture opacity={0.03} />
        <FloatingHexagon className="top-10 left-10 animate-float opacity-20" />
        <FloatingCircle
          className="bottom-10 right-10 animate-float-delayed opacity-20"
          size={150}
        />
        <GradientBlob className="top-0 right-0 opacity-10" />
        <div className="container mx-auto text-center relative z-10">
          <div
            className="glass rounded-3xl p-12 backdrop-blur-xl max-w-4xl mx-auto border border-white/20 shadow-2xl"
            style={{ background: 'rgba(255, 255, 255, 0.12)' }}
          >
            <Badge className="mb-4 bg-white/20 text-white border-white/30">
              <Sparkles className="w-3 h-3 mr-1" />
              Over 10,000 bugs fixed this month
            </Badge>
            <h2 className="text-4xl lg:text-6xl font-bold mb-6">Ready to fix bugs faster?</h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join 500+ teams using VibeQA to ship better software with confidence
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-white text-vibe-600 hover:bg-gray-100 px-8 shadow-xl"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
              >
                Schedule Demo
              </Button>
            </div>
            <div className="flex items-center justify-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <span>Setup in 60 seconds</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-sm opacity-75">Happy Teams</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">50k+</div>
              <div className="text-sm opacity-75">Bugs Fixed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-sm opacity-75">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-gray-100/50 to-white">
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-vibe-50/20 to-transparent"></div>
        </div>
        <GrainTexture />
        <DotPattern className="opacity-10" />
        <FloatingHexagon className="bottom-10 right-10 animate-float opacity-10" />
        <div className="container mx-auto relative z-10">
          <div className="glass rounded-2xl p-8 mb-8">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <img src="/src/assets/vibe-code-logo.svg" alt="VibeQA" className="h-8 mb-4" />
                <p className="text-sm text-gray-600">
                  QA feedback that doesn't suck. Made with ❤️ by developers.
                </p>
                <div className="flex gap-3 mt-4">
                  <div className="w-8 h-8 bg-vibe-100 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-vibe-500 rounded-full"></div>
                  </div>
                  <div className="w-8 h-8 bg-vibe-100 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-vibe-500 rounded-full"></div>
                  </div>
                  <div className="w-8 h-8 bg-vibe-100 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-vibe-500 rounded-full"></div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Product</h3>
                <ul className="space-y-2">
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-vibe-600">
                      Features
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-vibe-600">
                      Pricing
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-vibe-600">
                      API Docs
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-vibe-600">
                      Changelog
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Company</h3>
                <ul className="space-y-2">
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-vibe-600">
                      About
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-vibe-600">
                      Blog
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-vibe-600">
                      Careers
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-vibe-600">
                      Contact
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Legal</h3>
                <ul className="space-y-2">
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-vibe-600">
                      Privacy
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-vibe-600">
                      Terms
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-vibe-600">
                      Security
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-vibe-600">
                      GDPR
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="glass rounded-xl p-6 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-600">© 2024 VibeQA. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a
                href="#"
                className="text-gray-600 hover:text-vibe-600 transition-colors flex items-center gap-2"
              >
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-vibe-100 transition-colors">
                  <span className="text-xs">𝕏</span>
                </div>
                <span className="text-sm">Twitter</span>
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-vibe-600 transition-colors flex items-center gap-2"
              >
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-vibe-100 transition-colors">
                  <span className="text-xs">GH</span>
                </div>
                <span className="text-sm">GitHub</span>
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-vibe-600 transition-colors flex items-center gap-2"
              >
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-vibe-100 transition-colors">
                  <span className="text-xs">DC</span>
                </div>
                <span className="text-sm">Discord</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
