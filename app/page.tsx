import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ChevronRight,
  Shield,
  Gift,
  Clock,
  Percent,
  Users,
  Globe,
} from "lucide-react";
import { HeroSection } from "@/components/hero-section";
import { CardSelector } from "@/components/card-selector";
import { FeatureHighlight } from "@/components/feature-highlight";

export default function AffinityCardPage() {
  return (
    <div className="min-h-screen bg-white">
      <main>
        {/* Hero Section */}
        <HeroSection />

        {/* Breadcrumb */}
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center text-sm text-gray-500">
            <a href="#" className="hover:text-[#006241]">
              Home
            </a>
            <ChevronRight className="h-4 w-4 mx-2" />
            <a href="#" className="hover:text-[#006241]">
              Personal Banking
            </a>
            <ChevronRight className="h-4 w-4 mx-2" />
            <a href="#" className="hover:text-[#006241]">
              Cards
            </a>
            <ChevronRight className="h-4 w-4 mx-2" />
            <span className="text-gray-700 font-medium">
              Custom Debit Cards
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Area */}
            <div className="lg:col-span-2">
              <h1 className="text-3xl md:text-4xl font-bold text-[#006241] mb-6">
                Customized Debit Cards
              </h1>
              <p className="text-lg text-gray-700 mb-8">
                Show your support for your favorite organization with every
                purchase. Our affinity debit cards let you proudly display your
                passion while enjoying all the benefits of banking with
                Cooperative Bank of Oromia.
              </p>

              {/* Card Selector */}
              <CardSelector />

              {/* Features Section */}
              <div className="mt-16">
                <h2 className="text-2xl font-bold text-[#006241] mb-6">
                  Card Features & Benefits
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FeatureHighlight
                    icon={<Shield className="h-6 w-6 text-[#006241]" />}
                    title="Enhanced Security"
                    description="EMV chip technology and zero liability protection keep your money safe."
                  />
                  <FeatureHighlight
                    icon={<Gift className="h-6 w-6 text-[#006241]" />}
                    title="Rewards Program"
                    description="Earn points on every purchase that can be redeemed for cash back or merchandise."
                  />
                  <FeatureHighlight
                    icon={<Clock className="h-6 w-6 text-[#006241]" />}
                    title="24/7 Access"
                    description="Use your card anytime, anywhere with worldwide acceptance."
                  />
                  <FeatureHighlight
                    icon={<Percent className="h-6 w-6 text-[#006241]" />}
                    title="Special Discounts"
                    description="Enjoy exclusive discounts at partner merchants across Ethiopia."
                  />
                </div>
              </div>

              {/* Tabs Section */}
              <div className="mt-16">
                <Tabs defaultValue="details">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="details">Card Details</TabsTrigger>
                    <TabsTrigger value="fees">Fees & Limits</TabsTrigger>
                    <TabsTrigger value="apply">How to Apply</TabsTrigger>
                  </TabsList>
                  <TabsContent
                    value="details"
                    className="p-6 border rounded-b-lg"
                  >
                    <h3 className="text-xl font-semibold text-[#006241] mb-4">
                      Card Details
                    </h3>
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <div className="bg-[#006241]/10 rounded-full p-1 mr-3 mt-1">
                          <ChevronRight className="h-4 w-4 text-[#006241]" />
                        </div>
                        <span>
                          Personalized with your name and your chosen
                          organization's logo
                        </span>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-[#006241]/10 rounded-full p-1 mr-3 mt-1">
                          <ChevronRight className="h-4 w-4 text-[#006241]" />
                        </div>
                        <span>EMV chip technology for enhanced security</span>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-[#006241]/10 rounded-full p-1 mr-3 mt-1">
                          <ChevronRight className="h-4 w-4 text-[#006241]" />
                        </div>
                        <span>
                          Contactless payment capability for quick transactions
                        </span>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-[#006241]/10 rounded-full p-1 mr-3 mt-1">
                          <ChevronRight className="h-4 w-4 text-[#006241]" />
                        </div>
                        <span>Valid for 5 years from date of issue</span>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-[#006241]/10 rounded-full p-1 mr-3 mt-1">
                          <ChevronRight className="h-4 w-4 text-[#006241]" />
                        </div>
                        <span>
                          Works with mobile wallets for digital payments
                        </span>
                      </li>
                    </ul>
                  </TabsContent>
                  <TabsContent value="fees" className="p-6 border rounded-b-lg">
                    <h3 className="text-xl font-semibold text-[#006241] mb-4">
                      Fees & Limits
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 bg-gray-50">
                              Fee Type
                            </th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 bg-gray-50">
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          <tr>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              Card Issuance Fee
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 text-right">
                              100 Birr
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              Annual Maintenance Fee
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 text-right">
                              50 Birr
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              Card Replacement Fee
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 text-right">
                              150 Birr
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              ATM Withdrawal (Own Bank)
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 text-right">
                              Free
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              ATM Withdrawal (Other Banks)
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 text-right">
                              15 Birr
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <h4 className="text-lg font-semibold text-[#006241] mt-6 mb-3">
                      Daily Limits
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 bg-gray-50">
                              Transaction Type
                            </th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 bg-gray-50">
                              Limit
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          <tr>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              ATM Withdrawal
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 text-right">
                              10,000 Birr
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              POS Transactions
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 text-right">
                              50,000 Birr
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              Online Purchases
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 text-right">
                              25,000 Birr
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                  <TabsContent
                    value="apply"
                    className="p-6 border rounded-b-lg"
                  >
                    <h3 className="text-xl font-semibold text-[#006241] mb-4">
                      How to Apply
                    </h3>
                    <div className="space-y-6">
                      <div className="flex items-start">
                        <div className="bg-[#006241] text-white rounded-full w-8 h-8 flex items-center justify-center mr-4 flex-shrink-0">
                          1
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">
                            Choose Your Organization
                          </h4>
                          <p className="text-gray-600">
                            Select from our list of partner organizations or
                            request a custom design.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="bg-[#006241] text-white rounded-full w-8 h-8 flex items-center justify-center mr-4 flex-shrink-0">
                          2
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">
                            Complete the Application
                          </h4>
                          <p className="text-gray-600">
                            Fill out the application form online or visit any
                            Cooperative Bank of Oromia branch.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="bg-[#006241] text-white rounded-full w-8 h-8 flex items-center justify-center mr-4 flex-shrink-0">
                          3
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">
                            Submit Required Documents
                          </h4>
                          <p className="text-gray-600">
                            Provide your ID, proof of address, and other
                            required documentation.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="bg-[#006241] text-white rounded-full w-8 h-8 flex items-center justify-center mr-4 flex-shrink-0">
                          4
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">
                            Receive Your Card
                          </h4>
                          <p className="text-gray-600">
                            Your card will be ready for pickup at your preferred
                            branch within 7-10 business days.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-8">
                      <Button className="bg-[#006241] hover:bg-[#004d33] text-white">
                        Apply Now
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Testimonials */}
              <div className="mt-16">
                <h2 className="text-2xl font-bold text-[#006241] mb-6">
                  What Our Customers Say
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 rounded-full bg-[#006241]/20 flex items-center justify-center mr-3">
                          <span className="text-[#006241] font-bold">AB</span>
                        </div>
                        <div>
                          <p className="font-medium">Abebe Bekele</p>
                          <p className="text-sm text-gray-500">
                            Addis Ababa University Card Holder
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-700 italic">
                        "I love showing my university pride with every purchase.
                        The card design is beautiful and the rewards program is
                        an added bonus!"
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 rounded-full bg-[#006241]/20 flex items-center justify-center mr-3">
                          <span className="text-[#006241] font-bold">FT</span>
                        </div>
                        <div>
                          <p className="font-medium">Fatuma Teshome</p>
                          <p className="text-sm text-gray-500">
                            Ethiopian Red Cross Card Holder
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-700 italic">
                        "It feels good knowing that my everyday purchases are
                        supporting a cause I believe in. The card works
                        perfectly everywhere I shop."
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                {/* Quick Apply Card */}
                <Card className="mb-6 border-t-4 border-t-[#006241]">
                  <CardHeader>
                    <CardTitle className="text-xl text-[#006241]">
                      Apply for Your Card
                    </CardTitle>
                    <CardDescription>
                      Get your custom card in just a few steps
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4">
                      Show your support for your favorite organization while
                      enjoying all the benefits of our debit card.
                    </p>
                    <Button className="w-full bg-[#006241] hover:bg-[#004d33] text-white">
                      Apply Online
                    </Button>
                  </CardContent>
                  <CardFooter className="border-t pt-4 text-sm text-gray-500">
                    <p>You can also apply at any branch</p>
                  </CardFooter>
                </Card>

                {/* FAQ Accordion */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-xl text-[#006241]">
                      Frequently Asked Questions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="item-1">
                        <AccordionTrigger className="text-left">
                          How do I activate my new card?
                        </AccordionTrigger>
                        <AccordionContent>
                          You can activate your card through our mobile banking
                          app, online banking portal, by calling our customer
                          service at 8070, or by visiting any branch.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-2">
                        <AccordionTrigger className="text-left">
                          Can I change my card design later?
                        </AccordionTrigger>
                        <AccordionContent>
                          Yes, you can request a design change at any time. A
                          replacement fee will apply, and your new card will be
                          ready within 7-10 business days.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-3">
                        <AccordionTrigger className="text-left">
                          Is there a fee for the affinity card?
                        </AccordionTrigger>
                        <AccordionContent>
                          There is a standard card issuance fee of 100 Birr and
                          an annual maintenance fee of 50 Birr. These fees
                          support both the bank and your chosen organization.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-4">
                        <AccordionTrigger className="text-left">
                          How does my organization benefit?
                        </AccordionTrigger>
                        <AccordionContent>
                          For every transaction made with your affinity card, a
                          small percentage is donated to your chosen
                          organization, helping support their mission and
                          activities.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-5">
                        <AccordionTrigger className="text-left">
                          Can I use my card internationally?
                        </AccordionTrigger>
                        <AccordionContent>
                          Yes, your affinity debit card can be used worldwide
                          wherever Visa/Mastercard is accepted. International
                          transaction fees may apply.
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>

                {/* Contact Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl text-[#006241]">
                      Need Help?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start">
                      <div className="bg-[#006241]/10 rounded-full p-2 mr-3">
                        <Users className="h-5 w-5 text-[#006241]" />
                      </div>
                      <div>
                        <p className="font-medium">Customer Service</p>
                        <p className="text-gray-600">Call us at 8070</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="bg-[#006241]/10 rounded-full p-2 mr-3">
                        <Globe className="h-5 w-5 text-[#006241]" />
                      </div>
                      <div>
                        <p className="font-medium">Visit a Branch</p>
                        <p className="text-gray-600">Find a branch near you</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full border-[#006241] text-[#006241] hover:bg-[#006241] hover:text-white"
                    >
                      Contact Us
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white pt-6 pb-6">
        <div className="container mx-auto px-4">
          {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Personal Banking</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-300 hover:text-white">
                    Accounts
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white">
                    Cards
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white">
                    Loans
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white">
                    Savings & Investments
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white">
                    Mobile Banking
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Business Banking</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-300 hover:text-white">
                    Business Accounts
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white">
                    Business Loans
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white">
                    Trade Finance
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white">
                    Corporate Banking
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white">
                    SME Banking
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">About Us</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-300 hover:text-white">
                    Our History
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white">
                    Leadership
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white">
                    News & Media
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white">
                    Corporate Responsibility
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
              <ul className="space-y-2">
                <li className="text-gray-300">Customer Service: 8070</li>
                <li className="text-gray-300">
                  Email: info@coopbankoromia.com.et
                </li>
                <li className="text-gray-300">
                  Head Office: Addis Ababa, Ethiopia
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white">
                    Find a Branch
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white">
                    ATM Locations
                  </a>
                </li>
              </ul>
            </div>
          </div> */}
          <div className="border-t border-gray-800 pt-6 mt-2">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm mb-4 md:mb-0">
                © {new Date().getFullYear()} Cooperative Bank of Oromia. All
                rights reserved.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  Terms & Conditions
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  Privacy Policy
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  Security
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
