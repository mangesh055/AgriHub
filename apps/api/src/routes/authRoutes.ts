import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { RegisterRequestSchema, LoginRequestSchema } from '@agrihub/contracts';
import { ENV } from '../config/env.js';
import { store } from '../services/storage.js';

export const authRouter = Router();

authRouter.post('/register', async (req: Request, res: Response) => {
  const data = RegisterRequestSchema.parse(req.body);

  // Check if mobile already exists
  for (const user of store.users.values()) {
    if (user.mobile === data.mobile) {
      return res.status(400).json({ error: 'User with this mobile number already exists' });
    }
  }

  const userId = randomUUID();
  const farmerId = randomUUID();
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(data.password, salt);

  const newUser = {
    id: userId,
    mobile: data.mobile,
    passwordHash,
    role: 'FARMER' as const,
    createdAt: new Date().toISOString()
  };
  store.users.set(userId, newUser);

  const newProfile = {
    id: farmerId,
    userId,
    mobile: data.mobile,
    name: data.name,
    preferredLanguage: data.preferredLanguage || 'en',
    state: data.state,
    district: data.district,
    taluka: data.taluka || '',
    village: data.village || '',
    createdAt: new Date().toISOString()
  };
  store.profiles.set(farmerId, newProfile);

  const token = jwt.sign(
    { userId, farmerId, mobile: data.mobile, role: 'FARMER' },
    ENV.JWT_SECRET,
    { expiresIn: ENV.JWT_EXPIRES_IN as any }
  );

  return res.status(201).json({
    token,
    user: { id: userId, mobile: data.mobile, role: 'FARMER' },
    profile: newProfile
  });
});

authRouter.post('/login', async (req: Request, res: Response) => {
  const data = LoginRequestSchema.parse(req.body);

  let targetUser;
  for (const user of store.users.values()) {
    if (user.mobile === data.mobile) {
      targetUser = user;
      break;
    }
  }

  // If demo user or credentials match
  if (!targetUser) {
    return res.status(401).json({ error: 'Invalid mobile or password' });
  }

  // Allow 'agrihub123' or exact match
  const valid = data.password === 'agrihub123' || (await bcrypt.compare(data.password, targetUser.passwordHash));
  if (!valid) {
    return res.status(401).json({ error: 'Invalid mobile or password' });
  }

  // Find profile
  let targetProfile;
  for (const profile of store.profiles.values()) {
    if (profile.userId === targetUser.id) {
      targetProfile = profile;
      break;
    }
  }

  const token = jwt.sign(
    {
      userId: targetUser.id,
      farmerId: targetProfile ? targetProfile.id : targetUser.id,
      mobile: targetUser.mobile,
      role: targetUser.role
    },
    ENV.JWT_SECRET,
    { expiresIn: ENV.JWT_EXPIRES_IN as any }
  );

  return res.json({
    token,
    user: { id: targetUser.id, mobile: targetUser.mobile, role: targetUser.role },
    profile: targetProfile
  });
});

authRouter.get('/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as any;
    let targetProfile = store.profiles.get(decoded.farmerId);
    if (!targetProfile) {
      for (const p of store.profiles.values()) {
        if (p.userId === decoded.userId) {
          targetProfile = p;
          break;
        }
      }
    }
    const farms = Array.from(store.farms.values()).filter(
      (f) => f.farmerId === decoded.farmerId || f.farmerId === targetProfile?.id
    );

    return res.json({
      user: { id: decoded.userId, mobile: decoded.mobile, role: decoded.role },
      profile: targetProfile,
      hasFarm: farms.length > 0,
      farmsCount: farms.length
    });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

authRouter.get('/profile', (req: Request, res: Response) => {
  const profile = Array.from(store.profiles.values())[0];
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  return res.json(profile);
});
