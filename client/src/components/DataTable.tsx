import { DataRow } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface DataTableProps {
  data: DataRow[];
  columns: string[]; // Keys to display
  title: string;
}

export function DataTable({ data, columns, title }: DataTableProps) {
  return (
    <div
      className="rounded-xl border border-border/50 bg-card/50 overflow-hidden shadow-sm"
      dir="rtl"
    >
      <div className="bg-secondary/30 px-6 py-4 border-b border-border/50">
        <h3 className="font-bold text-foreground flex items-center gap-2 flex-row-reverse justify-end text-right">
          <span className="w-2 h-6 bg-primary rounded-full"></span>
          {title}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <Table dir="rtl">
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/50">
              {columns.map((col) => (
                <TableHead
                  key={col}
                  className="text-right font-bold text-primary"
                >
                  {col.toUpperCase()}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, idx) => (
              <TableRow 
                key={row.id} 
                className={cn(
                  "border-border/50 transition-colors",
                  idx % 2 === 0 ? "bg-transparent" : "bg-muted/20"
                )}
              >
                {columns.map((col) => (
                  <TableCell
                    key={`${row.id}-${col}`}
                    className="font-mono text-muted-foreground text-right"
                  >
                    {row[col]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
