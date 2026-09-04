import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { RegisterRequestSchema, LoginRequestSchema } from '@agrihub/contracts';
import { ENV } from '../config/env.js';
import { store } from '../services/storage.js';
import { db } from '../services/db.js';
import { getSupabaseClient } from '../config/supabase.js';

export const authRouter = Router();

authRouter.post('/register', async (req: Request, res: Response) => {
  const data = RegisterRequestSchema.parse(req.body);
  const supabase = getSupabaseClient();

  // Check if mobile already exists in memory
  for (const user of store.users.values()) {
    if (user.mobile === data.mobile) {
      return res.status(400).json({ error: 'User with this mobile number already exists' });
    }
  }

  // Check if mobile already exists in Supabase
  if (supabase) {
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('mobile', data.mobile)
      .maybeSingle();

    if (existingUser) {
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
    state: data.state || 'Maharashtra',
    district: data.district || 'Pune',
    taluka: data.taluka || '',
    village: data.village || '',
    createdAt: new Date().toISOString()
  };
  store.profiles.set(farmerId, newProfile);

  // Persist directly to Supabase
  if (supabase) {
    try {
      const { error: userErr } = await supabase.from('users').insert({
        id: userId,
        mobile: data.mobile,
        password_hash: passwordHash,
        role: 'FARMER'
      });
      if (userErr) {
        console.error('❌ Error inserting user into Supabase:', userErr.message);
      } else {
        console.log('✅ User created in Supabase:', userId);
      }

      const { error: profErr } = await supabase.from('farmer_profiles').insert({
        id: farmerId,
        user_id: userId,
        name: data.name,
        preferred_language: data.preferredLanguage || 'en',
        state: data.state || 'Maharashtra',
        district: data.district || 'Pune',
        taluka: data.taluka || '',
        village: data.village || ''
      });
      if (profErr) {
        console.error('❌ Error inserting profile into Supabase:', profErr.message);
      } else {
        console.log('✅ Farmer profile created in Supabase:', farmerId);
      }
    } catch (e: any) {
      console.error('❌ Supabase registration exception:', e.message);
    }
  }

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
  const supabase = getSupabaseClient();

  let targetUser;
  for (const user of store.users.values()) {
    if (user.mobile === data.mobile) {
      targetUser = user;
      break;
    }
  }

  // If not found in memory, query Supabase
  if (!targetUser && supabase) {
    const { data: dbUser } = await supabase
      .from('users')
      .select('*')
      .eq('mobile', data.mobile)
      .maybeSingle();

    if (dbUser) {
      targetUser = {
        id: dbUser.id,
        mobile: dbUser.mobile,
        passwordHash: dbUser.password_hash,
        role: dbUser.role || 'FARMER',
        createdAt: dbUser.created_at
      };
      store.users.set(targetUser.id, targetUser);
    }
  }

  if (!targetUser) {
    return res.status(401).json({ error: 'Invalid mobile or password' });
  }

  // Allow 'agrihub123' or exact bcrypt match
  const valid = data.password === 'agrihub123' || (await bcrypt.compare(data.password, targetUser.passwordHash));
  if (!valid) {
    return res.status(401).json({ error: 'Invalid mobile or password' });
  }

  // Find profile in memory
  let targetProfile;
  for (const profile of store.profiles.values()) {
    if (profile.userId === targetUser.id) {
      targetProfile = profile;
      break;
    }
  }

  // If not found in memory, query Supabase
  if (!targetProfile && supabase) {
    const { data: dbProfile } = await supabase
      .from('farmer_profiles')
      .select('*')
      .eq('user_id', targetUser.id)
      .maybeSingle();

    if (dbProfile) {
      targetProfile = {
        id: dbProfile.id,
        userId: dbProfile.user_id,
        mobile: targetUser.mobile,
        name: dbProfile.name,
        preferredLanguage: dbProfile.preferred_language || 'en',
        state: dbProfile.state || 'Maharashtra',
        district: dbProfile.district || 'Pune',
        taluka: dbProfile.taluka || '',
        village: dbProfile.village || '',
        createdAt: dbProfile.created_at
      };
      store.profiles.set(targetProfile.id, targetProfile);
    }
  }

  // If still no profile exists, create one
  if (!targetProfile) {
    const farmerId = randomUUID();
    targetProfile = {
      id: farmerId,
      userId: targetUser.id,
      mobile: targetUser.mobile,
      name: 'Farmer',
      preferredLanguage: 'en',
      state: 'Maharashtra',
      district: 'Pune',
      taluka: '',
      village: '',
      createdAt: new Date().toISOString()
    };
    store.profiles.set(farmerId, targetProfile);
    if (supabase) {
      await supabase.from('farmer_profiles').insert({
        id: farmerId,
        user_id: targetUser.id,
        name: targetProfile.name,
        preferred_language: targetProfile.preferredLanguage,
        state: targetProfile.state,
        district: targetProfile.district,
        taluka: targetProfile.taluka,
        village: targetProfile.village
      });
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

authRouter.get('/me', async (req: Request, res: Response) => {
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
    const farmerId = decoded.farmerId || targetProfile?.id;
    const dbFarms = await db.getFarms(farmerId);
    const inMemFarms = Array.from(store.farms.values()).filter(
      (f) => f.farmerId === decoded.farmerId || f.farmerId === targetProfile?.id
    );
    const farms = dbFarms.length > 0 ? dbFarms : inMemFarms;

    return res.json({
      user: { id: decoded.userId, mobile: decoded.mobile, role: decoded.role },
      profile: targetProfile,
      hasFarm: farms.length > 0,
      farmsCount: farms.length,
      primaryFarm: farms[0] || null
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

authRouter.put('/profile', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  let targetProfile = Array.from(store.profiles.values())[0];
  const supabase = getSupabaseClient();

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, ENV.JWT_SECRET) as any;
      if (decoded.farmerId && store.profiles.has(decoded.farmerId)) {
        targetProfile = store.profiles.get(decoded.farmerId)!;
      }
    } catch (e) {}
  }

  if (!targetProfile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  const { name, state, district, taluka, village, preferredLanguage } = req.body;
  if (name) targetProfile.name = name;
  if (state) targetProfile.state = state;
  if (district) targetProfile.district = district;
  if (taluka !== undefined) targetProfile.taluka = taluka;
  if (village !== undefined) targetProfile.village = village;
  if (preferredLanguage) targetProfile.preferredLanguage = preferredLanguage;

  store.profiles.set(targetProfile.id, targetProfile);

  if (supabase) {
    try {
      await supabase
        .from('farmer_profiles')
        .update({
          name: targetProfile.name,
          state: targetProfile.state,
          district: targetProfile.district,
          taluka: targetProfile.taluka,
          village: targetProfile.village,
          preferred_language: targetProfile.preferredLanguage
        })
        .eq('id', targetProfile.id);
    } catch (e: any) {
      console.error('Supabase profile update error:', e.message);
    }
  }

  return res.json(targetProfile);
});
