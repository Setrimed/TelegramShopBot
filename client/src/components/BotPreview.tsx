import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";

export default function BotPreview() {
  const { toast } = useToast();
  const [userMessage, setUserMessage] = useState('');
  
  // Fetch bot commands
  const { data: commands, isLoading } = useQuery({
    queryKey: ['/api/bot/commands'],
  });

  // Update command mutation
  const updateCommand = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const res = await apiRequest('PUT', `/api/bot/commands/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bot/commands'] });
      toast({
        title: "Command updated",
        description: "The bot command has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating command",
        description: `${error}`,
        variant: "destructive",
      });
    },
  });

  // Toggle command active state
  const toggleCommandStatus = (id: number, active: boolean) => {
    updateCommand.mutate({
      id,
      data: { active: !active }
    });
  };

  if (isLoading) {
    return (
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
        <div className="lg:col-span-1 bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-blue-600">
            <div className="h-6 bg-blue-500 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-blue-500 rounded w-1/2"></div>
          </div>
          <div className="bg-gray-100 h-96"></div>
        </div>
        
        <div className="lg:col-span-2 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="h-6 bg-gray-300 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
          <div className="p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="mb-4">
                <div className="h-6 bg-gray-300 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Telegram Bot Preview */}
      <div className="lg:col-span-1 bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-[#5682a3]">
          <h3 className="text-lg leading-6 font-medium text-white flex items-center">
            <i className="fab fa-telegram mr-2"></i>
            Bot Preview
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Demo Mode
            </span>
          </h3>
          <p className="mt-1 text-sm text-white text-opacity-80">How your bot appears to customers</p>
        </div>
        <div className="bg-yellow-50 p-2 border-b border-yellow-100">
          <p className="text-xs text-yellow-800 flex items-center">
            <svg className="h-4 w-4 text-yellow-500 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            This is a demo preview. Set a valid Telegram token in Bot Settings to enable the actual bot.
          </p>
        </div>
        
        <div className="bg-[#e7ebf0] h-96 overflow-y-auto p-2">
          {/* Conversation Thread */}
          <div className="flex flex-col space-y-2">
            {/* Bot Message */}
            <div className="flex items-start">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-[#5682a3] flex items-center justify-center text-white">
                <i className="fas fa-robot text-sm"></i>
              </div>
              <div className="ml-2 bg-white rounded-lg px-3 py-2 max-w-[80%] shadow-sm">
                <p className="text-sm text-gray-800">
                  Welcome to Digital Shop Bot! 👋 
                  I can help you purchase premium digital accounts. Use these commands:
                </p>
                <p className="text-sm text-gray-800 mt-2">
                  /products - Browse available products<br/>
                  /cart - View your shopping cart<br/>
                  /orders - Check your order history<br/>
                  /help - Get assistance
                </p>
              </div>
            </div>

            {/* User Message */}
            <div className="flex items-start justify-end">
              <div className="bg-[#effdde] rounded-lg px-3 py-2 max-w-[80%] shadow-sm">
                <p className="text-sm text-gray-800">/products</p>
              </div>
            </div>

            {/* Bot Message with Products */}
            <div className="flex items-start">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-[#5682a3] flex items-center justify-center text-white">
                <i className="fas fa-robot text-sm"></i>
              </div>
              <div className="ml-2 bg-white rounded-lg px-3 py-2 max-w-[80%] shadow-sm">
                <p className="text-sm text-gray-800 font-medium">📋 Available Products:</p>
                <div className="mt-2 space-y-2">
                  <div className="border border-gray-200 rounded p-2">
                    <p className="font-medium">Netflix Premium</p>
                    <p className="text-xs text-gray-500">1 Month Subscription</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="font-bold">$14.99</span>
                      <button className="bg-[#5682a3] text-white text-xs py-1 px-2 rounded">Add to Cart</button>
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded p-2">
                    <p className="font-medium">Spotify Premium</p>
                    <p className="text-xs text-gray-500">1 Month Subscription</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="font-bold">$9.99</span>
                      <button className="bg-[#5682a3] text-white text-xs py-1 px-2 rounded">Add to Cart</button>
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded p-2">
                    <p className="font-medium">Disney+ Premium</p>
                    <p className="text-xs text-gray-500">1 Month Subscription</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="font-bold">$7.99</span>
                      <button className="bg-[#5682a3] text-white text-xs py-1 px-2 rounded">Add to Cart</button>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Select an item to add to your cart.</p>
              </div>
            </div>

            {/* User Message */}
            <div className="flex items-start justify-end">
              <div className="bg-[#effdde] rounded-lg px-3 py-2 max-w-[80%] shadow-sm">
                <p className="text-sm text-gray-800">I want to buy Netflix Premium</p>
              </div>
            </div>

            {/* Bot Message */}
            <div className="flex items-start">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-[#5682a3] flex items-center justify-center text-white">
                <i className="fas fa-robot text-sm"></i>
              </div>
              <div className="ml-2 bg-white rounded-lg px-3 py-2 max-w-[80%] shadow-sm">
                <p className="text-sm text-gray-800">✅ Added <strong>Netflix Premium (1 Month)</strong> to your cart for <strong>$14.99</strong>.</p>
                <p className="text-sm text-gray-800 mt-2">Would you like to:</p>
                <div className="mt-2 flex flex-col space-y-1">
                  <button className="bg-[#5682a3] text-white text-xs py-1 px-2 rounded text-left">Continue Shopping</button>
                  <button className="bg-[#5682a3] text-white text-xs py-1 px-2 rounded text-left">View Cart</button>
                  <button className="bg-[#5682a3] text-white text-xs py-1 px-2 rounded text-left">Checkout Now</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center">
            <Input
              type="text"
              placeholder="Type a message to test..."
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              className="flex-1"
            />
            <button 
              type="button" 
              className="ml-2 inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              onClick={() => setUserMessage('')}
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Bot Commands */}
      <div className="lg:col-span-2 bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Bot Commands</h3>
          <p className="mt-1 text-sm text-gray-500">Configure available customer commands</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Command</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {commands?.map((command: any) => (
                <tr key={command.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {command.command}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {command.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      command.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {command.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      type="button" 
                      className="text-primary hover:text-primary-dark mr-3"
                      onClick={() => {
                        // Edit command (in a real app, this would open a modal)
                        toast({
                          title: "Edit command",
                          description: `Editing ${command.command} (Not implemented in this demo)`,
                        });
                      }}
                    >
                      Edit
                    </button>
                    <button 
                      type="button" 
                      className={`text-sm ${command.active ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}
                      onClick={() => toggleCommandStatus(command.id, command.active)}
                    >
                      {command.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-gray-50 flex justify-between border-t border-gray-200">
          <Button 
            variant="outline"
            onClick={() => {
              toast({
                title: "Add new command",
                description: "Adding a new command (Not implemented in this demo)",
              });
            }}
          >
            <i className="fas fa-plus mr-2"></i>
            Add New Command
          </Button>
          <Button
            onClick={() => {
              toast({
                title: "Commands updated",
                description: "Bot commands have been updated with the Telegram BotFather.",
              });
            }}
          >
            <i className="fas fa-sync-alt mr-2"></i>
            Update Bot Commands
          </Button>
        </div>
      </div>
    </div>
  );
}
