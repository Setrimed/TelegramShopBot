import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function BotSettings() {
  const { toast } = useToast();
  const [isTokenVisible, setIsTokenVisible] = useState(false);
  const [isEditCommandOpen, setIsEditCommandOpen] = useState(false);
  const [isAddCommandOpen, setIsAddCommandOpen] = useState(false);
  const [selectedCommand, setSelectedCommand] = useState<any>(null);
  
  // Bot settings form state
  const [botSettings, setBotSettings] = useState({
    token: "",
    status: "active",
    welcomeMessage: "",
    paymentMethods: [] as string[],
  });

  // New command form state
  const [newCommand, setNewCommand] = useState({
    command: "",
    description: "",
    active: true,
    responseMessage: "",
  });
  
  // Fetch bot settings
  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['/api/bot/settings'],
  });

  // Fetch bot commands
  const { data: commands, isLoading: isLoadingCommands } = useQuery({
    queryKey: ['/api/bot/commands'],
  });

  // Set form values once data is loaded
  useEffect(() => {
    if (settings) {
      setBotSettings({
        token: settings.token || '',
        status: settings.status || 'active',
        welcomeMessage: settings.welcomeMessage || '',
        paymentMethods: settings.paymentMethods || [],
      });
    }
  }, [settings]);

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

  // Update command mutation
  const updateCommand = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const res = await apiRequest('PUT', `/api/bot/commands/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bot/commands'] });
      setIsEditCommandOpen(false);
      setSelectedCommand(null);
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

  // Create command mutation
  const createCommand = useMutation({
    mutationFn: async (command: any) => {
      const res = await apiRequest('POST', '/api/bot/commands', command);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bot/commands'] });
      setIsAddCommandOpen(false);
      resetNewCommandForm();
      toast({
        title: "Command created",
        description: "The bot command has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating command",
        description: `${error}`,
        variant: "destructive",
      });
    },
  });

  // Handle form input changes for bot settings
  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBotSettings({
      ...botSettings,
      [name]: value,
    });
  };

  // Handle select changes for bot settings
  const handleSelectChange = (value: string) => {
    setBotSettings({
      ...botSettings,
      status: value,
    });
  };

  // Toggle payment method
  const togglePaymentMethod = (method: string) => {
    if (botSettings.paymentMethods.includes(method)) {
      setBotSettings({
        ...botSettings,
        paymentMethods: botSettings.paymentMethods.filter(m => m !== method),
      });
    } else {
      setBotSettings({
        ...botSettings,
        paymentMethods: [...botSettings.paymentMethods, method],
      });
    }
  };

  // Save bot settings
  const handleSaveSettings = () => {
    updateSettings.mutate(botSettings);
  };

  // Handle form input changes for commands
  const handleCommandInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewCommand({
      ...newCommand,
      [name]: value,
    });
  };

  // Handle switch changes for commands
  const handleCommandSwitchChange = (checked: boolean) => {
    setNewCommand({
      ...newCommand,
      active: checked,
    });
  };

  // Reset new command form
  const resetNewCommandForm = () => {
    setNewCommand({
      command: "",
      description: "",
      active: true,
      responseMessage: "",
    });
  };

  // Edit command
  const handleEditCommand = (command: any) => {
    setSelectedCommand(command);
    setNewCommand({
      command: command.command,
      description: command.description,
      active: command.active,
      responseMessage: command.responseMessage || "",
    });
    setIsEditCommandOpen(true);
  };

  // Submit edit command form
  const handleUpdateCommand = () => {
    if (!selectedCommand) return;
    
    updateCommand.mutate({
      id: selectedCommand.id,
      data: newCommand,
    });
  };

  // Submit new command form
  const handleCreateCommand = () => {
    // Check if command starts with /
    if (!newCommand.command.startsWith('/')) {
      newCommand.command = '/' + newCommand.command;
    }
    
    createCommand.mutate(newCommand);
  };

  // Toggle command active state directly
  const toggleCommandStatus = (id: number, active: boolean) => {
    updateCommand.mutate({
      id,
      data: { active: !active }
    });
  };

  if (isLoadingSettings || isLoadingCommands) {
    return (
      <div className="animate-pulse">
        <div className="mb-6">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        </div>
        <div className="mb-6">
          <div className="h-64 bg-gray-300 rounded mb-6"></div>
          <div className="h-64 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Bot Settings</h1>
        <p className="mt-1 text-sm text-gray-600">Configure your Telegram shop bot settings and commands</p>
      </div>

      {/* Bot Configuration */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Bot Configuration</CardTitle>
          <CardDescription>Manage your Telegram shop bot settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <Label htmlFor="botToken">Bot Token</Label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <Input
                  type={isTokenVisible ? "text" : "password"}
                  id="botToken"
                  name="token"
                  value={botSettings.token}
                  onChange={handleSettingsChange}
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
              <Label htmlFor="botStatus">Bot Status</Label>
              <div className="mt-1">
                <Select
                  value={botSettings.status}
                  onValueChange={handleSelectChange}
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
              <Label htmlFor="welcomeMessage">Welcome Message</Label>
              <div className="mt-1">
                <Textarea
                  id="welcomeMessage"
                  name="welcomeMessage"
                  rows={3}
                  value={botSettings.welcomeMessage}
                  onChange={handleSettingsChange}
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">Message shown to new users.</p>
            </div>
            
            <div>
              <Label>Payment Methods</Label>
              <div className="mt-1 space-y-2">
                <div className="flex items-center">
                  <Checkbox 
                    id="crypto" 
                    checked={botSettings.paymentMethods.includes('Cryptocurrency')}
                    onCheckedChange={() => togglePaymentMethod('Cryptocurrency')}
                  />
                  <label htmlFor="crypto" className="ml-2 block text-sm text-gray-700">Cryptocurrency</label>
                </div>
                <div className="flex items-center">
                  <Checkbox 
                    id="bankTransfer" 
                    checked={botSettings.paymentMethods.includes('Bank Transfer')}
                    onCheckedChange={() => togglePaymentMethod('Bank Transfer')}
                  />
                  <label htmlFor="bankTransfer" className="ml-2 block text-sm text-gray-700">Bank Transfer</label>
                </div>
                <div className="flex items-center">
                  <Checkbox 
                    id="paypal" 
                    checked={botSettings.paymentMethods.includes('PayPal')}
                    onCheckedChange={() => togglePaymentMethod('PayPal')}
                  />
                  <label htmlFor="paypal" className="ml-2 block text-sm text-gray-700">PayPal</label>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500">Available payment options.</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 border-t flex justify-end">
          <Button 
            onClick={handleSaveSettings}
            disabled={updateSettings.isPending}
          >
            {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardFooter>
      </Card>

      {/* Bot Commands */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Bot Commands</CardTitle>
            <CardDescription>Configure available customer commands</CardDescription>
          </div>
          <Button 
            onClick={() => {
              resetNewCommandForm();
              setIsAddCommandOpen(true);
            }}
          >
            <i className="fas fa-plus mr-2"></i>
            Add Command
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Command</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commands?.length > 0 ? (
                commands.map((command: any) => (
                  <TableRow key={command.id}>
                    <TableCell className="font-medium">
                      {command.command}
                    </TableCell>
                    <TableCell>{command.description}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        command.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {command.active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditCommand(command)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant={command.active ? "destructive" : "default"}
                          size="sm"
                          onClick={() => toggleCommandStatus(command.id, command.active)}
                        >
                          {command.active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                    No commands found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="bg-gray-50 border-t flex justify-end">
          <Button
            variant="outline"
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
        </CardFooter>
      </Card>

      {/* Edit Command Dialog */}
      <Dialog open={isEditCommandOpen} onOpenChange={setIsEditCommandOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Command</DialogTitle>
            <DialogDescription>
              Edit the bot command and its response
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="edit-command">Command</Label>
              <Input
                id="edit-command"
                name="command"
                value={newCommand.command}
                onChange={handleCommandInputChange}
                className="mt-1"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">Command name cannot be changed</p>
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                name="description"
                value={newCommand.description}
                onChange={handleCommandInputChange}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-responseMessage">Response Message</Label>
              <Textarea
                id="edit-responseMessage"
                name="responseMessage"
                rows={4}
                value={newCommand.responseMessage}
                onChange={handleCommandInputChange}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Message sent to user when command is used</p>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="edit-active">Active</Label>
              <Switch
                id="edit-active"
                checked={newCommand.active}
                onCheckedChange={handleCommandSwitchChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditCommandOpen(false);
                setSelectedCommand(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateCommand}
              disabled={updateCommand.isPending}
            >
              {updateCommand.isPending ? 'Updating...' : 'Update Command'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Command Dialog */}
      <Dialog open={isAddCommandOpen} onOpenChange={setIsAddCommandOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Command</DialogTitle>
            <DialogDescription>
              Create a new bot command for your customers
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="new-command">Command</Label>
              <Input
                id="new-command"
                name="command"
                value={newCommand.command}
                onChange={handleCommandInputChange}
                placeholder="/mycommand"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Must start with / (will be added if missing)</p>
            </div>
            <div>
              <Label htmlFor="new-description">Description</Label>
              <Input
                id="new-description"
                name="description"
                value={newCommand.description}
                onChange={handleCommandInputChange}
                placeholder="What this command does"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="new-responseMessage">Response Message</Label>
              <Textarea
                id="new-responseMessage"
                name="responseMessage"
                rows={4}
                value={newCommand.responseMessage}
                onChange={handleCommandInputChange}
                placeholder="Message sent to user when command is used"
                className="mt-1"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="new-active">Active</Label>
              <Switch
                id="new-active"
                checked={newCommand.active}
                onCheckedChange={handleCommandSwitchChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAddCommandOpen(false);
                resetNewCommandForm();
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateCommand}
              disabled={createCommand.isPending || !newCommand.command || !newCommand.description}
            >
              {createCommand.isPending ? 'Creating...' : 'Create Command'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
