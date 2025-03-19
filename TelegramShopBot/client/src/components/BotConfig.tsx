import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";

export default function BotConfig() {
  const { toast } = useToast();
  const [isTokenVisible, setIsTokenVisible] = useState(false);
  
  // Fetch bot settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/bot/settings'],
  });

  // State for form
  const [botToken, setBotToken] = useState('');
  const [botStatus, setBotStatus] = useState('active');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);

  // Set form values once data is loaded
  useState(() => {
    if (settings) {
      setBotToken(settings.token || '');
      setBotStatus(settings.status || 'active');
      setWelcomeMessage(settings.welcomeMessage || '');
      setPaymentMethods(settings.paymentMethods || []);
    }
  });

  // Update settings mutation
  const updateSettings = useMutation({
    mutationFn: async (updatedSettings: any) => {
      const res = await apiRequest('PUT', '/api/bot/settings', updatedSettings);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bot/settings'] });
      toast({
        title: "Settings saved",
        description: "Your bot settings have been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error saving settings",
        description: `${error}`,
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = () => {
    updateSettings.mutate({
      token: botToken,
      status: botStatus,
      welcomeMessage,
      paymentMethods,
    });
  };

  const togglePaymentMethod = (method: string) => {
    if (paymentMethods.includes(method)) {
      setPaymentMethods(paymentMethods.filter(m => m !== method));
    } else {
      setPaymentMethods([...paymentMethods, method]);
    }
  };

  if (isLoading) {
    return (
      <div className="mt-6 bg-white shadow rounded-lg animate-pulse">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <div className="h-6 bg-gray-300 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                <div className="h-10 bg-gray-300 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Bot Configuration</h3>
        <p className="mt-1 text-sm text-gray-500">Manage your Telegram shop bot settings</p>
      </div>
      <div className="px-4 py-5 sm:p-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="botToken" className="block text-sm font-medium text-gray-700">Bot Token</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <Input
                type={isTokenVisible ? "text" : "password"}
                id="botToken"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                className="pr-10"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button 
                  type="button" 
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setIsTokenVisible(!isTokenVisible)}
                >
                  <i className={`fas ${isTokenVisible ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Create a bot with <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">BotFather</a> and paste your token here
            </p>
          </div>
          
          <div>
            <label htmlFor="botStatus" className="block text-sm font-medium text-gray-700">Bot Status</label>
            <div className="mt-1">
              <Select
                value={botStatus}
                onValueChange={(value) => setBotStatus(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select bot status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="maintenance">Maintenance Mode</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="mt-2 text-sm text-gray-500">Current status of your Telegram bot.</p>
          </div>
          
          <div>
            <label htmlFor="welcomeMessage" className="block text-sm font-medium text-gray-700">Welcome Message</label>
            <div className="mt-1">
              <Textarea
                id="welcomeMessage"
                rows={3}
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">Message shown to new users.</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Methods</label>
            <div className="mt-1 space-y-2">
              <div className="flex items-center">
                <Checkbox 
                  id="crypto" 
                  checked={paymentMethods.includes('Cryptocurrency')}
                  onCheckedChange={() => togglePaymentMethod('Cryptocurrency')}
                />
                <label htmlFor="crypto" className="ml-2 block text-sm text-gray-700">Cryptocurrency</label>
              </div>
              <div className="flex items-center">
                <Checkbox 
                  id="bankTransfer" 
                  checked={paymentMethods.includes('Bank Transfer')}
                  onCheckedChange={() => togglePaymentMethod('Bank Transfer')}
                />
                <label htmlFor="bankTransfer" className="ml-2 block text-sm text-gray-700">Bank Transfer</label>
              </div>
              <div className="flex items-center">
                <Checkbox 
                  id="paypal" 
                  checked={paymentMethods.includes('PayPal')}
                  onCheckedChange={() => togglePaymentMethod('PayPal')}
                />
                <label htmlFor="paypal" className="ml-2 block text-sm text-gray-700">PayPal</label>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">Available payment options.</p>
          </div>
        </div>
      </div>
      <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 rounded-b-lg border-t border-gray-200">
        <Button 
          onClick={handleSaveSettings}
          disabled={updateSettings.isPending}
        >
          {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
