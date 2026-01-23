/**
 * Image Service Layer - Backend Ready
 * This service abstracts image file operations and metadata extraction.
 * Can be easily connected to backend API and database.
 */

export interface ImageMetadata {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  width: number;
  height: number;
  createdAt: string;
}

export interface ImageFile extends ImageMetadata {
  url: string;
}

/**
 * Extract image dimensions
 * In a real backend scenario, this would come from the database
 */
export async function extractImageMetadata(
  file: File,
  imageElement: HTMLImageElement
): Promise<Omit<ImageMetadata, 'id' | 'createdAt'>> {
  return new Promise((resolve) => {
    imageElement.onload = () => {
      resolve({
        fileName: file.name,
        fileType: file.type || 'image/unknown',
        fileSize: file.size,
        width: imageElement.naturalWidth,
        height: imageElement.naturalHeight,
      });
    };
  });
}

/**
 * Generate unique ID for image files
 * In production, this would come from backend/database
 */
export function generateImageId(): string {
  return `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a blob URL from a file
 * This is a frontend utility that works without backend
 */
export function createBlobUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revoke a blob URL to prevent memory leaks
 */
export function revokeBlobUrl(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Validate image file format
 */
export function isValidImageFormat(file: File): boolean {
  const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
  return validTypes.includes(file.type);
}

/**
 * Service function to upload image file
 * Currently uses blob URLs; can be replaced with backend API call
 */
export async function uploadImageFile(file: File): Promise<ImageFile> {
  if (!isValidImageFormat(file)) {
    throw new Error(`Invalid image format. Supported: PNG, JPG, WEBP`);
  }

  const imageElement = new Image();
  const blobUrl = createBlobUrl(file);
  imageElement.src = blobUrl;

  const metadata = await extractImageMetadata(file, imageElement);
  const id = generateImageId();

  return {
    id,
    ...metadata,
    url: blobUrl,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Service function to replace an existing image file
 * Handles cleanup of old URL and creates new one
 */
export async function replaceImageFile(
  oldImage: ImageFile | null,
  newFile: File
): Promise<ImageFile> {
  // Clean up old blob URL if exists
  if (oldImage?.url) {
    revokeBlobUrl(oldImage.url);
  }

  // Upload new file
  const updatedImage = await uploadImageFile(newFile);

  // Keep the same ID if replacing existing image
  if (oldImage?.id) {
    updatedImage.id = oldImage.id;
  }

  return updatedImage;
}

/**
 * Service function to delete an image file
 */
export function deleteImageFile(imageFile: ImageFile): void {
  revokeBlobUrl(imageFile.url);
}
