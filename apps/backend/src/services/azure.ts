import { BlobServiceClient } from "@azure/storage-blob";

const CONTAINER_NAME = "avatars";

export const uploadAvatarToAzure = async (
  userId: string,
  buffer: Buffer,
  mimetype: string,
): Promise<string> => {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || "";

  if (!connectionString) {
    // Return base64 data URI for instant local development reliability
    const resolvedMime = mimetype || "image/png";
    return `data:${resolvedMime};base64,${buffer.toString("base64")}`;
  }

  try {
    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);

    const containerClient =
      blobServiceClient.getContainerClient(CONTAINER_NAME);

    // Ensure container exists and has blob access
    await containerClient.createIfNotExists({
      access: "blob",
    });

    const extension = mimetype.split("/")[1] || "png";
    const blobName = `${userId}-${Date.now()}.${extension}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: {
        blobContentType: mimetype,
        // Aggressive caching for avatars
        blobCacheControl: "public, max-age=31536000",
      },
    });

    return blockBlobClient.url;
  } catch (error) {
    console.warn("Azure upload failed, falling back to Data URI:", error);
    const resolvedMime = mimetype || "image/png";
    return `data:${resolvedMime};base64,${buffer.toString("base64")}`;
  }
};

export const uploadFileToAzure = async (
  containerName: string,
  fileName: string,
  buffer: Buffer,
  mimetype: string,
): Promise<string> => {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || "";

  if (!connectionString) {
    // Return base64 data URI for instant reliable rendering
    const resolvedMime = mimetype || "image/png";
    return `data:${resolvedMime};base64,${buffer.toString("base64")}`;
  }

  try {
    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    await containerClient.createIfNotExists({ access: "blob" });

    const blockBlobClient = containerClient.getBlockBlobClient(fileName);

    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: {
        blobContentType: mimetype,
        blobCacheControl: "public, max-age=31536000",
      },
    });

    return blockBlobClient.url;
  } catch (error) {
    console.warn("Azure file upload failed, falling back to Data URI:", error);
    const resolvedMime = mimetype || "image/png";
    return `data:${resolvedMime};base64,${buffer.toString("base64")}`;
  }
};

export const deleteFileFromAzure = async (
  containerName: string,
  fileUrl: string,
): Promise<void> => {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || "";

  if (!connectionString || fileUrl.startsWith("data:")) return; // Skip if mock or data URI

  try {
    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Extract blob name from URL (assuming format: https://account.blob.core.windows.net/container/blobname)
    const urlParts = fileUrl.split("/");
    const blobName = urlParts
      .slice(urlParts.indexOf(containerName) + 1)
      .join("/");

    if (blobName) {
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.deleteIfExists();
    }
  } catch (error) {
    console.error("Failed to delete file from Azure:", error);
  }
};
