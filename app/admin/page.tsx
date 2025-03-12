"use client";

  import CustomerCardTable  from "@/components/admin/individual-table"
  import Navbar from "@/components/ui/auth/navbar"
  
  export default function AdminPage() {
    return (
      <>
      <Navbar/>
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8 ">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mt-10 mb-4">Custom Debit Card Designer</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Design your own personalized debit card. Upload images, add text, and choose colors to create a card that's
              uniquely yours.
            </p>
          </div>
          <CustomerCardTable />
        </div>
      </main>
      </>
    )
  }
  
  
  