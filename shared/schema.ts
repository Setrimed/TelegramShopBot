import { pgTable, text, serial, integer, boolean, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false),
  role: text("role").default("user"), // user, admin, superadmin
  isActive: boolean("is_active").default(true),
  email: text("email"),
  // For Telegram users
  telegramId: text("telegram_id").unique(),
  telegramUsername: text("telegram_username"),
  firstName: text("first_name"),
  lastName: text("last_name"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  isAdmin: true,
  role: true,
  isActive: true,
  email: true,
  telegramId: true,
  telegramUsername: true,
  firstName: true,
  lastName: true,
});

// Product schema
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // Price in cents
  categoryId: integer("category_id"),
  stock: integer("stock").default(0),
  active: boolean("active").default(true),
  icon: text("icon").default("fa-box"), // Font Awesome icon class
  iconBg: text("icon_bg").default("#2B5278"), // Icon background color
});

export const insertProductSchema = createInsertSchema(products).pick({
  name: true,
  description: true,
  price: true,
  categoryId: true,
  stock: true,
  active: true,
  icon: true,
  iconBg: true,
});

// Category schema
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
});

// Order schema
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  status: text("status").notNull().default("pending"), // pending, completed, cancelled, failed
  totalAmount: integer("total_amount").notNull(), // Total in cents
  createdAt: timestamp("created_at").defaultNow(),
  telegramChatId: text("telegram_chat_id"),
  paymentMethod: text("payment_method"),
  accountCredentials: text("account_credentials"), // Store account credentials for delivery
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  userId: true,
  status: true,
  totalAmount: true,
  telegramChatId: true,
  paymentMethod: true,
  accountCredentials: true,
});

// Order Item schema
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  price: integer("price").notNull(), // Price per item in cents
});

export const insertOrderItemSchema = createInsertSchema(orderItems).pick({
  orderId: true,
  productId: true,
  quantity: true,
  price: true,
});

// Cart schema (for tracking cart items during shopping)
export const carts = pgTable("carts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  telegramChatId: text("telegram_chat_id").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCartSchema = createInsertSchema(carts).pick({
  userId: true,
  telegramChatId: true,
});

// Cart Item schema
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  cartId: integer("cart_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
});

export const insertCartItemSchema = createInsertSchema(cartItems).pick({
  cartId: true,
  productId: true,
  quantity: true,
});

// Bot Settings schema
export const botSettings = pgTable("bot_settings", {
  id: serial("id").primaryKey(),
  token: text("token").notNull(),
  status: text("status").notNull().default("active"), // active, maintenance, inactive
  welcomeMessage: text("welcome_message").notNull(),
  paymentMethods: json("payment_methods").notNull(), // JSON array of payment methods
});

export const insertBotSettingsSchema = createInsertSchema(botSettings).pick({
  token: true,
  status: true,
  welcomeMessage: true,
  paymentMethods: true,
});

// Bot Command schema
export const botCommands = pgTable("bot_commands", {
  id: serial("id").primaryKey(),
  command: text("command").notNull().unique(),
  description: text("description").notNull(),
  active: boolean("active").default(true),
  responseMessage: text("response_message"),
});

export const insertBotCommandSchema = createInsertSchema(botCommands).pick({
  command: true,
  description: true,
  active: true,
  responseMessage: true,
});



// Statistics schema (for dashboard data)
export const statistics = pgTable("statistics", {
  id: serial("id").primaryKey(),
  totalOrders: integer("total_orders").default(0),
  totalCustomers: integer("total_customers").default(0),
  totalRevenue: integer("total_revenue").default(0), // In cents
  totalProducts: integer("total_products").default(0),
});

export const insertStatisticsSchema = createInsertSchema(statistics).pick({
  totalOrders: true,
  totalCustomers: true,
  totalRevenue: true,
  totalProducts: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type Cart = typeof carts.$inferSelect;
export type InsertCart = z.infer<typeof insertCartSchema>;

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

export type BotSettings = typeof botSettings.$inferSelect;
export type InsertBotSettings = z.infer<typeof insertBotSettingsSchema>;

export type BotCommand = typeof botCommands.$inferSelect;
export type InsertBotCommand = z.infer<typeof insertBotCommandSchema>;



// Account schema
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  credentials: text("credentials").notNull(),
  isDelivered: boolean("is_delivered").default(false),
  deliveredAt: timestamp("delivered_at"),
  deliveredToUserId: integer("delivered_to_user_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAccountSchema = createInsertSchema(accounts).pick({
  productId: true,
  credentials: true,
});

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;

export type Statistics = typeof statistics.$inferSelect;
export type InsertStatistics = z.infer<typeof insertStatisticsSchema>;
