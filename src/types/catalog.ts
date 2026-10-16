import { MediaType } from './room';

export type MovieGenre = 
  | 'All'
  | 'Sci-Fi'
  | 'Animation'
  | 'Action'
  | 'Comedy'
  | 'Documentary'
  | 'Drama'
  | 'Short Film';

export interface CatalogItem {
  id: string;
  title: string;
  tagline: string;
  description: string;
  genre: MovieGenre[];
  year: number;
  durationSeconds: number;
  rating: string;
  posterUrl: string;
  backdropUrl: string;
  mediaType: MediaType;
  mediaUrl: string;
  featured?: boolean;
  director?: string;
  tags: string[];
}
