import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const BUCKET_NAME = process.env.R2_BUCKET_NAME || "sentio";

// Initialize S3 Client for Cloudflare R2
const getS3Client = () => {
  const accountId = process.env.R2_ACCOUNT_ID || "";
  const accessKeyId = process.env.R2_ACCESS_KEY_ID || "";
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "";
  const endpoint = process.env.R2_ENDPOINT || "";

  if (!accessKeyId || !secretAccessKey || !endpoint) return null;

  return new S3Client({
    region: "auto",
    endpoint: endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
};

export const uploadAvatarToS3 = async (
  userId: string,
  buffer: Buffer,
  mimetype: string,
): Promise<string> => {
  const s3 = getS3Client();

  if (!s3) {
    // Return base64 data URI for instant local development reliability
    const resolvedMime = mimetype || "image/png";
    return `data:${resolvedMime};base64,${buffer.toString("base64")}`;
  }

  try {
    const extension = mimetype.split("/")[1] || "png";
    const objectKey = `avatars/${userId}-${Date.now()}.${extension}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: objectKey,
        Body: buffer,
        ContentType: mimetype,
        CacheControl: "public, max-age=31536000",
      }),
    );

    // Cloudflare R2 bucket public URL
    const publicDomain =
      process.env.R2_PUBLIC_DOMAIN || process.env.R2_ENDPOINT;
    return `${publicDomain}/${objectKey}`;
  } catch (error) {
    console.warn("S3 upload failed, falling back to Data URI:", error);
    const resolvedMime = mimetype || "image/png";
    return `data:${resolvedMime};base64,${buffer.toString("base64")}`;
  }
};

export const uploadFileToS3 = async (
  folderName: string,
  fileName: string,
  buffer: Buffer,
  mimetype: string,
): Promise<string> => {
  const s3 = getS3Client();

  if (!s3) {
    // Return base64 data URI for instant reliable rendering
    const resolvedMime = mimetype || "image/png";
    return `data:${resolvedMime};base64,${buffer.toString("base64")}`;
  }

  try {
    const objectKey = `${folderName}/${fileName}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: objectKey,
        Body: buffer,
        ContentType: mimetype,
        CacheControl: "public, max-age=31536000",
      }),
    );

    const publicDomain =
      process.env.R2_PUBLIC_DOMAIN || process.env.R2_ENDPOINT;
    return `${publicDomain}/${objectKey}`;
  } catch (error) {
    console.warn("S3 file upload failed, falling back to Data URI:", error);
    const resolvedMime = mimetype || "image/png";
    return `data:${resolvedMime};base64,${buffer.toString("base64")}`;
  }
};

export const deleteFileFromS3 = async (
  folderName: string,
  fileUrl: string,
): Promise<void> => {
  const s3 = getS3Client();

  if (!s3 || fileUrl.startsWith("data:")) return; // Skip if mock or data URI

  try {
    // Extract object key from URL
    const urlParts = fileUrl.split("/");
    const objectKey = urlParts.slice(urlParts.indexOf(folderName)).join("/");

    if (objectKey) {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: objectKey,
        }),
      );
    }
  } catch (error) {
    console.error("Failed to delete file from S3:", error);
  }
};
