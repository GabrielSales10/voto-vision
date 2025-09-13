import Header from "@/components/layout/Header";
import HeroSection from "@/components/layout/HeroSection";
import FeaturesSection from "@/components/features/FeaturesSection";
import DashboardPreview from "@/components/dashboard/DashboardPreview";
import Footer from "@/components/layout/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <DashboardPreview />
      <Footer />
    </div>
  );
};

export default Index;
