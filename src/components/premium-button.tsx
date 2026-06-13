"use client";
import { Crown } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import Button from "./common/custom-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { toast } from "sonner";
import { login, signup } from "@/lib/local-auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PremiumButton() {
  const auth = useAuthStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });
  const [tabValue, setTabValue] = useState<"login" | "signup">("login");

  if (auth.auth) {
    return (
      <Link
        href="/premium"
        className="flex items-center gap-1.5 text-xs sm:text-sm font-bold px-2 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-amber-400 hover:from-amber-500/20 hover:to-orange-500/20 transition-all duration-300 shrink-0"
      >
        <Crown className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Go Premium</span>
      </Link>
    );
  }

  const handleLogin = async () => {
    if (!formData.username || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }
    const result = await login(formData.username, formData.password);
    if (result.success && result.user) {
      toast.success("Login successful");
      auth.setAuth({
        id: result.user.id,
        email: result.user.email,
        username: result.user.username,
        avatar: result.user.avatar,
        collectionId: "",
        collectionName: "",
        autoSkip: false,
      });
      setOpen(false);
      router.push("/premium");
    } else {
      toast.error(result.error || "Login failed");
    }
  };

  const handleSignup = async () => {
    if (!formData.username || !formData.password || !formData.email) {
      toast.error("Please fill in all fields");
      return;
    }
    const result = await signup(formData.username, formData.email, formData.password);
    if (result.success) {
      toast.success("Account created. Please login.");
      setFormData({ username: "", email: "", password: "" });
      setTabValue("login");
    } else {
      toast.error(result.error || "Signup failed");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 text-xs sm:text-sm font-bold flex items-center gap-1.5 whitespace-nowrap"
        >
          <Crown className="h-3.5 w-3.5" />
          Go Premium
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        className="bg-black bg-opacity-50 backdrop-blur-sm w-[300px] mt-4 mr-4 p-4 max-w-[90vw]"
      >
        <Tabs
          defaultValue={tabValue}
          value={tabValue}
          onValueChange={(value) => setTabValue(value as "login" | "signup")}
        >
          <TabsList>
            <TabsTrigger onClick={() => setFormData({ username: "", email: "", password: "" })} value="login">Login</TabsTrigger>
            <TabsTrigger onClick={() => setFormData({ username: "", email: "", password: "" })} value="signup">Signup</TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="flex flex-col gap-2">
            <p className="text-xs text-amber-400/80 mb-1">Login to get Premium</p>
            <div className="mt-2">
              <label className="text-gray-300 text-xs">Username:</label>
              <Input
                required
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                type="text"
                value={formData.username}
                placeholder="Enter your username"
              />
            </div>
            <div>
              <label className="text-gray-300 text-xs">Password:</label>
              <Input
                required
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter your password"
              />
            </div>
            <Button variant="default" className="w-full text-xs" size="sm" type="submit" onClick={handleLogin}>
              Login & Get Premium
            </Button>
          </TabsContent>
          <TabsContent value="signup" className="flex flex-col gap-2">
            <p className="text-xs text-amber-400/80 mb-1">Create an account to get Premium</p>
            <div>
              <label className="text-gray-300 text-xs">Username:</label>
              <Input
                required
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                type="text"
                placeholder="Enter your username"
              />
            </div>
            <div>
              <label className="text-gray-300 text-xs">Email:</label>
              <Input
                required
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                type="email"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="text-gray-300 text-xs">Password:</label>
              <Input
                required
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                type="password"
                placeholder="Create a password"
              />
            </div>
            <Button variant="default" className="w-full text-xs" size="sm" type="submit" onClick={handleSignup}>
              Signup
            </Button>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
