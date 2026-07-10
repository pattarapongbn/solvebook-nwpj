import { apiFetch } from "@/lib/api";

import type {
  FavoriteItem,
  ProductDetail,
  SearchFormValues,
  SearchResponse,
} from "./types";

export function buildSearchQuery(values: SearchFormValues, page: number): string {
  const params = new URLSearchParams();
  if (values.keyword) params.set("keyword", values.keyword);
  if (values.category) params.set("category", values.category);
  if (values.country) params.set("country", values.country);
  if (values.marketplace) params.set("marketplace", values.marketplace);
  if (values.price_min) params.set("price_min", values.price_min);
  if (values.price_max) params.set("price_max", values.price_max);
  if (values.thailand_status) params.set("thailand_status", values.thailand_status);
  params.set("period", values.period);
  params.set("page", String(page));
  params.set("page_size", "25");
  return params.toString();
}

export function searchProducts(
  values: SearchFormValues,
  page: number,
): Promise<SearchResponse> {
  return apiFetch<SearchResponse>(`/search?${buildSearchQuery(values, page)}`);
}

export function getProductDetail(id: number): Promise<ProductDetail> {
  return apiFetch<ProductDetail>(`/products/${id}`);
}

export function listFavorites(): Promise<FavoriteItem[]> {
  return apiFetch<FavoriteItem[]>("/favorites");
}

export function addFavorite(productId: number): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>("/favorites", {
    method: "POST",
    body: JSON.stringify({ product_id: productId }),
  });
}

export function removeFavorite(productId: number): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/favorites/${productId}`, { method: "DELETE" });
}
