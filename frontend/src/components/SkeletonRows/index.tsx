import { Box, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import React from "react";

interface SkeletonRowsProps {
  rows?: number;
  columns?: number;
  hasHeader?: boolean;
}

function SkeletonRows({ rows = 5, columns = 4, hasHeader = true }: SkeletonRowsProps) {
  return (
    <TableContainer component={Box} className="panel overflow-hidden">
      <Table aria-label="loading skeleton">
        {hasHeader && (
          <TableHead>
            <TableRow>
              {Array.from({ length: columns }).map((_, i) => (
                <TableCell key={`h-${i}`}>
                  <Skeleton variant="text" width="60%" />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
        )}
        <TableBody>
          {Array.from({ length: rows }).map((_, row) => (
            <TableRow key={`r-${row}`}>
              {Array.from({ length: columns }).map((_, col) => (
                <TableCell key={`c-${col}`}>
                  <Skeleton variant="text" width={col === 0 ? "70%" : "40%"} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default SkeletonRows;
