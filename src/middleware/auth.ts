import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string;
    email: string;
    role: string;
    permissions: string[];
  };
}

export function withAuth(handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>) {
  return async (req: NextRequest, context?: any) => {
    try {
      const token = extractTokenFromHeader(req.headers.get('authorization'));

      if (!token) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      const payload = verifyToken(token);
      if (!payload) {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        );
      }

      await dbConnect();
      const user = await User.findById(payload.userId).select('-password');

      if (!user || !user.isActive) {
        return NextResponse.json(
          { error: 'User not found or inactive' },
          { status: 401 }
        );
      }

      // Attach user info to request
      (req as AuthenticatedRequest).user = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        permissions: user.permissions,
      };

      return handler(req as AuthenticatedRequest, context);
    } catch (error) {
      console.error('Authentication error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }
  };
}

export function withPermission(permission: string) {
  return function (handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>) {
    return withAuth(async (req: AuthenticatedRequest, context?: any) => {
      const user = req.user!;

      // Admin has all permissions
      if (user.role === 'admin') {
        return handler(req, context);
      }

      // Check if user has the required permission
      if (!user.permissions.includes(permission)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      return handler(req, context);
    });
  };
}

// Simple auth function for direct use in API routes
export async function auth(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(request.headers.get('authorization'));

    if (!token) {
      return { success: false, error: 'Authorization token required', status: 401 };
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return { success: false, error: 'Invalid token', status: 401 };
    }

    await dbConnect();

    const user = await User.findById(decoded.userId).select('-password');
    if (!user || !user.isActive) {
      return { success: false, error: 'User not found or inactive', status: 401 };
    }

    return {
      success: true,
      user: {
        _id: user._id.toString(),
        email: user.email,
        role: user.role,
        permissions: user.permissions,
      }
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, error: 'Authentication failed', status: 401 };
  }
}

export function withRole(allowedRoles: string[]) {
  return function (handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>) {
    return withAuth(async (req: AuthenticatedRequest, context?: any) => {
      const user = req.user!;

      if (!allowedRoles.includes(user.role)) {
        return NextResponse.json(
          { error: 'Insufficient role permissions' },
          { status: 403 }
        );
      }

      return handler(req, context);
    });
  };
}
