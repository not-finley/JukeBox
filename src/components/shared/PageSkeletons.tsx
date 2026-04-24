import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Full-page placeholder while shell layout waits on session */
export function AppShellSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("common-container w-full max-w-lg mx-auto gap-8 py-12", className)}>
      <div className="flex flex-col items-center gap-4 w-full">
        <Skeleton className="h-14 w-14 rounded-full" />
        <Skeleton className="h-6 w-48 rounded-lg" />
        <Skeleton className="h-4 w-full max-w-xs" />
      </div>
      <Skeleton className="h-48 w-full rounded-2xl" />
      <div className="w-full space-y-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-[85%]" />
        <Skeleton className="h-3 w-[70%]" />
      </div>
    </div>
  );
}

/** Compact skeleton for the auth-provider overlay */
export function AuthOverlaySkeleton() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-10 px-6">
      <Skeleton className="h-14 w-14 rounded-full" />
      <Skeleton className="h-5 w-40 rounded" />
      <Skeleton className="h-3 w-56 rounded" />
    </div>
  );
}

export function HomeFeedSkeleton() {
  return (
    <div className="common-container w-full px-0 sm:px-8 lg:px-16 py-6">
      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-10 w-full max-w-7xl mx-auto">
        <div className="w-full max-w-2xl px-4 space-y-6">
          <Skeleton className="h-8 w-56 max-w-full" />
          <Skeleton className="h-4 w-72 max-w-full" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-10 w-24 rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-lg" />
            <Skeleton className="h-10 w-28 rounded-lg" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-800 overflow-hidden bg-gray-900/40"
            >
              <div className="flex items-center gap-3 p-4 bg-gray-900/60">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2 min-w-0">
                  <Skeleton className="h-4 w-[90%]" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="w-full aspect-square sm:aspect-[6/5] min-h-[220px] rounded-none" />
            </div>
          ))}
        </div>
        <div className="hidden xl:flex flex-col gap-4 sticky top-6 h-fit">
          <Skeleton className="h-72 w-full rounded-xl border border-gray-800/80" />
        </div>
      </div>
    </div>
  );
}

export function HomeTrendingPanelSkeleton() {
  return (
    <div className="px-4 pb-4 space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg overflow-hidden border border-gray-800 bg-gray-950/50">
            <Skeleton className="aspect-square w-full rounded-none" />
            <Skeleton className="h-3 w-[80%] m-1.5" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function FeedLoadMoreSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-2 w-full max-w-2xl">
      <Skeleton className="h-2 w-36 rounded-full opacity-80" />
      <Skeleton className="h-2 w-28 rounded-full opacity-60" />
      <Skeleton className="h-2 w-20 rounded-full opacity-40" />
    </div>
  );
}

