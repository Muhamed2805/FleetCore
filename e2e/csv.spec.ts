import { expect, test } from "@playwright/test";

import { buildCsv, csvFormat, type CsvColumn } from "../src/lib/csv";
import { filterExpenses } from "../src/lib/expenses";
import { filterMaintenanceRecords } from "../src/lib/maintenance";
import { filterVehicles } from "../src/lib/vehicles";

// Plain unit checks; no page or server involved.

type Row = { name: string; amount: number | null };

const columns: CsvColumn<Row>[] = [
  { header: "Name", value: (row) => row.name },
  { header: "Amount (USD)", value: (row) => row.amount, money: true },
];

function lines(csv: string) {
  expect(csv.startsWith("﻿")).toBe(true);
  expect(csv.endsWith("\r\n")).toBe(true);
  return csv.slice(1, -2).split("\r\n");
}

test.describe("buildCsv", () => {
  test("follows the language's delimiter and decimal separator", () => {
    expect(csvFormat("en")).toEqual({ decimal: ".", delimiter: "," });
    for (const locale of ["bs", "hr", "sr", "de", "sv", "nl"]) {
      expect(csvFormat(locale)).toEqual({ decimal: ",", delimiter: ";" });
    }

    const rows = [{ name: "Fuel", amount: 1234.5 }];
    expect(lines(buildCsv(columns, rows, "en"))).toEqual([
      "Name,Amount (USD)",
      "Fuel,1234.50",
    ]);
    expect(lines(buildCsv(columns, rows, "de"))).toEqual([
      "Name;Amount (USD)",
      "Fuel;1234,50",
    ]);
  });

  test("quotes cells that would break the row", () => {
    const rows = [
      { name: "Oil, filters", amount: null },
      { name: 'Said "urgent"', amount: 0 },
      { name: "Line one\nline two", amount: -12 },
      { name: " padded ", amount: 1 },
      { name: "Semicolon; only matters in bs", amount: 2 },
    ];
    expect(lines(buildCsv(columns, rows, "en"))).toEqual([
      "Name,Amount (USD)",
      '"Oil, filters",',
      '"Said ""urgent""",0.00',
      '"Line one\nline two",-12.00',
      '" padded ",1.00',
      "Semicolon; only matters in bs,2.00",
    ]);
    expect(lines(buildCsv(columns, rows, "bs"))[5]).toBe(
      '"Semicolon; only matters in bs";2,00'
    );
  });

  test("stops text from running as a formula", () => {
    const rows = ["=1+1", "+1", "-1", "@SUM(A1)", "\tx", '=HYPERLINK("x")'].map(
      (name) => ({ name, amount: null })
    );
    expect(lines(buildCsv(columns, rows, "en")).slice(1)).toEqual([
      "'=1+1,",
      "'+1,",
      "'-1,",
      "'@SUM(A1),",
      "'\tx,",
      `"'=HYPERLINK(""x"")",`,
    ]);
    // Real negative numbers stay numbers.
    expect(lines(buildCsv(columns, [{ name: "Refund", amount: -5 }], "en"))[1]).toBe(
      "Refund,-5.00"
    );
  });
});

test.describe("list filters", () => {
  const vehicles = [
    { type: "car", status: "active", make: "Škoda", model: "Octavia", license_plate: "A12-B-345", vin: null },
    { type: "van", status: "sold", make: "Ford", model: "Transit", license_plate: "K99-M-001", vin: "WF0XXXTTGXKA12345" },
  ] as const;

  test("vehicles: type, status and search", () => {
    expect(filterVehicles([...vehicles], {})).toHaveLength(2);
    expect(filterVehicles([...vehicles], { type: "van" })).toEqual([vehicles[1]]);
    expect(filterVehicles([...vehicles], { status: "active" })).toEqual([vehicles[0]]);
    expect(filterVehicles([...vehicles], { search: "  škoda " })).toEqual([vehicles[0]]);
    expect(filterVehicles([...vehicles], { search: "xka12" })).toEqual([vehicles[1]]);
    expect(filterVehicles([...vehicles], { type: "car", status: "sold" })).toEqual([]);
  });

  test("maintenance and expenses", () => {
    const records = [
      { status: "scheduled", vehicle_id: "a" },
      { status: "completed", vehicle_id: "b" },
    ] as const;
    expect(filterMaintenanceRecords([...records], { status: "all" })).toHaveLength(2);
    expect(filterMaintenanceRecords([...records], { vehicleId: "b" })).toEqual([records[1]]);
    expect(
      filterMaintenanceRecords([...records], { status: "scheduled", vehicleId: "b" })
    ).toEqual([]);

    const expenses = [{ category: "fuel" }, { category: "toll" }] as const;
    expect(filterExpenses([...expenses], {})).toHaveLength(2);
    expect(filterExpenses([...expenses], { category: "toll" })).toEqual([expenses[1]]);
  });
});
