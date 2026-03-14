import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { validate } from '../middleware/validate.middleware';
import { loginSchema, pinLoginSchema, refreshTokenSchema, createUserSchema } from '../schemas/auth.schema';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { UserRole } from '../../src/generated/prisma';

const router = Router();

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production environment');
  }
  if (!secret) {
    console.warn('WARNING: Using default JWT secret. Set JWT_SECRET in .env for security.');
    return 'dev-secret-change-in-production';
  }
  return secret;
};

const JWT_SECRET = getJwtSecret();

// POST /api/v1/auth/login - Email/password login
router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { location: true },
    });

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { lastActive: new Date(), isOnline: true },
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          locationId: user.locationId,
          domain: user.location,
        },
        token,
        refreshToken: token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/v1/auth/pin-login - PIN login
router.post('/pin-login', validate(pinLoginSchema), async (req: Request, res: Response) => {
  try {
    const { userId, pin } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { location: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const validPin = await bcrypt.compare(pin, user.password);
    if (!validPin) {
      return res.status(401).json({ success: false, error: 'Invalid PIN' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { lastActive: new Date(), isOnline: true },
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          locationId: user.locationId,
          domain: user.location,
        },
        token,
      },
    });
  } catch (error) {
    console.error('PIN login error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/v1/auth/logout
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        await prisma.user.update({
          where: { id: decoded.userId },
          data: { isOnline: false },
        });
      } catch {
        // Token invalid, that's ok for logout
      }
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/v1/auth/pin-users - List users for PIN login screen (public, minimal info)
router.get('/pin-users', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        role: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ success: true, data: users });
  } catch (error) {
    console.error('List pin users error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/v1/auth/me - Get current user
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { location: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        locationId: user.locationId,
        domain: user.location,
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

// ============================================================================
// USER MANAGEMENT (ADMIN ONLY)
// ============================================================================

// GET /api/v1/auth/users - List all users
router.get('/users', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        locationId: true,
        lastActive: true,
        isOnline: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ success: true, data: users });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/v1/auth/users - Create a new user
router.post('/users', authMiddleware, adminMiddleware, validate(createUserSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { email, name, pin, role, locationId } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, error: 'User with this email already exists' });
    }

    const hashedPin = await bcrypt.hash(pin, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        role: role as UserRole,
        password: hashedPin,
        locationId: locationId || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        locationId: true,
        createdAt: true,
      },
    });

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /api/v1/auth/users/:id - Delete a user
router.delete('/users/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (req.user?.id === id) {
      return res.status(400).json({ success: false, error: 'Cannot delete your own account' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await prisma.user.delete({ where: { id } });

    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
