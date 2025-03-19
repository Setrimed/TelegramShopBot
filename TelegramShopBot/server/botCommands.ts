import TelegramBot from 'node-telegram-bot-api';
import { storage } from './storage';

export async function handleCommand(bot: TelegramBot, msg: TelegramBot.Message, commandName: string) {
  const chatId = msg.chat.id.toString();

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

  // Get command from database
  const command = await storage.getBotCommand(commandName);

  if (command && command.active) {
    // Execute command based on type
    switch (commandName) {
      case '/start':
        await handleStartCommand(bot, chatId);
        break;
      case '/products':
        await handleProductsCommand(bot, chatId);
        break;
      case '/cart':
        await handleCartCommand(bot, chatId);
        break;
      case '/checkout':
        await handleCheckoutCommand(bot, chatId);
        break;
      case '/orders':
        await handleOrdersCommand(bot, chatId, telegramId || '');
        break;
      case '/help':
        await handleHelpCommand(bot, chatId);
        break;
      case '/feedback':
        await handleFeedbackCommand(bot, chatId);
        break;
      default:
        // Send the default response message if available
        if (command.responseMessage) {
          await bot.sendMessage(chatId, command.responseMessage);
        } else {
          await bot.sendMessage(chatId, "Command not implemented yet.");
        }
    }
  } else {
    // Command not found or inactive
    await bot.sendMessage(chatId, "Sorry, this command is not available.");
  }
}

async function handleStartCommand(bot: TelegramBot, chatId: string) {
  const command = await storage.getBotCommand('/start');
  const settings = await storage.getBotSettings();

  const welcomeMessage = settings?.welcomeMessage || 
    "Welcome to our Digital Shop Bot! 👋 I can help you purchase premium digital accounts.";

  await bot.sendMessage(chatId, welcomeMessage, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: "🛍️ Browse Products", callback_data: "browse_products" }],
        [{ text: "🛒 View Cart", callback_data: "view_cart" }],
        [{ text: "📦 My Orders", callback_data: "view_orders" }],
        [{ text: "❓ Help", callback_data: "help" }],
        [{ text: "📝 Feedback", callback_data: "feedback" }]
      ]
    }
  });
}

