import { z } from "zod";

export const MARKETPLACES = ["amazon_us", "1688", "shopee_th"] as const;
export const COUNTRIES = ["US", "CN"] as const;
export const PERIODS = ["1d", "7d", "30d"] as const;
export const THAILAND_STATUSES = ["found", "not_found"] as const;
export const CATEGORIES = [
  "Home",
  "Kitchen",
  "Pet",
  "Automotive",
  "Sports",
  "Beauty",
  "Baby",
  "Office",
] as const;

export type Marketplace = (typeof MARKETPLACES)[number];
export type Country = (typeof COUNTRIES)[number];
export type SalesPeriod = (typeof PERIODS)[number];
export type ThailandStatus = (typeof THAILAND_STATUSES)[number];

export const searchFormSchema = z.object({
  keyword: z.string(),
  category: z.string(),
  country: z.string(),
  marketplace: z.string(),
  price_min: z.string(),
  price_max: z.string(),
  period: z.enum(PERIODS),
  thailand_status: z.string(),
});

export type SearchFormValues = z.infer<typeof searchFormSchema>;

export const DEFAULT_SEARCH_VALUES: SearchFormValues = {
  keyword: "",
  category: "",
  country: "",
  marketplace: "",
  price_min: "",
  price_max: "",
  period: "7d",
  thailand_status: "",
};

export interface ProductListItem {
  id: number;
  name: string;
  image_url: string | null;
  marketplace: Marketplace;
  country: Country;
  category: string | null;
  price: number | null;
  currency: string | null;
  price_thb: number | null;
  orders: number | null;
  thailand_status: ThailandStatus | null;
  is_favorite: boolean;
  last_updated: string | null;
}

export interface SearchResponse {
  items: ProductListItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface SnapshotPoint {
  snapshot_date: string;
  price: number;
  currency: string;
  price_thb: number | null;
  orders_1d: number | null;
  orders_7d: number | null;
  orders_30d: number | null;
  revenue_30d: number | null;
  revenue_30d_thb: number | null;
  rating: number | null;
  review_count: number | null;
}

export interface ThailandCheckPoint {
  check_date: string;
  status: ThailandStatus;
  matched_url: string | null;
  matched_price_thb: number | null;
  seller_count: number | null;
}

export interface ProductDetail {
  id: number;
  external_id: string;
  name: string;
  image_url: string | null;
  product_url: string | null;
  marketplace: Marketplace;
  country: Country;
  category: string | null;
  created_at: string;
  is_favorite: boolean;
  snapshots: SnapshotPoint[];
  thailand_checks: ThailandCheckPoint[];
}

export interface FavoriteItem {
  id: number;
  product: ProductListItem;
  note: string | null;
  created_at: string;
}

export const MARKETPLACE_LABELS: Record<Marketplace, string> = {
  amazon_us: "Amazon US",
  "1688": "1688",
  shopee_th: "Shopee TH",
};
