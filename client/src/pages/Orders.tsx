import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Orders() {
  const { toast } = useToast();
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [newStatus, setNewStatus] = useState("");

  // Get orders
  const { data: orders, isLoading } = useQuery({
    queryKey: ['/api/orders'],
  });

  // Get order details
  const { data: orderDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['/api/orders', selectedOrder?.id],
    enabled: !!selectedOrder,
  });

  // Update order status mutation
  const updateOrderStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await apiRequest('PUT', `/api/orders/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      if (selectedOrder) {
        queryClient.invalidateQueries({ queryKey: ['/api/orders', selectedOrder.id] });
      }
      toast({
        title: "Order status updated",
        description: "The order status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating order status",
        description: `${error}`,
        variant: "destructive",
      });
    },
  });

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format price from cents to dollars
  const formatPrice = (price: number) => {
    return `$${(price / 100).toFixed(2)}`;
  };

  // Generate status badge based on order status
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

  // View order details
  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setOrderDetailsOpen(true);
  };

  // Update order status
  const handleUpdateStatus = () => {
    if (!selectedOrder || !newStatus) return;
    
    updateOrderStatus.mutate({
      id: selectedOrder.id,
      status: newStatus
    });
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
        <h1 className="text-2xl font-semibold text-gray-800">Orders</h1>
        <p className="mt-1 text-sm text-gray-600">Manage and track customer orders</p>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>
            You have a total of {orders?.length || 0} orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders?.length > 0 ? (
                orders.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      #{`ORD-${order.id.toString().padStart(4, '0')}`}
                    </TableCell>
                    <TableCell>
                      @{order.telegramChatId ? order.telegramChatId.substring(0, 10) : 'unknown'}
                    </TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell>{formatPrice(order.totalAmount)}</TableCell>
                    <TableCell>{order.paymentMethod || 'N/A'}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => handleViewOrder(order)}>
                        <i className="fas fa-eye mr-1"></i> View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={orderDetailsOpen} onOpenChange={setOrderDetailsOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              {selectedOrder && `Order #ORD-${selectedOrder.id.toString().padStart(4, '0')}`}
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingDetails ? (
            <div className="py-4 animate-pulse">
              <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
              <div className="h-20 bg-gray-300 rounded mb-4"></div>
              <div className="h-6 bg-gray-300 rounded w-1/2 mb-4"></div>
              <div className="h-32 bg-gray-300 rounded"></div>
            </div>
          ) : (
            <div className="py-4">
              {/* Order information */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Order Information</h3>
                  <p className="mt-1">Date: {selectedOrder && formatDate(selectedOrder.createdAt)}</p>
                  <p>Customer ID: {selectedOrder && selectedOrder.userId}</p>
                  <p>Telegram: @{selectedOrder && (selectedOrder.telegramChatId ? selectedOrder.telegramChatId.substring(0, 10) : 'unknown')}</p>
                  <p>Payment Method: {selectedOrder && (selectedOrder.paymentMethod || 'N/A')}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Order Status</h3>
                  <div className="mt-1 flex items-center space-x-4">
                    <div>{selectedOrder && getStatusBadge(selectedOrder.status)}</div>
                    <div className="flex-1">
                      <Select
                        value={newStatus}
                        onValueChange={setNewStatus}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Change status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      size="sm"
                      onClick={handleUpdateStatus}
                      disabled={updateOrderStatus.isPending || newStatus === selectedOrder?.status}
                    >
                      Update
                    </Button>
                  </div>
                </div>
              </div>

              {/* Order items */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Ordered Items</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product ID</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderDetails?.items?.length > 0 ? (
                      orderDetails.items.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.productId}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatPrice(item.price)}</TableCell>
                          <TableCell>{formatPrice(item.price * item.quantity)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-2 text-gray-500">
                          No items found for this order.
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow>
                      <TableCell colSpan={3} className="text-right font-medium">Total:</TableCell>
                      <TableCell className="font-bold">{selectedOrder && formatPrice(selectedOrder.totalAmount)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Account credentials */}
              {selectedOrder?.accountCredentials && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Account Credentials</h3>
                  <div className="bg-gray-100 p-3 rounded font-mono text-sm whitespace-pre-wrap">
                    {selectedOrder.accountCredentials}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button 
              onClick={() => {
                setOrderDetailsOpen(false);
                setSelectedOrder(null);
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
