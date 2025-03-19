import TelegramBot from 'node-telegram-bot-api';
import { storage } from './storage';
import { handleCommand } from './botCommands';
import { log } from './vite';

class BotService {
  private bot: TelegramBot | null = null;
  private isInitialized = false;

  async initialize() {
    try {
      // If bot is already initialized, stop it first
      if (this.bot) {
        await this.stopBot();
      }
      
      const settings = await storage.getBotSettings();

      if (!settings) {
        log('Bot settings not found - using demo mode', 'bot');
        return false;
      }

      // Check if token is missing or is the default example token
      if (!settings.token || 
          settings.token === '7257963725:AAH4NOx5KZK4_sLNOXLbofMBW5OfZpLWSU' ||
          settings.token.includes('...')) {
        log('Valid bot token not provided - using demo mode', 'bot');
        return false;
      }
      
      // Check if bot status is not active
      if (settings.status !== 'active') {
        log(`Bot is in ${settings.status} mode - not starting polling`, 'bot');
        return false;
      }

      try {
        // Create the bot instance with error handling options
        this.bot = new TelegramBot(settings.token, { 
          polling: {
            autoStart: true,
            params: {
              timeout: 10
            },
            interval: 2000,  // Poll every 2 seconds
            retryTimeout: 5000  // Wait 5 seconds before retrying on error
          }
        });
        log('Bot initialized with token: ' + settings.token.substring(0, 5) + '...', 'bot');
        
        // Add error handler for polling errors
        this.bot.on('polling_error', (error) => {
          log(`Polling error: ${error.code} - ${error.message}`, 'bot');
          
          // If we get too many errors, stop the bot
          if (error.code === 'ETELEGRAM' && error.message.includes('404 Not Found')) {
            log('Invalid token detected - stopping bot', 'bot');
            this.stopBot();
          }
        });
      } catch (error) {
        log('Error initializing bot: ' + error, 'bot');
        return false;
      }

      // Set up event handlers
      this.setupEventHandlers();

      this.isInitialized = true;
      log('Telegram bot initialized successfully', 'bot');
      return true;
    } catch (error) {
      log(`Error initializing bot: ${error}`, 'bot');
      return false;
    }
  }

  private setupEventHandlers() {
    if (!this.bot) return;

    // Handle incoming messages
    // Add handler for viewing credentials
    this.bot.on('callback_query', async (query) => {
      if (!query.data) return;

      if (query.data.startsWith('view_credentials_')) {
        const orderId = parseInt(query.data.split('_')[2]);
        const order = await storage.getOrder(orderId);

        if (order && order.accountCredentials && query.message) {
          await this.bot.sendMessage(query.message.chat.id, 
            `🔐 *Account Credentials for Order #${orderId}*\n\n\`\`\`\n${order.accountCredentials}\n\`\`\`\n\n⚠️ Keep these credentials safe and do not share them.`, 
            {
              parse_mode: 'Markdown'
            }
          );
        }
      }
    });

    this.bot.on('message', async (msg) => {
      try {
        const chatId = msg.chat.id.toString();
        const text = msg.text || '';
        
        // Check if it's a command (starts with /)
        if (text.startsWith('/')) {
          const commandName = text.split(' ')[0];
          await handleCommand(this.bot!, msg, commandName);
        } else {
          // Handle regular text messages
          await this.handleTextMessage(chatId, msg);
        }
      } catch (error) {
        log(`Error handling message: ${error}`, 'bot');
      }
    });

    // Handle callback queries (button clicks)
    this.bot.on('callback_query', async (query) => {
      try {
        const chatId = query.message?.chat.id.toString();
        if (!chatId || !query.data) return;

        await this.handleCallbackQuery(chatId, query);
      } catch (error) {
        log(`Error handling callback query: ${error}`, 'bot');
      }
    });
  }

  private async handleTextMessage(chatId: string, msg: TelegramBot.Message) {
    const settings = await storage.getBotSettings();
    const text = msg.text || '';
    
    // Register user if not exists
    const telegramId = msg.from?.id.toString();
    if (telegramId) {
      let user = await storage.getUserByTelegramId(telegramId);
      
      if (!user) {
        // Create new user
        const username = msg.from?.username || `user_${telegramId}`;
        await storage.createUser({
          username,
          password: '', // No password for Telegram users
          telegramId,
          telegramUsername: msg.from?.username,
          firstName: msg.from?.first_name,
          lastName: msg.from?.last_name,
          isAdmin: false
        });
        
        // Update statistics
        const stats = await storage.getStatistics();
        if (stats) {
          await storage.updateStatistics({
            totalCustomers: stats.totalCustomers + 1
          });
        }
      }
    }
    
    // Process message based on context
    if (text.toLowerCase().includes('product') || text.toLowerCase().includes('buy')) {
      // User is asking about products
      const activeProducts = await storage.listProducts(true);
      const message = "Here are our available products:";
      
      await this.sendProductList(chatId, activeProducts);
    } else {
      // Default response
      if (this.bot && settings) {
        await this.bot.sendMessage(chatId, 
          "I'm not sure what you mean. Please use one of the following commands:\n\n" +
          "/products - Browse our products\n" +
          "/cart - View your shopping cart\n" +
          "/orders - Check your order history\n" +
          "/help - Get assistance"
        );
      }
    }
  }
  
