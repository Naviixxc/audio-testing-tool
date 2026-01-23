/**
 * Audio Service Layer - Backend Ready
 * This service abstracts audio file operations and metadata extraction.
 * Can be easily connected to backend API and database.
 */

export interface AudioMetadata {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  duration: number;
  sampleRate: number;
  channels: number;
  createdAt: string;
}

export interface AudioFile extends AudioMetadata {
  url: string;
}

/**
 * Extract audio metadata from an HTML5 Audio element
 * In a real backend scenario, this would come from the database
 */
export async function extractAudioMetadata(
  file: File,
  audioElement: HTMLAudioElement
): Promise<Omit<AudioMetadata, 'id' | 'createdAt'>> {
  return new Promise((resolve) => {
    audioElement.onloadedmetadata = () => {
      resolve({
        fileName: file.name,
        fileType: file.type || 'audio/unknown',
        fileSize: file.size,
        duration: audioElement.duration,
        sampleRate: 44100, // In a real scenario, this would come from Web Audio API analysis
        channels: 2, // Standard stereo
      });
    };
  });
}

/**
 * Generate unique ID for audio files
 * In production, this would come from backend/database
 */
export function generateAudioId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
 * Service function to upload audio file
 * Currently uses blob URLs; can be replaced with backend API call
 */
export async function uploadAudioFile(
  file: File,
  category: 'bgm' | 'sfx'
): Promise<AudioFile> {
  const audioElement = new Audio();
  const blobUrl = createBlobUrl(file);
  audioElement.src = blobUrl;

  const metadata = await extractAudioMetadata(file, audioElement);
  const id = generateAudioId(category);

  return {
    id,
    ...metadata,
    url: blobUrl,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Service function to replace an existing audio file
 * Handles cleanup of old URL and creates new one
 */
export async function replaceAudioFile(
  oldFile: AudioFile,
  newFile: File,
  category: 'bgm' | 'sfx'
): Promise<AudioFile> {
  // Clean up old blob URL
  revokeBlobUrl(oldFile.url);

  // Upload new file
  const updatedFile = await uploadAudioFile(newFile, category);
  
  // Keep the same ID to maintain references in database
  updatedFile.id = oldFile.id;

  return updatedFile;
}

/**
 * Service function to delete an audio file
 */
export function deleteAudioFile(audioFile: AudioFile): void {
  revokeBlobUrl(audioFile.url);
}

/**
 * Format audio duration for display
 */
export function formatAudioDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
