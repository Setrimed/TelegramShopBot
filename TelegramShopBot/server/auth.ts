import { Express } from "express";
import { Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@shared/schema";
import createMemoryStore from "memorystore";
import { log } from "./vite";

// Extend Express Request with user property
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Extend Express Session with userId property
declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

const scryptAsync = promisify(scrypt);
const MemoryStore = createMemoryStore(session);

/**
 * Hash a password with a salt
 */
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

/**
 * Compare a password with a stored hash
 */
async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

/**
 * Configure authentication middleware and routes
 */
export function setupAuth(app: Express): void {
  // Session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "your-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }, // 1 day
      store: new MemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
      })
    })
  );

  // Auth middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Add user to request if session has userId
    if (req.session && req.session.userId) {
      storage.getUser(req.session.userId)
        .then(user => {
          if (user) {
            req.user = user;
          }
          next();
        })
        .catch(err => {
          log(`Auth middleware error: ${err.message}`, "auth");
          next();
        });
    } else {
      next();
    }
  });

  // Register route
  app.post("/api/register", async (req: Request, res: Response) => {
    try {
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "اسم المستخدم موجود بالفعل" });
      }

      // Hash password
      const hashedPassword = await hashPassword(req.body.password);

      // Create user with hashed password
      const userData = {
        ...req.body,
        password: hashedPassword
      };

      // Create user in storage
      const user = await storage.createUser(userData);

      // Set user in session
      req.session.userId = user.id;

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      log(`Register error: ${error.message}`, "auth");
      res.status(500).json({ message: error.message });
    }
  });

  // Login route
  app.post("/api/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      // Get user from storage
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "اسم المستخدم أو كلمة المرور غير صحيحة" });
      }



      // Compare passwords
      const isPasswordValid = await comparePasswords(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "اسم المستخدم أو كلمة المرور غير صحيحة" });
      }

      // Set user in session
      req.session.userId = user.id;

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      log(`Login error: ${error.message}`, "auth");
      res.status(500).json({ message: error.message });
    }
  });

  // Logout route
  app.post("/api/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        log(`Logout error: ${err.message}`, "auth");
        return res.status(500).json({ message: err.message });
      }
      res.clearCookie("connect.sid");
      res.status(200).json({ message: "تم تسجيل الخروج بنجاح" });
    });
  });

  // Get current user route
  app.get("/api/user", (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "غير مصرح" });
    }
    
    // Return user without password
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });

  // End of setupAuth function
}

// Admin middleware
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "غير مصرح" });
  }
  
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "غير مسموح" });
  }
  
  next();
}