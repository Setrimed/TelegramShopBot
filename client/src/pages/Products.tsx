import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Products() {
  const { toast } = useToast();
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false); // Added state for account dialog
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [accountInput, setAccountInput] = useState(""); // Added state for account input
  const [accounts, setAccounts] = useState([]); // State to hold fetched accounts

  // Form state for new product
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
    stock: "",
    active: true,
    icon: "fa-box",
    iconBg: "#2B5278"
  });

  // Get products
  const { data: products, isLoading } = useQuery({
    queryKey: ['/api/products'],
  });

  // Get categories
  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
  });

  // Create product mutation
  const createProduct = useMutation({
    mutationFn: async (product: any) => {
      const res = await apiRequest('POST', '/api/products', product);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/statistics'] });
      setIsAddProductOpen(false);
      resetNewProductForm();
      toast({
        title: "Product created",
        description: "The product has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating product",
        description: `${error}`,
        variant: "destructive",
      });
    },
  });

  // Update product mutation
  const updateProduct = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const res = await apiRequest('PUT', `/api/products/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setIsEditProductOpen(false);
      toast({
        title: "Product updated",
        description: "The product has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating product",
        description: `${error}`,
        variant: "destructive",
      });
    },
  });

  // Delete product mutation
  const deleteProduct = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/products/${id}`, undefined);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/statistics'] });
      setIsDeleteDialogOpen(false);
      setSelectedProduct(null);
      toast({
        title: "Product deleted",
        description: "The product has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting product",
        description: `${error}`,
        variant: "destructive",
      });
    },
  });

  // Handle form input changes for new product
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewProduct({
      ...newProduct,
      [name]: name === 'price' || name === 'stock' ? value : value,
    });
  };

  // Handle select changes for new product
  const handleSelectChange = (name: string, value: string) => {
    setNewProduct({
      ...newProduct,
      [name]: value,
    });
  };

  // Handle switch changes for new product
  const handleSwitchChange = (name: string, checked: boolean) => {
    setNewProduct({
      ...newProduct,
      [name]: checked,
    });
  };

  // Reset new product form
  const resetNewProductForm = () => {
    setNewProduct({
      name: "",
      description: "",
      price: "",
      categoryId: "",
      stock: "",
      active: true,
      icon: "fa-box",
      iconBg: "#2B5278"
    });
  };

  // Submit new product form
  const handleCreateProduct = () => {
    // Convert price and stock to numbers
    const formattedProduct = {
      ...newProduct,
      price: parseInt((parseFloat(newProduct.price) * 100).toString()), // Convert to cents
      stock: parseInt(newProduct.stock),
      categoryId: parseInt(newProduct.categoryId),
    };

    createProduct.mutate(formattedProduct);
  };

  // Edit product
  const handleEditProduct = (product: any) => {
    setSelectedProduct(product);
    // Format the product for editing (convert price from cents to dollars)
    setNewProduct({
      name: product.name,
      description: product.description,
      price: (product.price / 100).toString(),
      categoryId: product.categoryId?.toString() || "",
      stock: product.stock, // Calculate stock from credentials
      active: product.active,
      icon: product.icon || "fa-box",
      iconBg: product.iconBg || "#2B5278"
    });
    fetchProductAccounts(product.id); // Fetch accounts when editing
    setIsEditProductOpen(true);
  };

  // Fetch product accounts
  const fetchProductAccounts = async (productId: number) => {
    try {
      const res = await apiRequest('GET', `/api/products/${productId}/accounts`);
      const data = await res.json();
      setAccounts(data);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      toast({ title: "Error fetching accounts", description: error.message || "An unexpected error occurred", variant: "destructive" });
    }
  };

  // Submit edit product form
  const handleUpdateProduct = () => {
    if (!selectedProduct) return;

    // Convert price and stock to numbers
    const formattedProduct = {
      ...newProduct,
      price: parseInt((parseFloat(newProduct.price) * 100).toString()), // Convert to cents
      stock: parseInt(newProduct.stock),
      categoryId: parseInt(newProduct.categoryId) || null,
    };

    updateProduct.mutate({ id: selectedProduct.id, data: formattedProduct });
  };

  // Handle delete product
  const handleDeleteClick = (product: any) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  // Handle add accounts
  const handleAddAccounts = async (productId: number) => {
    const accounts = accountInput.split('\n').map(item => item.trim()).filter(item => item !== "");
    try {
      const res = await apiRequest('POST', `/api/products/${productId}/accounts`, { accounts: accounts.length > 1 ? accounts : accounts[0] });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Accounts added successfully!", description: "" });
        setIsAddAccountOpen(false);
        setAccountInput("");
        fetchProductAccounts(productId); // Refresh accounts after adding
      } else {
        toast({ title: "Error adding accounts", description: data.message || "An unexpected error occurred", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error adding accounts", description: error.message || "An unexpected error occurred", variant: "destructive" });
    }
  };


  // Format price from cents to dollars
  const formatPrice = (price: number) => {
    return `$${(price / 100).toFixed(2)}`;
  };

  // Get icon class and background color
  const getIconClass = (product: any) => {
    return product.icon || "fa-box";
  };

  const getIconBgColor = (product: any) => {
    return { backgroundColor: product.iconBg || "#2B5278" };
  };

  // Get category name by ID
  const getCategoryName = (categoryId: number) => {
    if (!categories) return "Uncategorized";
    const category = categories.find((cat: any) => cat.id === categoryId);
    return category ? category.name : "Uncategorized";
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
            <div className="flex justify-between mb-4">
              <div className="h-10 bg-gray-300 rounded w-1/4"></div>
              <div className="h-10 bg-gray-300 rounded w-32"></div>
            </div>
            <div className="h-64 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Products</h1>
          <p className="mt-1 text-sm text-gray-600">Manage your digital accounts inventory</p>
        </div>
        <Button onClick={() => setIsAddProductOpen(true)}>
          <i className="fas fa-plus mr-2"></i>
          Add Product
        </Button>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
          <CardDescription>
            You have a total of {products?.length || 0} products
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products?.length > 0 ? (
                products.map((product: any) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-white" style={getIconBgColor(product)}>
                          <i className={`fab ${getIconClass(product)}`}></i>
                        </div>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.description}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getCategoryName(product.categoryId)}</TableCell>
                    <TableCell>{formatPrice(product.price)}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {product.active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditProduct(product)}>
                          <i className="fas fa-edit"></i>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => {
                          setSelectedProduct(product);
                          setIsAddAccountOpen(true);
                        }}>
                          <i className="fas fa-user-plus"></i>
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-800" onClick={() => handleDeleteClick(product)}>
                          <i className="fas fa-trash-alt"></i>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No products found. Add your first product to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Product Dialog */}
      <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Add a new digital account product to your inventory
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={newProduct.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Netflix Premium"
                  className="mt-1"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={newProduct.description}
                  onChange={handleInputChange}
                  placeholder="e.g. 1 Month Subscription"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  value={newProduct.price}
                  onChange={handleInputChange}
                  placeholder="e.g. 14.99"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="categoryId">Category</Label>
                <Select
                  value={newProduct.categoryId}
                  onValueChange={(value) => handleSelectChange("categoryId", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category: any) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  value={newProduct.stock}
                  onChange={handleInputChange}
                  placeholder="e.g. 100"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="icon">Icon</Label>
                <Select
                  value={newProduct.icon}
                  onValueChange={(value) => handleSelectChange("icon", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select icon" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fa-netflix">Netflix</SelectItem>
                    <SelectItem value="fa-spotify">Spotify</SelectItem>
                    <SelectItem value="fa-youtube">YouTube</SelectItem>
                    <SelectItem value="fa-play">Disney+</SelectItem>
                    <SelectItem value="fa-xbox">Xbox</SelectItem>
                    <SelectItem value="fa-playstation">PlayStation</SelectItem>
                    <SelectItem value="fa-amazon">Amazon</SelectItem>
                    <SelectItem value="fa-apple">Apple</SelectItem>
                    <SelectItem value="fa-google">Google</SelectItem>
                    <SelectItem value="fa-adobe">Adobe</SelectItem>
                    <SelectItem value="fa-box">Generic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="iconBg">Icon Background</Label>
                <Input
                  id="iconBg"
                  name="iconBg"
                  type="color"
                  value={newProduct.iconBg}
                  onChange={handleInputChange}
                  className="mt-1 h-10"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="active">Active</Label>
                <Switch
                  id="active"
                  checked={newProduct.active}
                  onCheckedChange={(checked) => handleSwitchChange("active", checked)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAddProductOpen(false);
                resetNewProductForm();
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateProduct}
              disabled={createProduct.isPending}
            >
              {createProduct.isPending ? 'Creating...' : 'Create Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={isEditProductOpen} onOpenChange={setIsEditProductOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product information
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="edit-name">Product Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={newProduct.name}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  value={newProduct.description}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-price">Price ($)</Label>
                <Input
                  id="edit-price"
                  name="price"
                  type="number"
                  step="0.01"
                  value={newProduct.price}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-categoryId">Category</Label>
                <Select
                  value={newProduct.categoryId}
                  onValueChange={(value) => handleSelectChange("categoryId", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category: any) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-stock">Stock</Label>
                <Input
                  id="edit-stock"
                  name="stock"
                  type="number"
                  value={newProduct.stock}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-icon">Icon</Label>
                <Select
                  value={newProduct.icon}
                  onValueChange={(value) => handleSelectChange("icon", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select icon" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fa-netflix">Netflix</SelectItem>
                    <SelectItem value="fa-spotify">Spotify</SelectItem>
                    <SelectItem value="fa-youtube">YouTube</SelectItem>
                    <SelectItem value="fa-play">Disney+</SelectItem>
                    <SelectItem value="fa-xbox">Xbox</SelectItem>
                    <SelectItem value="fa-playstation">PlayStation</SelectItem>
                    <SelectItem value="fa-amazon">Amazon</SelectItem>
                    <SelectItem value="fa-apple">Apple</SelectItem>
                    <SelectItem value="fa-google">Google</SelectItem>
                    <SelectItem value="fa-adobe">Adobe</SelectItem>
                    <SelectItem value="fa-box">Generic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-iconBg">Icon Background</Label>
                <Input
                  id="edit-iconBg"
                  name="iconBg"
                  type="color"
                  value={newProduct.iconBg}
                  onChange={handleInputChange}
                  className="mt-1 h-10"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="edit-active">Active</Label>
                <Switch
                  id="edit-active"
                  checked={newProduct.active}
                  onCheckedChange={(checked) => handleSwitchChange("active", checked)}
                />
              </div>
              <div className="grid gap-2">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="single-account">Single Account</Label>
                    <Input
                      id="single-account"
                      placeholder="email:password"
                      onChange={(e) => setAccountInput(e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => handleAddAccounts(selectedProduct?.id)}
                    >
                      Add Account
                    </Button>
                  </div>

                  <div>
                    <Label htmlFor="bulk-accounts">Bulk Accounts</Label>
                    <Textarea
                      id="bulk-accounts"
                      placeholder="email1:password1&#10;email2:password2&#10;email3:password3"
                      className="h-32"
                      onChange={(e) => setAccountInput(e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => handleAddAccounts(selectedProduct?.id)}
                    >
                      Add Bulk Accounts
                    </Button>
                  </div>

                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2">Product Accounts</h3>
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Account</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Order ID</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {accounts?.map((account) => (
                            <TableRow key={account.id}>
                              <TableCell>{account.id}</TableCell>
                              <TableCell>{account.credentials}</TableCell>
                              <TableCell>
                                {account.isDelivered ? (
                                  <span className="text-green-600">Delivered</span>
                                ) : (
                                  <span className="text-yellow-600">Pending</span>
                                )}
                              </TableCell>
                              <TableCell>{account.deliveredToOrderId || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditProductOpen(false);
                setSelectedProduct(null);
                setAccounts([]); // Clear accounts on cancel
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateProduct}
              disabled={updateProduct.isPending}
            >
              {updateProduct.isPending ? 'Updating...' : 'Update Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Account Dialog */}
      <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Accounts</DialogTitle>
            <DialogDescription>
              Add accounts that will be delivered to buyers. Enter one account per line in email:password format.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="accounts">Accounts</Label>
              <Textarea
                id="accounts"
                value={accountInput}
                onChange={(e) => setAccountInput(e.target.value)}
                placeholder="email1:password1&#10;email2:password2"
                className="h-40"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => handleAddAccounts(selectedProduct?.id)}>
              Add Accounts
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the product "{selectedProduct?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedProduct(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteProduct.mutate(selectedProduct?.id)}
              disabled={deleteProduct.isPending}
            >
              {deleteProduct.isPending ? 'Deleting...' : 'Delete Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}