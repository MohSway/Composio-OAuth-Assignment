import GuideDetail from "@/components/GuideDetail";
import GeneratedGuideView from "@/components/GeneratedGuideView";
import { getLibraryGuide } from "@/lib/guides";

export default async function GuidePage({ params }: PageProps<"/guide/[slug]">) {
  const { slug } = await params;
  const guide = getLibraryGuide(slug);
  if (guide) return <GuideDetail guide={guide} />;
  return <GeneratedGuideView slug={slug} />;
}
