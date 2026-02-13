/**
 * Parse a CSV string into rows of fields. Handles quoted fields with commas.
 */
export function parseCSV(csv: string): string[][] {
  const rows: string[][] = [];
  let i = 0;
  const len = csv.length;

  while (i < len) {
    const row: string[] = [];
    while (i < len) {
      const field: string[] = [];
      if (csv[i] === '"') {
        i++;
        while (i < len) {
          if (csv[i] === '"') {
            i++;
            if (csv[i] === '"') {
              field.push('"');
              i++;
            } else {
              break;
            }
          } else {
            field.push(csv[i]);
            i++;
          }
        }
        row.push(field.join(""));
      } else {
        while (
          i < len &&
          csv[i] !== "," &&
          csv[i] !== "\n" &&
          csv[i] !== "\r"
        ) {
          field.push(csv[i]);
          i++;
        }
        row.push(field.join("").trim());
      }
      if (i < len && csv[i] === ",") {
        i++;
      } else if (i < len && (csv[i] === "\n" || csv[i] === "\r")) {
        if (csv[i] === "\r" && csv[i + 1] === "\n") i++;
        i++;
        break;
      }
    }
    if (row.some((cell) => cell !== "")) {
      rows.push(row);
    }
  }
  return rows;
}
