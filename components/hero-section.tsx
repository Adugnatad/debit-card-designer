import { PlusCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function HeroSection() {
  return (
    <div className="bg-gradient-to-r from-[#006241]/10 to-[#f8b133]/5 py-12 md:py-20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center">
          <div className="w-full md:w-1/2 mb-8 md:mb-0 md:pr-8">
            {/* <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-[#f8b133] hover:bg-[#e5a42f] text-black mb-4">
              New Feature
            </div> */}
            <h1 className="text-4xl md:text-5xl font-bold text-[#006241] mb-4">
              Express Your Identity
            </h1>
            <p className="text-lg text-gray-700 mb-6">
              Your debit card is more than just a payment tool—it's an
              expression of who you are. With our custom card designer, you can
              showcase your personality while enjoying the trusted services of
              Cooperative Bank of Oromia.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/cards/new"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 bg-[#006241] hover:bg-[#004d33] text-white"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Create New Design
              </Link>
              <Link
                href="/cards/gallery"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border bg-background h-10 px-4 py-2 border-[#006241] text-[#006241] hover:bg-[#006241] hover:text-white"
              >
                Browse Gallery
              </Link>
            </div>
          </div>
          <div className="hidden hsm:flex  w-full md:min-w-[465px] max-w-[730px]  relative ">
            <div className="relative h-[300px] md:h-[400px]  w-full">
              <div className="absolute top-0 left-0 w-[395px] md:min-w-[500px]  h-[85%] rounded-lg overflow-hidden shadow-xl transform rotate-[-6deg] z-10">
                <Image
                  fill
                  alt="University Affinity Card"
                  loading="lazy"
                  decoding="async"
                  className="object-cover"
                  src="/Card1.png?height=340&width=540&text=University Card"
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
          </div>
        </div>
      </div>
    </div>
  );
}
