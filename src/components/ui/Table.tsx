interface TableProps {
  headers: string[];
  rows: (string | number | React.ReactNode)[][];
}

export function Table({ headers, rows }: TableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-bg-tertiary border-b border-border">
            {headers.map((h, i) => (
              <th
                key={i}
                className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-border-light hover:bg-bg-hover transition-colors"
            >
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 font-mono text-text-primary">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
