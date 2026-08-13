import FileResource, { IFileResource } from "../models/FileResource";
import { uploadFileToAzure, deleteFileFromAzure } from "./azure";
import { extractTextFromDocument } from "./documentProcessor";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // pptx
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  "text/plain",
  "text/markdown",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export function validateFile(file: Express.Multer.File) {
  if (!file) {
    throw new Error("No file uploaded");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File size exceeds limit of 25MB (File size: ${(file.size / (1024 * 1024)).toFixed(1)}MB)`,
    );
  }

  const extension = file.originalname.split(".").pop()?.toLowerCase();
  const isAllowedMime = ALLOWED_MIME_TYPES.includes(file.mimetype);
  const isAllowedExt = [
    "pdf",
    "pptx",
    "ppt",
    "docx",
    "txt",
    "md",
    "jpg",
    "jpeg",
    "png",
    "webp",
    "gif",
  ].includes(extension || "");

  if (!isAllowedMime && !isAllowedExt) {
    throw new Error(`Unsupported file type: ${file.mimetype} (.${extension})`);
  }
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

export async function uploadAndProcessFile(
  ownerId: string,
  file: Express.Multer.File,
  options: {
    presentationId?: string;
    category?: "presentation" | "document" | "image" | "reference";
  },
): Promise<IFileResource> {
  validateFile(file);

  const cleanOriginalName = sanitizeFileName(file.originalname);
  const storedName = `${ownerId}-${Date.now()}-${cleanOriginalName}`;
  const storagePath = `files/${storedName}`;

  // Upload binary to Azure Blob Storage
  const fileUrl = await uploadFileToAzure(
    "files",
    storedName,
    file.buffer,
    file.mimetype,
  );

  // Categorize
  let category = options.category;
  if (!category) {
    if (file.mimetype.startsWith("image/")) category = "image";
    else if (file.mimetype.includes("presentation")) category = "presentation";
    else category = "document";
  }

  const fileDoc = new FileResource({
    originalName: file.originalname,
    storedName,
    mimeType: file.mimetype,
    size: file.size,
    owner: ownerId,
    presentationId: options.presentationId || undefined,
    category,
    storagePath,
    fileUrl,
    status: "PROCESSING",
    extractionStatus: "PENDING",
    version: 1,
    isLatestVersion: true,
  });

  await fileDoc.save();

  // Async document processing (text extraction)
  extractTextFromDocument(file.buffer, file.mimetype, file.originalname)
    .then(async (result) => {
      fileDoc.extractedText = result.extractedText;
      fileDoc.extractionStatus = result.extractionStatus;
      fileDoc.extractedMetadata = result.metadata;
      fileDoc.status = "READY";
      await fileDoc.save();
    })
    .catch(async (err) => {
      console.error("[FileService] Text extraction error:", err);
      fileDoc.status = "READY";
      fileDoc.extractionStatus = "FAILED";
      await fileDoc.save();
    });

  return fileDoc;
}

export async function createFileVersion(
  parentFileId: string,
  ownerId: string,
  file: Express.Multer.File,
): Promise<IFileResource> {
  const parentFile = await FileResource.findOne({
    _id: parentFileId,
    owner: ownerId,
  });
  if (!parentFile) {
    throw new Error("Parent file not found or access denied");
  }

  validateFile(file);

  // Mark previous as not latest
  parentFile.isLatestVersion = false;
  await parentFile.save();

  const cleanOriginalName = sanitizeFileName(file.originalname);
  const storedName = `${ownerId}-${Date.now()}-v${parentFile.version + 1}-${cleanOriginalName}`;
  const fileUrl = await uploadFileToAzure(
    "files",
    storedName,
    file.buffer,
    file.mimetype,
  );

  const newVersionDoc = new FileResource({
    originalName: file.originalname,
    storedName,
    mimeType: file.mimetype,
    size: file.size,
    owner: ownerId,
    presentationId: parentFile.presentationId,
    category: parentFile.category,
    storagePath: `files/${storedName}`,
    fileUrl,
    status: "PROCESSING",
    extractionStatus: "PENDING",
    version: parentFile.version + 1,
    parentFileId: parentFile._id,
    isLatestVersion: true,
  });

  await newVersionDoc.save();

  extractTextFromDocument(file.buffer, file.mimetype, file.originalname)
    .then(async (result) => {
      newVersionDoc.extractedText = result.extractedText;
      newVersionDoc.extractionStatus = result.extractionStatus;
      newVersionDoc.extractedMetadata = result.metadata;
      newVersionDoc.status = "READY";
      await newVersionDoc.save();
    })
    .catch(async (err) => {
      newVersionDoc.status = "READY";
      newVersionDoc.extractionStatus = "FAILED";
      await newVersionDoc.save();
    });

  return newVersionDoc;
}

export async function searchKnowledgeBase(
  userId: string,
  query: string,
  presentationId?: string,
) {
  const filter: any = { owner: userId, isLatestVersion: true };
  if (presentationId) filter.presentationId = presentationId;

  if (!query || !query.trim()) {
    return FileResource.find(filter).sort({ createdAt: -1 });
  }

  const regex = new RegExp(query.trim(), "i");
  return FileResource.find({
    ...filter,
    $or: [{ originalName: regex }, { extractedText: regex }],
  }).sort({ createdAt: -1 });
}

export async function deleteFileResource(fileId: string, ownerId: string) {
  const fileDoc = await FileResource.findOne({ _id: fileId, owner: ownerId });
  if (!fileDoc) {
    throw new Error("File not found");
  }

  // Delete from Azure
  if (fileDoc.fileUrl) {
    await deleteFileFromAzure("files", fileDoc.fileUrl);
  }

  await FileResource.deleteOne({ _id: fileDoc._id });

  // If this was a versioned file, check if we need to promote previous version
  if (fileDoc.parentFileId) {
    const parent = await FileResource.findById(fileDoc.parentFileId);
    if (parent) {
      parent.isLatestVersion = true;
      await parent.save();
    }
  }
}
