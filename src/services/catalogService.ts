import { CatalogItem, MovieGenre } from '../types/catalog';

export const SAMPLE_CATALOG: CatalogItem[] = [
  {
    id: 'movie-cosmic-tears',
    title: 'Tears of Steel',
    tagline: 'In a dystopian future, nostalgia has teeth.',
    description: 'Set in a dystopian future Amsterdam, a group of warriors and scientists gather at the Oude Kerk to stage a desperate attempt to rescue humanity from rogue cybernetic robots.',
    genre: ['Sci-Fi', 'Action', 'Short Film'],
    year: 2012,
    durationSeconds: 734,
    rating: 'PG-13 (Sample)',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=80',
    mediaType: 'html5',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    featured: true,
    director: 'Ian Hubert (Blender Foundation)',
    tags: ['Cyberpunk', 'VFX', 'Robots', 'Amsterdam']
  },
  {
    id: 'movie-sintel',
    title: 'Sintel: The Dragon Saga',
    tagline: 'The lonely journey to rescue a friend.',
    description: 'A lonely young woman, Sintel, helps and cares for a wounded baby dragon that she names Scales. When the dragon is kidnapped, she embarks on a perilous quest across the world.',
    genre: ['Animation', 'Drama', 'Short Film'],
    year: 2010,
    durationSeconds: 888,
    rating: 'PG (Sample)',
    posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
    mediaType: 'html5',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    featured: true,
    director: 'Colin Levy (Blender Foundation)',
    tags: ['Dragon', 'Fantasy', 'Emotional', 'Adventure']
  },
  {
    id: 'movie-big-buck-bunny',
    title: 'Big Buck Bunny',
    tagline: 'A giant rabbit takes revenge on woodland bullies.',
    description: 'Follow a gentle, oversized forest rabbit who is driven to crafting elaborate contraptions to exact payback on three bullying forest pests who disturb his peace.',
    genre: ['Animation', 'Comedy', 'Short Film'],
    year: 2008,
    durationSeconds: 596,
    rating: 'G (Sample)',
    posterUrl: 'https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80',
    mediaType: 'html5',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    featured: false,
    director: 'Sacha Goedegebure',
    tags: ['Animation', 'Slapstick', 'Forest', 'Funny']
  },
  {
    id: 'movie-elephants-dream',
    title: "Elephants Dream",
    tagline: 'An eerie mechanical labyrinth of the mind.',
    description: 'Proog guides the young and impressionable Emo through an endless labyrinth of cables and machinery, exploring the fragile boundaries of perception and trust.',
    genre: ['Sci-Fi', 'Animation'],
    year: 2006,
    durationSeconds: 653,
    rating: 'PG (Sample)',
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
    mediaType: 'html5',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    featured: false,
    director: 'Bassam Kurdali',
    tags: ['Surreal', 'Machines', 'Pioneering CGI']
  },
  {
    id: 'movie-for-bigger-blazes',
    title: 'For Bigger Blazes: Volcanic Wonders',
    tagline: 'The elemental power of planetary geology.',
    description: 'A breathtaking high-definition showcase of lava flows, geothermal vents, and volcanic eruptions filmed across the Pacific Ring of Fire.',
    genre: ['Documentary'],
    year: 2021,
    durationSeconds: 15,
    rating: 'All Ages (Sample)',
    posterUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=80',
    mediaType: 'html5',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    featured: false,
    director: 'Nature Cinema Lab',
    tags: ['Nature', 'Geology', 'Fire', 'Atmosphere']
  },
  {
    id: 'movie-youtube-open-cinematic',
    title: 'Cosmic Journey 4K (YouTube Stream)',
    tagline: 'Glide through nebulas and distant star clusters.',
    description: 'A soothing, visually stunning open interstellar journey through photorealistic space simulations and authentic Hubble and James Webb imagery.',
    genre: ['Sci-Fi', 'Documentary'],
    year: 2023,
    durationSeconds: 1200,
    rating: 'All Ages (Sample)',
    posterUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80',
    mediaType: 'youtube',
    mediaUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // fallback test stream or open clip
    featured: false,
    director: 'Astro Vision',
    tags: ['Space', '4K', 'Ambient', 'YouTube API']
  }
];

export function searchCatalog(query: string, genre: MovieGenre = 'All', sortBy: 'featured' | 'year' | 'title' = 'featured'): CatalogItem[] {
  let results = [...SAMPLE_CATALOG];

  if (genre !== 'All') {
    results = results.filter(item => item.genre.includes(genre));
  }

  if (query.trim()) {
    const q = query.toLowerCase().trim();
    results = results.filter(item => 
      item.title.toLowerCase().includes(q) ||
      item.tagline.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  results.sort((a, b) => {
    if (sortBy === 'featured') {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return b.year - a.year;
    }
    if (sortBy === 'year') {
      return b.year - a.year;
    }
    return a.title.localeCompare(b.title);
  });

  return results;
}

export function getFeaturedItem(): CatalogItem {
  return SAMPLE_CATALOG.find(i => i.featured) || SAMPLE_CATALOG[0];
}

export function getCatalogItemById(id: string): CatalogItem | undefined {
  return SAMPLE_CATALOG.find(i => i.id === id);
}
