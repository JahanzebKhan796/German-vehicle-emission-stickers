import { readFileSync } from "fs";
import path from "path";
import { parseCSV } from "@/lib/csv";
import StickerForm from "./StickerForm";

export default function Home() {
  const dataPath = path.join(process.cwd(), "data", "Stickers.csv");
  const csv = readFileSync(dataPath, "utf-8");
  const rows = parseCSV(csv);

  return <StickerForm rows={rows} />;
}
