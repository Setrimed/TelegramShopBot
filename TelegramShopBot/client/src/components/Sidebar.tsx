import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface SidebarProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export default function Sidebar({ mobileMenuOpen, setMobileMenuOpen }: SidebarProps) {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Dashboard", icon: "fas fa-tachometer-alt" },
    { href: "/products", label: "Products", icon: "fas fa-box" },
    { href: "/orders", label: "Orders", icon: "fas fa-shopping-cart" },
    { href: "/customers", label: "Customers", icon: "fas fa-users" },
    { href: "/bot-settings", label: "Bot Settings", icon: "fas fa-cog" },
  ];

  return (
    <aside className={cn(
      "bg-primary text-white",
      mobileMenuOpen 
        ? "fixed inset-0 z-40 flex" 
        : "hidden md:flex md:flex-shrink-0"
    )}>
      <div className="flex flex-col w-64">
        <div className="flex items-center justify-center h-16 border-b border-primary-light">
          <div className="flex items-center">
            <i className="fab fa-telegram text-2xl mr-3"></i>
            <span className="text-xl font-semibold">TeleShop Admin</span>
          </div>
        </div>
        
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          <nav className="flex-1 px-2 space-y-1">
            {links.map((link) => (
              <div
                key={link.href}
                onClick={() => {
                  setMobileMenuOpen(false);
                  window.location.href = link.href;
                }}
                className={cn(
                  "flex items-center px-4 py-3 text-sm font-medium rounded-md cursor-pointer",
                  location === link.href 
                    ? "bg-primary-light" 
                    : "text-white hover:bg-primary-light"
                )}
              >
                <i className={cn(link.icon, "w-6 text-center")}></i>
                <span className="ml-3">{link.label}</span>
              </div>
            ))}
          </nav>
        </div>
        
        <div className="p-4 border-t border-primary-light">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 rounded-full bg-primary-dark p-1 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">Admin User</p>
              <p className="text-xs font-medium text-gray-300">admin@example.com</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