async function deliverAccount(bot: TelegramBot, userId: number, productId: number): Promise<boolean> {
  const account = await storage.getAvailableAccount(productId);
  if (!account) {
    await bot.sendMessage(userId, "❌ Sorry, no accounts are available at the moment. Please try again later or contact support.");
    return false;
  }

  try {
    // Try to mark the account as delivered
    await storage.markAccountDelivered(account.id, userId);

    // Send credentials with retry mechanism
    let deliveryAttempts = 0;
    const maxAttempts = 3;

    while (deliveryAttempts < maxAttempts) {
      try {
        const message = await bot.sendMessage(userId, 
          `✅ *Order Confirmation*\n\n` +
          `Order ID: #${order.id}\n` +
          `Account: \`${account.credentials}\`\n\n` +
          `⚠️ Please save these credentials securely.`, 
          {
            parse_mode: 'Markdown'
          }
        );

        if (message) {
          // Successfully delivered
          return true;
        }

        deliveryAttempts++;
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between retries
      } catch (sendError) {
        deliveryAttempts++;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // If we get here, all delivery attempts failed
    const updatedAccount = {
      ...account,
      isDelivered: false,
      deliveredAt: null,
      deliveredToUserId: null
    };
    await storage.accounts.set(account.id, updatedAccount);

    await bot.sendMessage(userId, "❌ Failed to deliver account credentials. Please contact support or try again.");
    return false;
  } catch (error) {
    // Revert account delivery status on error
    const updatedAccount = {
      ...account,
      isDelivered: false,
      deliveredAt: null,
      deliveredToUserId: null
    };
    await storage.accounts.set(account.id, updatedAccount);

    await bot.sendMessage(userId, "❌ An error occurred while delivering your account. Please try again or contact support.");
    return false;
  }
}

async function handleProductsCommand(bot: TelegramBot, chatId: string) {
  const products = await storage.listProducts(true);

  if (products.length === 0) {
    await bot.sendMessage(chatId, "Sorry, no products are available at the moment.");
    return;
  }

  await bot.sendMessage(chatId, "📋 *Available Products:*", {
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

    await bot.sendMessage(chatId, 
      i === 0 ? "Please select a product to add to your cart:" : "More products:",
      {
        reply_markup: {
          inline_keyboard: inlineKeyboard
        }
      }
    );
  }
}

async function handleCartCommand(bot: TelegramBot, chatId: string) {
  const cart = await storage.getCartByTelegramChatId(chatId);

  if (!cart) {
    await bot.sendMessage(chatId, "Your cart is empty. Use /products to browse our catalog.");
    return;
  }

  const cartItems = await storage.getCartItems(cart.id);

  if (cartItems.length === 0) {
    await bot.sendMessage(chatId, "Your cart is empty. Use /products to browse our catalog.");
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

  await bot.sendMessage(chatId, cartDetails, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: inlineKeyboard
    }
  });
}

async function handleCheckoutCommand(bot: TelegramBot, chatId: string) {
  const cart = await storage.getCartByTelegramChatId(chatId);

  if (!cart) {
    await bot.sendMessage(chatId, "Your cart is empty. Use /products to browse our catalog.");
    return;
  }

  const cartItems = await storage.getCartItems(cart.id);

  if (cartItems.length === 0) {
    await bot.sendMessage(chatId, "Your cart is empty. Use /products to browse our catalog.");
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
  await bot.sendMessage(chatId, 
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

async function handleOrdersCommand(bot: TelegramBot, chatId: string, telegramId: string) {
  const user = await storage.getUserByTelegramId(telegramId);

  if (!user) {
    await bot.sendMessage(chatId, "You need to start shopping first. Use /products to browse our catalog.");
    return;
  }

  const orders = await storage.listUserOrders(user.id);

  if (orders.length === 0) {
    await bot.sendMessage(chatId, "You don't have any orders yet. Use /products to browse our catalog.");
    return;
  }

  let ordersList = "📜 *Your Order History:*\n\n";

  for (const order of orders) {
    const formattedDate = new Date(order.createdAt).toLocaleDateString();
    const formattedTime = new Date(order.createdAt).toLocaleTimeString();
    const account = await storage.getAccountByOrderId(order.id);

    ordersList += `• Order #${order.id}\n`;
    ordersList += `  Account ID: #ACC-${account?.id || 'N/A'}\n`;
    ordersList += `  Date: ${formattedDate} ${formattedTime}\n`;
    ordersList += `  Total: $${(order.totalAmount / 100).toFixed(2)}\n`;
    ordersList += `  Status: ${order.status.toUpperCase()}\n\n`;

    // Add button to view credentials for each completed order
    const inlineKeyboard = [];
    if (order.status === 'completed') {
      inlineKeyboard.push([{ text: `🔑 View Credentials for Order #${order.id}`, callback_data: `view_credentials_${order.id}` }]);
    }
    inlineKeyboard.push([{ text: "🛍️ Browse More Products", callback_data: "browse_products" }]);

    await bot.sendMessage(chatId, ordersList, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: inlineKeyboard
      }
    });
  }
}

// Handler for viewing credentials will be set up in botService.ts where we have access to the bot instance

async function handleHelpCommand(bot: TelegramBot, chatId: string) {
  const helpMessage = 
    "🤖 *Need help?* Here's how to use our shop:\n\n" +
    "• /products - Browse our catalog of premium accounts\n" +
    "• /cart - View your shopping cart\n" +
    "• /checkout - Complete your purchase\n" +
    "• /orders - View your order history\n\n" +
    "If you need assistance, please contact our support team.";

  await bot.sendMessage(chatId, helpMessage, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: "Browse Products", callback_data: "browse_products" }],
        [{ text: "View Cart", callback_data: "view_cart" }]
      ]
    }
  });
}

async function handleFeedbackCommand(bot: TelegramBot, chatId: string) {
  await bot.sendMessage(chatId, 
    "We value your feedback! Please share your thoughts about our bot and service:",
    {
      reply_markup: {
        force_reply: true
      }
    }
  );
}