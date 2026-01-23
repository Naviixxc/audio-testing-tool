/**
 * Audio Storage Service using IndexedDB
 * Stores audio files as blobs to persist across browser refreshes
 */

export interface StoredAudioFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  duration: number;
  sampleRate: number;
  channels: number;
  createdAt: string;
  blob: Blob;
}

export interface StoredImageFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  width: number;
  height: number;
  createdAt: string;
  blob: Blob;
}

class AudioStorageService {
  private dbName = 'AudioTesterDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores for audio files
        if (!db.objectStoreNames.contains('audioFiles')) {
          const audioStore = db.createObjectStore('audioFiles', { keyPath: 'id' });
          audioStore.createIndex('fileName', 'fileName', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('imageFiles')) {
          const imageStore = db.createObjectStore('imageFiles', { keyPath: 'id' });
          imageStore.createIndex('fileName', 'fileName', { unique: false });
        }
      };
    });
  }

  async storeAudioFile(audioFile: StoredAudioFile): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['audioFiles'], 'readwrite');
      const store = transaction.objectStore('audioFiles');
      const request = store.put(audioFile);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log(`Stored audio file: ${audioFile.fileName}`);
        resolve();
      };
    });
  }

  async getAudioFile(id: string): Promise<StoredAudioFile | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['audioFiles'], 'readonly');
      const store = transaction.objectStore('audioFiles');
      const request = store.get(id);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          console.log(`Retrieved audio file: ${result.fileName}`);
        } else {
          console.log(`Audio file not found: ${id}`);
        }
        resolve(result || null);
      };
    });
  }

  async getAllAudioFiles(): Promise<StoredAudioFile[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['audioFiles'], 'readonly');
      const store = transaction.objectStore('audioFiles');
      const request = store.getAll();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const results = request.result as StoredAudioFile[];
        console.log(`Retrieved ${results.length} audio files from IndexedDB`);
        resolve(results);
      };
    });
  }

  async storeImageFile(imageFile: StoredImageFile): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['imageFiles'], 'readwrite');
      const store = transaction.objectStore('imageFiles');
      const request = store.put(imageFile);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log(`Stored image file: ${imageFile.fileName}`);
        resolve();
      };
    });
  }

  async getImageFile(id: string): Promise<StoredImageFile | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['imageFiles'], 'readonly');
      const store = transaction.objectStore('imageFiles');
      const request = store.get(id);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          console.log(`Retrieved image file: ${result.fileName}`);
        } else {
          console.log(`Image file not found: ${id}`);
        }
        resolve(result || null);
      };
    });
  }

  async deleteAudioFile(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['audioFiles'], 'readwrite');
      const store = transaction.objectStore('audioFiles');
      const request = store.delete(id);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log(`Deleted audio file: ${id}`);
        resolve();
      };
    });
  }

  async deleteImageFile(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['imageFiles'], 'readwrite');
      const store = transaction.objectStore('imageFiles');
      const request = store.delete(id);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log(`Deleted image file: ${id}`);
        resolve();
      };
    });
  }

  async clearAll(): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['audioFiles', 'imageFiles'], 'readwrite');
      
      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => {
        console.log('Cleared all stored files');
        resolve();
      };
      
      // Clear both stores
      transaction.objectStore('audioFiles').clear();
      transaction.objectStore('imageFiles').clear();
    });
  }

  // Convert blob to URL for audio element
  createBlobURL(blob: Blob): string {
    return URL.createObjectURL(blob);
  }

  // Revoke blob URL to prevent memory leaks
  revokeBlobURL(url: string): void {
    URL.revokeObjectURL(url);
  }
}

// Export singleton instance
export const audioStorage = new AudioStorageService();
