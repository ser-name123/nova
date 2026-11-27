import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { ModuleWorkspaceClient } from "@/components/modules/ModuleWorkspaceClient";
import { findNavItem } from "@/lib/navigation";

async function ModuleWorkspaceContent({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const pathname = `/${slug.join("/")}`;
  const mod = findNavItem(pathname);

  if (!mod) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-surface-border bg-surface p-8 text-center">
        <h1 className="text-xl font-bold">Module Not Found</h1>
        <p className="mt-2 text-sm text-muted">
          Route <code className="font-mono">{pathname}</code> is not registered.
        </p>
        <Link
          href="/"
          className="nova-gradient mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return <ModuleWorkspaceClient mod={mod} />;
}

export default function ModuleWorkspacePage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl rounded-2xl border border-surface-border bg-surface p-6 text-sm text-muted">
          Loading module workspace...
        </div>
      }
    >
      <ModuleWorkspaceContent params={params} />
    </Suspense>
  );
}
