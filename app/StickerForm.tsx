"use client";

import { useState, useEffect } from "react";

const VEHICLE_OPTIONS: { value: "Car" | "Truck"; label: string }[] = [
  { value: "Car", label: "PKW und Wohnmobile bis 2,8t" },
  {
    value: "Truck",
    label: "LKW / Nutzfahrzeuge (M2, M3, N und Wohnmobil ab 2,8t)",
  },
];
const FUEL_OPTIONS: { value: "Petrol" | "Diesel"; label: string }[] = [
  { value: "Petrol", label: "Kfz mit Ottomotor (Benzin, Flüssiggas, Erdgas)" },
  { value: "Diesel", label: "Kfz mit Dieselmotor (Diesel)" },
];
/** Emission key codes that always return 4 (green) for any vehicle type, fuel and PM. */
const ALWAYS_GREEN_EMISSION_KEYS = new Set([
  "A0",
  "B0",
  "C0",
  "D0",
  "E0",
  "F0",
  "G0",
  "H0",
  "I0",
  "J0",
  "K0",
  "L0",
  "M0",
  "N0",
  "O0",
  "P0",
  "Q0",
  "R0",
  "S0",
  "T0",
  "U0",
  "V0",
  "W0",
  "X0",
  "Y0",
  "ZA",
  "ZB",
  "ZC",
  "ZD",
  "ZE",
  "ZF",
  "ZG",
  "ZH",
  "ZI",
  "ZJ",
  "ZK",
  "ZL",
  "BA",
  "BB",
  "BC",
  "AA",
  "AB",
  "AC",
  "AD",
  "AE",
  "AF",
  "AG",
  "AH",
  "AI",
  "CG",
  "BH",
  "BI",
  "AJ",
  "AK",
  "AL",
  "DG",
  "CH",
  "CI",
  "AM",
  "AN",
  "AO",
  "AP",
  "AQ",
  "AR",
  "EA",
  "EB",
  "EC",
  "ZX",
  "ZY",
  "ZZ",
  "AX",
  "AY",
  "AZ",
]);

const DPF_OPTIONS: { value: string; label: string }[] = [
  { value: "no DPF", label: "kein Partikelminderungssystem" },
  { value: "PM01/PMK01", label: "PM01/PMK01" },
  { value: "PM0/PMK0", label: "PM0/PMK0" },
  { value: "PM1/PMK1", label: "PM1/PMK1" },
  { value: "PM2/PMK2", label: "PM2/PMK2" },
  { value: "PM3/PMK3", label: "PM3/PMK3" },
  { value: "PM4/PMK4", label: "PM4/PMK4" },
  { value: "PM5", label: "PM5" },
];

// Output value → square color (Tailwind background class)
const VALUE_COLOR: Record<string, string> = {
  "0": "bg-black border border-zinc-400",
  "1": "bg-black border border-zinc-400",
  "2": "bg-red-500",
  "3": "bg-yellow-400",
  "3*": "bg-yellow-400",
  "4": "bg-green-500",
  "4**": "bg-green-500",
  "4***": "bg-green-500",
};

const UNSUPPORTED_MESSAGE =
  "Die gewählte Kombination von Fahrzeugart, PM-Stufe/-Klasse und Emissionsschlüsselnummer ist nicht möglich / nicht vorgesehen. Bitte überprüfen Sie die Eingabe!";

const RESULT_MESSAGE: Record<string, string> = {
  "0": "Ihr Fahrzeug kann leider keine Plakette erhalten.",
  "1": "Ihr Fahrzeug kann leider keine Plakette erhalten.",
  "2": 'Es kann eine Feinstaubplakette "2 rot" zugeteilt werden.',
  "3": 'Es kann eine Feinstaubplakette "3 gelb" zugeteilt werden.',
  "3*": 'Es kann eine Feinstaubplakette "3 gelb" zugeteilt werden.',
  "4": 'Es kann eine Feinstaubplakette "4 grün" zugeteilt werden.',
  "4**": 'Es kann eine Feinstaubplakette "4 grün" zugeteilt werden.',
  "4***": 'Es kann eine Feinstaubplakette "4 grün" zugeteilt werden.',
  "3*,4**":
    'Fahrzeugen mit einem zulässigen Gesamtgewicht von höchstens 2500 kg kann eine Plakette der Schadstoffgruppe "3 gelb" zugeteilt werden. Fahrzeugen mit einem zulässigen Gesamtgewicht von über 2500 kg kann eine Plakette der Schadstoffgruppe "4 grün" zugeteilt werden.',
};

