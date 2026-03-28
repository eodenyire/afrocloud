import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { ArchitectureLayers } from "@/components/ArchitectureLayers";
import { EdgeNodeDiagram } from "@/components/EdgeNodeDiagram";
import { EdgeDeepDive } from "@/components/EdgeDeepDive";
import { TechStack } from "@/components/TechStack";
import { ApiShowcase } from "@/components/ApiShowcase";
import { Roadmap } from "@/components/Roadmap";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <div id="architecture">
        <ArchitectureLayers />
      </div>
      <div id="edge">
        <EdgeNodeDiagram />
      </div>
      <EdgeDeepDive />
      <TechStack />
      <div id="api">
        <ApiShowcase />
      </div>
      <div id="roadmap">
        <Roadmap />
      </div>
      <Footer />
    </div>
  );
};

export default Index;
