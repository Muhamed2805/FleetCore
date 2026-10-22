// CSV files meant to be opened in a spreadsheet, Excel first.
//
// Excel takes the delimiter and decimal separator from the computer's
// regional settings: an English Excel expects "," and "1234.50", a German
// or Bosnian one ";" and "1234,50". The UI language stands in for those
// settings. The file is UTF-8 with a byte order mark, so Excel reads č, ž
// and ö correctly, and uses CRLF line endings (RFC 4180).

export type CsvColumn<Row> = {
  header: string;
  value: (row: Row) => string | number | null;
  // Money is written with exactly two decimals; other numbers as they are.
  money?: boolean;
};

export function csvFormat(locale: string) {
  const decimal =
    new Intl.NumberFormat(locale)
      .formatToParts(1.5)
      .find((part) => part.type === "decimal")?.value === ","
      ? ","
      : ".";
  return { decimal, delimiter: decimal === "," ? ";" : "," };
}

// A text cell that starts like a formula would run as one when the file is
// opened (CSV injection), e.g. a vehicle note "=HYPERLINK(...)". A leading
// apostrophe makes the spreadsheet show it as text.
const FORMULA_START = /^[=+\-@\t\r]/;

function textCell(value: string, delimiter: string) {
  const safe = FORMULA_START.test(value) ? `'${value}` : value;
  const needsQuotes =
    safe.includes(delimiter) || /["\r\n]/.test(safe) || safe !== safe.trim();
  return needsQuotes ? `"${safe.replaceAll('"', '""')}"` : safe;
}

function numberCell(value: number, money: boolean, decimal: string) {
  const text = money ? value.toFixed(2) : String(value);
  return decimal === "," ? text.replace(".", ",") : text;
}

export function buildCsv<Row>(
  columns: CsvColumn<Row>[],
  rows: Row[],
  locale: string
) {
  const { decimal, delimiter } = csvFormat(locale);

  const line = (cells: string[]) => cells.join(delimiter);
  const header = line(
    columns.map((column) => textCell(column.header, delimiter))
  );
  const body = rows.map((row) =>
    line(
      columns.map((column) => {
        const value = column.value(row);
        if (value === null || value === "") return "";
        return typeof value === "number"
          ? numberCell(value, column.money ?? false, decimal)
          : textCell(value, delimiter);
      })
    )
  );

  return `\uFEFF${[header, ...body].join("\r\n")}\r\n`;
}
