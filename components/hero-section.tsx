import { PlusCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/button";
import { CardCarousel } from "./card-carousel";
import { Badge } from "./ui/badge";
import { useState } from "react";
import { SpinToWinModal } from "./spin-to-win-modal";

export function HeroSection() {
  const [isSpinModalOpen, setIsSpinModalOpen] = useState(false);
  return (
    <div className="bg-gradient-to-r from-[#006241]/10 to-[#f8b133]/5 py-12 md:py-20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="w-full md:w-[900px] mb-8 md:mb-0 md:pr-8">
            {/* <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-[#f8b133] hover:bg-[#e5a42f] text-black mb-4">
              New Feature
            </div> */}

            <h1 className="text-4xl md:text-5xl font-bold  mb-4">
              Get Your
              <span className="text-[#006241]"> Custom Visa </span>
              Debit Card
            </h1>
            <p className="text-lg text-gray-700 mb-6">
              {/* Your debit card is more than just a payment tool—it's an
              expression of who you are. With our custom card designer, you can
              showcase your personality while enjoying the trusted services of
              Cooperative Bank of Oromia. */}
              Celebrate the new Addis Ababa with a beautifully designed debit
              card. Spin to win rewards, refer friends, and carry Ethiopia's
              pride in your wallet.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                // href="/cards/new"
                href="/cards/gallery"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 bg-[#006241] hover:bg-[#004d33] text-white"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                {/* Create New Design */}
                Order Your Custom Card
              </Link>
              {/* <Link
                href="/cards/gallery"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border bg-background h-10 px-4 py-2 border-[#006241] text-[#006241] hover:bg-[#006241] hover:text-white"
              >
                Order Your Custom Card
              </Link> */}
              <Button
                onClick={() => setIsSpinModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 text-white shadow-lg hover:from-yellow-500 hover:to-pink-500 relative overflow-hidden"
                style={{
                  boxShadow:
                    "0 2px 12px 0 rgba(0,0,0,0.10), 0 1.5px 6px 0 rgba(0,0,0,0.08)",
                }}
              >
                <span
                  className="absolute inset-0 bg-black/20 pointer-events-none rounded-md"
                  aria-hidden="true"
                ></span>
                <span className="relative flex items-center">
                  <svg
                    className="h-5 w-5 animate-spin-slow"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeOpacity="0.2"
                      strokeWidth="4"
                    />
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  <span className="ml-2">Spin &amp; Try Your Luck</span>
                </span>
              </Button>
            </div>
          </div>
          <CardCarousel />
          {/* <div className="hidden hsm:flex  w-full md:min-w-[465px] max-w-[730px]  relative ">
            <div className="relative h-[300px] md:h-[400px]  w-full">
              <div className="absolute top-0 left-0 w-[395px] md:min-w-[500px]  h-[85%] rounded-lg overflow-hidden shadow-xl transform rotate-[-6deg] z-10">
                <Image
                  fill
                  alt="University Affinity Card"
                  loading="lazy"
                  decoding="async"
                  className="object-cover"
                  src="/images/Card1.png?height=340&width=540&text=University Card"
                  style={{
                    position: "absolute",
                    height: "100%",
                    width: "100%",
                    inset: 0,
                    color: "transparent",
                  }}
                />
              </div>
              <div className="absolute bottom-0 right-0 w-[395px] md:min-w-[500px]  h-[85%] rounded-lg overflow-hidden shadow-xl transform rotate-[6deg] z-0">
                <Image
                  fill
                  alt="Sports Team Affinity Card"
                  loading="lazy"
                  decoding="async"
                  className="object-cover"
                  src="/Card.png?height=340&width=540&text=Sports Card"
                  style={{
                    position: "absolute",
                    height: "100%",
                    width: "100%",
                    inset: 0,
                    color: "transparent",
                  }}
                />
              </div>
            </div>
          </div> */}
        </div>
      </div>
      <SpinToWinModal
        isOpen={isSpinModalOpen}
        onOpenChange={setIsSpinModalOpen}
      />
    </div>
  );
}
