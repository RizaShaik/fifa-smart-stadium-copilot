import React from "react";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
}

export default function MD3Skeleton({ className = "", variant = "rectangular" }: SkeletonProps) {
  const baseClass = "animate-pulse bg-surface-container-high rounded";
  const variantClass = {
    text: "h-3 w-3/4 my-1.5",
    circular: "rounded-full",
    rectangular: "h-24 w-full",
  }[variant];

  return <div className={`${baseClass} ${variantClass} ${className}`} />;
}
export function MD3DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2 w-1/3">
          <MD3Skeleton variant="text" className="w-1/2 h-6" />
          <MD3Skeleton variant="text" className="w-3/4 h-4" />
        </div>
        <MD3Skeleton variant="rectangular" className="w-24 h-8 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <MD3Skeleton key={i} variant="rectangular" className="h-20 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MD3Skeleton variant="rectangular" className="lg:col-span-2 h-96 rounded-xl" />
        <MD3Skeleton variant="rectangular" className="h-96 rounded-xl" />
      </div>
    </div>
  );
}
