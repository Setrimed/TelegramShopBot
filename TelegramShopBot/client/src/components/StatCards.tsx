import { useQuery } from "@tanstack/react-query";

export default function StatCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/statistics'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-gray-300 rounded-md p-3 h-12 w-12"></div>
                <div className="ml-5 w-0 flex-1">
                  <div className="h-5 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  const statCards = [
    {
      title: "Total Orders",
      value: stats?.totalOrders || 0,
      icon: "fa-shopping-cart",
      bgColor: "bg-primary-light",
      increase: "12%",
    },
    {
      title: "Total Customers",
      value: stats?.totalCustomers || 0,
      icon: "fa-users",
      bgColor: "bg-secondary",
      increase: "8%",
    },
    {
      title: "Total Revenue",
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: "fa-dollar-sign",
      bgColor: "bg-green-600",
      increase: "15%",
    },
    {
      title: "Products",
      value: stats?.totalProducts || 0,
      icon: "fa-box",
      bgColor: "bg-yellow-500",
      increase: "5%",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      {statCards.map((card, index) => (
        <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${card.bgColor} rounded-md p-3`}>
                <i className={`fas ${card.icon} text-white`}></i>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{card.title}</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{card.value}</div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      <i className="fas fa-arrow-up"></i>
                      <span className="sr-only">Increased by</span>
                      {card.increase}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
