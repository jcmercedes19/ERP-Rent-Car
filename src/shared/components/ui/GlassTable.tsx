import { type ReactNode } from "react";

interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => ReactNode;
}

interface GlassTableProps<T> {
  data: T[];
  columns: Column<T>[];
  emptyMessage?: string;
}

export function GlassTable<T>({ data, columns, emptyMessage = "No hay datos disponibles" }: GlassTableProps<T>) {
  return (
    <div className="w-full overflow-hidden rounded-2xl glass shadow-sm border border-border">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-secondary/30">
            <tr>
              {columns.map((col, index) => (
                <th key={index} className="px-6 py-4 font-semibold tracking-wider">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  className="border-t border-border/50 hover:bg-secondary/40 transition-colors"
                >
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-foreground">
                      {col.cell ? col.cell(row) : (col.accessorKey ? String(row[col.accessorKey]) : null)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
