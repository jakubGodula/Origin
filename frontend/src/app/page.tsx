import { Header } from "@/components/Header";
import { Marketplace } from "@/components/Marketplace";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Header />

      <main className="pt-20">


        <Marketplace />


      </main>
    </div>
  );
}
