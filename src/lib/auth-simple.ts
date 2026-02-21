// Authentication system with Supabase integration
import * as bcrypt from 'bcryptjs';
import {
  createUser,
  createSession,
  findUserByEmail,
  findUserById,
  findSessionByToken,
  deleteSession,
  updateUser,
  trackUserActivity as trackActivity,
  createImage,
  listUserImages as listImages,
  setImageStatus,
  listUserActivity as listUserActivityFromDB
} from './supabase-server';

export interface User {
  id: string;
  email: string;
  name: string;
  subscriptionStatus: 'free' | 'pro' | 'enterprise';
  apiUsage: number;
  monthlyApiLimit: number;
  isAdmin?: boolean;
}

export interface Session {
  id: string;
  token: string;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate session token
export function generateSessionToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Sign up user
export async function signUpUser(email: string, password: string, name: string, ipAddress?: string) {
  console.log('signUpUser called with:', { email, name });
  
  try {
    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      throw new Error('User already exists with this email');
    }
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Create user in Supabase (let Supabase generate the ID)
    const userId = await createUser({
      email,
      name,
      passwordHash,
    });
    
    // Create session (non-blocking for signup flow)
    const sessionToken = generateSessionToken();
    let sessionId: string | null = null;
    try {
      sessionId = await createSession({
        userId,
        token: sessionToken,
        expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
        ipAddress,
      });
    } catch (e) {
      console.warn('Non-blocking: failed to create session during signup', e);
    }
    
    // Track activity (non-blocking inside implementation)
    await trackActivity(userId, 'user_signup', { email, name });
    
    console.log('Created user and (maybe) session:', { userId, sessionId });
    
    return {
      user: {
        id: userId,
        email,
        name,
        subscriptionStatus: 'free' as const,
        apiUsage: 0,
        monthlyApiLimit: 100,
      },
      session: sessionId ? { id: sessionId, token: sessionToken } : null,
    };
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
}

// Sign in user
export async function signInUser(email: string, password: string, ipAddress?: string) {
  try {
    console.log('signInUser called with:', { email, ipAddress })

    // Find user by email
    const foundUser = await findUserByEmail(email);
    if (!foundUser) {
      throw new Error('User not found');
    }

    console.log('Found user:', { id: foundUser.id, email: foundUser.email })

    // Verify password
    const isValidPassword = await verifyPassword(password, foundUser.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid password');
    }

    console.log('Password verified, creating session...')

    // Create session
    const sessionToken = generateSessionToken();
    console.log('Generated session token, calling createSession...')

    const sessionId = await createSession({
      userId: foundUser.id,
      token: sessionToken,
      expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
      ipAddress,
    });

    console.log('Session created successfully:', sessionId)
    
    // Update last login time (non-blocking)
    try {
      await updateUser(foundUser.id, { lastLoginAt: Date.now() });
    } catch (e) {
      console.warn('Non-blocking: failed to update last login timestamp', e);
    }
    
    // Track activity
    await trackActivity(foundUser.id, 'user_signin', { email });
    
    console.log('User signed in:', { userId: foundUser.id, email });
    
    return {
      user: {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name,
        subscriptionStatus: foundUser.subscriptionStatus || 'free',
        apiUsage: foundUser.apiUsage || 0,
        monthlyApiLimit: foundUser.monthlyApiLimit || 100,
        isAdmin: foundUser.isAdmin || false,
      },
      session: { id: sessionId, token: sessionToken },
    };
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
}

// Get session
export async function getSession(token: string) {
  if (!token) return null;
  
  try {
    const result = await findSessionByToken(token);
    if (!result) {
      return null;
    }

    const { session, user } = result as any;

    // Validate session expiry
    const expiresAt = (session?.expiresAt as number) ?? 0;
    if (!session || expiresAt < Date.now()) {
      return null;
    }
    
    if (!user) {
      return null;
    }
    
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscriptionStatus: user.subscriptionStatus || 'free',
        apiUsage: user.apiUsage || 0,
        monthlyApiLimit: user.monthlyApiLimit || 100,
        isAdmin: user.isAdmin || false,
      },
      session: { id: session.id, token: session.token },
    };
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
}

// Sign out user
export async function signOutUser(token: string) {
  try {
    if (!token) return;
    await deleteSession(token);
    console.log('User signed out with token:', token.substring(0, 8) + '...');
  } catch (error) {
    console.error('Sign out error:', error);
  }
}

// Get user stats
export async function getUserStats(userId: string) {
  try {
    const user = await findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    return {
      totalImages: 0, // TODO: Implement image counting
      enhancedImages: 0,
      processingImages: 0,
      totalStorage: 0,
      apiUsage: user.apiUsage || 0,
      monthlyApiLimit: user.monthlyApiLimit || 100,
      subscriptionStatus: user.subscriptionStatus || 'free' as const,
    };
  } catch (error) {
    console.error('Get user stats error:', error);
    return {
      totalImages: 0,
      enhancedImages: 0,
      processingImages: 0,
      totalStorage: 0,
      apiUsage: 0,
      monthlyApiLimit: 100,
      subscriptionStatus: 'free' as const,
    };
  }
}

// Upload image
export async function uploadImage(userId: string, imageData: {
  filename: string;
  fileSize: number;
  dimensions: { width: number; height: number };
  originalUrl: string;
}) {
  try {
    // Persist image in database
    const created = await createImage({
      userId,
      filename: imageData.filename,
      fileSize: imageData.fileSize,
      width: imageData.dimensions.width,
      height: imageData.dimensions.height,
      originalUrl: imageData.originalUrl,
      status: 'uploaded'
    });

    // Track activity (non-blocking)
    trackActivity(userId, 'image_upload', {
      imageId: created.id,
      filename: created.filename,
      size: created.fileSize
    }).catch(() => {});
    
    console.log('Image uploaded:', { imageId: created.id, userId, filename: created.filename });
    
    return created;
  } catch (error) {
    console.error('Upload image error:', error);
    throw error;
  }
}

// Get user images
export async function getUserImages(userId: string) {
  try {
    const images = await listImages(userId, 50);
    return images;
  } catch (error) {
    console.error('Get user images error:', error);
    return [];
  }
}

// Update API usage
export async function updateApiUsage(userId: string, increment: number = 1) {
  try {
    await updateUser(userId, { 
      apiUsage: { $increment: increment } 
    });
    console.log(`API usage updated for user ${userId}: +${increment}`);
  } catch (error) {
    console.error('Update API usage error:', error);
  }
}

// Update image status
export async function updateImageStatus(
  imageId: string,
  status: 'uploaded' | 'processing' | 'enhanced' | 'failed',
  enhancedUrl?: string
) {
  try {
    await setImageStatus(imageId, status, enhancedUrl);
    console.log(`Image ${imageId} status updated to ${status}`);
  } catch (error) {
    console.error('Update image status error:', error);
    throw error;
  }
}

// Track user activity
export async function trackUserActivity(userId: string, action: string, metadata?: any) {
  try {
    await trackActivity(userId, action, metadata);
    console.log(`Activity tracked: ${action} for user ${userId}`);
  } catch (error) {
    console.error('Track activity error:', error);
  }
}

// List user activity (for dashboards/fallbacks)
export async function listUserActivity(userId: string, limit: number = 10) {
  try {
    const activity = await listUserActivityFromDB(userId, limit);
    return activity;
  } catch (error) {
    console.error('List user activity error:', error);
    return [];
  }
}