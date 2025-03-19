import { Input } from "@/components/ui/input";

interface TopNavProps {
  setMobileMenuOpen: (open: boolean) => void;
}

export default function TopNav({ setMobileMenuOpen }: TopNavProps) {
  return (
    <header className="bg-white shadow-sm z-10">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        <div className="flex items-center md:hidden">
          <button
            type="button"
            className="text-gray-700 hover:text-primary"
            onClick={() => setMobileMenuOpen(true)}
          >
            <i className="fas fa-bars text-lg"></i>
          </button>
        </div>
        
        <div className="flex-1 flex justify-center md:justify-end">
          <div className="relative max-w-xs w-full">
            <div className="relative text-gray-500 focus-within:text-gray-700">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fas fa-search"></i>
              </div>
              <Input
                id="search"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="Search"
                type="search"
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button type="button" className="p-1 text-gray-600 hover:text-primary">
            <span className="sr-only">View notifications</span>
            <i className="fas fa-bell"></i>
          </button>
          <button type="button" className="md:hidden p-1 text-gray-600 hover:text-primary">
            <span className="sr-only">Open user menu</span>
            <i className="fas fa-user-circle text-lg"></i>
          </button>
        </div>
      </div>
    </header>
  );
}
