import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Mic, Image as ImageIcon, Sparkles, Send } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">
            Turn Your Thoughts Into Heartfelt Letters
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            Speak, write, or show us an image—we'll create the perfect handwritten letter and send it anywhere.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8 h-14 bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-105">
              <Link href="/generate">Start Free Trial</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 h-14 hover:bg-muted/50 transition-all hover:scale-105">
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Powered by Advanced AI
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mic className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Voice to Letter</h3>
              <p className="text-muted-foreground text-sm">
                Just speak—our AI transcribes and writes for you
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Image-Inspired</h3>
              <p className="text-muted-foreground text-sm">
                Upload a photo—get personalized card designs
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">AI Writing</h3>
              <p className="text-muted-foreground text-sm">
                GPT-4o crafts perfect, personal messages
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Physical Delivery</h3>
              <p className="text-muted-foreground text-sm">
                Real handwritten letters in mailboxes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          How It Works
        </h2>
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-shrink-0 bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold">
              1
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Provide Your Message</h3>
              <p className="text-muted-foreground">
                Speak into your microphone, type your thoughts, or upload an image that inspires you.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-shrink-0 bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold">
              2
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">AI Creates Your Letter</h3>
              <p className="text-muted-foreground">
                Our AI analyzes your input and generates a beautiful, personalized letter with matching card design.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-shrink-0 bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold">
              3
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">We Send It</h3>
              <p className="text-muted-foreground">
                Choose a recipient, and we'll handwrite and mail your letter anywhere in the world.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary to-purple-600 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Send Your First Letter?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Start with our free plan. No credit card required.
          </p>
          <Button asChild size="lg" variant="secondary" className="text-lg px-8">
            <Link href="/generate">Get Started Free</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