/** Returns the message to display for a result value, or null if none. */
function getResultMessage(value: string): string | null {
  const trimmed = value.trim();
  return RESULT_MESSAGE[trimmed] ?? null;
}

/** Map result value to sticker type(s) for circle display. 3* shows as 3, 4** and 4*** show as 4. */
function getStickerTypes(value: string): ("1" | "2" | "3" | "4")[] {
  const trimmed = value.trim();
  if (trimmed === "3*,4**") return ["3", "4"];
  if (trimmed === "0" || trimmed === "1") return ["1"];
  if (trimmed === "2") return ["2"];
  if (trimmed === "3" || trimmed === "3*") return ["3"];
  if (trimmed === "4" || trimmed === "4**" || trimmed === "4***") return ["4"];
  return [];
}

const STICKER_IMAGES: Record<"2" | "3" | "4", string> = {
  "2": "/help/Umwelt_rot.png",
  "3": "/help/Umwelt_gelb.png",
  "4": "/help/Umwelt_grün.png",
};

const STICKER_SIZE = 80;

function StickerCircle({ type }: { type: "1" | "2" | "3" | "4" }) {
  if (type === "1") {
    return (
      <div
        className="shrink-0 rounded-full border-10 border-zinc-300 bg-white flex items-center justify-center"
        style={{ width: STICKER_SIZE, height: STICKER_SIZE }}
        aria-hidden
      >
        <span className="sr-only">Keine Plakette</span>
        <svg
          viewBox="0 0 24 24"
          className="w-12 h-12 text-red-500"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </div>
    );
  }

  const src = STICKER_IMAGES[type];
  return (
    <img
      src={src}
      alt={`Feinstaubplakette ${type}`}
      className="shrink-0 w-auto h-auto object-contain"
      style={{ width: STICKER_SIZE, height: STICKER_SIZE }}
    />
  );
}

