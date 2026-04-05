import BooaWantedPoster from "@/components/booa/BooaWantedPoster";
import { Footer } from "@/components/layouts/Footer";
import { Header } from "@/components/layouts/Header";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">


      <main className="page-shell">
        <div className="flex min-h-[calc(100vh-132px)] flex-col py-6 pb-20 md:py-8 md:pb-28 lg:py-10 lg:pb-32">
          <BooaWantedPoster />
        </div>
      </main>


    </div>
  );
}