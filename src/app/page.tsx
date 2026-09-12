import { AppShell } from "../components/app-shell";
import { inspections } from "../lib/data/inspections";

export default function HomePage() {
  return <AppShell inspections={inspections} />;
}
