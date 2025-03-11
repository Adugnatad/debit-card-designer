"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";

const images = ["/card1.jpg", "/card2.jpg", "/card3.jpg"]; // Add your image paths

const Login = () => {
  const [password, setPassword] = useState<string>("123456");
  const [email, setEmail] = useState<string>("emuti@gmail.com");
  const [signingIn, setSigningIn] = useState(false);
  const router = useRouter();

  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-slide effect every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSigningIn(true);

    // ✅ Simulate successful login without API call
    localStorage.setItem("accessToken", "dummy-token");
    toast.success("Login successful!");
    router.push("/admin");

    setSigningIn(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="rounded-xl p-8 flex flex-col md:flex-row items-center space-y-8 md:space-y-0 md:space-x-8 w-full md:max-w-[65vw] bg-gray-100 shadow-lg border-s-8">
        
        {/* Image Carousel */}
        <div className="w-full md:w-[35vw] flex justify-center">
          <div className="overflow-hidden rounded-lg relative">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentIndex}
                src={images[currentIndex]}
                alt="Coop Card templates"
                className="w-full h-auto rounded-lg"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 1 }}
              />
            </AnimatePresence>
          </div>
        </div>

        {/* Login Form */}
        <form className="w-full md:w-[45vw] max-w-md" onSubmit={handleSubmit}>
          <h2 className="text-xl font-bold mb-4 text-gray-800">Sign In</h2>
          <p className="text-sm text-gray-600 mb-6">Welcome Back.</p>

          <div className="mb-5">
            <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900">
              Email
            </label>
            <input
              type="text"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              placeholder="johndoe@gmail.com"
              required
            />
          </div>

          <div className="mb-5">
            <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-cyan-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
            disabled={signingIn}
          >
            {signingIn ? "Loading..." : "LOGIN"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
