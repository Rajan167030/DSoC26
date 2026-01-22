"use client";

import React from "react";
import { LogoCarousel } from "@/components/ui/logo-carousel";
import sponsorsData from "@/data/sponsors.json";

// Transform JSON data for carousel
const sponsorLogos = sponsorsData.sponsors.map((sponsor) => ({
  name: sponsor.name,
  id: sponsor.id,
  img: sponsor.logo,
}));

const partnerLogos = sponsorsData.partners.map((partner) => ({
  name: partner.name,
  id: partner.id,
  img: partner.logo,
}));

export default function LogoCarouselDemo() {
  return (
    <div className="space-y-12 py-12">
      {/* Sponsors Section */}
      <div className="mx-auto flex w-full max-w-screen-lg flex-col items-center space-y-4">
        <h3 className="text-xl md:text-2xl font-semibold text-white mb-4">Our Sponsors</h3>
        <LogoCarousel columnCount={1} logos={sponsorLogos} />
      </div>

      {/* Partners Section */}
      <div className="mx-auto flex w-full max-w-screen-lg flex-col items-center space-y-4">
        <h3 className="text-xl md:text-2xl font-semibold text-white mb-4">Our Partners</h3>
        <LogoCarousel columnCount={3} logos={partnerLogos} />
      </div>
    </div>
  );
}
