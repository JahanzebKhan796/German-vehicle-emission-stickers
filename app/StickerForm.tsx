"use client";

import { useState } from "react";

const VEHICLE_OPTIONS = ["Car", "Truck"] as const;
const FUEL_OPTIONS = ["Petrol", "Diesel"] as const;
const DPF_OPTIONS = [
  "no DPF",
  "PM01/PMK01",
  "PM0/PMK0",
  "PM1/PMK1",
  "PM2/PMK2",
  "PM3/PMK3",
  "PM4/PMK4",
  "PM5/PMK5",
] as const;

// Output value → square color (Tailwind background class)
const VALUE_COLOR: Record<string, string> = {
  "0": "bg-black border border-zinc-400",
  "1": "bg-black border border-zinc-400",
  "2": "bg-red-500",
  "3": "bg-yellow-400",
  "3*": "bg-yellow-400",
  "4": "bg-green-500",
  "4**": "bg-green-500",
};

const UNSUPPORTED_MESSAGE =
  "The selected combination of vehicle type, PM level/class, and emissions key number is not possible/not supported. Please check your entry!";

/** Returns list of [displayValue, colorClass] for the result (handles "3*,4**" as two items). */
function getResultItems(value: string): [string, string][] {
  const trimmed = value.trim();
  if (trimmed === "3*,4**") {
    return [
      ["3*", VALUE_COLOR["3*"]],
      ["4**", VALUE_COLOR["4**"]],
    ];
  }
  const color = VALUE_COLOR[trimmed] ?? "bg-zinc-400";
  return [[trimmed, color]];
}

// Column indices: 0 = emission id, 1 = description, 2 = petrol, 3–10 = DPF (no DPF … PM5/PMK5)
const DPF_TO_COLUMN_INDEX: Record<string, number> = {
  "no DPF": 3,
  "PM01/PMK01": 4,
  "PM0/PMK0": 5,
  "PM1/PMK1": 6,
  "PM2/PMK2": 7,
  "PM3/PMK3": 8,
  "PM4/PMK4": 9,
  "PM5/PMK5": 10,
};

function findRow(
  rows: string[][],
  vehicleType: "Car" | "Truck",
  emissionKey: string,
): string[] | null {
  const keyNum = parseInt(emissionKey, 10);
  if (Number.isNaN(keyNum) || keyNum < 0 || keyNum > 99) return null;

  for (const row of rows) {
    const firstCol = row[0]?.trim();
    if (!firstCol) continue;
    const num = parseInt(firstCol, 10);
    if (Number.isNaN(num)) continue;

    const lastTwo = num % 100;
    if (lastTwo !== keyNum) continue;

    if (vehicleType === "Car" && num >= 600) continue;
    if (vehicleType === "Truck" && num <= 600) continue;

    return row;
  }
  return null;
}

