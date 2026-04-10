export interface Place {
  id: string;
  name: string;
  district: string | null;
  category: string | null;
  kind_label: string | null;
  image_url: string | null;
  rating: number | null;
  review_count: number | null;
  description: string | null;
  address: string | null;
  pet_friendly?: boolean | null;
  created_at?: string;
  updated_at?: string;
}