export function TrendingHubSkeleton() {
  return (
    <div className="common-container w-full px-4 sm:px-8 lg:px-16 py-6">
      <div className="max-w-7xl mx-auto w-full">
        <div className="mb-10 space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 flex flex-col gap-12">
            <section>
              <div className="flex justify-between mb-6">
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-3 rounded-xl bg-gray-900/40 border border-gray-800"
                  >
                    <Skeleton className="h-16 w-16 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <div className="flex justify-between mb-6">
                <Skeleton className="h-7 w-44" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex gap-4 overflow-hidden">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="min-w-[160px] flex flex-col gap-3">
                    <Skeleton className="w-40 h-40 rounded-2xl" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ))}
              </div>
            </section>
          </div>
          <aside className="lg:col-span-1">
            <div className="p-6 rounded-2xl border border-gray-800 bg-gray-900/40 min-h-[400px] flex flex-col gap-4">
              <div className="flex justify-between">
                <Skeleton className="h-7 w-36" />
                <Skeleton className="h-4 w-14" />
              </div>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 rounded-xl border border-gray-700/50 space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <Skeleton className="h-12 w-full rounded-lg" />
                  <div className="flex gap-3 items-center">
                    <Skeleton className="h-10 w-10 rounded-md" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export function TrendingListSkeleton({ type }: { type: "songs" | "albums" | "reviews" }) {
  return (
    <>
      <div className="mb-10 flex items-center gap-4">
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-10 w-56 sm:w-72 rounded-lg" />
      </div>

      {type === "songs" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 rounded-xl bg-gray-900/40 border border-gray-800"
            >
              <Skeleton className="h-6 w-6 rounded shrink-0" />
              <Skeleton className="h-16 w-16 rounded-lg shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      )}

      {type === "albums" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <Skeleton className="aspect-square w-full rounded-2xl" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      )}

      {type === "reviews" && (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="break-inside-avoid p-6 rounded-2xl border border-gray-800 bg-gray-900/40 mb-6 space-y-4"
            >
              <div className="flex justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-14" />
              </div>
              <Skeleton className="h-16 w-full rounded-lg" />
              <div className="flex gap-3 items-center p-2 rounded-lg bg-black/40">
                <Skeleton className="h-10 w-10 rounded" />
                <Skeleton className="h-4 flex-1" />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export function SongDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row w-full">
      <div className="lg:w-1/3 flex-shrink-0 mb-8 lg:mb-0">
        <Skeleton className="w-full aspect-square max-w-md mx-auto lg:mx-0 rounded-2xl mb-6" />
        <div className="rounded-2xl bg-gray-900/40 border border-gray-800 p-5 space-y-3">
          <div className="flex gap-3">
            <Skeleton className="h-16 flex-1 rounded-xl" />
            <Skeleton className="h-16 flex-1 rounded-xl" />
          </div>
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
      <div className="lg:flex-1 lg:pl-8 space-y-6 w-full min-w-0">
        <Skeleton className="h-10 w-3/4 max-w-lg" />
        <Skeleton className="h-5 w-52" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="space-y-3">
          <Skeleton className="h-6 w-40" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function AlbumDetailSkeleton() {
  return (
    <div className="w-full max-w-6xl">
      <Skeleton className="h-[35vh] w-full rounded-lg mb-6" />
      <div className="space-y-4 px-2">
        <Skeleton className="h-12 w-2/3 max-w-xl" />
        <Skeleton className="h-5 w-48" />
        <div className="flex gap-3 py-4">
          <Skeleton className="h-12 w-32 rounded-full" />
          <Skeleton className="h-12 w-32 rounded-full" />
        </div>
        <div className="rounded-xl border border-gray-800 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-3 border-b border-white/5 last:border-0"
            >
              <Skeleton className="h-4 w-6" />
              <Skeleton className="h-10 w-10 rounded" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ArtistPageSkeleton() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 mt-20 px-2">
      <Skeleton className="h-[50vh] md:h-[55vh] w-full rounded-lg" />
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="aspect-square w-full rounded-xl" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PlaylistPageSkeleton() {
  return (
    <div className="w-full max-w-6xl min-h-[50dvh]">
      <Skeleton className="w-full min-h-[50dvh] md:h-[40dvh] rounded-b-3xl mb-8" />
      <div className="px-6 space-y-4">
        <Skeleton className="h-12 w-2/3 max-w-md" />
        <Skeleton className="h-4 w-full max-w-lg" />
        <div className="grid gap-2 pt-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-white/5">
              <Skeleton className="h-12 w-12 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PlaylistSearchSkeleton() {
  return (
    <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 py-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <Skeleton className="h-8 w-16 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function SearchGridSkeleton() {
  return (
    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-x-3 gap-y-6 w-full">
      {Array.from({ length: 14 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function SearchSuggestionsSkeleton() {
  return (
    <div className="p-2 space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 border-b border-white/5">
          <Skeleton className="h-10 w-10 rounded shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-2 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Skeleton album / playlist tiles — matches Library rounded-2xl cover art */
export function LibraryGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 w-full">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <Skeleton className="aspect-square w-full rounded-2xl shadow-lg ring-1 ring-white/5" />
          <Skeleton className="h-3.5 w-full rounded-md" />
          <Skeleton className="h-3 w-2/3 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export type LibrarySkeletonSection = "reviews" | "ratings" | "listens" | "playlists";

export function LibraryPageSkeleton({ section }: { section: LibrarySkeletonSection }) {
  if (section === "reviews") {
    return (
      <div className="w-full space-y-8 py-2">
        <header className="space-y-1 text-center sm:text-left">
          <h2 className="text-xl font-bold text-white tracking-tight">Loading your reviews</h2>
          <p className="text-sm text-gray-500">Pulling your latest write-ups…</p>
        </header>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex gap-6 p-4 rounded-xl bg-gray-900/40 border border-gray-800/50"
            >
              <Skeleton className="h-20 w-20 rounded-lg shrink-0 shadow-md ring-1 ring-white/5" />
              <div className="flex-1 min-w-0 space-y-3">
                <Skeleton className="h-5 w-4/5 max-w-md rounded-md" />
                <Skeleton className="h-4 w-3/5 rounded-md" />
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-3 w-28 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section === "ratings") {
    return (
      <div className="w-full space-y-8 py-2">
        <header className="space-y-1 text-center sm:text-left">
          <h2 className="text-xl font-bold text-white tracking-tight">Loading your ratings</h2>
          <p className="text-sm text-gray-500">Syncing stars and scores…</p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-3 rounded-xl bg-gray-900/40 border border-gray-800"
            >
              <Skeleton className="h-14 w-14 rounded-lg shrink-0 ring-1 ring-white/5" />
              <div className="flex-1 min-w-0 space-y-2.5">
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-3.5 w-28 rounded-full opacity-90" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 py-2">
      <header className="space-y-1 text-center sm:text-left">
        <h2 className="text-xl font-bold text-white tracking-tight">Loading your library</h2>
        <p className="text-sm text-gray-500">
          {section === "playlists"
            ? "Fetching your playlists and artwork…"
            : "Fetching albums and songs you’ve saved…"}
        </p>
      </header>
      <LibraryGridSkeleton />
    </div>
  );
}

export function ProfileFullPageSkeleton() {
  return (
    <div className="user-container flex w-full max-w-6xl mx-auto">
      <div className="w-full space-y-8 py-6">
        <Skeleton className="h-40 w-full rounded-2xl max-w-4xl mx-auto" />
        <div className="flex flex-col md:flex-row items-center gap-6 -mt-16 px-4">
          <Skeleton className="h-32 w-32 rounded-full border-4 border-dark-1" />
          <div className="flex-1 space-y-3 w-full max-w-md">
            <Skeleton className="h-8 w-48 mx-auto md:mx-0" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
        <div className="flex gap-8 border-b border-gray-800 px-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 mb-4" />
          ))}
        </div>
        <ProfileTabContentSkeleton variant="reviews" />
      </div>
    </div>
  );
}

export function ProfileTabContentSkeleton({
  variant,
}: {
  variant: "reviews" | "ratings" | "listens" | "playlists";
}) {
  if (variant === "listens" || variant === "playlists") {
    return (
      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 px-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    );
  }

  if (variant === "ratings") {
    return (
      <div className="space-y-4 px-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-6 p-4 rounded-xl bg-gray-900/40 border border-gray-800/50">
            <Skeleton className="h-20 w-20 rounded-lg shrink-0" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 px-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-6 p-4 rounded-xl bg-gray-900/40 border border-gray-800/50">
          <Skeleton className="h-20 w-20 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ReviewPageSkeleton() {
  return (
    <div className="min-h-[calc(100dvh-145px)] w-full max-w-2xl mx-auto px-4 py-6 space-y-6">
      <Skeleton className="h-4 w-20" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="space-y-3 pt-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function DiscographyGridSkeleton() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 py-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="w-full flex flex-col md:flex-row gap-6 p-5 md:p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800"
        >
          <Skeleton className="w-full xs:w-2/3 md:w-[240px] aspect-square rounded-xl mx-auto md:mx-0" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded" />
              <Skeleton className="h-6 w-20 rounded" />
            </div>
            <Skeleton className="h-[200px] w-full rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DiscographyTracksSkeleton() {
  return (
    <div className="space-y-2 py-4 px-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex gap-3 py-2 px-2">
          <Skeleton className="h-4 w-6 shrink-0" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
  );
}

export function MediaFormPageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row w-full py-4">
      <div className="lg:w-1/3 mb-8 lg:mb-0">
        <Skeleton className="w-full max-w-sm mx-auto aspect-square rounded-lg" />
      </div>
      <div className="lg:w-2/3 lg:ml-8 space-y-6">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-12 w-40 rounded-lg" />
      </div>
    </div>
  );
}

export function SuggestionsCarouselSkeleton() {
  return (
    <div className="flex overflow-hidden gap-4 py-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center min-w-[120px] gap-2">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function FollowerColumnSkeleton() {
  return (
    <div className="flex flex-col gap-4 py-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PlaylistModalRowsSkeleton() {
  return (
    <div className="flex flex-col gap-2 py-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-2 rounded-xl">
          <Skeleton className="h-14 w-14 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}
