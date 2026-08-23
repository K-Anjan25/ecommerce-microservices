import { Skeleton } from "@mui/material";

interface SkeletonRowsProps {
  rows?: number;
  columns?: number;
  hasHeader?: boolean;
}

/** Loading state shaped like DataTable, so nothing jumps when data lands. */
function SkeletonRows({ rows = 5, columns = 4, hasHeader = true }: SkeletonRowsProps) {
  return (
    <div className="panel overflow-hidden">
      {hasHeader && (
        <div className="flex gap-4 border-b border-line bg-canvas px-4 py-2.5">
          {Array.from({ length: columns }).map((_, i) => (
            <div key={`h-${i}`} className={i === 0 ? "flex-[2]" : "flex-1"}>
              <Skeleton variant="text" width="60%" height={12} />
            </div>
          ))}
        </div>
      )}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={`r-${r}`}
          className="flex gap-4 border-b border-line/70 px-4 py-3.5 last:border-0"
        >
          {Array.from({ length: columns }).map((_, c) => (
            <div key={`c-${c}`} className={c === 0 ? "flex-[2]" : "flex-1"}>
              <Skeleton variant="text" width={c === 0 ? "75%" : "45%"} height={14} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default SkeletonRows;
