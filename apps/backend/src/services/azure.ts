import { BlobServiceClient } from "@azure/storage-blob";

const CONTAINER_NAME = "avatars";

export const uploadAvatarToAzure = async (
  userId: string,
  buffer: Buffer,
  mimetype: string,
): Promise<string> => {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || "";

  if (!connectionString) {
    // Return a mock URL for local development if no connection string is provided
    console.warn(
      "No AZURE_STORAGE_CONNECTION_STRING provided. Returning a mock URL.",
    );
    return `https://api.dicebear.com/9.x/initials/svg?seed=MockUpload`;
  }

  const blobServiceClient =
    BlobServiceClient.fromConnectionString(connectionString);

  const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

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
};

export const uploadFileToAzure = async (
  containerName: string,
  fileName: string,
  buffer: Buffer,
  mimetype: string,
): Promise<string> => {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || "";

  if (!connectionString) {
    console.warn(
      "No AZURE_STORAGE_CONNECTION_STRING provided. Returning a mock URL.",
    );
    return `https://mock.azure.storage/mock/${containerName}/${fileName}`;
  }

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
};

export const deleteFileFromAzure = async (
  containerName: string,
  fileUrl: string,
): Promise<void> => {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || "";

  if (!connectionString) return; // Skip if mock

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
