import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
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
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Customers() {
  const [customerDetailsOpen, setCustomerDetailsOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Get customers
  const { data: customers, isLoading } = useQuery({
    queryKey: ['/api/customers'],
  });

  // Get customer orders
  const { data: customerOrders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['/api/orders'],
    select: (orders) => {
      if (selectedCustomer) {
        return orders.filter((order: any) => order.userId === selectedCustomer.id);
      }
      return [];
    },
    enabled: !!selectedCustomer,
  });

  // View customer details
  const handleViewCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setCustomerDetailsOpen(true);
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format price from cents to dollars
  const formatPrice = (price: number) => {
    return `$${(price / 100).toFixed(2)}`;
  };

  // Get total spent by a customer
  const getCustomerTotalSpent = (customerId: number) => {
    if (!customerOrders) return formatPrice(0);
    
    const total = customerOrders.reduce((acc: number, order: any) => {
      if (order.userId === customerId && order.status === 'completed') {
        return acc + order.totalAmount;
      }
      return acc;
    }, 0);
    
    return formatPrice(total);
  };

  // Get customer order count
  const getCustomerOrderCount = (customerId: number) => {
    const orders = customerOrders?.filter((order: any) => order.userId === customerId) || [];
    return orders.length;
  };

  // Generate status badge for orders
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return (
          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            Completed
          </span>
        );
      case 'processing':
        return (
          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Processing
          </span>
        );
      case 'pending':
        return (
          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            Pending
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            Cancelled
          </span>
        );
      case 'failed':
        return (
          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            Failed
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="mb-6">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="h-64 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Customers</h1>
        <p className="mt-1 text-sm text-gray-600">Manage and view customers of your Telegram shop</p>
      </div>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
          <CardDescription>
            You have a total of {customers?.length || 0} customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Telegram</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers?.length > 0 ? (
                customers.map((customer: any) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.id}</TableCell>
                    <TableCell>{customer.username}</TableCell>
                    <TableCell>
                      {customer.telegramUsername ? `@${customer.telegramUsername}` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {customer.firstName || customer.lastName 
                        ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim() 
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        customer.isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {customer.isAdmin ? 'Admin' : 'Customer'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => handleViewCustomer(customer)}>
                        <i className="fas fa-eye mr-1"></i> View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No customers found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Customer Details Dialog */}
      <Dialog open={customerDetailsOpen} onOpenChange={setCustomerDetailsOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>
              {selectedCustomer && `Customer ID: ${selectedCustomer.id}`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="py-4">
              {/* Customer information */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Basic Information</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex">
                      <span className="font-medium w-24">Username:</span>
                      <span>{selectedCustomer.username}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-24">Name:</span>
                      <span>
                        {selectedCustomer.firstName || selectedCustomer.lastName 
                          ? `${selectedCustomer.firstName || ''} ${selectedCustomer.lastName || ''}`.trim() 
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-24">Telegram:</span>
                      <span>{selectedCustomer.telegramUsername ? `@${selectedCustomer.telegramUsername}` : 'N/A'}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-24">Telegram ID:</span>
                      <span>{selectedCustomer.telegramId || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Customer Statistics</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex">
                      <span className="font-medium w-24">Total Orders:</span>
                      <span>{isLoadingOrders ? '...' : getCustomerOrderCount(selectedCustomer.id)}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-24">Total Spent:</span>
                      <span>{isLoadingOrders ? '...' : getCustomerTotalSpent(selectedCustomer.id)}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-24">Status:</span>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        selectedCustomer.isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {selectedCustomer.isAdmin ? 'Admin' : 'Customer'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer orders */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Order History</h3>
                {isLoadingOrders ? (
                  <div className="animate-pulse h-20 bg-gray-200 rounded"></div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customerOrders?.length > 0 ? (
                        customerOrders.map((order: any) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">
                              #{`ORD-${order.id.toString().padStart(4, '0')}`}
                            </TableCell>
                            <TableCell>{formatDate(order.createdAt)}</TableCell>
                            <TableCell>{formatPrice(order.totalAmount)}</TableCell>
                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                            No orders found for this customer.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              onClick={() => {
                setCustomerDetailsOpen(false);
                setSelectedCustomer(null);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
