import StatCards from "@/components/StatCards";
import RecentOrders from "@/components/RecentOrders";
import TopProducts from "@/components/TopProducts";
import BotConfig from "@/components/BotConfig";
import BotPreview from "@/components/BotPreview";

export default function Dashboard() {
  return (
    <div>
      {/* Dashboard Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">Welcome to your Telegram Shop Bot admin panel</p>
      </div>

      {/* Demo Mode Alert */}
      <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Demo Mode Active
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Currently running in demo mode. To activate the Telegram bot functionality, please:
              </p>
              <ol className="list-decimal mt-2 ml-5 space-y-1">
                <li>Go to <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="font-medium underline">@BotFather</a> on Telegram</li>
                <li>Send the command <code className="bg-blue-100 px-1 rounded">/newbot</code> and follow the instructions</li>
                <li>Copy the API token provided by BotFather</li>
                <li>Paste the token in the Bot Settings page and save</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <StatCards />

      {/* Recent Orders & Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RecentOrders />
        <TopProducts />
      </div>

      {/* Bot Configuration */}
      <BotConfig />

      {/* Bot Preview & Commands */}
      <BotPreview />
    </div>
  );
}
