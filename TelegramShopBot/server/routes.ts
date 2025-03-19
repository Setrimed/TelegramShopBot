import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { botService } from "./botService";
import { log } from './vite';
import session from "express-session";
import createMemoryStore from "memorystore";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup basic session for bot operation
  const MemoryStore = createMemoryStore(session);
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "bot-shop-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }, // 1 day
      store: new MemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
      })
    })
  );
  
  // Initialize the Telegram bot
  try {
    await botService.initialize();
  } catch (error) {
    log(`Failed to initialize Telegram bot: ${error}`, 'server');
  }

  // API Routes
  // ----------
  
  // Products
  app.get('/api/products', async (req, res) => {
    try {
      const products = await storage.listProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving products' });
    }
  });
  
  app.post('/api/products', async (req, res) => {
    try {
      const newProduct = await storage.createProduct(req.body);
      
      // Update statistics
      const stats = await storage.getStatistics();
      if (stats && stats.totalProducts !== null) {
        await storage.updateStatistics({
          totalProducts: stats.totalProducts + 1
        });
      }
      
      res.status(201).json(newProduct);
    } catch (error) {
      res.status(500).json({ message: 'Error creating product' });
    }
  });
  
  app.put('/api/products/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedProduct = await storage.updateProduct(id, req.body);
      
      if (!updatedProduct) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      res.json(updatedProduct);
    } catch (error) {
      res.status(500).json({ message: 'Error updating product' });
    }
  });
  
  app.delete('/api/products/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteProduct(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      // Update statistics
      const stats = await storage.getStatistics();
      if (stats && stats.totalProducts !== null) {
        await storage.updateStatistics({
          totalProducts: Math.max(0, stats.totalProducts - 1)
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting product' });
    }
  });

  // Account management routes
  app.post('/api/products/:id/accounts', async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const { accounts } = req.body;
      
      if (!Array.isArray(accounts)) {
        const account = await storage.addAccount({ productId, credentials: accounts });
        return res.status(201).json(account);
      }
      
      const newAccounts = await storage.addBulkAccounts(productId, accounts);
      res.status(201).json(newAccounts);
    } catch (error) {
      res.status(500).json({ message: 'Error adding accounts' });
    }
  });

  app.get('/api/products/:id/accounts', async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const accounts = await storage.getProductAccounts(productId);
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving accounts' });
    }
  });
  
  // Categories
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.listCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving categories' });
    }
  });
  
  app.post('/api/categories', async (req, res) => {
    try {
      const newCategory = await storage.createCategory(req.body);
      res.status(201).json(newCategory);
    } catch (error) {
      res.status(500).json({ message: 'Error creating category' });
    }
  });
  
  // Orders
  app.get('/api/orders', async (req, res) => {
    try {
      const orders = await storage.listOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving orders' });
    }
  });
  
  app.get('/api/orders/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      const orderItems = await storage.getOrderItems(id);
      
      res.json({ ...order, items: orderItems });
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving order' });
    }
  });
  
  app.put('/api/orders/:id/status', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: 'Status is required' });
      }
      
      const updatedOrder = await storage.updateOrderStatus(id, status);
      
      if (!updatedOrder) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      res.json(updatedOrder);
    } catch (error) {
      res.status(500).json({ message: 'Error updating order status' });
    }
  });
  
  // Users/Customers
  app.get('/api/customers', async (req, res) => {
    try {
      const users = await storage.listUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving customers' });
    }
  });
  
  // Bot Settings
  app.get('/api/bot/settings', async (req, res) => {
    try {
      const settings = await storage.getBotSettings();
      
      if (!settings) {
        return res.status(404).json({ message: 'Bot settings not found' });
      }
      
      // Don't expose the full token in the response
      const maskedToken = settings.token ? 
        settings.token.substring(0, 5) + '...' + settings.token.substring(settings.token.length - 5) : '';
      
      res.json({
        ...settings,
        token: maskedToken
      });
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving bot settings' });
    }
  });
  
  app.put('/api/bot/settings', async (req, res) => {
    try {
      const settings = await storage.getBotSettings();
      
      if (!settings) {
        return res.status(404).json({ message: 'Bot settings not found' });
      }
      
      const { token, status } = req.body;
      
      // Basic validation for token if provided
      if (token && token !== settings.token && !token.includes('...')) {
        // Simple validation for Telegram bot tokens (format: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ)
        const tokenPattern = /^\d+:[A-Za-z0-9_-]+$/;
        if (!tokenPattern.test(token)) {
          return res.status(400).json({ 
            message: 'Invalid token format. Telegram bot tokens should match pattern: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ' 
          });
        }
      }
      
      const tokenChanged = token && token !== settings.token;
      const statusChanged = status && status !== settings.status;
      
      // Update settings in database
      const updatedSettings = await storage.updateBotSettings(req.body);
      
      // Handle bot service changes if needed
      if (tokenChanged || statusChanged) {
        // Always stop the bot first if it's running
        if (botService.isActive()) {
          await botService.stopBot();
        }
        
        // Wait a moment to ensure the bot is fully stopped
        setTimeout(async () => {
          // Only try to initialize if status is active
          if (status === 'active') {
            try {
              await botService.initialize();
              log('Bot reinitialized after settings change', 'server');
            } catch (error) {
              log(`Failed to reinitialize bot: ${error}`, 'server');
            }
          }
        }, 1000);
      }
      
      // Don't expose the full token in the response
      const maskedToken = updatedSettings && updatedSettings.token ? 
        updatedSettings.token.substring(0, 5) + '...' + updatedSettings.token.substring(updatedSettings.token.length - 5) : '';
      
      res.json({
        ...updatedSettings,
        token: maskedToken
      });
    } catch (error) {
      res.status(500).json({ message: 'Error updating bot settings' });
    }
  });
  
  // Bot Commands
  app.get('/api/bot/commands', async (req, res) => {
    try {
      const commands = await storage.listBotCommands();
      res.json(commands);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving bot commands' });
    }
  });
  
  app.put('/api/bot/commands/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedCommand = await storage.updateBotCommand(id, req.body);
      
      if (!updatedCommand) {
        return res.status(404).json({ message: 'Command not found' });
      }
      
      res.json(updatedCommand);
    } catch (error) {
      res.status(500).json({ message: 'Error updating bot command' });
    }
  });
  
  app.post('/api/bot/commands', async (req, res) => {
    try {
      const newCommand = await storage.createBotCommand(req.body);
      res.status(201).json(newCommand);
    } catch (error) {
      res.status(500).json({ message: 'Error creating bot command' });
    }
  });
  
  // Statistics for Dashboard
  app.get('/api/statistics', async (req, res) => {
    try {
      const stats = await storage.getStatistics();
      
      if (!stats) {
        return res.status(404).json({ message: 'Statistics not found' });
      }
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving statistics' });
    }
  });
  
  // User endpoint - always return admin user for any request
  app.get('/api/user', async (req, res) => {
    try {
      // Get first admin user or create one if not found
      let adminUser = await storage.getUserByUsername('admin');
      
      if (!adminUser) {
        // For demo purposes, create a default admin user
        adminUser = await storage.createUser({
          username: 'admin',
          password: 'admin123', // This won't be exposed
          email: 'admin@example.com',
          fullName: 'Admin User',
          role: 'admin',
          isAdmin: true,
          createdAt: new Date()
        });
      }
      
      // Return admin user without sensitive fields
      const { password, ...safeUserData } = adminUser;
      res.json(safeUserData);
    } catch (error) {
      // Just return a default admin user object if there's an error
      res.json({
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        fullName: 'Admin User',
        role: 'admin',
        isAdmin: true,
        createdAt: new Date()
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
