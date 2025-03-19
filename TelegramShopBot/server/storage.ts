import {
  type User, type InsertUser, 
  type Product, type InsertProduct,
  type Category, type InsertCategory,
  type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem,
  type Cart, type InsertCart,
  type CartItem, type InsertCartItem,
  type BotSettings, type InsertBotSettings,
  type BotCommand, type InsertBotCommand,
  type Statistics, type InsertStatistics
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByTelegramId(telegramId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  listUsers(): Promise<User[]>;
  
  // Product operations
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  listProducts(onlyActive?: boolean): Promise<Product[]>;
  
  // Category operations
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  listCategories(): Promise<Category[]>;
  
  // Order operations
  getOrder(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  listOrders(): Promise<Order[]>;
  listUserOrders(userId: number): Promise<Order[]>;
  
  // Order Item operations
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  
  // Cart operations
  getCartByUserId(userId: number): Promise<Cart | undefined>;
  getCartByTelegramChatId(telegramChatId: string): Promise<Cart | undefined>;
  createCart(cart: InsertCart): Promise<Cart>;
  deleteCart(id: number): Promise<boolean>;
  
  // Cart Item operations
  getCartItems(cartId: number): Promise<CartItem[]>;
  addCartItem(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItemQuantity(id: number, quantity: number): Promise<CartItem | undefined>;
  removeCartItem(id: number): Promise<boolean>;
  
  // Bot Settings operations
  getBotSettings(): Promise<BotSettings | undefined>;
  updateBotSettings(settings: Partial<InsertBotSettings>): Promise<BotSettings | undefined>;
  
  // Bot Command operations
  getBotCommand(command: string): Promise<BotCommand | undefined>;
  createBotCommand(command: InsertBotCommand): Promise<BotCommand>;
  updateBotCommand(id: number, command: Partial<InsertBotCommand>): Promise<BotCommand | undefined>;
  listBotCommands(onlyActive?: boolean): Promise<BotCommand[]>;
  
  // Statistics operations
  getStatistics(): Promise<Statistics | undefined>;
  updateStatistics(stats: Partial<InsertStatistics>): Promise<Statistics | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private categories: Map<number, Category>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  private carts: Map<number, Cart>;
  private cartItems: Map<number, CartItem>;
  private botSettings: BotSettings | undefined;
  private botCommands: Map<number, BotCommand>;
  private statistics: Statistics | undefined;
  
  private userId: number = 1;
  private productId: number = 1;
  private categoryId: number = 1;
  private orderId: number = 1;
  private orderItemId: number = 1;
  private cartId: number = 1;
  private cartItemId: number = 1;
  private botCommandId: number = 1;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.categories = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.carts = new Map();
    this.cartItems = new Map();
    this.botCommands = new Map();
    this.accounts = new Map();

    // Initialize Gmail accounts
    const gmailAccounts = [
      "rluce@live.com:Loveme318",
      "gheju@t-online.de:oAMHKtgaNJkls5!",
      "hakle52@t-online.de:thome6274",
      "peterlady@hotmail.com:Oliveros",
      "frank.kalkowski@t-online.de:frgeka68",
      "et-kropf@t-online.de:wp01101988",
      "alwaysurs26@rediffmail.com:maytas",
      "cristty611@hotmail.com:Perfume05",
      "pivano02@hotmail.com:liebre73",
      "b.vanderw@hotmail.com:bvdw1148",
      "m.a.barnes@outlook.com:Michele123",
      "m.carr@suddenlink.net:Boomer68",
      "kacper@studiokamado.pl:DivineJaworek1.",
      "michele1953@t-online.de:michele1953",
      "aylin_18@live.com.mx:Jejuzyry18",
      "schreibwaren.koblitz@t-online.de:uran3192",
      "dunwoodymom@outlook.com:Mj89919221",
      "chappellsportscards@hotmail.com:Kingcat0421",
      "pud62@msn.com:Britbrit09$",
      "borsch_t@t-online.de:Vova0908aass",
      "falgime@hotmail.com:Mfaly282.",
      "sstefanjankow-ski29@mv-hallstadt.de:musikverein",
      "jswiedmann@t-online.de:iAzeJkaeaH"
    ];

    let accountId = 1;
    for (const account of gmailAccounts) {
      this.accounts.set(accountId++, {
        id: accountId,
        productId: 1,
        credentials: account,
        isDelivered: false,
        deliveredAt: null,
        deliveredToUserId: null,
        deliveredToOrderId: null,
        createdAt: new Date()
      });
    }
    
    // Initialize with default bot settings
    this.botSettings = {
      id: 1,
      token: process.env.TELEGRAM_BOT_TOKEN || "",
      status: "active",
      welcomeMessage: "Welcome to our Digital Shop! Browse our catalog of premium accounts by using the /products command.",
      paymentMethods: ["Crypto", "Bank Transfer"],
    };
    
    // Initialize statistics
    this.statistics = {
      id: 1,
      totalOrders: 245,
      totalCustomers: 156,
      totalRevenue: 324600, // $3,246.00
      totalProducts: 42,
    };
    
    // Add default bot commands
    this.initializeDefaultCommands();
    
    // Add default products
    this.initializeDefaultProducts();
  }
  
  private initializeDefaultCommands() {
    const defaultCommands = [
      {
        id: this.botCommandId++,
        command: "/start",
        description: "Welcome message with bot instructions",
        active: true,
        responseMessage: "Welcome to our Digital Shop Bot! 👋 I can help you purchase premium digital accounts. Use these commands:\n\n/products - Browse available products\n/cart - View your shopping cart\n/orders - Check your order history\n/help - Get assistance",
      },
      {
        id: this.botCommandId++,
        command: "/products",
        description: "Browse available digital accounts",
        active: true,
        responseMessage: "Here are our available products:",
      },
      {
        id: this.botCommandId++,
        command: "/cart",
        description: "View current shopping cart",
        active: true,
        responseMessage: "Your shopping cart:",
      },
      {
        id: this.botCommandId++,
        command: "/checkout",
        description: "Complete purchase process",
        active: true,
        responseMessage: "Let's complete your purchase:",
      },
      {
        id: this.botCommandId++,
        command: "/orders",
        description: "Check order history and status",
        active: true,
        responseMessage: "Your order history:",
      },
      {
        id: this.botCommandId++,
        command: "/help",
        description: "Get customer assistance",
        active: true,
        responseMessage: "How can I help you today? Here are the available commands:\n\n/products - Browse available products\n/cart - View your shopping cart\n/orders - Check your order history",
      },
      {
        id: this.botCommandId++,
        command: "/feedback",
        description: "Submit customer feedback",
        active: false,
        responseMessage: "Please share your feedback with us:",
      },
    ];
    
    for (const command of defaultCommands) {
      this.botCommands.set(command.id, command);
    }
  }
  
  private initializeDefaultProducts() {
    // Add default categories
    const streamingCategory = {
      id: this.categoryId++,
      name: "Streaming Services",
    };
    this.categories.set(streamingCategory.id, streamingCategory);
    
    const gamingCategory = {
      id: this.categoryId++,
      name: "Gaming",
    };
    this.categories.set(gamingCategory.id, gamingCategory);
    
    const productionCategory = {
      id: this.categoryId++,
      name: "Production Software",
    };
    this.categories.set(productionCategory.id, productionCategory);
    
    // Add default products
    const defaultProducts = [
      {
        id: this.productId++,
        name: "Gmail Account",
        description: "1 Month Old Account",
        price: 200, // $2.00
        categoryId: streamingCategory.id,
        stock: 22, // Number of accounts provided
        active: true,
        icon: "fa-envelope",
        iconBg: "#EA4335",
      },
      {
        id: this.productId++,
        name: "YouTube Premium",
        description: "1 Month Subscription",
        price: 1199, // $11.99
        categoryId: streamingCategory.id,
        stock: 75,
        active: true,
        icon: "fa-youtube",
        iconBg: "#FF0000",
      },
      {
        id: this.productId++,
        name: "Disney+ Premium",
        description: "1 Month Subscription",
        price: 799, // $7.99
        categoryId: streamingCategory.id,
        stock: 80,
        active: true,
        icon: "fa-play",
        iconBg: "#0063e5",
      },
      {
        id: this.productId++,
        name: "Xbox Game Pass",
        description: "1 Month Subscription",
        price: 1499, // $14.99
        categoryId: gamingCategory.id,
        stock: 30,
        active: true,
        icon: "fa-xbox",
        iconBg: "#107C10",
      },
      {
        id: this.productId++,
        name: "PlayStation Plus",
        description: "1 Month Subscription",
        price: 999, // $9.99
        categoryId: gamingCategory.id,
        stock: 40,
        active: true,
        icon: "fa-playstation",
        iconBg: "#006FCD",
      },
      {
        id: this.productId++,
        name: "Adobe Creative Cloud",
        description: "1 Month Subscription",
        price: 5299, // $52.99
        categoryId: productionCategory.id,
        stock: 20,
        active: true,
        icon: "fa-adobe",
        iconBg: "#FF0000",
      },
    ];
    
    for (const product of defaultProducts) {
      this.products.set(product.id, product);
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.telegramId === telegramId,
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userId++;
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }
  
  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser = { ...existingUser, ...user };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  // Product operations
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }
  
  async createProduct(product: InsertProduct): Promise<Product> {
    const id = this.productId++;
    const newProduct: Product = { ...product, id };
    this.products.set(id, newProduct);
    return newProduct;
  }
  
  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const existingProduct = this.products.get(id);
    if (!existingProduct) return undefined;
    
    const updatedProduct = { ...existingProduct, ...product };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  // Account operations
  private accounts = new Map<number, Account>();
  private accountId = 1;

  async addAccount(account: InsertAccount): Promise<Account> {
    const id = this.accountId++;
    const newAccount: Account = { 
      ...account, 
      id,
      isDelivered: false,
      deliveredAt: null,
      deliveredToUserId: null,
      createdAt: new Date()
    };
    this.accounts.set(id, newAccount);
    return newAccount;
  }

  async addBulkAccounts(productId: number, credentials: string[]): Promise<Account[]> {
    return Promise.all(
      credentials.map(cred => this.addAccount({ productId, credentials: cred }))
    );
  }

  async getAvailableAccount(productId: number): Promise<Account | undefined> {
    return Array.from(this.accounts.values()).find(
      acc => acc.productId === productId && !acc.isDelivered
    );
  }

  async markAccountDelivered(accountId: number, userId: number, orderId?: number): Promise<Account | undefined> {
    const account = this.accounts.get(accountId);
    if (!account) return undefined;
    
    const updatedAccount = {
      ...account,
      isDelivered: true,
      deliveredAt: new Date(),
      deliveredToUserId: userId,
      deliveredToOrderId: orderId
    };
    this.accounts.set(accountId, updatedAccount);
    return updatedAccount;
  }

  async getProductAccounts(productId: number): Promise<Account[]> {
    return Array.from(this.accounts.values())
      .filter(acc => acc.productId === productId);
  }
  
  async listProducts(onlyActive: boolean = false): Promise<Product[]> {
    const products = Array.from(this.products.values());
    if (onlyActive) {
      return products.filter(p => p.active);
    }
    return products;
  }
  
  // Category operations
  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }
  
  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.categoryId++;
    const newCategory: Category = { ...category, id };
    this.categories.set(id, newCategory);
    return newCategory;
  }
  
  async listCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }
  
  // Order operations
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }
  
  async createOrder(order: InsertOrder): Promise<Order> {
    const id = this.orderId++;
    const createdAt = new Date();
    const newOrder: Order = { ...order, id, createdAt };
    this.orders.set(id, newOrder);
    
    // Update statistics
    if (this.statistics) {
      this.statistics.totalOrders += 1;
      this.statistics.totalRevenue += order.totalAmount;
    }
    
    return newOrder;
  }
  
  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const existingOrder = this.orders.get(id);
    if (!existingOrder) return undefined;
    
    const updatedOrder = { ...existingOrder, status };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }
  
  async listOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }
  
  async listUserOrders(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(order => order.userId === userId);
  }
  
  // Order Item operations
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values())
      .filter(item => item.orderId === orderId);
  }
  
  async createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    const id = this.orderItemId++;
    const newOrderItem: OrderItem = { ...orderItem, id };
    this.orderItems.set(id, newOrderItem);
    return newOrderItem;
  }
  
  // Cart operations
  async getCartByUserId(userId: number): Promise<Cart | undefined> {
    return Array.from(this.carts.values())
      .find(cart => cart.userId === userId);
  }
  
  async getCartByTelegramChatId(telegramChatId: string): Promise<Cart | undefined> {
    return Array.from(this.carts.values())
      .find(cart => cart.telegramChatId === telegramChatId);
  }
  
  async createCart(cart: InsertCart): Promise<Cart> {
    const id = this.cartId++;
    const createdAt = new Date();
    const newCart: Cart = { ...cart, id, createdAt };
    this.carts.set(id, newCart);
    return newCart;
  }
  
  async deleteCart(id: number): Promise<boolean> {
    // Delete cart items first
    const cartItems = await this.getCartItems(id);
    for (const item of cartItems) {
      await this.removeCartItem(item.id);
    }
    return this.carts.delete(id);
  }
  
  // Cart Item operations
  async getCartItems(cartId: number): Promise<CartItem[]> {
    return Array.from(this.cartItems.values())
      .filter(item => item.cartId === cartId);
  }
  
  async addCartItem(cartItem: InsertCartItem): Promise<CartItem> {
    // Check if this product is already in the cart
    const existingItems = Array.from(this.cartItems.values())
      .filter(item => item.cartId === cartItem.cartId && item.productId === cartItem.productId);
    
    if (existingItems.length > 0) {
      // Update the quantity instead of adding a new item
      const existingItem = existingItems[0];
      return this.updateCartItemQuantity(existingItem.id, existingItem.quantity + cartItem.quantity) as Promise<CartItem>;
    }
    
    const id = this.cartItemId++;
    const newCartItem: CartItem = { ...cartItem, id };
    this.cartItems.set(id, newCartItem);
    return newCartItem;
  }
  
  async updateCartItemQuantity(id: number, quantity: number): Promise<CartItem | undefined> {
    const existingItem = this.cartItems.get(id);
    if (!existingItem) return undefined;
    
    const updatedItem = { ...existingItem, quantity };
    this.cartItems.set(id, updatedItem);
    return updatedItem;
  }
  
  async removeCartItem(id: number): Promise<boolean> {
    return this.cartItems.delete(id);
  }
  
  // Bot Settings operations
  async getBotSettings(): Promise<BotSettings | undefined> {
    return this.botSettings;
  }
  
  async updateBotSettings(settings: Partial<InsertBotSettings>): Promise<BotSettings | undefined> {
    if (!this.botSettings) return undefined;
    
    this.botSettings = { ...this.botSettings, ...settings };
    return this.botSettings;
  }
  
  // Bot Command operations
  async getBotCommand(command: string): Promise<BotCommand | undefined> {
    return Array.from(this.botCommands.values())
      .find(cmd => cmd.command === command);
  }
  
  async createBotCommand(command: InsertBotCommand): Promise<BotCommand> {
    const id = this.botCommandId++;
    const newCommand: BotCommand = { ...command, id };
    this.botCommands.set(id, newCommand);
    return newCommand;
  }
  
  async updateBotCommand(id: number, command: Partial<InsertBotCommand>): Promise<BotCommand | undefined> {
    const existingCommand = this.botCommands.get(id);
    if (!existingCommand) return undefined;
    
    const updatedCommand = { ...existingCommand, ...command };
    this.botCommands.set(id, updatedCommand);
    return updatedCommand;
  }
  
  async listBotCommands(onlyActive: boolean = false): Promise<BotCommand[]> {
    const commands = Array.from(this.botCommands.values());
    if (onlyActive) {
      return commands.filter(cmd => cmd.active);
    }
    return commands;
  }
  
  // Statistics operations
  async getStatistics(): Promise<Statistics | undefined> {
    return this.statistics;
  }
  
  async updateStatistics(stats: Partial<InsertStatistics>): Promise<Statistics | undefined> {
    if (!this.statistics) return undefined;
    
    this.statistics = { ...this.statistics, ...stats };
    return this.statistics;
  }
}

export const storage = new MemStorage();
