import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const bucketName = process.env.S3_BUCKET_NAME || process.env.AWS_BUCKET_NAME;
const region = process.env.S3_REGION || process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_KEY;
const sessionToken = process.env.AWS_SESSION_TOKEN;
const CDN_BASE_URL = process.env.ASSETS_CDN_BASE_URL || process.env.CDN_BASE_URL;

if (!bucketName || !region || !CDN_BASE_URL) {
    throw new Error("S3_BUCKET_NAME, S3_REGION, and CDN_BASE_URL must be configured for avatar uploads.");
}

const s3 = new S3Client({
    region,
    ...(accessKeyId && secretAccessKey
        ? {
            credentials: {
                accessKeyId,
                secretAccessKey,
                ...(sessionToken ? { sessionToken } : {}),
            },
        }
        : {}),
});

type AvatarUploadSuccess = {
    avatarUrl: string;
    error?: never;
    message?: never;
};

type AvatarUploadFailure = {
    avatarUrl?: never;
    error: string;
    message: string;
};

type AvatarUploadResponse = AvatarUploadSuccess | AvatarUploadFailure;

function extensionFromMimeType(mimeType: string): string {
    if (mimeType === "image/png") return "png";
    if (mimeType === "image/jpeg") return "jpg";
    if (mimeType === "image/webp") return "webp";
    if (mimeType === "image/gif") return "gif";
    return "bin";
}

function buildS3Key(prefix: string, folder: string, fileName: string): string {
    return `${prefix}/${folder}/${fileName}`;
}

function keyToCdnUrl(key: string): string {
    return `${CDN_BASE_URL?.replace(/\/$/, "")}/${key}`;
}

async function putObjectToS3(input: { key: string; body: Buffer; contentType: string }): Promise<void> {
    await s3.send(
        new PutObjectCommand({
            Bucket: bucketName,
            Key: input.key,
            Body: input.body,
            ContentType: input.contentType,
        }),
    );
}

export async function uploadAvatarToS3({
    userId,
    mimeType,
    fileBuffer,
}: {
    userId: string;
    mimeType: string;
    fileBuffer: Buffer;
}): Promise<AvatarUploadResponse> {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const ext = extensionFromMimeType(mimeType);
        const objectKey = buildS3Key("quantnest", "user-profile", `${userId}/avatar-${timestamp}.${ext}`);

        await putObjectToS3({
            key: objectKey,
            body: fileBuffer,
            contentType: mimeType,
        });

        return {
            avatarUrl: keyToCdnUrl(objectKey),
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown upload error";
        console.error("Avatar upload error:", message);

        return {
            error: "Error uploading file",
            message: "Please try again later",
        };
    }
}
