'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLoading } from '../contexts/LoadingContext';
import { 
  Home, 
  Music, 
  Trophy, 
  Volume2, 
  Settings, 
  FolderOpen, 
  Plus, 
  ChevronRight, 
  ChevronDown,
  Headphones,
  Mic,
  Radio,
  FileAudio,
  Save,
  Upload,
  Download,
  Trash2,
  Copy,
  Share2,
  Moon,
  Sun,
  Image,
  Box,
  Package
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  type: 'audio' | 'music' | 'sfx' | 'voice';
  lastModified: string;
  size: string;
}

interface SidebarProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  currentProject?: string;
}

export default function Sidebar({ isDarkMode, toggleDarkMode, currentProject = "Audio Testing Tool" }: SidebarProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['projects', 'tools']);
  const router = useRouter();
  const pathname = usePathname();
  const { setLoading } = useLoading();
  const [projects, setProjects] = useState<Project[]>([
    {
      id: '1',
      name: 'Audio Testing Tool',
      type: 'audio',
      lastModified: '2024-01-28',
      size: '2.4 MB'
    }
  ]);

  const getCurrentToolInfo = () => {
    switch (pathname) {
      case '/':
        return { name: 'Audio Tester', icon: Headphones };
      case '/image-sizer':
        return { name: 'Image Sizer', icon: Image };
      case '/future-tool-1':
        return { name: 'Future Tool 1', icon: Box };
      case '/future-tool-2':
        return { name: 'Future Tool 2', icon: Package };
      default:
        return { name: 'Audio Tools', icon: Volume2 };
    }
  };

  const currentTool = getCurrentToolInfo();

  const navigateWithLoading = (path: string) => {
    if (pathname === path) return; // Don't navigate if already on the same page
    
    setLoading(true);
    
    // Simulate loading time for smooth transition
    setTimeout(() => {
      router.push(path);
      
      // Hide loading screen after navigation
      setTimeout(() => {
        setLoading(false);
      }, 300);
    }, 300);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const getProjectIcon = (type: Project['type']) => {
    switch (type) {
      case 'audio': return <Headphones className="w-4 h-4" />;
      case 'music': return <Music className="w-4 h-4" />;
      case 'sfx': return <Radio className="w-4 h-4" />;
      case 'voice': return <Mic className="w-4 h-4" />;
      default: return <FileAudio className="w-4 h-4" />;
    }
  };

  const getProjectColor = (type: Project['type']) => {
    switch (type) {
      case 'audio': return 'text-purple-400';
      case 'music': return 'text-blue-400';
      case 'sfx': return 'text-green-400';
      case 'voice': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="w-64 bg-card border-r border-border h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center transition-all duration-300">
              <currentTool.icon className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-foreground transition-all duration-300">{currentTool.name}</span>
          </div>
          <button
            onClick={toggleDarkMode}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        {/* Projects Section */}
        <div className="p-4">
          <button
            onClick={() => toggleSection('projects')}
            className="flex items-center justify-between w-full mb-3"
          >
            <h3 className="text-xs font-medium text-muted-foreground">PROJECTS</h3>
            {expandedSections.includes('projects') ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          
          {expandedSections.includes('projects') && (
            <div className="space-y-1">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    project.name === currentProject 
                      ? 'bg-primary/20 border border-primary/30' 
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className={getProjectColor(project.type)}>
                    {getProjectIcon(project.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{project.name}</p>
                    <p className="text-xs text-muted-foreground">{project.lastModified}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-1 hover:bg-muted rounded transition-colors" title="Duplicate">
                      <Copy className="w-3 h-3" />
                    </button>
                    <button className="p-1 hover:bg-muted rounded transition-colors" title="Share">
                      <Share2 className="w-3 h-3" />
                    </button>
                    <button className="p-1 hover:bg-muted rounded transition-colors" title="Delete">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tools Section */}
        <div className="p-4">
          <button
            onClick={() => toggleSection('tools')}
            className="flex items-center justify-between w-full mb-3"
          >
            <h3 className="text-xs font-medium text-muted-foreground">TOOLS</h3>
            {expandedSections.includes('tools') ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          
          {expandedSections.includes('tools') && (
            <div className="space-y-1">
              <button 
                onClick={() => navigateWithLoading('/')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                  pathname === '/' 
                    ? 'bg-primary/20 border border-primary/30' 
                    : 'hover:bg-muted'
                }`}
              >
                <Headphones className={`w-4 h-4 ${pathname === '/' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-sm ${pathname === '/' ? 'font-medium' : ''}`}>Audio Tester</span>
              </button>
              <button 
                onClick={() => navigateWithLoading('/image-sizer')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                  pathname === '/image-sizer' 
                    ? 'bg-primary/20 border border-primary/30' 
                    : 'hover:bg-muted'
                }`}
              >
                <Image className={`w-4 h-4 ${pathname === '/image-sizer' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-sm ${pathname === '/image-sizer' ? 'font-medium' : ''}`}>Image Sizer</span>
              </button>
              <button 
                onClick={() => navigateWithLoading('/future-tool-1')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                  pathname === '/future-tool-1' 
                    ? 'bg-primary/20 border border-primary/30' 
                    : 'hover:bg-muted'
                }`}
              >
                <Box className={`w-4 h-4 ${pathname === '/future-tool-1' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-sm ${pathname === '/future-tool-1' ? 'font-medium' : ''}`}>Future Tool 1</span>
              </button>
              <button 
                onClick={() => navigateWithLoading('/future-tool-2')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                  pathname === '/future-tool-2' 
                    ? 'bg-primary/20 border border-primary/30' 
                    : 'hover:bg-muted'
                }`}
              >
                <Package className={`w-4 h-4 ${pathname === '/future-tool-2' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-sm ${pathname === '/future-tool-2' ? 'font-medium' : ''}`}>Future Tool 2</span>
              </button>
            </div>
          )}
        </div>

        {/* Settings Section */}
        <div className="p-4">
          <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted rounded-lg transition-colors text-left">
            <Settings className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">Settings</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          <p>Audio Tools v1.0</p>
          <p>© 2024 Di Joker</p>
        </div>
      </div>
    </div>
  );
}
