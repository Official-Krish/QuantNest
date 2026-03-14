const AVATAR_URL_REGEX = /^https:\/\/api\.dicebear\.com\/7\.x\/avataaars\/svg\?seed=[A-Za-z0-9_-]+$/;

export function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret === "JWT_SECRET") {
        throw new Error("JWT_SECRET must be configured and must not use the default placeholder value.");
    }
    return secret;
}

export function getFrontendBaseUrl(): string {
    const configured =
        process.env.FRONTEND_URL ||
        process.env.CORS_ORIGIN?.split(",")[0]?.trim();

    return configured || "http://localhost:5173";
}

export function isAllowedAvatarUrl(value: string): boolean {
    return AVATAR_URL_REGEX.test(value.trim());
}
