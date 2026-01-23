'use client';

/**
 * Individual SFX Audio Controller Component
 * Provides dedicated playback control, timing, and effects for each sound effect
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Square,
  Repeat2,
  Trash2,
  Upload,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface SFXControllerProps {
  sfxId: string;
  fileName: string;
  duration: number;
  audioRef: React.RefObject<HTMLAudioElement>;
  volume: number;
  loop: boolean;
  isPlaying: boolean;
  currentTime: number;
  onVolumeChange: (volume: number) => void;
  onLoopToggle: (loop: boolean) => void;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onRestart: () => void;
  onReplace: () => void;
  onDelete: () => void;
  onSeek: (time: number) => void;
  isReplacing: boolean;
}

export function SFXController({
  sfxId,
  fileName,
  duration,
  audioRef,
  volume,
  loop,
  isPlaying,
  currentTime,
  onVolumeChange,
  onLoopToggle,
  onPlay,
  onPause,
  onStop,
  onRestart,
  onReplace,
  onDelete,
  onSeek,
  isReplacing,
}: SFXControllerProps) {
  const fileExt = (fileName && fileName.includes('.')) ? fileName.split('.').pop()?.toUpperCase() : 'AUDIO';
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Space: toggle play/pause
    if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault();
      if (isPlaying) onPause(); else onPlay();
      return;
    }

    // Arrow keys: seek
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const newTime = Math.max(0, currentTime - 5);
      onSeek(newTime);
      return;
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const newTime = Math.min(duration, currentTime + 5);
      onSeek(newTime);
      return;
    }

    // 'L' toggles loop
    if (e.key.toLowerCase() === 'l') {
      e.preventDefault();
      onLoopToggle(!loop);
      return;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    onSeek(newTime);
  };

  return (
    <div
      id={`sfx-${sfxId}`}
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label={`SFX controls for ${fileName}`}
      className="rounded-lg border border-slate-700 bg-slate-800/50 p-3 space-y-3 focus:outline-none"
      title={`Keyboard: Space play/pause · ←/→ seek · L toggle loop`}
    >
      {/* Header with file name and controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-slate-100 truncate text-xs">{fileName}</h4>
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">
              {fileExt}
            </span>
            {isReplacing && (
              <span className="ml-1 text-[8px] text-yellow-300 bg-yellow-900/20 px-1 py-0.5 rounded">Replacing...</span>
            )}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {formatTime(currentTime)} / {formatTime(duration)}
          </p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={onReplace}
            disabled={isReplacing}
            className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-slate-100 transition-colors disabled:opacity-50"
            title="Replace audio file"
            aria-label={`Replace ${fileName}`}
          >
            <Upload size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 hover:bg-red-900/30 rounded text-red-400 hover:text-red-300 transition-colors"
            title="Delete this SFX"
            aria-label={`Delete ${fileName}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Timeline / Scrubber */}
      <div className="space-y-1">
        <input
          type="range"
          min="0"
          max={duration || 0}
          step="0.01"
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          title="Seek to position (millisecond precision)"
        />
      </div>

      {/* Playback Controls */}
      <div className="grid grid-cols-4 gap-1">
        <button
          onClick={isPlaying ? onPause : onPlay}
          className={`flex items-center justify-center p-1.5 rounded font-medium text-sm transition-all transform hover:scale-105 ${
            isPlaying 
              ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/30' 
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30'
          }`}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>

        <button
          onClick={onStop}
          className={`flex items-center justify-center p-1.5 rounded font-medium text-sm transition-all transform hover:scale-105 ${
            isPlaying 
              ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30' 
              : 'bg-slate-700 hover:bg-slate-600 text-slate-100 shadow-lg shadow-slate-700/30'
          }`}
          title="Stop"
        >
          <Square size={14} />
        </button>

        <button
          onClick={onRestart}
          className="flex items-center justify-center p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded font-medium text-sm transition-all transform hover:scale-105 shadow-lg shadow-slate-700/30"
          title="Restart from beginning"
        >
          <RotateCcw size={14} />
        </button>

        <button
          onClick={() => onLoopToggle(!loop)}
          className={`flex items-center justify-center p-1.5 rounded font-medium text-sm transition-all transform hover:scale-105 ${
            loop
              ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/30'
              : 'bg-slate-700 hover:bg-slate-600 text-slate-100 shadow-lg shadow-slate-700/30'
          }`}
          title={loop ? 'Loop enabled' : 'Loop disabled'}
        >
          <Repeat2 size={14} />
        </button>
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-2">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          title={`Volume: ${Math.round(volume * 100)}%`}
        />
        <button
          onClick={() => onVolumeChange(volume === 0 ? 0.5 : 0)}
          className="p-1.5 hover:bg-slate-600 rounded transition-colors"
          title={volume === 0 ? 'Unmute' : 'Mute'}
        >
          {volume === 0 ? <VolumeX size={14} className="text-slate-400" /> : <Volume2 size={14} className="text-slate-300" />}
        </button>
      </div>

    </div>
  );
}
