"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Volume2,
  Play,
  Pause,
  RotateCcw,
  Repeat2,
  Plus,
  Trash2,
  Upload,
  AlertCircle,
  Zap,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Image,
  Square,
} from 'lucide-react';
import {
  uploadAudioFile,
  replaceAudioFile,
  deleteAudioFile,
  formatAudioDuration,
  type AudioFile,
} from '@/lib/audioService';
import {
  uploadImageFile,
  replaceImageFile,
  deleteImageFile,
  type ImageFile,
} from '@/lib/imageService';
import { SFXController } from '@/components/SFXController';
import { createSoundQueue, type QueueStats } from '@/lib/queueService';
import { useToast } from '@/hooks/use-toast';
import { audioStorage } from '@/lib/audioStorage';
import Layout from '@/components/Layout';

interface SFXTrack extends AudioFile {
  volume: number;
  isPlaying: boolean;
  currentTime: number;
  loop: boolean;
}

interface WinDialogueTrack extends AudioFile {
  volume: number;
  isPlaying: boolean;
  currentTime: number;
  loop: boolean;
}

export default function AudioTesterTool() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);
  const winDialogueAudioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  const sfxAudioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  const soundQueueRef = useRef(createSoundQueue());
  
  // Fade management refs
  const bgmFadeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const originalBGMVolumeRef = useRef<number>(1);

  // State: Audio Files
  const [bgm, setBgm] = useState<AudioFile | null>(null);
  const [winDialogueTracks, setWinDialogueTracks] = useState<WinDialogueTrack[]>([]);
  const [sfxTracks, setSfxTracks] = useState<SFXTrack[]>([]);

  // State: Reference Image
  const [image, setImage] = useState<ImageFile | null>(null);
  const [imageFitMode, setImageFitMode] = useState<'contain' | 'cover'>('contain');
  const [imageOpacity, setImageOpacity] = useState(1);

  // State: Playback Controls
  const [masterVolume, setMasterVolume] = useState(1);
  const [bgmLoop, setBgmLoop] = useState(false);
  const [bgmVolume, setBgmVolume] = useState(1);
  const [bgmPlaying, setBgmPlaying] = useState(false);
  const [bgmCurrentTime, setBgmCurrentTime] = useState(0);
  const [bgmFadeStatus, setBgmFadeStatus] = useState<'normal' | 'faded' | 'fading-out' | 'fading-in'>('normal');
  const [bgmEffectiveVolume, setBgmEffectiveVolume] = useState(1); // Real-time volume during fades

  // State: Audio Effects
  const [distanceMode, setDistanceMode] = useState<'near' | 'medium' | 'far'>('medium');
  const [positionalMode, setPositionalMode] = useState<'left' | 'center' | 'right'>('center');
  const [dopplerEnabled, setDopplerEnabled] = useState(false);
  const [reverbPreset, setReverbPreset] = useState<'none' | 'room' | 'hall' | 'cave'>('none');
  const [filterMode, setFilterMode] = useState<'none' | 'lowpass' | 'highpass'>('none');
  const [pitchShift, setPitchShift] = useState(1);
  const [fadeInDuration, setFadeInDuration] = useState(0);
  const [fadeOutDuration, setFadeOutDuration] = useState(0);
  const [clipDetected, setClipDetected] = useState(false);
  const [peakVolume, setPeakVolume] = useState(0);
  const [polyphonyLimit, setPolyphonyLimit] = useState(32);
  const [activeSFXCount, setActiveSFXCount] = useState(0);

  // State: SFX Pagination
  const [sfxCurrentPage, setSfxCurrentPage] = useState(1);
  const sfxItemsPerPage = 9;

  // Calculate SFX pagination
  const sfxTotalPages = Math.ceil(sfxTracks.length / sfxItemsPerPage);
  const sfxStartIndex = (sfxCurrentPage - 1) * sfxItemsPerPage;
  const sfxEndIndex = sfxStartIndex + sfxItemsPerPage;
  const sfxPaginatedTracks = sfxTracks.slice(sfxStartIndex, sfxEndIndex);

  // Reset to page 1 when SFX tracks change significantly
  useEffect(() => {
    if (sfxCurrentPage > sfxTotalPages && sfxTotalPages > 0) {
      setSfxCurrentPage(1);
    }
  }, [sfxTracks.length, sfxCurrentPage, sfxTotalPages]);

  // State: UI & Queue
  const [replacingBGM, setReplacingBGM] = useState(false);
  const [replacingWinDialogue, setReplacingWinDialogue] = useState(false);
  const [replacingSFXId, setReplacingSFXId] = useState<string | null>(null);
  const [queueStats, setQueueStats] = useState<QueueStats>({ totalQueued: 0, currentlyPlaying: 0, completed: 0 });
  const [expandedSections, setExpandedSections] = useState({
    bgm: true,
    winDialogue: true,
    sfx: true,
    effects: false,
    image: false,
  });

  // Save progress to IndexedDB and localStorage
  const saveProgress = useCallback(async () => {
    try {
      console.log('Saving progress to IndexedDB...');
      
      // Store audio files in IndexedDB
      if (bgm) {
        const response = await fetch(bgm.url);
        const blob = await response.blob();
        await audioStorage.storeAudioFile({
          id: 'bgm', // Fixed ID for BGM
          fileName: bgm.fileName,
          fileType: bgm.fileType,
          fileSize: bgm.fileSize,
          duration: bgm.duration,
          sampleRate: bgm.sampleRate,
          channels: bgm.channels,
          createdAt: bgm.createdAt,
          blob
        });
      }
      
      // Save Win Dialogue tracks
      if (winDialogueTracks.length > 0) {
        await Promise.all(winDialogueTracks.map(async (track) => {
          const response = await fetch(track.url);
          const blob = await response.blob();
          await audioStorage.storeAudioFile({
            id: track.id,
            fileName: track.fileName,
            fileType: track.fileType,
            fileSize: track.fileSize,
            duration: track.duration,
            sampleRate: track.sampleRate,
            channels: track.channels,
            createdAt: track.createdAt,
            blob
          });
        }));
      }
      
      // Store SFX tracks in IndexedDB
      for (const sfx of sfxTracks) {
        const response = await fetch(sfx.url);
        const blob = await response.blob();
        await audioStorage.storeAudioFile({
          id: sfx.id,
          fileName: sfx.fileName,
          fileType: sfx.fileType,
          fileSize: sfx.fileSize,
          duration: sfx.duration,
          sampleRate: sfx.sampleRate,
          channels: sfx.channels,
          createdAt: sfx.createdAt,
          blob
        });
      }
      
      // Store image in IndexedDB
      if (image) {
        const response = await fetch(image.url);
        const blob = await response.blob();
        await audioStorage.storeImageFile({
          id: 'image', // Fixed ID for image
          fileName: image.fileName,
          fileType: image.fileType,
          fileSize: image.fileSize,
          width: image.width,
          height: image.height,
          createdAt: image.createdAt,
          blob
        });
      }
      
      // Save settings to localStorage (small data only)
      const settings = {
        bgmVolume,
        bgmLoop,
        bgmCurrentTime,
        bgmPlaying,
        sfxTracks: sfxTracks.map(sfx => ({
          id: sfx.id,
          volume: sfx.volume,
          loop: sfx.loop,
          currentTime: sfx.currentTime,
          isPlaying: sfx.isPlaying
        })),
        winDialogueTracks: winDialogueTracks.map(track => ({
          id: track.id,
          volume: track.volume,
          loop: track.loop,
          currentTime: track.currentTime,
          isPlaying: track.isPlaying
        })),
        imageFitMode,
        imageOpacity,
        masterVolume,
        timestamp: Date.now()
      };
      
      localStorage.setItem('audioTesterSettings', JSON.stringify(settings));
      console.log('Progress saved successfully!');
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }, [bgm, bgmVolume, bgmLoop, bgmCurrentTime, bgmPlaying, winDialogueTracks, sfxTracks, image, imageFitMode, imageOpacity, masterVolume]);

  // Load progress from IndexedDB and localStorage
  const loadProgress = useCallback(async () => {
    try {
      console.log('Loading progress from IndexedDB...');
      
      // Initialize IndexedDB
      await audioStorage.init();
      
      // Load settings from localStorage
      const saved = localStorage.getItem('audioTesterSettings');
      if (!saved) {
        console.log('No saved settings found');
        return;
      }
      
      const settings = JSON.parse(saved);
      
      // Check if settings are too old (24 hours)
      if (Date.now() - settings.timestamp > 24 * 60 * 60 * 1000) {
        console.log('Settings are too old, removing...');
        localStorage.removeItem('audioTesterSettings');
        return;
      }
      
      // Restore BGM from IndexedDB
      if (settings.bgmVolume !== undefined) {
        const bgmData = await audioStorage.getAudioFile('bgm');
        if (bgmData) {
          console.log('Restoring BGM from IndexedDB:', bgmData.fileName);
          const url = audioStorage.createBlobURL(bgmData.blob);
          
          const bgmFile: AudioFile = {
            id: 'bgm', // Match the stored ID
            fileName: bgmData.fileName,
            url: url,
            duration: bgmData.duration,
            fileType: bgmData.fileType,
            fileSize: bgmData.fileSize,
            sampleRate: bgmData.sampleRate,
            channels: bgmData.channels,
            createdAt: bgmData.createdAt
          };
          setBgm(bgmFile);
          setBgmVolume(settings.bgmVolume);
          originalBGMVolumeRef.current = settings.bgmVolume; // Set original volume
          setBgmLoop(settings.bgmLoop);
          setBgmCurrentTime(settings.bgmCurrentTime);
          setBgmPlaying(false); // Reset playing state on load
        }
      }
      
      // Restore SFX tracks from IndexedDB
      if (settings.sfxTracks && settings.sfxTracks.length > 0) {
        console.log('Restoring SFX tracks from IndexedDB:', settings.sfxTracks.length);
        const restoredSFX: SFXTrack[] = [];
        
        for (const sfxSettings of settings.sfxTracks) {
          const sfxData = await audioStorage.getAudioFile(sfxSettings.id);
          if (sfxData) {
            const url = audioStorage.createBlobURL(sfxData.blob);
            restoredSFX.push({
              id: sfxData.id,
              fileName: sfxData.fileName,
              url: url,
              duration: sfxData.duration,
              fileType: sfxData.fileType,
              fileSize: sfxData.fileSize,
              sampleRate: sfxData.sampleRate,
              channels: sfxData.channels,
              createdAt: sfxData.createdAt,
              volume: sfxSettings.volume,
              loop: sfxSettings.loop,
              isPlaying: false, // Reset playing state on load
              currentTime: 0 // Reset time on load
            });
          }
        }
        
        setSfxTracks(restoredSFX);
      }
      
      // Restore image from IndexedDB
      if (settings.imageFitMode !== undefined) {
        const imageData = await audioStorage.getImageFile('image');
        if (imageData) {
          console.log('Restoring image from IndexedDB:', imageData.fileName);
          const url = audioStorage.createBlobURL(imageData.blob);
          
          const imageFile: ImageFile = {
            id: 'image', // Match the stored ID
            fileName: imageData.fileName,
            url: url,
            fileType: imageData.fileType,
            fileSize: imageData.fileSize,
            width: imageData.width,
            height: imageData.height,
            createdAt: imageData.createdAt
          };
          setImage(imageFile);
          setImageFitMode(settings.imageFitMode);
          setImageOpacity(settings.imageOpacity);
        }
      }
      
      // Restore master volume
      setMasterVolume(settings.masterVolume);
      console.log('Progress loaded successfully!');
      
      // Recreate audio elements after a short delay to ensure DOM is ready
      setTimeout(() => {
        // Create BGM audio element if needed
        if (bgm && !bgmAudioRef.current) {
          console.log('Creating BGM audio element from IndexedDB');
          const bgmAudioEl = new Audio(bgm.url);
          bgmAudioEl.preload = 'auto';
          bgmAudioEl.crossOrigin = 'anonymous';
          bgmAudioRef.current = bgmAudioEl;
          bgmAudioEl.volume = bgmVolume * masterVolume;
          bgmAudioEl.loop = bgmLoop;
        }
      }, 100);
      
    } catch (error) {
      console.error('Failed to load progress:', error);
      localStorage.removeItem('audioTesterSettings');
    }
  }, []);

  // Clear saved progress
  const clearProgress = useCallback(async () => {
    try {
      console.log('Clearing all progress...');
      await audioStorage.clearAll();
      localStorage.removeItem('audioTesterSettings');
      
      // Clear all state
      setBgm(null);
      setWinDialogueTracks([]);
      setSfxTracks([]);
      setImage(null);
      
      // Reset all settings
      setBgmVolume(1);
      setBgmLoop(false);
      setBgmCurrentTime(0);
      setBgmPlaying(false);
      setImageFitMode('contain');
      setImageOpacity(1);
      setMasterVolume(1);
      
      // Clear audio refs
      sfxAudioRefs.current.clear();
      bgmAudioRef.current = null;
      winDialogueAudioRefs.current.clear();
      
      toast({ title: 'Progress cleared', description: 'All saved data has been removed' });
    } catch (error) {
      console.error('Failed to clear progress:', error);
      toast({ title: 'Clear failed', description: 'Failed to clear all data' });
    }
  }, []);

  // Auto-save progress when state changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveProgress();
    }, 500); // Debounce 500ms
    return () => clearTimeout(timeoutId);
  }, [bgm, bgmVolume, bgmLoop, bgmCurrentTime, bgmPlaying, winDialogueTracks, sfxTracks, image, imageFitMode, imageOpacity, masterVolume]);

  // Load progress on mount
  useEffect(() => {
    loadProgress();
  }, []);
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  const { toast } = useToast();

  // Setup queue listeners
  useEffect(() => {
    const queue = soundQueueRef.current;
    queue.onUpdate(() => {
      setQueueStats(queue.getStats());
    });
    return () => {
      queue.dispose();
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (bgm) deleteAudioFile(bgm);
      winDialogueTracks.forEach((track) => deleteAudioFile(track));
      sfxTracks.forEach((sfx) => deleteAudioFile(sfx));
      if (image) deleteImageFile(image);
    };
  }, []);

  // BGM Upload
  const handleBGMUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const t = toast({ title: 'Uploading BGM', description: file.name });
    setReplacingBGM(true);
    try {
      const audioFile = await uploadAudioFile(file, 'bgm');
      setBgm(audioFile);
      setBgmCurrentTime(0);
      setBgmPlaying(false);
      t.update({ id: t.id, title: 'BGM uploaded', description: file.name });
    } catch (error: any) {
      console.error('BGM upload failed:', error);
      t.update({ id: t.id, title: 'BGM upload failed', description: String(error?.message || error) });
    } finally {
      setReplacingBGM(false);
    }
  };

  // BGM Replace
  const handleBGMReplace = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file || !bgm) return;
      setReplacingBGM(true);
      try {
        const newFile = await replaceAudioFile(bgm, file, 'bgm');
        setBgm(newFile);
        setBgmCurrentTime(0);
        setBgmPlaying(false);
      } catch (error) {
        console.error('BGM replace failed:', error);
      } finally {
        setReplacingBGM(false);
      }
    };
    input.click();
  };

  // Win Dialogue Upload
  const handleWinDialogueUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if we've reached the 8 file limit
    if (winDialogueTracks.length >= 8) {
      toast({ 
        title: 'Upload failed', 
        description: 'Maximum 8 Win Dialogue files allowed' 
      });
      return;
    }

    const t = toast({ title: 'Uploading Win Dialogue', description: file.name });
    setReplacingWinDialogue(true);
    try {
      console.log('Starting Win Dialogue upload for file:', file.name, file.size, file.type);
      const audioFile = await uploadAudioFile(file, 'sfx');
      console.log('Win Dialogue upload successful, audioFile:', audioFile);
      const winDialogueTrack: WinDialogueTrack = {
        ...audioFile,
        volume: 1,
        isPlaying: false,
        currentTime: 0,
        loop: false,
      };
      setWinDialogueTracks((prev) => [...prev, winDialogueTrack]);
      t.update({ id: t.id, title: 'Win Dialogue uploaded', description: file.name });
    } catch (error: any) {
      console.error('Win Dialogue upload failed:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      t.update({ id: t.id, title: 'Win Dialogue upload failed', description: String(error?.message || error) });
    } finally {
      setReplacingWinDialogue(false);
    }
  };

  // Win Dialogue Replace
  const handleWinDialogueReplace = (trackId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setReplacingWinDialogue(true);
      try {
        const track = winDialogueTracks.find(t => t.id === trackId);
        if (!track) return;
        const newFile = await replaceAudioFile(track, file, 'sfx');
        setWinDialogueTracks(prev => prev.map(t => t.id === trackId ? { ...newFile, volume: t.volume, isPlaying: t.isPlaying, currentTime: t.currentTime, loop: t.loop } : t));
      } catch (error) {
        console.error('Win Dialogue replace failed:', error);
      } finally {
        setReplacingWinDialogue(false);
      }
    };
    input.click();
  };

  // SFX Upload - Single file via button
  const handleSFXUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const t = toast({ title: 'Uploading SFX', description: file.name });
    try {
      const audioFile = await uploadAudioFile(file, 'sfx');
      const sfxTrack: SFXTrack = {
        ...audioFile,
        volume: 1,
        isPlaying: false,
        currentTime: 0,
        loop: false,
      };
      setSfxTracks((prev) => [...prev, sfxTrack]);
      t.update({ id: t.id, title: 'SFX uploaded', description: file.name });
    } catch (error: any) {
      console.error('SFX upload failed:', error);
      t.update({ id: t.id, title: 'SFX upload failed', description: String(error?.message || error) });
    }
  };

  // Utility function to extract audio files from DataTransfer (supports files and folders)
  const extractAudioFilesFromDataTransfer = async (dataTransfer: DataTransfer): Promise<File[]> => {
    const files: File[] = [];
    
    // Handle direct files
    for (let i = 0; i < dataTransfer.items.length; i++) {
      const item = dataTransfer.items[i];
      
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry();
        if (entry) {
          if (entry.isFile) {
            const file = item.getAsFile();
            if (file && file.type.startsWith('audio/')) {
              files.push(file);
            }
          } else if (entry.isDirectory) {
            // Recursively read directory
            const dirFiles = await readDirectoryEntry(entry as FileSystemDirectoryEntry);
            files.push(...dirFiles);
          }
        }
      }
    }
    
    return files;
  };

  // Recursively read directory entries
  const readDirectoryEntry = async (directoryEntry: FileSystemDirectoryEntry): Promise<File[]> => {
    const files: File[] = [];
    const reader = directoryEntry.createReader();
    
    return new Promise((resolve) => {
      reader.readEntries(async (entries) => {
        for (const entry of entries) {
          if (entry.isFile) {
            const file = await getFileFromEntry(entry as FileSystemFileEntry);
            if (file && file.type.startsWith('audio/')) {
              files.push(file);
            }
          } else if (entry.isDirectory) {
            const dirFiles = await readDirectoryEntry(entry as FileSystemDirectoryEntry);
            files.push(...dirFiles);
          }
        }
        resolve(files);
      });
    });
  };

  // Get File from FileSystemFileEntry
  const getFileFromEntry = (fileEntry: FileSystemFileEntry): Promise<File | null> => {
    return new Promise((resolve) => {
      fileEntry.file((file) => {
        resolve(file);
      });
    });
  };

  // SFX Drag-and-Drop Upload - Multiple files and folders at once
  const handleSFXDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
  };

  const handleSFXDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.backgroundColor = 'transparent';
  };

  const handleSFXDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.backgroundColor = 'transparent';

    const audioFiles = await extractAudioFilesFromDataTransfer(e.dataTransfer);

    if (audioFiles.length === 0) return;

    const t = toast({ title: 'Uploading SFX batch', description: `${audioFiles.length} files` });
    // Upload all files in parallel
    const uploadPromises = audioFiles.map(async (file) => {
      try {
        const audioFile = await uploadAudioFile(file, 'sfx');
        const sfxTrack: SFXTrack = {
          ...audioFile,
          volume: 1,
          isPlaying: false,
          currentTime: 0,
          loop: false,
        };
        return sfxTrack;
      } catch (error) {
        console.error(`SFX upload failed for ${file.name}:`, error);
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    const successful = results.filter((r): r is SFXTrack => r !== null);
    
    setSfxTracks((prev) => [...prev, ...successful]);
    t.update({ id: t.id, title: 'SFX batch uploaded', description: `${successful.length} files added` });
  };

  // BGM Drag-and-Drop Upload
  const handleBGMDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
  };

  const handleBGMDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.backgroundColor = 'transparent';
  };

  const handleBGMDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.backgroundColor = 'transparent';

    const audioFiles = await extractAudioFilesFromDataTransfer(e.dataTransfer);
    
    if (audioFiles.length === 0) return;
    
    // Take the first audio file for BGM
    const file = audioFiles[0];
    setReplacingBGM(true);
    try {
      const audioFile = await uploadAudioFile(file, 'bgm');
      if (bgm) deleteAudioFile(bgm);
      setBgm(audioFile);
      setBgmPlaying(false);
      setBgmCurrentTime(0);
      toast({ title: 'BGM uploaded', description: file.name });
    } catch (error: any) {
      console.error('BGM upload failed:', error);
      toast({ title: 'BGM upload failed', description: String(error?.message || error) });
    } finally {
      setReplacingBGM(false);
    }
  };

  // Win Dialogue Drag-and-Drop Upload
  const handleWinDialogueDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
  };

  const handleWinDialogueDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.backgroundColor = 'transparent';
  };

  const handleWinDialogueDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.backgroundColor = 'transparent';

    try {
      const audioFiles = await extractAudioFilesFromDataTransfer(e.dataTransfer);
      
      if (audioFiles.length === 0) {
        toast({ title: 'Invalid files', description: 'No audio files found' });
        return;
      }
      
      // Check if adding these files would exceed the 8 file limit
      const availableSlots = 8 - winDialogueTracks.length;
      const filesToProcess = audioFiles.slice(0, availableSlots);
      
      if (filesToProcess.length === 0) {
        toast({ 
          title: 'Upload failed', 
          description: 'Maximum 8 Win Dialogue files allowed' 
        });
        return;
      }
      
      if (audioFiles.length > availableSlots) {
        toast({ 
          title: 'Limited upload', 
          description: `Only first ${availableSlots} files will be uploaded (8 file limit)` 
        });
      }
      
      setReplacingWinDialogue(true);
      
      // Process each file
      for (const file of filesToProcess) {
        try {
          const audioFile = await uploadAudioFile(file, 'sfx');
          const winDialogueTrack: WinDialogueTrack = {
            ...audioFile,
            volume: 1,
            isPlaying: false,
            currentTime: 0,
            loop: false,
          };
          setWinDialogueTracks(prev => [...prev, winDialogueTrack]);
        } catch (error: any) {
          console.error(`Win Dialogue upload failed for ${file.name}:`, error);
          toast({ title: 'Upload failed', description: `Failed to upload ${file.name}` });
        }
      }
      
      toast({ title: 'Win Dialogue uploaded', description: `${filesToProcess.length} files added` });
    } catch (error: any) {
      console.error('Win Dialogue upload failed:', error);
      toast({ title: 'Upload failed', description: String(error?.message || error) });
    } finally {
      setReplacingWinDialogue(false);
    }
  };
  const handleSFXReplace = (sfxId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setReplacingSFXId(sfxId);
      try {
        const sfxTrack = sfxTracks.find((t) => t.id === sfxId);
        if (!sfxTrack) return;
        const newFile = await replaceAudioFile(sfxTrack, file, 'sfx');
        setSfxTracks((prev) =>
          prev.map((t) =>
            t.id === sfxId
              ? { ...t, ...newFile, currentTime: 0, isPlaying: false }
              : t
          )
        );
      } catch (error) {
        console.error('SFX replace failed:', error);
      } finally {
        setReplacingSFXId(null);
      }
    };
    input.click();
  };

  // SFX Delete
  const handleSFXDelete = (sfxId: string) => {
    const sfxTrack = sfxTracks.find((t) => t.id === sfxId);
    if (sfxTrack) {
      deleteAudioFile(sfxTrack);
      setSfxTracks((prev) => prev.filter((t) => t.id !== sfxId));
      const audioEl = sfxAudioRefs.current.get(sfxId);
      if (audioEl) {
        audioEl.pause();
        sfxAudioRefs.current.delete(sfxId);
      }
    }
  };

  // Image Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const t = toast({ title: 'Uploading image', description: file.name });
    try {
      const imageFile = await uploadImageFile(file);
      setImage(imageFile);
      t.update({ id: t.id, title: 'Image uploaded', description: file.name });
    } catch (error: any) {
      console.error('Image upload failed:', error);
      t.update({ id: t.id, title: 'Image upload failed', description: String(error?.message || error) });
    }
  };

  // Image Replace
  const handleImageReplace = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file || !image) return;
      try {
        const newFile = await replaceImageFile(image, file);
        setImage(newFile);
      } catch (error) {
        console.error('Image replace failed:', error);
      }
    };
    input.click();
  };

  // BGM Playback
  const toggleBGMPlayback = () => {
    if (!bgm || !bgmAudioRef.current) return;
    if (bgmPlaying) {
      bgmAudioRef.current.pause();
      setBgmPlaying(false);
    } else {
      bgmAudioRef.current.play();
      setBgmPlaying(true);
    }
  };

  const stopBGM = () => {
    if (!bgmAudioRef.current) return;
    bgmAudioRef.current.pause();
    bgmAudioRef.current.currentTime = 0;
    setBgmPlaying(false);
    setBgmCurrentTime(0);
  };

  const restartBGM = () => {
    if (!bgmAudioRef.current) return;
    bgmAudioRef.current.currentTime = 0;
    setBgmCurrentTime(0);
    if (bgmPlaying) {
      bgmAudioRef.current.play();
    }
  };

  // BGM Fade Functions
  const fadeOutBGM = useCallback(() => {
    if (!bgmAudioRef.current || bgmVolume === 0) return;
    
    // Clear any existing fade interval
    if (bgmFadeIntervalRef.current) {
      clearInterval(bgmFadeIntervalRef.current);
    }
    
    // Store original volume
    originalBGMVolumeRef.current = bgmVolume;
    
    const fadeDuration = 1000; // 1 second
    const fadeSteps = 20; // 20 steps for smooth fade
    const fadeInterval = fadeDuration / fadeSteps;
    const volumeStep = bgmVolume / fadeSteps;
    let currentStep = 0;
    
    bgmFadeIntervalRef.current = setInterval(() => {
      currentStep++;
      const newVolume = Math.max(0, bgmVolume - (volumeStep * currentStep));
      
      if (bgmAudioRef.current) {
        bgmAudioRef.current.volume = newVolume * masterVolume;
      }
      
      if (currentStep >= fadeSteps || newVolume <= 0) {
        if (bgmFadeIntervalRef.current) {
          clearInterval(bgmFadeIntervalRef.current);
          bgmFadeIntervalRef.current = null;
        }
        if (bgmAudioRef.current) {
          bgmAudioRef.current.volume = 0;
        }
      }
    }, fadeInterval);
  }, [bgmVolume, masterVolume]);
  
  const fadeInBGM = useCallback(() => {
    if (!bgmAudioRef.current || !bgmPlaying) return;
    
    // Clear any existing fade interval
    if (bgmFadeIntervalRef.current) {
      clearInterval(bgmFadeIntervalRef.current);
    }
    
    const targetVolume = originalBGMVolumeRef.current;
    const fadeDuration = 1000; // 1 second
    const fadeSteps = 20; // 20 steps for smooth fade
    const fadeInterval = fadeDuration / fadeSteps;
    const volumeStep = targetVolume / fadeSteps;
    let currentStep = 0;
    
    bgmFadeIntervalRef.current = setInterval(() => {
      currentStep++;
      const newVolume = Math.min(targetVolume, volumeStep * currentStep);
      
      if (bgmAudioRef.current) {
        bgmAudioRef.current.volume = newVolume * masterVolume;
      }
      
      if (currentStep >= fadeSteps || newVolume >= targetVolume) {
        if (bgmFadeIntervalRef.current) {
          clearInterval(bgmFadeIntervalRef.current);
          bgmFadeIntervalRef.current = null;
        }
        if (bgmAudioRef.current) {
          bgmAudioRef.current.volume = targetVolume * masterVolume;
        }
      }
    }, fadeInterval);
  }, [bgmPlaying, masterVolume]);

  // Win Dialogue-specific BGM fade functions (50% over 5 seconds)
  const fadeOutBGMForWinDialogue = useCallback(() => {
    if (!bgmAudioRef.current || bgmVolume === 0) return;
    
    // Clear any existing fade interval
    if (bgmFadeIntervalRef.current) {
      clearInterval(bgmFadeIntervalRef.current);
    }
    
    // Set fade status
    setBgmFadeStatus('fading-out');
    
    // Store original volume if not already stored
    if (originalBGMVolumeRef.current === 0) {
      originalBGMVolumeRef.current = bgmVolume;
    }
    
    const fadeDuration = 5000; // 5 seconds
    const fadeSteps = 50; // 50 steps for smooth fade
    const fadeInterval = fadeDuration / fadeSteps;
    const targetVolume = originalBGMVolumeRef.current * 0.5; // 50% of original
    const volumeDifference = bgmAudioRef.current.volume / masterVolume - targetVolume;
    const volumeStep = volumeDifference / fadeSteps;
    let currentStep = 0;
    
    bgmFadeIntervalRef.current = setInterval(() => {
      currentStep++;
      const newVolume = Math.max(targetVolume, (bgmAudioRef.current!.volume / masterVolume) - volumeStep);
      
      if (bgmAudioRef.current) {
        bgmAudioRef.current.volume = newVolume * masterVolume;
        // Update effective volume display
        setBgmEffectiveVolume(newVolume);
      }
      
      if (currentStep >= fadeSteps || newVolume <= targetVolume) {
        if (bgmFadeIntervalRef.current) {
          clearInterval(bgmFadeIntervalRef.current);
          bgmFadeIntervalRef.current = null;
        }
        if (bgmAudioRef.current) {
          bgmAudioRef.current.volume = targetVolume * masterVolume;
          setBgmEffectiveVolume(targetVolume);
        }
        setBgmFadeStatus('faded'); // Set to faded when complete
      }
    }, fadeInterval);
  }, [bgmVolume, masterVolume]);
  
  const fadeInBGMFromWinDialogue = useCallback(() => {
    if (!bgmAudioRef.current || !bgmPlaying) return;
    
    // Clear any existing fade interval
    if (bgmFadeIntervalRef.current) {
      clearInterval(bgmFadeIntervalRef.current);
    }
    
    const targetVolume = originalBGMVolumeRef.current;
    const currentVolume = bgmAudioRef.current.volume / masterVolume;
    
    // Only fade if we're currently at 50% or less
    if (currentVolume >= targetVolume * 0.9) {
      setBgmFadeStatus('normal'); // Already at or near full volume
      setBgmEffectiveVolume(targetVolume);
      return; 
    }
    
    // Set fade status
    setBgmFadeStatus('fading-in');
    
    const fadeDuration = 5000; // 5 seconds
    const fadeSteps = 50; // 50 steps for smooth fade
    const fadeInterval = fadeDuration / fadeSteps;
    const volumeDifference = targetVolume - currentVolume;
    const volumeStep = volumeDifference / fadeSteps;
    let currentStep = 0;
    
    bgmFadeIntervalRef.current = setInterval(() => {
      currentStep++;
      const newVolume = Math.min(targetVolume, currentVolume + (volumeStep * currentStep));
      
      if (bgmAudioRef.current) {
        bgmAudioRef.current.volume = newVolume * masterVolume;
        // Update effective volume display
        setBgmEffectiveVolume(newVolume);
      }
      
      if (currentStep >= fadeSteps || newVolume >= targetVolume) {
        if (bgmFadeIntervalRef.current) {
          clearInterval(bgmFadeIntervalRef.current);
          bgmFadeIntervalRef.current = null;
        }
        if (bgmAudioRef.current) {
          bgmAudioRef.current.volume = targetVolume * masterVolume;
          setBgmEffectiveVolume(targetVolume);
        }
        // Reset original volume reference and status
        originalBGMVolumeRef.current = targetVolume;
        setBgmFadeStatus('normal');
      }
    }, fadeInterval);
  }, [bgmPlaying, masterVolume]);

  const activeWinDialogueIdRef = useRef<string | null>(null);
  const winDialogueEndedHandlersRef = useRef(new Map<string, () => void>());

  const removeWinDialogueEndedHandler = (trackId: string) => {
    const audioRef = winDialogueAudioRefs.current.get(trackId);
    const handler = winDialogueEndedHandlersRef.current.get(trackId);
    if (audioRef && handler) {
      audioRef.removeEventListener('ended', handler);
    }
    winDialogueEndedHandlersRef.current.delete(trackId);
  };

  // Win Dialogue Playback
  const toggleWinDialoguePlayback = (trackId: string) => {
    const track = winDialogueTracks.find(t => t.id === trackId);
    const audioRef = winDialogueAudioRefs.current.get(trackId);
    
    if (!track || !audioRef) return;
    
    if (track.isPlaying) {
      // Pause this Win Dialogue and fade BGM back in
      removeWinDialogueEndedHandler(trackId);
      audioRef.pause();
      const ct = audioRef.currentTime || 0;
      setWinDialogueTracks(prev => prev.map(t => 
        t.id === trackId ? { ...t, isPlaying: false, currentTime: ct } : t
      ));
      if (activeWinDialogueIdRef.current === trackId) {
        activeWinDialogueIdRef.current = null;
      }
      fadeInBGMFromWinDialogue(); // Fade BGM back in from 50%
      return;
    }

    // Exclusive playback: stop any other currently playing Win Dialogue immediately
    const otherPlayingIds = winDialogueTracks.filter(t => t.isPlaying && t.id !== trackId).map(t => t.id);
    if (otherPlayingIds.length > 0) {
      otherPlayingIds.forEach((id) => {
        const otherAudio = winDialogueAudioRefs.current.get(id);
        if (otherAudio) {
          removeWinDialogueEndedHandler(id);
          otherAudio.pause();
          try {
            otherAudio.currentTime = 0;
          } catch {
            // ignore
          }
        }
      });
    }

    // Start this Win Dialogue and fade BGM out to 50%
    fadeOutBGMForWinDialogue(); // Fade BGM to 50% over 5 seconds
    removeWinDialogueEndedHandler(trackId);
    activeWinDialogueIdRef.current = trackId;

    // Update state for exclusivity in one shot
    const stoppedSet = new Set(otherPlayingIds);
    setWinDialogueTracks(prev => prev.map(t => {
      if (t.id === trackId) return { ...t, isPlaying: true };
      if (stoppedSet.has(t.id)) return { ...t, isPlaying: false, currentTime: 0 };
      return t;
    }));

    // Set up ended event to fade BGM back in when Win Dialogue finishes
    const handleWinDialogueEnded = () => {
      setWinDialogueTracks(prev => prev.map(t => 
        t.id === trackId ? { ...t, isPlaying: false, currentTime: 0 } : t
      ));
      if (activeWinDialogueIdRef.current === trackId) {
        activeWinDialogueIdRef.current = null;
      }
      fadeInBGMFromWinDialogue(); // Fade BGM back in from 50%
      removeWinDialogueEndedHandler(trackId);
    };
    winDialogueEndedHandlersRef.current.set(trackId, handleWinDialogueEnded);
    audioRef.addEventListener('ended', handleWinDialogueEnded);

    const playPromise = audioRef.play();
    if (playPromise) {
      playPromise.catch((err) => {
        console.error('[toggleWinDialoguePlayback] play failed:', err);
        setWinDialogueTracks(prev => prev.map(t => 
          t.id === trackId ? { ...t, isPlaying: false } : t
        ));
        if (activeWinDialogueIdRef.current === trackId) {
          activeWinDialogueIdRef.current = null;
        }
        removeWinDialogueEndedHandler(trackId);
        fadeInBGMFromWinDialogue();
      });
    }
  };

  const stopWinDialogue = (trackId: string) => {
    const audioRef = winDialogueAudioRefs.current.get(trackId);
    if (!audioRef) return;
    removeWinDialogueEndedHandler(trackId);
    audioRef.pause();
    audioRef.currentTime = 0;
    setWinDialogueTracks(prev => prev.map(t => 
      t.id === trackId ? { ...t, isPlaying: false, currentTime: 0 } : t
    ));
    if (activeWinDialogueIdRef.current === trackId) {
      activeWinDialogueIdRef.current = null;
    }
    fadeInBGMFromWinDialogue(); // Fade BGM back in from 50% when stopped
  };

  const restartWinDialogue = (trackId: string) => {
    const track = winDialogueTracks.find(t => t.id === trackId);
    const audioRef = winDialogueAudioRefs.current.get(trackId);
    if (!audioRef || !track) return;
    audioRef.currentTime = 0;
    setWinDialogueTracks(prev => prev.map(t => 
      t.id === trackId ? { ...t, currentTime: 0 } : t
    ));
    if (track.isPlaying) {
      audioRef.play();
    }
  };

  // Load progress on mount
  useEffect(() => {
    loadProgress();
  }, []);

  // Store event handlers to properly remove them later
  const sfxEventHandlers = useRef(new Map<string, {
    handleEnded: () => void;
    handleTimeUpdate: () => void;
    handleError: (e: Event) => void;
    handlePlaying: () => void;
    handlePause: () => void;
  }>());

  // Used to cancel in-flight play() calls when users spam play/stop.
  // Token increments invalidate any previous async play attempt.
  const sfxPlaybackTokenRef = useRef(new Map<string, number>());

  const bumpSfxToken = (sfxId: string) => {
    const next = (sfxPlaybackTokenRef.current.get(sfxId) ?? 0) + 1;
    sfxPlaybackTokenRef.current.set(sfxId, next);
    return next;
  };

  // Keep this derived so it never drifts when users spam controls.
  useEffect(() => {
    setActiveSFXCount(sfxTracks.filter(t => t.isPlaying).length);
  }, [sfxTracks]);

  // Perfectly spammable SFX playback system with proper cleanup
  const playSFX = useCallback((sfxId: string, onEnded?: () => void) => {
    const sfxTrack = sfxTracks.find((t) => t.id === sfxId);
    if (!sfxTrack) {
      console.warn('[playSFX] SFX track not found:', sfxId);
      return;
    }

    // Invalidate any previous play attempt for this SFX
    const token = bumpSfxToken(sfxId);

    // Ensure we reuse the same audio element per SFX id
    let audioEl = sfxAudioRefs.current.get(sfxId);
    if (!audioEl) {
      audioEl = new Audio(sfxTrack.url);
      audioEl.preload = 'auto';
      audioEl.crossOrigin = 'anonymous';
      sfxAudioRefs.current.set(sfxId, audioEl);

      const newHandlers = {
        handleEnded: () => {
          setSfxTracks((prev) =>
            prev.map((t) => (t.id === sfxId ? { ...t, isPlaying: false } : t))
          );
          try {
            onEnded?.();
          } catch (err) {
            console.error('[playSFX] onEnded handler error:', err);
          }
        },
        handleTimeUpdate: () => {
          const ct = audioEl!.currentTime || 0;
          setSfxTracks((prev) => prev.map((t) => (t.id === sfxId ? { ...t, currentTime: ct } : t)));
        },
        handleError: (e: Event) => {
          console.error('[playSFX] audio element error', e);
          setSfxTracks((prev) =>
            prev.map((t) => (t.id === sfxId ? { ...t, isPlaying: false } : t))
          );
        },
        handlePlaying: () => {
          setSfxTracks((prev) =>
            prev.map((t) => (t.id === sfxId ? { ...t, isPlaying: true } : t))
          );
        },
        handlePause: () => {
          setSfxTracks((prev) =>
            prev.map((t) => (t.id === sfxId ? { ...t, isPlaying: false } : t))
          );
        },
      };

      sfxEventHandlers.current.set(sfxId, newHandlers);
      audioEl.addEventListener('ended', newHandlers.handleEnded);
      audioEl.addEventListener('timeupdate', newHandlers.handleTimeUpdate);
      audioEl.addEventListener('error', newHandlers.handleError);
      audioEl.addEventListener('playing', newHandlers.handlePlaying);
      audioEl.addEventListener('pause', newHandlers.handlePause);
    } else if (audioEl.src !== sfxTrack.url) {
      audioEl.src = sfxTrack.url;
    }

    // Hard stop current playback before restarting (prevents stacking)
    audioEl.pause();
    try {
      audioEl.currentTime = 0;
    } catch {
      // ignore
    }
    audioEl.volume = sfxTrack.volume * masterVolume;
    audioEl.loop = sfxTrack.loop;

    // Update UI immediately to reflect restart
    setSfxTracks((prev) =>
      prev.map((t) => (t.id === sfxId ? { ...t, isPlaying: true, currentTime: 0 } : t))
    );

    const playPromise = audioEl.play();
    if (playPromise) {
      playPromise
        .then(() => {
          // If user pressed stop/play again while play() was pending, cancel this start.
          if ((sfxPlaybackTokenRef.current.get(sfxId) ?? 0) !== token) {
            audioEl!.pause();
            try {
              audioEl!.currentTime = 0;
            } catch {
              // ignore
            }
          }
        })
        .catch((error) => {
          console.error('[playSFX] playback failed:', error);
          if ((sfxPlaybackTokenRef.current.get(sfxId) ?? 0) === token) {
            setSfxTracks((prev) =>
              prev.map((t) => (t.id === sfxId ? { ...t, isPlaying: false } : t))
            );
          }
        });
    }
  }, [sfxTracks, masterVolume]);

  const pauseSFX = (sfxId: string) => {
    const audioEl = sfxAudioRefs.current.get(sfxId);
    if (audioEl) {
      bumpSfxToken(sfxId);
      audioEl.pause();
      const ct = audioEl.currentTime || 0;
      setSfxTracks((prev) =>
        prev.map((t) => (t.id === sfxId ? { ...t, isPlaying: false, currentTime: ct } : t))
      );
    }
  };

  const stopSFX = (sfxId: string) => {
    const audioEl = sfxAudioRefs.current.get(sfxId);
    if (audioEl) {
      bumpSfxToken(sfxId);
      audioEl.pause();
      audioEl.currentTime = 0;
      setSfxTracks((prev) =>
        prev.map((t) => (t.id === sfxId ? { ...t, isPlaying: false, currentTime: 0 } : t))
      );
    }
  };

  const restartSFX = (sfxId: string) => {
    // Restart should behave like a spammable play: immediately restart from 0.
    playSFX(sfxId);
  };

  const seekSFX = (sfxId: string, time: number) => {
    const audioEl = sfxAudioRefs.current.get(sfxId);
    if (audioEl) {
      audioEl.currentTime = time;
      setSfxTracks((prev) =>
        prev.map((t) => (t.id === sfxId ? { ...t, currentTime: time } : t))
      );
    }
  };

  // Ultra-reliable stop function with proper cleanup
  const forceStopSFX = (sfxId: string) => {
    // Get the audio element and its handlers
    const audioEl = sfxAudioRefs.current.get(sfxId);

    // Cancel any pending play() that may still resolve after we stop
    bumpSfxToken(sfxId);
    
    if (audioEl) {
      try {
        // Stop immediately. We intentionally keep the audio element (and listeners)
        // so repeated play is instant and UI events keep working.
        audioEl.pause();
        try {
          audioEl.currentTime = 0;
        } catch {
          // ignore
        }
        // keep volume/loop as configured; stop should not mutate settings
        
      } catch (error) {
        console.error('[forceStopSFX] Error stopping audio:', error);
      }
    }
    
    // Note: keep references so next play is immediate.
    // We only clear refs on delete/replace.
    
    // Always update UI state immediately
    setSfxTracks((prev) =>
      prev.map((t) => (t.id === sfxId ? { ...t, isPlaying: false, currentTime: 0 } : t))
    );
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const stopAllSFX = useCallback(() => {
    if (sfxTracks.length === 0) return;
    
    // Stop all currently playing SFX
    sfxTracks.forEach((sfx) => {
      if (sfx.isPlaying) {
        forceStopSFX(sfx.id);
      }
    });
  }, [sfxTracks]);

  const playAllSFX = useCallback(() => {
    if (sfxTracks.length === 0) return;
    // Trigger each SFX with a small stagger for reliability
    sfxTracks.forEach((sfx, index) => {
      setTimeout(() => {
        playSFX(sfx.id);
      }, index * 10); // 10ms stagger between each SFX
    });
  }, [sfxTracks]);

  return (
    <Layout>
      <div id="main" className="min-h-screen bg-background text-foreground">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur">
          <div className="max-w-full px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img src="/Image/Dijoker.svg" alt="DiJoker logo" className="w-70 h-22 rounded-md" />
                <div>
                  <p className="text-sm text-muted-foreground mt-1"></p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="hidden sm:inline">Auto-save enabled</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearProgress}
                  className="flex items-center justify-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium text-sm transition-colors"
                  title="Clear all saved progress"
                >
                  <Trash2 size={14} />
                  Clear Progress
                </button>
              </div>
            </div>
          </div>
        </header>

      {/* Main Layout: Single Container */}
      <div className="p-6 max-w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_300px] gap-6">
          
          {/* Left: SFX Controllers */}
          <div className="space-y-6">
            <section className="rounded-lg border border-border bg-card/30 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="font-semibold flex items-center gap-2">
                  <Zap size={18} className="text-primary" />
                  Sound Effects ({sfxTracks.length})
                  <span className="text-sm text-muted-foreground ml-3">Active SFX {activeSFXCount} of {polyphonyLimit}</span>
                </h2>
                <div className="flex gap-2">
                  {sfxTracks.length > 0 && (
                    <>
                      <button
                        onClick={playAllSFX}
                        className="flex items-center justify-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded font-medium text-sm transition-colors"
                        title="Play all SFX simultaneously"
                      >
                        <Play size={16} />
                        Play All
                      </button>
                      <button
                        onClick={stopAllSFX}
                        className="flex items-center justify-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-medium text-sm transition-colors"
                        title="Stop all playing SFX"
                      >
                        <Square size={16} />
                        Stop All
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'audio/*';
                      input.onchange = (e) => {
                        const target = e.target as HTMLInputElement;
                        handleSFXUpload({ target } as React.ChangeEvent<HTMLInputElement>);
                      };
                      input.click();
                    }}
                  className="flex items-center justify-center gap-1 px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded font-medium text-sm transition-colors"
                >
                  <Plus size={16} />
                  Add SFX
                </button>
              </div>
            </div>

            <div className="p-4">
              {sfxTracks.length === 0 ? (
                <div
                  onDragOver={handleSFXDragOver}
                  onDragLeave={handleSFXDragLeave}
                  onDrop={handleSFXDrop}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'audio/*';
                    input.onchange = (e) => {
                      const target = e.target as HTMLInputElement;
                      handleSFXUpload({ target } as React.ChangeEvent<HTMLInputElement>);
                    };
                    input.click();
                  }}
                  className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-lg transition-colors cursor-pointer hover:bg-card/50"
                >
                  <Zap size={32} className="mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium">Click to browse or drag audio files here</p>
                  <p className="text-xs text-muted-foreground mt-1">Supports WAV, MP3, OGG, AAC, FLAC and folders</p>
                </div>
              ) : (
                <>
                  <div
                    onDragOver={handleSFXDragOver}
                    onDragLeave={handleSFXDragLeave}
                    onDrop={handleSFXDrop}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-colors rounded-lg p-4 -m-4"
                  >
                    {sfxPaginatedTracks.map((sfx) => (
                      <SFXController
                        key={sfx.id}
                        sfxId={sfx.id}
                        fileName={sfx.fileName}
                        duration={sfx.duration}
                        audioRef={React.createRef()}
                        volume={sfx.volume}
                        loop={sfx.loop}
                        isPlaying={sfx.isPlaying}
                        currentTime={sfx.currentTime}
                        onVolumeChange={(vol) => {
                          setSfxTracks((prev) =>
                            prev.map((t) => (t.id === sfx.id ? { ...t, volume: vol } : t))
                          );
                          const audioEl = sfxAudioRefs.current.get(sfx.id);
                          if (audioEl) audioEl.volume = vol * masterVolume;
                        }}
                        onLoopToggle={(loop) => {
                          setSfxTracks((prev) =>
                            prev.map((t) => (t.id === sfx.id ? { ...t, loop } : t))
                          );
                          const audioEl = sfxAudioRefs.current.get(sfx.id);
                          if (audioEl) audioEl.loop = loop;
                        }}
                        onPlay={() => playSFX(sfx.id)}
                        onPause={() => pauseSFX(sfx.id)}
                        onStop={() => forceStopSFX(sfx.id)}
                        onRestart={() => restartSFX(sfx.id)}
                        onReplace={() => handleSFXReplace(sfx.id)}
                        onDelete={() => handleSFXDelete(sfx.id)}
                        onSeek={(time) => seekSFX(sfx.id, time)}
                        isReplacing={replacingSFXId === sfx.id}
                      />
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {sfxTotalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-border">
                      <button
                        onClick={() => setSfxCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={sfxCurrentPage === 1}
                        className="px-3 py-1 text-sm bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: sfxTotalPages }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            onClick={() => setSfxCurrentPage(page)}
                            className={`px-3 py-1 text-sm rounded transition-colors ${
                              sfxCurrentPage === page
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted hover:bg-muted/80'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      
                      <button
                        onClick={() => setSfxCurrentPage(prev => Math.min(sfxTotalPages, prev + 1))}
                        disabled={sfxCurrentPage === sfxTotalPages}
                        className="px-3 py-1 text-sm bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}

                  {/* Page Info */}
                  <div className="text-center text-xs text-muted-foreground mt-2">
                    Showing {sfxStartIndex + 1}-{Math.min(sfxEndIndex, sfxTracks.length)} of {sfxTracks.length} SFX files
                  </div>
                </>
              )}
            </div>
          </section>

          {/* BGM Section at bottom of left column */}
          <section className="rounded-lg border border-border bg-card/30 overflow-hidden">
            <button
              onClick={() => toggleSection('bgm')}
              className="w-full flex items-center justify-between p-4 hover:bg-card/50 transition-colors border-b border-border"
            >
              <div className="flex items-center gap-2">
                <Volume2 size={18} className="text-primary" />
                <h2 className="font-semibold">Background Music (BGM)</h2>
              </div>
              {expandedSections.bgm ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {expandedSections.bgm && (
              <div className="p-4 space-y-4">
                {!bgm ? (
                  <div 
                    onDragOver={handleBGMDragOver}
                    onDragLeave={handleBGMDragLeave}
                    onDrop={handleBGMDrop}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'audio/*';
                      input.onchange = (e) => {
                        const target = e.target as HTMLInputElement;
                        handleBGMUpload({ target } as React.ChangeEvent<HTMLInputElement>);
                      };
                      input.click();
                    }}
                    className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-card/50 transition-colors"
                  >
                    <Upload size={24} className="text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Upload BGM audio file or drag folder</span>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* BGM Header with File Info */}
                    <div className="bg-muted/30 rounded-lg p-4 border border-border">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Volume2 size={16} className="text-primary" />
                          <span className="font-medium text-sm">Now Playing</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span>{bgmCurrentTime.toFixed(1)}s</span>
                          <span>/</span>
                          <span>{bgm.duration.toFixed(1)}s</span>
                        </div>
                      </div>
                      <div className="text-sm font-medium truncate">{bgm.fileName}</div>
                      <div className="text-xs text-muted-foreground">{formatAudioDuration(bgm.duration)}</div>
                    </div>

                    {/* BGM Progress Bar */}
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="0"
                        max={bgm.duration || 0}
                        step="0.01"
                        value={bgmCurrentTime}
                        onChange={(e) => {
                          const time = parseFloat(e.target.value);
                          setBgmCurrentTime(time);
                          if (bgmAudioRef.current) bgmAudioRef.current.currentTime = time;
                        }}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>

                    {/* BGM Main Controls */}
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={restartBGM}
                        className="flex items-center justify-center p-2 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg transition-colors"
                        title="Restart"
                      >
                        <RotateCcw size={16} />
                      </button>
                      <button
                        onClick={toggleBGMPlayback}
                        className={`flex items-center justify-center p-3 rounded-full transition-all transform hover:scale-105 ${
                          bgmPlaying 
                            ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/25' 
                            : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25'
                        }`}
                        title={bgmPlaying ? 'Pause' : 'Play'}
                      >
                        {bgmPlaying ? <Pause size={20} /> : <Play size={20} />}
                      </button>
                      <button
                        onClick={stopBGM}
                        className={`flex items-center justify-center p-2 rounded-lg transition-colors ${
                          bgmPlaying 
                            ? 'bg-red-600 hover:bg-red-700 text-white' 
                            : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                        }`}
                        title="Stop"
                      >
                        <X size={16} />
                      </button>
                      <button
                        onClick={() => {
                          const next = !bgmLoop;
                          setBgmLoop(next);
                          if (bgmAudioRef.current) bgmAudioRef.current.loop = next;
                        }}
                        aria-pressed={bgmLoop}
                        title={bgmLoop ? 'Loop enabled' : 'Enable loop'}
                        className={`flex items-center justify-center p-2 rounded-lg transition-colors ${
                          bgmLoop ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                        }`}
                      >
                        <Repeat2 size={16} />
                      </button>
                    </div>

                    {/* BGM Settings Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Volume Control */}
                      <div className="bg-muted/30 rounded-lg p-4 border border-border">
                        <label className="flex items-center justify-between text-xs font-medium text-muted-foreground mb-3">
                          <span>Volume</span>
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${
                              bgmFadeStatus !== 'normal' ? 'text-orange-400' : 'text-primary'
                            }`}>
                              {Math.round(bgmEffectiveVolume * 100)}%
                            </span>
                            {bgmFadeStatus !== 'normal' && (
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                bgmFadeStatus === 'faded' 
                                  ? 'bg-orange-500/20 text-orange-400' 
                                  : bgmFadeStatus === 'fading-out'
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : 'bg-green-500/20 text-green-400'
                              }`}>
                                {bgmFadeStatus === 'faded' 
                                  ? '50%' 
                                  : bgmFadeStatus === 'fading-out'
                                  ? 'Fading...'
                                  : 'Restoring...'
                                }
                              </span>
                            )}
                          </div>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={bgmVolume}
                          onChange={(e) => {
                            const vol = parseFloat(e.target.value);
                            setBgmVolume(vol);
                            originalBGMVolumeRef.current = vol;
                            setBgmEffectiveVolume(vol); // Update effective volume when not fading
                            if (bgmAudioRef.current) bgmAudioRef.current.volume = vol * masterVolume;
                          }}
                          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        {bgmFadeStatus !== 'normal' && (
                          <div className="text-xs text-muted-foreground mt-2">
                            {bgmFadeStatus === 'faded' && 'BGM reduced to 50% for Win Dialogue'}
                            {bgmFadeStatus === 'fading-out' && 'Fading BGM to 50%...'}
                            {bgmFadeStatus === 'fading-in' && 'Restoring BGM to 100%...'}
                          </div>
                        )}
                      </div>

                      {/* File Actions */}
                      <div className="bg-muted/30 rounded-lg p-4 border border-border">
                        <div className="text-xs font-medium text-muted-foreground mb-3">File Actions</div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleBGMReplace}
                            disabled={replacingBGM}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg text-sm transition-colors disabled:opacity-50"
                          >
                            <Upload size={14} />
                            Replace
                          </button>
                          <button
                            onClick={() => {
                              deleteAudioFile(bgm);
                              setBgm(null);
                              setBgmPlaying(false);
                            }}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-900/30 hover:bg-red-900/40 text-red-400 rounded-lg text-sm transition-colors"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Right: Win Dialogue */}
        <div className="space-y-6">
          <section className="rounded-lg border border-border bg-card/30 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-semibold flex items-center gap-2">
                <Volume2 size={18} className="text-primary" />
                Win Dialogue ({winDialogueTracks.length}/8)
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'audio/*';
                    input.multiple = true;
                    input.webkitdirectory = false;
                    input.onchange = async (e) => {
                      const target = e.target as HTMLInputElement;
                      const files = Array.from(target.files || []);
                      
                      if (files.length === 0) return;
                      
                      // Check if adding these files would exceed the 8 file limit
                      const availableSlots = 8 - winDialogueTracks.length;
                      const filesToProcess = files.slice(0, availableSlots);
                      
                      if (filesToProcess.length === 0) {
                        toast({ 
                          title: 'Upload failed', 
                          description: 'Maximum 8 Win Dialogue files allowed' 
                        });
                        return;
                      }
                      
                      if (files.length > availableSlots) {
                        toast({ 
                          title: 'Limited upload', 
                          description: `Only first ${availableSlots} files will be uploaded (8 file limit)` 
                        });
                      }
                      
                      // Process each file
                      for (const file of filesToProcess) {
                        const mockEvent = {
                          target: { files: [file] }
                        } as unknown as React.ChangeEvent<HTMLInputElement>;
                        await handleWinDialogueUpload(mockEvent);
                      }
                    };
                    input.click();
                  }}
                  className="flex items-center justify-center gap-1 px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded font-medium text-sm transition-colors"
                  disabled={winDialogueTracks.length >= 8}
                >
                  <Plus size={16} />
                  Add Win Dialogue
                </button>
              </div>
            </div>

            <div className="p-4">
              {winDialogueTracks.length === 0 ? (
                <div
                  onDragOver={handleWinDialogueDragOver}
                  onDragLeave={handleWinDialogueDragLeave}
                  onDrop={handleWinDialogueDrop}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'audio/*';
                    input.multiple = true;
                    input.webkitdirectory = false;
                    input.onchange = async (e) => {
                      const target = e.target as HTMLInputElement;
                      const files = Array.from(target.files || []);
                      
                      if (files.length === 0) return;
                      
                      // Check if adding these files would exceed the 8 file limit
                      const availableSlots = 8 - winDialogueTracks.length;
                      const filesToProcess = files.slice(0, availableSlots);
                      
                      if (filesToProcess.length === 0) {
                        toast({ 
                          title: 'Upload failed', 
                          description: 'Maximum 8 Win Dialogue files allowed' 
                        });
                        return;
                      }
                      
                      if (files.length > availableSlots) {
                        toast({ 
                          title: 'Limited upload', 
                          description: `Only first ${availableSlots} files will be uploaded (8 file limit)` 
                        });
                      }
                      
                      // Process each file
                      for (const file of filesToProcess) {
                        const mockEvent = {
                          target: { files: [file] }
                        } as unknown as React.ChangeEvent<HTMLInputElement>;
                        await handleWinDialogueUpload(mockEvent);
                      }
                    };
                    input.click();
                  }}
                  className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-lg transition-colors cursor-pointer hover:bg-card/50"
                >
                  <Volume2 size={32} className="mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium">Click to browse or drag Win Dialogue files here</p>
                  <p className="text-xs text-muted-foreground mt-1">Maximum 8 files supported</p>
                </div>
              ) : (
                <div
                  onDragOver={handleWinDialogueDragOver}
                  onDragLeave={handleWinDialogueDragLeave}
                  onDrop={handleWinDialogueDrop}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-colors rounded-lg p-4 -m-4"
                >
                  {winDialogueTracks.map((winDialogue) => (
                    <SFXController
                      key={winDialogue.id}
                      sfxId={winDialogue.id}
                      fileName={winDialogue.fileName}
                      duration={winDialogue.duration}
                      audioRef={React.createRef()}
                      volume={winDialogue.volume}
                      loop={winDialogue.loop}
                      isPlaying={winDialogue.isPlaying}
                      currentTime={winDialogue.currentTime}
                      onVolumeChange={(vol) => {
                        setWinDialogueTracks((prev) =>
                          prev.map((t) => (t.id === winDialogue.id ? { ...t, volume: vol } : t))
                        );
                        const audioEl = winDialogueAudioRefs.current.get(winDialogue.id);
                        if (audioEl) audioEl.volume = vol * masterVolume;
                      }}
                      onLoopToggle={(loop) => {
                        setWinDialogueTracks((prev) =>
                          prev.map((t) => (t.id === winDialogue.id ? { ...t, loop } : t))
                        );
                        const audioEl = winDialogueAudioRefs.current.get(winDialogue.id);
                        if (audioEl) audioEl.loop = loop;
                      }}
                      onPlay={() => toggleWinDialoguePlayback(winDialogue.id)}
                      onPause={() => toggleWinDialoguePlayback(winDialogue.id)}
                      onStop={() => stopWinDialogue(winDialogue.id)}
                      onRestart={() => restartWinDialogue(winDialogue.id)}
                      onReplace={() => handleWinDialogueReplace(winDialogue.id)}
                      onDelete={() => {
                        deleteAudioFile(winDialogue);
                        setWinDialogueTracks((prev) => prev.filter((t) => t.id !== winDialogue.id));
                      }}
                      onSeek={(time) => {
                        const audioEl = winDialogueAudioRefs.current.get(winDialogue.id);
                        if (audioEl) audioEl.currentTime = time;
                        setWinDialogueTracks(prev => prev.map(t => 
                          t.id === winDialogue.id ? { ...t, currentTime: time } : t
                        ));
                      }}
                      isReplacing={replacingWinDialogue}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right: Uploadable Image */}
        <div className="space-y-6">
          <section className="rounded-lg border border-border bg-card/30 overflow-hidden">
            <div className="p-2">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold flex items-center gap-2 text-sm">
                  <Image size={14} className="text-primary" />
                  Image Display
                </h2>
                {image && (
                  <button
                    onClick={handleImageReplace}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded font-medium text-sm transition-colors"
                    title="Replace image"
                  >
                    <Upload size={14} />
                    Replace Image
                  </button>
                )}
              </div>
              <div className="flex items-center justify-center">
                {!image ? (
                  <div 
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const target = e.target as HTMLInputElement;
                        handleImageUpload({ target } as React.ChangeEvent<HTMLInputElement>);
                      };
                      input.click();
                    }}
                    className="w-full max-w-[300px] h-[630px] border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-card/50 transition-colors flex flex-col items-center justify-center gap-2"
                  >
                    <Upload size={24} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground text-center">Upload image</span>
                  </div>
                ) : (
                  <div className="relative w-[300px] h-[630px]">
                    <img 
                      src={image.url} 
                      alt="Uploaded Display"
                      className="w-full h-full object-cover rounded border border-border"
                    />
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 hover:opacity-100 transition-opacity">
                      <button
                        onClick={handleImageReplace}
                        className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
                        title="Replace image"
                      >
                        <Upload size={12} />
                      </button>
                      <button
                        onClick={() => {
                          deleteImageFile(image);
                          setImage(null);
                        }}
                        className="p-1 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
                        title="Delete image"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
      </div>

      {/* Audio Elements */}
      <div className="hidden">
        {bgm && (
          <audio
            ref={bgmAudioRef}
            src={bgm.url}
            onTimeUpdate={() => setBgmCurrentTime(bgmAudioRef.current?.currentTime || 0)}
            onEnded={() => setBgmPlaying(false)}
            crossOrigin="anonymous"
          />
        )}
        {sfxTracks.map((sfx) => (
          <audio
            key={sfx.id}
            ref={(el) => {
              if (el) sfxAudioRefs.current.set(sfx.id, el);
            }}
            src={sfx.url}
            onTimeUpdate={() => {
              const audioEl = sfxAudioRefs.current.get(sfx.id);
              if (audioEl) {
                setSfxTracks((prev) =>
                  prev.map((t) => (t.id === sfx.id ? { ...t, currentTime: audioEl.currentTime } : t))
                );
              }
            }}
            onEnded={() => {
              setSfxTracks((prev) =>
                prev.map((t) => (t.id === sfx.id ? { ...t, isPlaying: false } : t))
              );
            }}
            crossOrigin="anonymous"
          />
        ))}
        {winDialogueTracks.map((winDialogue) => (
          <audio
            key={winDialogue.id}
            ref={(el) => {
              if (el) winDialogueAudioRefs.current.set(winDialogue.id, el);
            }}
            src={winDialogue.url}
            onTimeUpdate={() => {
              const audioEl = winDialogueAudioRefs.current.get(winDialogue.id);
              if (audioEl) {
                setWinDialogueTracks((prev) =>
                  prev.map((t) => (t.id === winDialogue.id ? { ...t, currentTime: audioEl.currentTime } : t))
                );
              }
            }}
            onEnded={() => {
              setWinDialogueTracks((prev) =>
                prev.map((t) => (t.id === winDialogue.id ? { ...t, isPlaying: false } : t))
              );
            }}
            crossOrigin="anonymous"
          />
        ))}
      </div>
      </div>
    </Layout>
  );
}