export default function StickerForm({ rows }: { rows: string[][] }) {
  const [vehicleType, setVehicleType] = useState<"Car" | "Truck" | "">("");
  const [fuelType, setFuelType] = useState<"Petrol" | "Diesel" | "">("");
  const [dpf, setDpf] = useState<string>("");
  const [emissionKey, setEmissionKey] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [helpExpanded, setHelpExpanded] = useState(false);

  const isDiesel = fuelType === "Diesel";

  const emissionKeyValid = /^\d{2}$/.test(emissionKey.trim());

  const allFieldsFilled =
    !!vehicleType &&
    !!fuelType &&
    (isDiesel ? !!dpf : true) &&
    emissionKeyValid;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Hide result first so user sees the change when it reappears
    setResult(null);

    if (!vehicleType) return;

    const key = emissionKey.trim();
    if (!/^\d{2}$/.test(key)) {
      setTimeout(() => setResult("Invalid emission number."), 80);
      return;
    }

    const row = findRow(rows, vehicleType, key);
    if (!row) {
      setTimeout(() => setResult("Invalid emission number."), 80);
      return;
    }

    let resultValue: string;
    if (fuelType === "Petrol") {
      resultValue = row[2] ?? "";
    } else {
      const colIndex = DPF_TO_COLUMN_INDEX[dpf];
      if (colIndex === undefined) {
        setTimeout(() => setResult("Invalid emission number."), 80);
        return;
      }
      resultValue = row[colIndex] ?? "";
    }

    setTimeout(() => setResult(resultValue), 80);
  }

  function handleEmissionKeyChange(value: string) {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 2);
    setEmissionKey(digitsOnly);
  }

  return (
    <main className="min-h-screen bg-white flex justify-start pt-0 px-6 pb-6">
      <div className="w-full max-w-md">
        <form
          className="rounded-xl bg-white shadow-lg border border-zinc-300 p-8 space-y-8"
          onSubmit={handleSubmit}
        >
          {/* Vehicle type */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-black">
              Vehicle type
            </legend>
            <div className="flex gap-6">
              {VEHICLE_OPTIONS.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-2 cursor-pointer select-none"
                >
                  <input
                    type="radio"
                    name="vehicleType"
                    value={option}
                    checked={vehicleType === option}
                    onChange={() => setVehicleType(option)}
                    className="w-4 h-4 text-black border-zinc-400 focus:ring-2 focus:ring-zinc-500"
                  />
                  <span className="text-black">{option}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Fuel type */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-black">
              Fuel type
            </legend>
            <div className="flex gap-6">
              {FUEL_OPTIONS.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-2 cursor-pointer select-none"
                >
                  <input
                    type="radio"
                    name="fuelType"
                    value={option}
                    checked={fuelType === option}
                    onChange={() => {
                      setFuelType(option);
                      if (option !== "Diesel") setDpf("");
                    }}
                    className="w-4 h-4 text-black border-zinc-400 focus:ring-2 focus:ring-zinc-500"
                  />
                  <span className="text-black">{option}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* DPF dropdown (only when Diesel) */}
          {isDiesel && (
            <div className="space-y-2">
              <label
                htmlFor="dpf"
                className="block text-sm font-semibold text-black"
              >
                Diesel Particulate Filter (DPF)
              </label>
              <select
                id="dpf"
                value={dpf}
                onChange={(e) => setDpf(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 bg-white text-black focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
              >
                <option value="">Select DPF</option>
                {DPF_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Emission key number */}
          <div className="space-y-2">
            <label
              htmlFor="emissionKey"
              className="block text-sm font-semibold text-black"
            >
              Emission key number
            </label>
            <input
              id="emissionKey"
              type="text"
              inputMode="numeric"
              value={emissionKey}
              onChange={(e) => handleEmissionKeyChange(e.target.value)}
              placeholder="Enter 2 digits"
              maxLength={2}
              className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 bg-white text-black placeholder-zinc-500 focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
            />
            {emissionKey.length > 0 && !emissionKeyValid && (
              <p className="text-sm text-amber-700">
                Enter exactly 2 numeric digits.
              </p>
            )}
          </div>

          {/* Expandable help: Where can I find the emissions key number? */}
          <div className="border border-zinc-300 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setHelpExpanded((v) => !v)}
              className="w-full px-4 py-3 flex items-center justify-between text-left text-sm font-semibold text-black bg-zinc-50 hover:bg-zinc-100 transition-colors"
              aria-expanded={helpExpanded}
            >
              Where can I find the emissions key number?
              <span
                className={`shrink-0 ml-2 transition-transform ${helpExpanded ? "rotate-180" : ""}`}
                aria-hidden
              >
                ▼
              </span>
            </button>
            {helpExpanded && (
              <div className="px-4 pb-4 pt-1 space-y-4 bg-white border-t border-zinc-200 text-black text-sm">
                <section className="space-y-2">
                  <p className="font-bold">
                    Old vehicle registration certificate (until 30.09.2005)
                  </p>
                  <p>
                    The last two digits of the key number in the vehicle
                    registration document (&quot;to 1&quot;):
                  </p>
                  <div className="rounded border border-zinc-200 overflow-hidden">
                    <img
                      src="/help/image1.png"
                      alt="Old vehicle registration certificate showing key number 'to 1' with last two digits highlighted"
                      className="w-full h-auto max-h-64 object-contain object-top-left"
                    />
                  </div>
                </section>
                <section className="space-y-2">
                  <p className="font-bold">
                    Registration certificate Part I (from 01.10.2005)
                  </p>
                  <p>
                    In the registration certificate, the last two digits of
                    field &quot;14.1&quot;:
                  </p>
                  <div className="rounded border border-zinc-200 overflow-hidden">
                    <img
                      src="/help/image2.png"
                      alt="Registration certificate Part I showing field 14.1 with last two digits highlighted"
                      className="w-full h-auto max-h-64 object-contain object-top-left"
                    />
                  </div>
                </section>
                <section className="space-y-2">
                  <p className="font-bold">
                    Does the vehicle registration document look different?
                  </p>
                  <p>
                    On older vehicle registration documents, the emissions key
                    number can also be found in the location marked in red in
                    the illustration:
                  </p>
                  <div className="rounded border border-zinc-200 overflow-hidden">
                    <img
                      src="/help/image3.png"
                      alt="Older vehicle registration document with emissions key number location marked in red"
                      className="w-full h-auto max-h-64 object-contain object-top-left"
                    />
                  </div>
                </section>
              </div>
            )}
          </div>

          {result !== null && (
            <div className="space-y-2">
              <span className="block text-sm font-semibold text-black">
                Sticker color
              </span>
              <div
                className={`rounded-lg px-4 py-3 text-sm font-medium text-black ${
                  result === "Invalid emission number."
                    ? "bg-amber-100 text-amber-900"
                    : result === "-1" || result === "-2"
                      ? "bg-amber-100 text-amber-900"
                      : "bg-zinc-200 text-black"
                }`}
              >
                {result === "Invalid emission number." ? (
                  result
                ) : result === "-1" || result === "-2" ? (
                  UNSUPPORTED_MESSAGE
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    {getResultItems(result).map(([label, colorClass]) => (
                      <span
                        key={label}
                        className="inline-flex items-center gap-2"
                      >
                        <span
                          className={`inline-block h-5 w-5 shrink-0 rounded ${colorClass}`}
                          aria-hidden
                        />
                        <span>{label}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!allFieldsFilled}
            className="w-full py-3 rounded-lg bg-black text-white font-semibold hover:bg-zinc-800 focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-black"
          >
            Enter
          </button>
        </form>
      </div>
    </main>
  );
}
