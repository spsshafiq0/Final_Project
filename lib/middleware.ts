import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyToken, TokenPayload, RoleType } from "./auth";

export interface AuthenticatedRequest extends VercelRequest {
  user?: TokenPayload;
}

export function setCorsHeaders(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );
}

export function extractToken(req: VercelRequest): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}

export function authenticate(req: VercelRequest): TokenPayload | null {
  const token = extractToken(req);
  if (!token) return null;
  return verifyToken(token);
}

export type ApiHandler = (
  req: AuthenticatedRequest,
  res: VercelResponse,
  user?: TokenPayload
) => Promise<any> | any;

export function apiHandler(
  handler: ApiHandler,
  options?: {
    roles?: RoleType[];
    requireAuth?: boolean;
    allowedMethods?: string[];
  }
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    setCorsHeaders(res);

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    if (options?.allowedMethods && !options.allowedMethods.includes(req.method || "")) {
      return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }

    let user: TokenPayload | undefined;
    if (options?.requireAuth || (options?.roles && options.roles.length > 0)) {
      const authUser = authenticate(req);
      if (!authUser) {
        return res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
      }
      if (options?.roles && !options.roles.includes(authUser.role)) {
        return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
      }
      user = authUser;
    } else {
      const authUser = authenticate(req);
      if (authUser) user = authUser;
    }

    try {
      await handler(req as AuthenticatedRequest, res, user);
    } catch (error: any) {
      console.error("API error:", error);
      return res.status(500).json({
        error: error.message || "Internal server error",
      });
    }
  };
}
