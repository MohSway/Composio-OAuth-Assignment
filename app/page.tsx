import Marketplace from "@/components/Marketplace";
import { getLibraryGuides } from "@/lib/guides";

export default function Home() {
  const guides = getLibraryGuides();
  return <Marketplace guides={guides} />;
}