  private async handleCallbackQuery(chatId: string, query: TelegramBot.CallbackQuery) {
    if (!this.bot || !query.data) return;
    
    // Acknowledge the callback query
    await this.bot.answerCallbackQuery(query.id);
    
    const data = query.data;
    
    if (data.startsWith('product_')) {
      // Product selection
      const productId = parseInt(data.replace('product_', ''));
      const product = await storage.getProduct(productId);
      
      if (!product) {
        await this.bot.sendMessage(chatId, "Sorry, this product is no longer available.");
        return;
      }
      
      // Get or create user's cart
      const telegramId = query.from.id.toString();
      let user = await storage.getUserByTelegramId(telegramId);
      
      if (!user) {
        // This shouldn't happen but just in case
        await this.bot.sendMessage(chatId, "Error: User not found. Please start again with /start");
        return;
      }
      
      let cart = await storage.getCartByTelegramChatId(chatId);
      
      if (!cart) {
        cart = await storage.createCart({
          userId: user.id,
          telegramChatId: chatId
        });
      }
      
      // Add item to cart
      await storage.addCartItem({
        cartId: cart.id,
        productId: product.id,
        quantity: 1
      });
      
      // Send confirmation
      const formattedPrice = (product.price / 100).toFixed(2);
      await this.bot.sendMessage(chatId, 
        `✅ Added *${product.name} (${product.description})* to your cart for *$${formattedPrice}*.`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: "Continue Shopping", callback_data: "browse_products" }],
              [{ text: "View Cart", callback_data: "view_cart" }],
              [{ text: "Checkout Now", callback_data: "checkout" }]
            ]
          }
        }
      );
    }
    else if (data === 'browse_products') {
      const activeProducts = await storage.listProducts(true);
      await this.sendProductList(chatId, activeProducts);
    }
    else if (data === 'view_cart') {
      await this.sendCartDetails(chatId);
    }
    else if (data === 'checkout') {
      await this.startCheckout(chatId);
    }
    else if (data.startsWith('remove_item_')) {
      const itemId = parseInt(data.replace('remove_item_', ''));
      await storage.removeCartItem(itemId);
      await this.sendCartDetails(chatId, "Item removed from cart.");
    }
    else if (data.startsWith('payment_')) {
      const method = data.replace('payment_', '');
      await this.processPayment(chatId, method);
    }
  }
  
  private async sendProductList(chatId: string, products: any[]) {
    if (!this.bot) return;
    
    if (products.length === 0) {
      await this.bot.sendMessage(chatId, "Sorry, no products are available at the moment.");
      return;
    }
    
    await this.bot.sendMessage(chatId, "📋 *Available Products:*", {
      parse_mode: 'Markdown'
    });
    
    // Send products in chunks to avoid hitting message limits
    const chunkSize = 3;
    for (let i = 0; i < products.length; i += chunkSize) {
      const chunk = products.slice(i, i + chunkSize);
      const inlineKeyboard = chunk.map(product => {
        const formattedPrice = (product.price / 100).toFixed(2);
        return [{ text: `${product.name} - $${formattedPrice}`, callback_data: `product_${product.id}` }];
      });
      
      await this.bot.sendMessage(chatId, 
        i === 0 ? "Please select a product to add to your cart:" : "More products:",
        {
          reply_markup: {
            inline_keyboard: inlineKeyboard
          }
        }
      );
    }
  }
  
  private async sendCartDetails(chatId: string, message?: string) {
    if (!this.bot) return;
    
    const cart = await storage.getCartByTelegramChatId(chatId);
    
    if (!cart) {
      await this.bot.sendMessage(chatId, "Your cart is empty. Use /products to browse our catalog.");
      return;
    }
    
    const cartItems = await storage.getCartItems(cart.id);
    
    if (cartItems.length === 0) {
      await this.bot.sendMessage(chatId, "Your cart is empty. Use /products to browse our catalog.");
      return;
    }
    
    let totalAmount = 0;
    let cartDetails = "🛒 *Your Shopping Cart:*\n\n";
    
    for (const item of cartItems) {
      const product = await storage.getProduct(item.productId);
      if (!product) continue;
      
      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;
      
      cartDetails += `• ${product.name} (${product.description})\n`;
      cartDetails += `  Quantity: ${item.quantity}\n`;
      cartDetails += `  Price: $${(product.price / 100).toFixed(2)}\n`;
      cartDetails += `  Subtotal: $${(itemTotal / 100).toFixed(2)}\n\n`;
    }
    
    cartDetails += `*Total: $${(totalAmount / 100).toFixed(2)}*`;
    
    const inlineKeyboard = [
      [{ text: "Continue Shopping", callback_data: "browse_products" }],
      [{ text: "Checkout", callback_data: "checkout" }]
    ];
    
    // Add remove buttons
    for (const item of cartItems) {
      const product = await storage.getProduct(item.productId);
      if (!product) continue;
      
      inlineKeyboard.push([
        { text: `Remove ${product.name}`, callback_data: `remove_item_${item.id}` }
      ]);
    }
    
    await this.bot.sendMessage(chatId, message ? message + "\n\n" + cartDetails : cartDetails, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: inlineKeyboard
      }
    });
  }
  
  private async startCheckout(chatId: string) {
    if (!this.bot) return;
    
    const cart = await storage.getCartByTelegramChatId(chatId);
    
    if (!cart) {
      await this.bot.sendMessage(chatId, "Your cart is empty. Use /products to browse our catalog.");
      return;
    }
    
    const cartItems = await storage.getCartItems(cart.id);
    
    if (cartItems.length === 0) {
      await this.bot.sendMessage(chatId, "Your cart is empty. Use /products to browse our catalog.");
      return;
    }
    
    let totalAmount = 0;
    for (const item of cartItems) {
      const product = await storage.getProduct(item.productId);
      if (!product) continue;
      totalAmount += product.price * item.quantity;
    }
    
    const settings = await storage.getBotSettings();
    if (!settings) return;
    
    // Show payment options
    await this.bot.sendMessage(chatId, 
      `🛍️ *Checkout*\n\nTotal amount: *$${(totalAmount / 100).toFixed(2)}*\n\nPlease select a payment method:`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: settings.paymentMethods.map((method: string) => [
            { text: method, callback_data: `payment_${method.replace(/\s+/g, '_').toLowerCase()}` }
          ])
        }
      }
    );
  }
  
  private async processPayment(chatId: string, method: string) {
    if (!this.bot) return;
    
    // In a real application, you would integrate with actual payment processors here
    // For this example, we'll simulate a successful payment
    
    const cart = await storage.getCartByTelegramChatId(chatId);
    if (!cart) return;
    
    const telegramId = chatId;
    const user = await storage.getUserByTelegramId(telegramId);
    if (!user) return;
    
    const cartItems = await storage.getCartItems(cart.id);
    if (cartItems.length === 0) return;
    
    // Calculate total
    let totalAmount = 0;
    for (const item of cartItems) {
      const product = await storage.getProduct(item.productId);
      if (!product) continue;
      totalAmount += product.price * item.quantity;
    }
    
    // Get available account for the product
    const cartItem = cartItems[0]; // We only support single item orders for now
    const account = await storage.getAvailableAccount(cartItem.productId);
    
    if (!account) {
      await this.bot.sendMessage(chatId, "❌ Sorry, no accounts are available at the moment. Please try again later.");
      return;
    }

    // Create order
    const order = await storage.createOrder({
      userId: user.id,
      totalAmount,
      status: 'completed',
      telegramChatId: chatId,
      paymentMethod: method.replace(/_/g, ' '),
      accountCredentials: account.credentials
    });

    if (!order) {
      await this.bot.sendMessage(chatId, "❌ Error processing your order. Please try again later.");
      return;
    }

    // Mark account as delivered with order reference
    await storage.markAccountDelivered(account.id, user.id, order.id);
    
    // Add order items
    for (const item of cartItems) {
      const product = await storage.getProduct(item.productId);
      if (!product) continue;
      
      await storage.createOrderItem({
        orderId: order.id,
        productId: product.id,
        quantity: item.quantity,
        price: product.price
      });
      
      // Update product stock
      if (product.stock >= item.quantity) {
        await storage.updateProduct(product.id, {
          stock: product.stock - item.quantity
        });
      }
    }
    
    // Clear cart
    await storage.deleteCart(cart.id);
    
    if (!order) {
      await this.bot.sendMessage(chatId, "❌ Error processing your order. Please try again later.");
      return;
    }

    // Send confirmation
    await this.bot.sendMessage(chatId, 
      `✅ *Order Confirmed!*\n\nOrder ID: #ORD-${order.id}\nTotal: $${(totalAmount / 100).toFixed(2)}\nPayment Method: ${method.replace(/_/g, ' ')}\n\nYour account credentials:\n\`\`\`\n${order.accountCredentials}\n\`\`\`\n\nThank you for your purchase!`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: "View My Orders", callback_data: "view_orders" }],
            [{ text: "Browse More Products", callback_data: "browse_products" }]
          ]
        }
      }
    );
  }
  
  private generateFakeCredentials(): string {
    // Generate random fake credentials for demonstration
    const username = `user_${Math.random().toString(36).substring(2, 10)}`;
    const password = Math.random().toString(36).substring(2, 12);
    
    return `Username: ${username}\nPassword: ${password}\nExpires: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}`;
  }
  
  public getBotInstance(): TelegramBot | null {
    return this.bot;
  }
  
  public isActive(): boolean {
    return this.isInitialized && this.bot !== null;
  }
  
  public async stopBot() {
    if (this.bot) {
      this.bot.stopPolling();
      this.bot = null;
      this.isInitialized = false;
      log('Telegram bot stopped', 'bot');
    }
  }
}

// Singleton instance
export const botService = new BotService();
