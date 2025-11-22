import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { Marketplace } from "@/components/Marketplace";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Header />

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

          <div className="container mx-auto px-6 relative z-10 text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">
              Decentralized Commerce <br />
              <span className="text-primary">Reimagined on Sui</span>
            </h1>

            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
              Experience the future of digital marketplaces. Secure, transparent, and lightning-fast trading powered by the Sui blockchain.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button className="w-full sm:w-auto text-lg px-8 py-3">
                Explore Marketplace
              </Button>
              <Button variant="secondary" className="w-full sm:w-auto text-lg px-8 py-3">
                Learn More
              </Button>
            </div>
          </div>
        </section>

        <Marketplace />

        {/* Features Grid */}
        <section className="py-24 px-6">
          <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { id: 'listing', title: 'Listing', desc: 'List your assets with customizable parameters.' },
              { id: 'escrow', title: 'Escrow', desc: 'Secure transactions with trustless escrow.' },
              { id: 'dispute', title: 'Dispute Resolution', desc: 'Fair and transparent dispute handling.' }
            ].map((feature) => (
              <div
                key={feature.id}
                id={feature.id}
                className="group p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/50 transition-all duration-300 hover:bg-white/[0.07]"
              >
                <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-zinc-400 mb-6">
                  {feature.desc}
                </p>
                <Button variant="outline" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  View Details
                </Button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
