import { fetchUserById } from "../db/index.js";

export type UserEntity = {
  id: string;
  name: string;
  avatar_url: string;
  bio: string | null;
  gender: string | null;
  birthday: string | null;
  balance: number;
};

export async function getUserById(userId: string): Promise<UserEntity | null> {
  return fetchUserById(userId);
}
