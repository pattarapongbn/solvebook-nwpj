"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SearchIcon, X } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

import {
  CATEGORIES,
  COUNTRIES,
  DEFAULT_SEARCH_VALUES,
  MARKETPLACE_LABELS,
  MARKETPLACES,
  PERIODS,
  searchFormSchema,
  type SearchFormValues,
} from "./types";

const PERIOD_LABELS: Record<string, string> = {
  "1d": "1 Day",
  "7d": "7 Days",
  "30d": "30 Days",
};

interface SearchFiltersProps {
  onSearch: (values: SearchFormValues) => void;
}

export function SearchFilters({ onSearch }: SearchFiltersProps) {
  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: DEFAULT_SEARCH_VALUES,
  });

  return (
    <form
      onSubmit={form.handleSubmit(onSearch)}
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
    >
      <div className="flex gap-3">
        <Input
          {...form.register("keyword")}
          placeholder="ค้นหาสินค้า เช่น Portable Blender, Pet..."
          className="flex-1"
        />
        <Button type="submit">
          <SearchIcon size={16} />
          Search
        </Button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3 lg:grid-cols-7">
        <Select {...form.register("country")}>
          <option value="">Country: All</option>
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c === "US" ? "USA" : "China"}
            </option>
          ))}
        </Select>

        <Select {...form.register("marketplace")}>
          <option value="">Marketplace: All</option>
          {MARKETPLACES.filter((m) => m !== "shopee_th").map((m) => (
            <option key={m} value={m}>
              {MARKETPLACE_LABELS[m]}
            </option>
          ))}
        </Select>

        <Select {...form.register("category")}>
          <option value="">Category: All</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>

        <Input
          {...form.register("price_min")}
          type="number"
          min="0"
          step="0.01"
          placeholder="Min price"
        />
        <Input
          {...form.register("price_max")}
          type="number"
          min="0"
          step="0.01"
          placeholder="Max price"
        />

        <Select {...form.register("period")}>
          {PERIODS.map((p) => (
            <option key={p} value={p}>
              Sales: {PERIOD_LABELS[p]}
            </option>
          ))}
        </Select>

        <Select {...form.register("thailand_status")}>
          <option value="">Thailand: All</option>
          <option value="not_found">Not Found</option>
          <option value="found">Found</option>
        </Select>
      </div>

      <div className="mt-3 flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            form.reset(DEFAULT_SEARCH_VALUES);
            onSearch(DEFAULT_SEARCH_VALUES);
          }}
        >
          <X size={14} />
          Clear filters
        </Button>
      </div>
    </form>
  );
}
