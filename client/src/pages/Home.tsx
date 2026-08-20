/*
 * Style reminder: Laboratorio de Movimiento — a premium editorial-athletic landing
 * for Plaza Fitness. Use asymmetry, hard contrast, red markers, smoky glass cards,
 * scroll choreography. Prices, schedules and bank transfer data are real and
 * client-confirmed — keep them in sync with client/src/lib/gym-content.ts, never
 * invent new ones.
 */
import ScrollProgress from "@/components/ScrollProgress";
import Header from "@/components/sections/Header";
import Hero from "@/components/sections/Hero";
import Method from "@/components/sections/Method";
import Space from "@/components/sections/Space";
import Schedule from "@/components/sections/Schedule";
import Rules from "@/components/sections/Rules";
import Coaching from "@/components/sections/Coaching";
import Plans from "@/components/sections/Plans";
import Contact from "@/components/sections/Contact";
import Footer from "@/components/sections/Footer";
import { useLenis } from "@/lib/useLenis";

function Home() {
  useLenis();

  return (
    <div className="site-shell">
      <ScrollProgress />
      <Header />
      <main>
        <Hero />
        <Method />
        <Space />
        <Plans />
        <Schedule />
        <Rules />
        <Coaching />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

export default Home;
