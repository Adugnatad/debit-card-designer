import Image from "next/image";
import { Button } from "@/components/ui/button";
import Login from "@/components/ui/auth/login";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Login Page",
};

import { initFlowbite } from "flowbite";

export default function SignIn() {
  return <Login />;
}
