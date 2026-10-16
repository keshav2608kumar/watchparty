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
    mediaType: 'youtube',
    mediaUrl: 'https://www.youtube.com/watch?v=R6MlUcmOul8',
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
    durationSeconds: 52,
    rating: 'PG (Sample)',
    posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
    mediaType: 'html5',
    mediaUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
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
    durationSeconds: 33,
    rating: 'G (Sample)',
    posterUrl: 'https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80',
    mediaType: 'html5',
    mediaUrl: 'https://media.w3.org/2010/05/bunny/trailer.mp4',
    featured: false,
    director: 'Sacha Goedegebure',
    tags: ['Animation', 'Slapstick', 'Forest', 'Funny']
  },
  {
    id: 'movie-oceans',
    title: 'Oceans & Marine Wonders',
    tagline: 'Plunge into the deep sapphire abyss of oceanic life.',
    description: 'A breathtaking high-definition underwater exploration through coral reefs, marine wildlife, oceanic predators, and tranquil deep-sea currents.',
    genre: ['Documentary', 'Short Film'],
    year: 2022,
    durationSeconds: 46,
    rating: 'All Ages (Sample)',
    posterUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
    mediaType: 'html5',
    mediaUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
    featured: true,
    director: 'Marine Motion Labs',
    tags: ['Ocean', 'Marine Life', 'Coral Reef', '4K']
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
    mediaType: 'youtube',
    mediaUrl: 'https://www.youtube.com/watch?v=TLkA0RELQ1g',
    featured: false,
    director: 'Bassam Kurdali',
    tags: ['Surreal', 'Machines', 'Pioneering CGI']
  },
  {
    id: 'movie-blender-charge',
    title: 'Charge (Blender Studio)',
    tagline: 'An old robot battles for survival in a battery factory.',
    description: 'In an abandoned factory, an aging robot must fight off hostile security drones to extract precious battery power before its final life cycle expires.',
    genre: ['Sci-Fi', 'Action', 'Animation'],
    year: 2022,
    durationSeconds: 180,
    rating: 'PG (Sample)',
    posterUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
    mediaType: 'youtube',
    mediaUrl: 'https://www.youtube.com/watch?v=UXqq0ZvbOnk',
    featured: false,
    director: 'Hjalti Hjalmarsson',
    tags: ['CGI', 'Blender', 'Robots', 'Action']
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
