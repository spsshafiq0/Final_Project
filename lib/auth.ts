import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "intelliwaste-jwt-secret-key-2025-dhaka";

export type RoleType =
  | "SUPER_ADMIN"
  | "CITY_ADMIN"
  | "WARD_ADMIN"
  | "CITIZEN"
  | "DRIVER"
  | "BUSINESS";

export interface TokenPayload {
  userId: string;
  username: string;
  role: RoleType;
  cityCorpId?: string | null;
  wardId?: string | null;
  fullName: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}
