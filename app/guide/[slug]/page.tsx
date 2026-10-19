import { notFound } from "next/navigation";
import GuideDetail from "@/components/GuideDetail";
import { getGuide } from "@/lib/guides";

export default async function GuidePage({ params }: PageProps<"/guide/[slug]">) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();
  return <GuideDetail guide={guide} />;
}
