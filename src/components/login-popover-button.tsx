import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import Button from "./common/custom-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth-store";
import { signup, login } from "@/lib/local-auth";

type FormData = {
  username: string;
  email: string;
  password: string;
};

function LoginPopoverButton() {
  const auth = useAuthStore();
  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    password: "",
  });
  const [tabValue, setTabValue] = useState<"login" | "signup">("login");

  const handleLogin = async () => {
    if (formData.username === "" || formData.password === "") {
      toast.error("Please fill in all fields", {
        style: { background: "red" },
      });
      return;
    }

    const result = await login(formData.username, formData.password);
    if (result.success && result.user) {
      toast.success("Login successful", { style: { background: "green" } });
      clearForm();
      auth.setAuth({
        id: result.user.id,
        email: result.user.email,
        username: result.user.username,
        avatar: result.user.avatar,
        collectionId: "",
        collectionName: "",
        autoSkip: false,
      });
    } else {
      toast.error(result.error || "Login failed", {
        style: { background: "red" },
      });
    }
  };

  const handleSignup = async () => {
    if (formData.username === "" || formData.password === "" || formData.email === "") {
      toast.error("Please fill in all fields", {
        style: { background: "red" },
      });
      return;
    }

    const result = await signup(formData.username, formData.email, formData.password);
    if (result.success) {
      toast.success("Account created successfully. Please login.", {
        style: { background: "green" },
      });
      clearForm();
      setTabValue("login");
    } else {
      toast.error(result.error || "Signup failed", {
        style: { background: "red" },
      });
    }
  };

  const clearForm = () => {
    setFormData({
      username: "",
      email: "",
      password: "",
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="bg-white text-md text-black hover:bg-gray-200 hover:text-black transition-all duration-300"
        >
          Login
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
            <TabsTrigger onClick={clearForm} value="login">
              Login
            </TabsTrigger>
            <TabsTrigger onClick={clearForm} value="signup">
              Signup
            </TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="flex flex-col gap-2" aria-label="Login form">
            <div className="mt-2">
              <label htmlFor="login-username" className="text-gray-300 text-xs">Username:</label>
              <Input
                id="login-username"
                required
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                type="text"
                value={formData.username}
                placeholder="Enter your username"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="text-gray-300 text-xs">Password:</label>
              <Input
                id="login-password"
                required
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Enter your password"
              />
            </div>
            <Button
              variant="default"
              className="w-full text-xs"
              size="sm"
              type="submit"
              onClick={handleLogin}
            >
              Login
            </Button>
          </TabsContent>
          <TabsContent value="signup" className="flex flex-col gap-2" aria-label="Signup form">
            <div>
              <label htmlFor="signup-username" className="text-gray-300 text-xs">Username:</label>
              <Input
                id="signup-username"
                required
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                type="text"
                placeholder="Enter your username"
              />
            </div>
            <div>
              <label htmlFor="signup-email" className="text-gray-300 text-xs">Email:</label>
              <Input
                id="signup-email"
                required
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                type="email"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label htmlFor="signup-password" className="text-gray-300 text-xs">Password:</label>
              <Input
                id="signup-password"
                required
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                type="password"
                placeholder="Enter your password"
              />
            </div>
            <Button
              variant="default"
              className="w-full text-xs"
              size="sm"
              type="submit"
              onClick={handleSignup}
            >
              Signup
            </Button>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}

export default LoginPopoverButton;
