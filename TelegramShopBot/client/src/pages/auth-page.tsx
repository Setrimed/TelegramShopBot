import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthPage() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const { user, loginMutation, registerMutation, isLoading } = useAuth();
  
  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);
  
  // Login form state
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: ""
  });

  // Register form state
  const [registerForm, setRegisterForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    firstName: "",
    lastName: ""
  });

  // Handle login form input change
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginForm({
      ...loginForm,
      [name]: value,
    });
  };

  // Handle register form input change
  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterForm({
      ...registerForm,
      [name]: value,
    });
  };

  // Handle login form submit
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginForm);
  };

  // Handle register form submit
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password match
    if (registerForm.password !== registerForm.confirmPassword) {
      toast({
        title: "كلمات المرور غير متطابقة",
        description: "يرجى التأكد من تطابق كلمة المرور",
        variant: "destructive",
      });
      return;
    }
    
    // Prepare data for submission (remove confirmPassword)
    const { confirmPassword, ...userData } = registerForm;
    registerMutation.mutate(userData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Hero section */}
        <div className="hidden lg:block p-8">
          <div className="text-center lg:text-right">
            <h1 className="text-4xl font-bold text-primary">متجر الحسابات الرقمية</h1>
            <p className="mt-4 text-lg text-gray-600">أفضل منصة لبيع وإدارة الحسابات الرقمية من خلال بوت تليجرام</p>
            
            <div className="mt-8">
              <div className="flex justify-center lg:justify-end space-x-4 space-x-reverse">
                <div className="bg-white p-4 rounded-lg shadow-md w-20 h-20 flex flex-col items-center justify-center">
                  <i className="fas fa-robot text-2xl text-primary"></i>
                  <span className="mt-2 text-sm">بوت تليجرام</span>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md w-20 h-20 flex flex-col items-center justify-center">
                  <i className="fas fa-shopping-cart text-2xl text-primary"></i>
                  <span className="mt-2 text-sm">تسوق سهل</span>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md w-20 h-20 flex flex-col items-center justify-center">
                  <i className="fas fa-shield-alt text-2xl text-primary"></i>
                  <span className="mt-2 text-sm">دفع آمن</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Auth forms */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-center text-2xl">لوحة التحكم</CardTitle>
            <CardDescription className="text-center">قم بتسجيل الدخول للوصول إلى لوحة التحكم</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
                <TabsTrigger value="register">حساب جديد</TabsTrigger>
              </TabsList>
              
              {/* Login form */}
              <TabsContent value="login">
                <form onSubmit={handleLoginSubmit}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="login-username">اسم المستخدم</Label>
                      <Input
                        id="login-username"
                        name="username"
                        value={loginForm.username}
                        onChange={handleLoginChange}
                        placeholder="أدخل اسم المستخدم"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="login-password">كلمة المرور</Label>
                      <Input
                        id="login-password"
                        name="password"
                        type="password"
                        value={loginForm.password}
                        onChange={handleLoginChange}
                        placeholder="أدخل كلمة المرور"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                    </Button>
                  </div>
                </form>
              </TabsContent>
              
              {/* Register form */}
              <TabsContent value="register">
                <form onSubmit={handleRegisterSubmit}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="register-firstName">الاسم الأول</Label>
                        <Input
                          id="register-firstName"
                          name="firstName"
                          value={registerForm.firstName}
                          onChange={handleRegisterChange}
                          placeholder="أدخل الاسم الأول"
                        />
                      </div>
                      <div>
                        <Label htmlFor="register-lastName">الاسم الأخير</Label>
                        <Input
                          id="register-lastName"
                          name="lastName"
                          value={registerForm.lastName}
                          onChange={handleRegisterChange}
                          placeholder="أدخل الاسم الأخير"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="register-username">اسم المستخدم</Label>
                      <Input
                        id="register-username"
                        name="username"
                        value={registerForm.username}
                        onChange={handleRegisterChange}
                        placeholder="أدخل اسم المستخدم"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="register-email">البريد الإلكتروني</Label>
                      <Input
                        id="register-email"
                        name="email"
                        type="email"
                        value={registerForm.email}
                        onChange={handleRegisterChange}
                        placeholder="أدخل البريد الإلكتروني"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="register-password">كلمة المرور</Label>
                      <Input
                        id="register-password"
                        name="password"
                        type="password"
                        value={registerForm.password}
                        onChange={handleRegisterChange}
                        placeholder="أدخل كلمة المرور"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="register-confirmPassword">تأكيد كلمة المرور</Label>
                      <Input
                        id="register-confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={registerForm.confirmPassword}
                        onChange={handleRegisterChange}
                        placeholder="أعد إدخال كلمة المرور"
                        required
                      />
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-500">
              بتسجيل الدخول، أنت توافق على شروط الاستخدام وسياسة الخصوصية
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}