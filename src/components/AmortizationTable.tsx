import React, { useState } from "react";
import { AmortizationEntry } from "../types";

interface AmortizationTableProps {
  data: AmortizationEntry[];
  formatCurrency: (value: number) => string;
  prepaymentMonth?: number;
}

export const AmortizationTable: React.FC<AmortizationTableProps> = ({
  data,
  formatCurrency,
  prepaymentMonth,
}) => {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof AmortizationEntry;
    direction: "asc" | "desc";
  } | null>(null);

  const sortedData = React.useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  const requestSort = (key: keyof AmortizationEntry) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig?.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: keyof AmortizationEntry) => {
    if (sortConfig?.key !== key) return "↕️";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <div className="max-h-[600px] overflow-y-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-800 sticky top-0">
            <tr>
              {[
                "Month",
                "Date",
                "Payment",
                "Principal",
                "Interest",
                "Balance",
              ].map((header) => (
                <th
                  key={header}
                  onClick={() =>
                    requestSort(header.toLowerCase() as keyof AmortizationEntry)
                  }
                  className="px-6 py-4 text-left text-sm font-medium text-gray-300 uppercase tracking-wider cursor-pointer border-b border-gray-700"
                >
                  <div className="flex items-center space-x-1">
                    <span>{header}</span>
                    <span className="text-gray-500">
                      {getSortIndicator(
                        header.toLowerCase() as keyof AmortizationEntry
                      )}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-gray-900 divide-y divide-gray-800">
            {sortedData.map((entry, index) => (
              <tr
                key={index}
                className={`
                  ${
                    entry.month === prepaymentMonth
                      ? "bg-blue-900 bg-opacity-50"
                      : ""
                  }
                  hover:bg-gray-800 transition-colors duration-150
                `}
              >
                <td className="px-6 py-4 text-sm text-gray-300 border-r border-gray-700">
                  {entry.month}
                </td>
                <td className="px-6 py-4 text-sm text-gray-300 border-r border-gray-700">
                  {entry.date}
                </td>
                <td className="px-6 py-4 text-sm text-gray-300 border-r border-gray-700">
                  {formatCurrency(entry.payment)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-300 border-r border-gray-700">
                  {formatCurrency(entry.principal)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-300 border-r border-gray-700">
                  {formatCurrency(entry.interest)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-300">
                  {formatCurrency(entry.balance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
