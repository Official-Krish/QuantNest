import { Storage } from "@google-cloud/storage";

const storage = new Storage({
    projectId: process.env.PROJECT_ID,
});
const bucket = storage.bucket(process.env.BUCKET_NAME!);
const CDN_BASE_URL = process.env.ASSETS_CDN_BASE_URL || "https://assets.krishdev.xyz";

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

export async function uploadAvatarToGcp({
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
        const fileName = `${userId}/avatar-${timestamp}.${ext}`;
        const objectPath = `quantnest/users/${fileName}`;

        const objectFile = bucket.file(objectPath);

        await new Promise<void>((resolve, reject) => {
            const writeStream = objectFile.createWriteStream({
                resumable: false,
                metadata: {
                    contentType: mimeType,
                },
            });

            writeStream.on("error", reject);
            writeStream.on("finish", resolve);
            writeStream.end(fileBuffer);
        });

        return {
            avatarUrl: `${CDN_BASE_URL}/${objectPath}`,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown upload error";
        console.error("Avatar upload error:", message);

        if (message.includes("billing account") || message.includes("verification")) {
            return {
                error: "Service temporarily unavailable",
                message: "Please try again once account verification is complete",
            };
    }

        return {
            error: "Error uploading file",
            message: "Please try again later",
        };
    }
}
