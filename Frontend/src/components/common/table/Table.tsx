import React from 'react';
import Spinner from '../spinner/Spinner';
import EmptyState from '../empty/EmptyState';
import './Table.css';

export interface Column<T = any> {
  header: React.ReactNode;
  accessor?: keyof T | ((row: T) => React.ReactNode);
  className?: string;
  width?: string | number;
}

export interface TableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

export function Table<T = any>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items to display right now.',
  className = '',
}: TableProps<T>) {
  if (isLoading) {
    return (
      <div className="table-responsive">
        <Spinner size="md" text="Loading data..." />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="table-responsive">
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  return (
    <div className={`table-responsive ${className}`}>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className={col.className} style={{ width: col.width }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr key={keyExtractor(row, rowIdx)}>
              {columns.map((col, colIdx) => {
                let cellContent: React.ReactNode = null;
                if (typeof col.accessor === 'function') {
                  cellContent = col.accessor(row);
                } else if (col.accessor) {
                  cellContent = row[col.accessor] as unknown as React.ReactNode;
                }
                return (
                  <td key={colIdx} className={col.className}>
                    {cellContent}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
