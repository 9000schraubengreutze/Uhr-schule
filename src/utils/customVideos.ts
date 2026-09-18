export interface CustomVideoWallpaper {
  id: string;
  title: string;
  url: string;
  createdAt: number;
}

export interface SampleVideoPreset {
  id: string;
  title: string;
  url: string;
  icon: string;
  desc: string;
  recommendedClockColor: string;
  recommendedAccentColor: string;
}

export const SAMPLE_VIDEO_PRESETS: SampleVideoPreset[] = [
  {
    id: 'sample-forest-stream',
    title: 'Waldbach im Sonnenlicht',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4',
    icon: '🌲',
    desc: 'Sanft fließendes Wasser und tanzendes Sonnenlicht im grünen Wald',
    recommendedClockColor: '#34d399',
    recommendedAccentColor: '#10b981',
  },
  {
    id: 'sample-fireplace',
    title: 'Gemütliches Kaminfeuer',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    icon: '🔥',
    desc: 'Wärmende Flammen und beruhigendes Glühen für gemütliche Stunden',
    recommendedClockColor: '#fb923c',
    recommendedAccentColor: '#f97316',
  },
  {
    id: 'sample-mountain-escape',
    title: 'Alpenpanorama & Naturflucht',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    icon: '🏔️',
    desc: 'Majestätische Berglandschaften und weite Naturhorizonte',
    recommendedClockColor: '#38bdf8',
    recommendedAccentColor: '#6366f1',
  },
  {
    id: 'sample-spring-blossom',
    title: 'Frühlingsblüten im Wind',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4',
    icon: '🌸',
    desc: 'Sanft wiegende Blütenpracht in freier Natur',
    recommendedClockColor: '#fde047',
    recommendedAccentColor: '#eab308',
  },
  {
    id: 'sample-mountain-river',
    title: 'Gebirgsfluss & Frische Brise',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    icon: '🌊',
    desc: 'Kristallklares Wasser und dynamische Flussströmung in der Wildnis',
    recommendedClockColor: '#67e8f9',
    recommendedAccentColor: '#06b6d4',
  },
];

const CUSTOM_VIDEOS_KEY = 'webclock_custom_videos_v1';

export function loadCustomVideos(): CustomVideoWallpaper[] {
  try {
    const raw = localStorage.getItem(CUSTOM_VIDEOS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCustomVideo(url: string, title?: string): CustomVideoWallpaper {
  const cleanUrl = url.trim();
  const existing = loadCustomVideos();
  const newVideo: CustomVideoWallpaper = {
    id: `custom-video-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: title?.trim() || cleanUrl.split('/').pop()?.split('?')[0] || 'Eigenes Video',
    url: cleanUrl,
    createdAt: Date.now(),
  };
  const updated = [newVideo, ...existing.filter((v) => v.url !== cleanUrl)];
  try {
    localStorage.setItem(CUSTOM_VIDEOS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save custom video URL to localStorage:', err);
  }
  return newVideo;
}

export function deleteCustomVideo(id: string): void {
  const existing = loadCustomVideos();
  const updated = existing.filter((v) => v.id !== id);
  try {
    localStorage.setItem(CUSTOM_VIDEOS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to delete custom video from localStorage:', err);
  }
}