// Column indices: 0 = emission id, 1 = description, 2 = petrol, 3–10 = DPF (no DPF … PM5)
const DPF_TO_COLUMN_INDEX: Record<string, number> = {
  "no DPF": 3,
  "PM01/PMK01": 4,
  "PM0/PMK0": 5,
  "PM1/PMK1": 6,
  "PM2/PMK2": 7,
  "PM3/PMK3": 8,
  "PM4/PMK4": 9,
  PM5: 10,
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
  const [dpf, setDpf] = useState<string>("no DPF");
  const [emissionKey, setEmissionKey] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [showEmissionHelp, setShowEmissionHelp] = useState(false);
  const [showDpfHelp, setShowDpfHelp] = useState(false);
  // Notify parent (WordPress) to resize iframe so only one scrollbar shows
  useEffect(() => {
    const sendHeight = () => {
      const height = document.documentElement.scrollHeight;
      try {
        window.parent?.postMessage?.(
          { type: "dust-sticker-resize", height },
          "*",
        );
      } catch {
        // ignore (e.g. cross-origin)
      }
    };
    sendHeight();
    // After expand/collapse, DOM updates asynchronously; send height multiple times
    // so we catch the correct (smaller) height when user collapses
    const delays = [100, 250, 500, 800];
    const timers = delays.map((ms) => setTimeout(sendHeight, ms));
    const ro = new ResizeObserver(sendHeight);
    ro.observe(document.body);
    return () => {
      timers.forEach((t) => clearTimeout(t));
      ro.disconnect();
    };
  }, [result]);

  const isDiesel = fuelType === "Diesel";

  // Allow submit for any 2 alphanumeric chars; validity is checked on submit
  const emissionKeyValid =
    emissionKey.trim().length === 2 &&
    /^[A-Za-z0-9]{2}$/.test(emissionKey.trim());

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

    if (vehicleType === "Truck" && fuelType === "Diesel" && dpf === "PM5") {
      setTimeout(
        () =>
          setResult(
            "Die gewählte Kombination von Fahrzeugart, PM-Stufe/-Klasse und Emissionsschlüsselnummer ist nicht möglich / nicht vorgesehen. Bitte überprüfen Sie die Eingabe!",
          ),
        80,
      );
      return;
    }

    const key = emissionKey.trim();
    const keyUpper = key.toUpperCase();
    if (ALWAYS_GREEN_EMISSION_KEYS.has(keyUpper)) {
      setTimeout(() => setResult("4"), 80);
      return;
    }
    if (!/^\d{2}$/.test(key)) {
      setTimeout(
        () =>
          setResult(
            "Die eingegebene Emissionsschlüsselnummer ist nicht gültig. Bitte überprüfen Sie die Eingabe!",
          ),
        80,
      );
      return;
    }

    const row = findRow(rows, vehicleType, key);
    if (!row) {
      setTimeout(
        () =>
          setResult(
            "Die eingegebene Emissionsschlüsselnummer ist nicht gültig. Bitte überprüfen Sie die Eingabe!",
          ),
        80,
      );
      return;
    }

    let resultValue: string;
    if (fuelType === "Petrol") {
      resultValue = row[2] ?? "";
    } else {
      const colIndex = DPF_TO_COLUMN_INDEX[dpf];
      if (colIndex === undefined) {
        setTimeout(
          () =>
            setResult(
              "Die eingegebene Emissionsschlüsselnummer ist nicht gültig. Bitte überprüfen Sie die Eingabe!",
            ),
          80,
        );
        return;
      }
      resultValue = row[colIndex] ?? "";
    }

    setTimeout(() => setResult(resultValue), 80);
  }

  function handleEmissionKeyChange(value: string) {
    const alphanumeric = value
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 2)
      .toUpperCase();
    setEmissionKey(alphanumeric);
  }

  return (
    <main className="bg-white flex justify-start pt-0 pl-3 pr-6 pb-6">
      <div className="w-full max-w-[800px]">
        <form className="space-y-8" onSubmit={handleSubmit}>
          {/* Vehicle type */}
          <fieldset className="space-y-3">
            <legend className="font-semibold text-black">1. Fahrzeugart</legend>
            <div className="flex gap-6">
              {VEHICLE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 cursor-pointer select-none"
                >
                  <input
                    type="radio"
                    name="vehicleType"
                    value={option.value}
                    checked={vehicleType === option.value}
                    onChange={() => setVehicleType(option.value)}
                    className="w-4 h-4 text-black border-zinc-400 focus:ring-2 focus:ring-zinc-500"
                  />
                  <span className="text-black">{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Fuel type */}
          <fieldset className="space-y-3">
            <legend className="font-semibold text-black">2. Antriebsart</legend>
            <div className="flex gap-6">
              {FUEL_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 cursor-pointer select-none"
                >
                  <input
                    type="radio"
                    name="fuelType"
                    value={option.value}
                    checked={fuelType === option.value}
                    onChange={() => {
                      setFuelType(option.value);
                      if (option.value !== "Diesel") setDpf("no DPF");
                    }}
                    className="w-4 h-4 text-black border-zinc-400 focus:ring-2 focus:ring-zinc-500"
                  />
                  <span className="text-black">{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* DPF dropdown (only when Diesel) */}
          {isDiesel && (
            <div className="space-y-2">
              <div className="rounded-full border border-zinc-300 bg-[#f0f0f0] px-5 pt-3 pb-2.5 focus-within:ring-2 focus-within:ring-zinc-500 focus-within:border-transparent">
                <div className="mb-1">
                  <span className="text-xs text-zinc-500">
                    Partikelminderungssystem mit PM-Stufe:
                  </span>
                  <span
                    className="inline-block ml-0.5"
                    style={{ verticalAlign: "super" }}
                  >
                    <button
                      type="button"
                      onClick={() => setShowDpfHelp(true)}
                      className="flex items-center justify-center w-4 h-4 rounded-full border border-zinc-400 bg-zinc-100 text-zinc-600 hover:bg-zinc-200 text-[10px] font-semibold leading-none"
                      aria-label="Wo finde ich die PM-Stufe?"
                      title="Wo finde ich die PM-Stufe?"
                    >
                      i
                    </button>
                  </span>
                </div>
                <select
                  id="dpf"
                  value={dpf}
                  onChange={(e) => setDpf(e.target.value)}
                  className="w-full min-h-[1.5em] border-none bg-transparent p-0 text-black focus:ring-0 focus:outline-none cursor-pointer"
                  aria-label="Partikelminderungssystem mit PM-Stufe"
                >
                  {DPF_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Emission key number */}
          <div className="space-y-2">
            <label htmlFor="emissionKey" className="font-semibold text-black">
              <span className="inline align-baseline">
                3. Emissionsschlüssel-Nr.
              </span>
              <span
                className="inline-block ml-0.5"
                style={{ verticalAlign: "super" }}
              >
                <button
                  type="button"
                  onClick={() => setShowEmissionHelp(true)}
                  className="flex items-center justify-center w-4 h-4 rounded-full border border-zinc-400 bg-zinc-100 text-zinc-600 hover:bg-zinc-200 text-[10px] font-semibold leading-none"
                  aria-label="Wo finde ich die Emissionsschlüssel-Nr.?"
                  title="Wo finde ich die Emissionsschlüssel-Nr.?"
                >
                  i
                </button>
              </span>
            </label>
            <input
              id="emissionKey"
              type="text"
              inputMode="text"
              value={emissionKey}
              onChange={(e) => handleEmissionKeyChange(e.target.value)}
              placeholder="Emissionsschlüssel-Nr.*"
              maxLength={2}
              className="w-full px-5 py-3.5 rounded-full border border-zinc-300 bg-[#f0f0f0] text-black placeholder-zinc-500 focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
            />
          </div>

          {result !== null && (
            <div className="space-y-2">
              <div>
                <span className="block font-semibold text-black">Ergebnis</span>
                <hr className="mt-1 border-zinc-300" />
              </div>
              <div
                className={`rounded-full px-5 py-3 font-medium text-black ${
                  result ===
                    "Die gewählte Kombination von Fahrzeugart, PM-Stufe/-Klasse und Emissionsschlüsselnummer ist nicht möglich / nicht vorgesehen. Bitte überprüfen Sie die Eingabe!" ||
                  result ===
                    "Die eingegebene Emissionsschlüsselnummer ist nicht gültig. Bitte überprüfen Sie die Eingabe!"
                    ? "bg-amber-100 text-amber-900"
                    : result === "-1" || result === "-2"
                      ? "bg-amber-100 text-amber-900"
                      : "bg-[#f0f0f0] text-black"
                }`}
              >
                {result ===
                "Die gewählte Kombination von Fahrzeugart, PM-Stufe/-Klasse und Emissionsschlüsselnummer ist nicht möglich / nicht vorgesehen. Bitte überprüfen Sie die Eingabe!" ? (
                  result
                ) : result ===
                  "Die eingegebene Emissionsschlüsselnummer ist nicht gültig. Bitte überprüfen Sie die Eingabe!" ? (
                  result
                ) : result === "-1" || result === "-2" ? (
                  UNSUPPORTED_MESSAGE
                ) : (
                  <div className="flex flex-row items-center gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                      {getStickerTypes(result).map((t) => (
                        <StickerCircle key={t} type={t} />
                      ))}
                    </div>
                    {getResultMessage(result) && (
                      <p className="text-black leading-snug flex-1 min-w-0">
                        {getResultMessage(result)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-start">
            <button
              type="submit"
              disabled={!allFieldsFilled}
              className="max-w-xs py-3 px-8 rounded-full bg-[#0065a4] text-white font-semibold hover:bg-[#005a94] focus:ring-2 focus:ring-[#0065a4] focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#0065a4]"
            >
              Plakettenart ermitteln
            </button>
          </div>
        </form>
      </div>

      {/* Emission key help image modal */}
      {showEmissionHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent"
          onClick={() => setShowEmissionHelp(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Emissionsschlüssel-Nr. finden"
        >
          <div
            className="relative max-h-[80vh] max-w-full bg-white border border-zinc-200 rounded-lg shadow-[0_25px_60px_-12px_rgba(0,0,0,0.4)] p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowEmissionHelp(false)}
              className="absolute top-2 right-2 text-zinc-600 hover:text-zinc-800 text-2xl font-bold leading-none"
              aria-label="Schließen"
            >
              ×
            </button>
            <img
              src="/help/Emissionsnummer.png"
              alt="Wo finde ich die Emissionsschlüssel-Nr.? Neuer Fahrzeugschein, Alter Fahrzeugschein, Alter Fahrzeugbrief"
              className="max-h-[72vh] w-auto object-contain rounded"
            />
          </div>
        </div>
      )}

      {/* DPF / PM-Stufe help image modal (same image for now; replace src when you have the PM image) */}
      {showDpfHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent"
          onClick={() => setShowDpfHelp(false)}
          role="dialog"
          aria-modal="true"
          aria-label="PM-Stufe finden"
        >
          <div
            className="relative max-h-[80vh] max-w-full bg-white border border-zinc-200 rounded-lg shadow-[0_25px_60px_-12px_rgba(0,0,0,0.4)] p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowDpfHelp(false)}
              className="absolute top-2 right-2 text-zinc-600 hover:text-zinc-800 text-2xl font-bold leading-none"
              aria-label="Schließen"
            >
              ×
            </button>
            <img
              src="/help/Partikelminderungssystem.png"
              alt="Wo finde ich die PM-Stufe?"
              className="max-h-[72vh] w-auto object-contain rounded"
            />
          </div>
        </div>
      )}
    </main>
  );
}
