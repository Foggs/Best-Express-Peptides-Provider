"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  RefreshCw,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Clock,
} from "lucide-react";
import type { CacheStatus, RefreshResult, SkippedVariant } from "@/types/admin";

interface ProductCacheSyncProps {
  adminToken: string;
  sheetUrl: string;
}

function formatLastFetched(timestamp: number | null): string {
  if (!timestamp) return "Never";
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60)
    return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24)
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString() + " " + date.toLocaleTimeString();
}

export function ProductCacheSync({
  adminToken,
  sheetUrl,
}: ProductCacheSyncProps) {
  const [cacheStatus, setCacheStatus] = useState<CacheStatus | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState<RefreshResult | null>(
    null,
  );

  useEffect(() => {
    fetchCacheStatus();
  }, [adminToken]);

  const fetchCacheStatus = async () => {
    try {
      const response = await fetch("/api/admin/refresh-products", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCacheStatus(data);
      }
    } catch (error) {
      console.error("Error fetching cache status:", error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshResult(null);
    try {
      const response = await fetch("/api/admin/refresh-products", {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await response.json();
      setRefreshResult(data);
      if (data.success) {
        await fetchCacheStatus();
      }
    } catch {
      setRefreshResult({
        success: false,
        error: "Network error. Please try again.",
      });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Product Data Sync
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Products are managed through Google Sheets. Edit your products in
            the spreadsheet, then refresh the cache to see changes on the site.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Last refreshed:</span>
              <span className="font-medium">
                {formatLastFetched(cacheStatus?.lastFetched || null)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground ml-6">
                Products in cache:
              </span>
              <span className="font-medium">
                {cacheStatus?.productCount ?? "—"}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex-1"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing
                ? "Refreshing..."
                : "Refresh Products from Google Sheets"}
            </Button>
          </div>

          {refreshResult && (
            <div
              className={`rounded-lg p-3 flex items-start gap-2 ${
                refreshResult.success
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              {refreshResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
              )}
              <div className="text-sm">
                {refreshResult.success ? (
                  <p className="text-green-800">
                    {refreshResult.message} ({refreshResult.productCount}{" "}
                    products loaded)
                  </p>
                ) : (
                  <p className="text-red-800">
                    {refreshResult.error}
                    {refreshResult.details && (
                      <span className="block text-xs mt-1 opacity-75">
                        {refreshResult.details}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
          )}

          <SkippedVariantsPanel
            skippedVariants={
              refreshResult?.skippedVariants ??
              cacheStatus?.skippedVariants ??
              []
            }
          />

          <p className="text-xs text-muted-foreground">
            The cache automatically refreshes every 5 minutes. Use the button
            above for immediate updates.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Edit Products
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Open the Google Sheet to add, edit, or remove products. You can
            update prices, descriptions, research info, and stock quantities
            directly in the spreadsheet.
          </p>

          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 mb-2">
                Sheet Structure:
              </p>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>
                  <strong>Products tab:</strong> slug, name, category,
                  shortDescription, description, research, shippingInfo, faq,
                  featured, active
                </li>
                <li>
                  <strong>Variants tab:</strong> productSlug, variantName, price
                  (in dollars), sku, stock
                </li>
              </ul>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open(sheetUrl, "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Google Sheet
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            After making changes in the sheet, come back here and click "Refresh
            Products" to update the site.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function SkippedVariantsPanel({
  skippedVariants,
}: {
  skippedVariants: SkippedVariant[];
}) {
  if (!skippedVariants || skippedVariants.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <div className="text-sm w-full">
          <p className="font-medium text-amber-900">
            {skippedVariants.length} variant
            {skippedVariants.length === 1 ? "" : "s"} skipped
          </p>
          <p className="text-xs text-amber-800 mt-1">
            These rows were dropped because their price is empty, not a number,
            or zero. Fix the price in the sheet and refresh again.
          </p>
          <ul className="mt-2 space-y-1 text-xs text-amber-900">
            {skippedVariants.map((v, idx) => (
              <li
                key={`${v.productSlug}-${v.sku}-${v.variantName}-${idx}`}
                className="rounded bg-amber-100/60 px-2 py-1"
              >
                <span className="font-medium">{v.productSlug}</span>
                {v.variantName && (
                  <>
                    {" "}
                    &middot; <span>{v.variantName}</span>
                  </>
                )}
                {v.sku && (
                  <>
                    {" "}
                    &middot; <span className="font-mono">{v.sku}</span>
                  </>
                )}
                <span className="block opacity-80">
                  price: <span className="font-mono">"{v.rawPrice}"</span> —{" "}
                  {v.reason}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
