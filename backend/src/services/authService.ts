import { hash as hashPassword, compare as comparePassword } from "bcryptjs";
import { randomUUID } from "node:crypto";
import {
  createUser,
  getUserByEmail,
  getUserById,
  getUserPasswordHash,
  type UserEntity,
} from "../repositories/userRepository.js";
import {
  addPointsToWallet,
  getWalletByUserId,
} from "../repositories/walletRepository.js";
import {
  saveRefreshTokenForUser,
  findRefreshToken,
} from "../repositories/authRepository.js";

const PASSWORD_SALT_ROUNDS = 10;
const TOKEN_EXPIRATION_SECONDS = 60 * 30; // 30m mock expiry
const REFRESH_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30d

export type SignUpInput = {
  name: string;
  email: string;
  password: string;
};

export type SignUpResult =
  | {
      success: true;
      user: {
        id: string;
        name: string;
        email: string;
        avatarUrl: string | null;
        intro: string | null;
        balance: number;
      };
      token: string;
      refreshToken: string;
      expiresIn: number;
    }
  | {
      success: false;
      reason: "EMAIL_ALREADY_USED" | "UNKNOWN_ERROR";
    };

function buildMockJwt(user: UserEntity) {
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" })
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      userId: user.id,
      email: user.email,
      role: "user",
      exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRATION_SECONDS,
    })
  ).toString("base64url");
  return `${header}.${payload}.mock-signature`;
}

export async function signUpUser(payload: SignUpInput): Promise<SignUpResult> {
  const normalizedEmail = payload.email.trim().toLowerCase();
  const existing = await getUserByEmail(normalizedEmail);
  if (existing) {
    return { success: false, reason: "EMAIL_ALREADY_USED" };
  }

  const passwordHash = await hashPassword(
    payload.password,
    PASSWORD_SALT_ROUNDS
  );

  try {
    const user = await createUser({
      name: payload.name,
      email: normalizedEmail,
      passwordHash,
    });

    const wallet = await addPointsToWallet(user.id, 0);
    const session = await issueSessionTokens(user);

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatar_url,
        intro: user.bio,
        balance: wallet.balance,
      },
      token: session.accessToken,
      refreshToken: session.refreshToken,
      expiresIn: session.expiresIn,
    };
  } catch {
    return { success: false, reason: "UNKNOWN_ERROR" };
  }
}

export type LoginInput = {
  email: string;
  password: string;
};

export type LoginResult =
  | {
      success: true;
      user: {
        id: string;
        name: string;
        email: string;
        avatarUrl: string | null;
        intro: string | null;
        balance: number;
      };
      token: string;
      refreshToken: string;
      expiresIn: number;
    }
  | {
      success: false;
      reason: "INVALID_CREDENTIALS" | "UNKNOWN_ERROR";
    };

export async function loginUser(payload: LoginInput): Promise<LoginResult> {
  const normalizedEmail = payload.email.trim().toLowerCase();
  const user = await getUserByEmail(normalizedEmail);
  if (!user) {
    return { success: false, reason: "INVALID_CREDENTIALS" };
  }

  const passwordHash = await getUserPasswordHash(user.id);
  if (!passwordHash) {
    return { success: false, reason: "INVALID_CREDENTIALS" };
  }

  const matches = await comparePassword(payload.password, passwordHash);
  if (!matches) {
    return { success: false, reason: "INVALID_CREDENTIALS" };
  }

  try {
    const wallet = await getWalletByUserId(user.id);
    const session = await issueSessionTokens(user);

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatar_url,
        intro: user.bio,
        balance: wallet?.balance ?? user.balance,
      },
      token: session.accessToken,
      refreshToken: session.refreshToken,
      expiresIn: session.expiresIn,
    };
  } catch {
    return { success: false, reason: "UNKNOWN_ERROR" };
  }
}

export type RefreshTokenResult =
  | {
      success: true;
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    }
  | {
      success: false;
      reason: "INVALID_REFRESH_TOKEN" | "UNKNOWN_ERROR";
    };

export async function refreshAccessToken(
  refreshToken: string
): Promise<RefreshTokenResult> {
  const record = await findRefreshToken(refreshToken);
  if (!record) {
    return { success: false, reason: "INVALID_REFRESH_TOKEN" };
  }

  if (new Date(record.expiresAt).getTime() <= Date.now()) {
    return { success: false, reason: "INVALID_REFRESH_TOKEN" };
  }

  const user = await getUserById(record.userId);
  if (!user) {
    return { success: false, reason: "INVALID_REFRESH_TOKEN" };
  }

  try {
    const session = await issueSessionTokens(user);
    return {
      success: true,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresIn: session.expiresIn,
    };
  } catch {
    return { success: false, reason: "UNKNOWN_ERROR" };
  }
}

async function issueSessionTokens(user: UserEntity) {
  const accessToken = buildMockJwt(user);
  const refreshToken = randomUUID();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS).toISOString();
  await saveRefreshTokenForUser({
    userId: user.id,
    token: refreshToken,
    expiresAt,
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: TOKEN_EXPIRATION_SECONDS,
  } as const;
}
