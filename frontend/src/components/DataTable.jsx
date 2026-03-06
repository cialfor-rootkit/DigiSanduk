import React from 'react';
import EmptyState from './EmptyState';

const DataTable = ({ columns, rows, emptyMessage }) => {
  if (!rows || rows.length === 0) {
    return <EmptyState title={emptyMessage || 'No records yet'} />;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-cyan/10 bg-midnight/70 hover-lift">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-carbon/70 text-haze">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id || index} className="border-t border-cyan/10 transition hover:bg-carbon/40">
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-3 text-sm text-white">
                  {column.render ? column.render(row) : row[column.key] ?? '--'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
