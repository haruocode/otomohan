import { hash as hashPassword, compare as comparePassword } from "bcryptjs";
import {
  createUser,
  getUserByEmail,
  getUserPasswordHash,
  type UserEntity,
} from "../repositories/userRepository.js";
import {
  addPointsToWallet,
  getWalletByUserId,
} from "../repositories/walletRepository.js";

const PASSWORD_SALT_ROUNDS = 10;
const TOKEN_EXPIRATION_SECONDS = 60 * 60 * 24; // 24h mock expiry

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
    const token = buildMockJwt(user);

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
      token,
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
    const token = buildMockJwt(user);

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
      token,
    };
  } catch {
    return { success: false, reason: "UNKNOWN_ERROR" };
  }
}
