"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import HeroSection from "../components/HeroSection";
import ProgramOverview from "../components/ProgramOverview";
import WhyDifferent from "../components/WhyDifferent";
import WhatYouGet from "../components/WhatYouGet";
import ShowcaseJourney from "../components/ShowcaseJourney";
import IDCardGallery from "../components/IDCardGallery";
import ProgramStats from "../components/ProgramStats";
import PartnersSection from "../components/PartnersSection";
import PrepareFuture from "../components/PrepareFuture";
import { FlickeringGrid } from "@/components/ui/flickering-grid";
export default function Home() {
  const router = useRouter();
  const [savedIDCards, setSavedIDCards] = useState([]);
  const [showIDPreview, setShowIDPreview] = useState(false);

  return (
    <div className="bg-black min-h-screen text-gray-200">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-8 max-w-7xl">
        <FlickeringGrid
        className="absolute inset-0 z-0 h-full"
        squareSize={4}
        gridGap={6}
        color="#6B7280"
        maxOpacity={0.2}
        flickerChance={0.05}
      
      />

        <HeroSection />
        <ProgramOverview />
        <WhyDifferent />
        <WhatYouGet />
        <ShowcaseJourney
          savedIDCards={savedIDCards}
          showIDPreview={showIDPreview}
          setShowIDPreview={setShowIDPreview}
        />
        <IDCardGallery
          savedIDCards={savedIDCards}
          showIDPreview={showIDPreview}
          setShowIDPreview={setShowIDPreview}
        />
        <ProgramStats />
        <PartnersSection />
        <PrepareFuture />
        <Footer />
      </div>
    </div>
  );
}
