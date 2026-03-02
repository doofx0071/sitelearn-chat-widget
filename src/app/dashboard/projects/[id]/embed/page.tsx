import { redirect } from "next/navigation";

export default async function ProjectEmbedRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/projects/${id}?tab=embed`);
}
