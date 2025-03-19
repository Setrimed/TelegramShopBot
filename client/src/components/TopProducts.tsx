import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

export default function TopProducts() {
  const { data: products, isLoading } = useQuery({
    queryKey: ['/api/products'],
  });

  // Format price from cents to dollars
  const formatPrice = (price: number) => {
    return `$${(price / 100).toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="lg:col-span-1 bg-white shadow rounded-lg animate-pulse">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <div className="h-6 bg-gray-300 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        </div>
        <div className="p-4">
          <ul className="divide-y divide-gray-200">
            {[...Array(5)].map((_, i) => (
              <li key={i} className="py-3">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300"></div>
                  <div className="flex-1 min-w-0">
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  </div>
                  <div className="h-5 bg-gray-300 rounded w-16"></div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // Get the top 5 most expensive products
  const topProducts = products?.slice(0, 5) || [];

  // Get icon class and background color
  const getIconClass = (product: any) => {
    return product.icon || "fa-box";
  };

  const getIconBgColor = (product: any) => {
    return product.iconBg || "bg-primary-light";
  };

  return (
    <div className="lg:col-span-1 bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Top Products</h3>
        <p className="mt-1 text-sm text-gray-500">Most popular digital accounts</p>
      </div>
      <div className="p-4">
        <ul className="divide-y divide-gray-200">
          {topProducts.length > 0 ? (
            topProducts.map((product) => (
              <li key={product.id} className="py-3">
                <div className="flex items-center space-x-4">
                  <div 
                    className={`flex-shrink-0 h-10 w-10 rounded-full ${getIconBgColor(product)} flex items-center justify-center`}
                  >
                    <i className={`fab ${getIconClass(product)} text-white text-lg`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-sm text-gray-500 truncate">Stock: {product.stock} accounts</p>
                  </div>
                  <div className="text-base font-semibold text-gray-900">{formatPrice(product.price)}</div>
                </div>
              </li>
            ))
          ) : (
            <li className="py-3 text-center text-sm text-gray-500">
              No products found
            </li>
          )}
        </ul>
      </div>
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6 rounded-b-lg">
        <Button variant="outline" className="w-full" onClick={() => window.location.href = '/products'}>
          Manage Products
        </Button>
      </div>
    </div>
  );
}
