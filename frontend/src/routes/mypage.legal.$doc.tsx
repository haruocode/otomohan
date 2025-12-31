import { useEffect } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  ExternalLink,
  Loader2,
  ScrollText,
} from 'lucide-react'

import type { LegalDocument, LegalDocumentSlug } from '@/lib/api'
import {
  fetchLegalDocument,
  fetchSupportResources,
  trackLegalDocumentView,
} from '@/lib/api'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export const Route = createFileRoute('/mypage/legal/$doc')({
  component: LegalDocumentScreen,
})

const updatedFormatter = new Intl.DateTimeFormat('ja-JP', {
  dateStyle: 'long',
})

function LegalDocumentScreen() {
  const params = Route.useParams()
  const slug = normalizeSlug(params.doc)

  const supportLinksQuery = useQuery({
    queryKey: ['support-links'],
    queryFn: fetchSupportResources,
    staleTime: 300_000,
  })

  const documentQuery = useQuery({
    queryKey: ['legal-document', slug],
    queryFn: () => fetchLegalDocument(slug!),
    enabled: Boolean(slug),
    staleTime: 0,
  })

  useEffect(() => {
    if (!slug || !documentQuery.data) return
    trackLegalDocumentView(slug).catch(() => undefined)
  }, [slug, documentQuery.data])

  const externalFallback = slug
    ? slug === 'privacy'
      ? supportLinksQuery.data?.privacyUrl
      : supportLinksQuery.data?.termsUrl
    : undefined

  if (!slug) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-16 text-white">
        <Card className="mx-auto max-w-2xl border-white/10 bg-white/5">
          <CardContent className="space-y-4 p-8 text-center">
            <ScrollText className="mx-auto h-10 w-10 text-rose-300" />
            <p className="text-xl font-semibold">ページを表示できません</p>
            <p className="text-sm text-white/70">
              URL が正しいか確認して、再度お試しください。
            </p>
            <Button asChild className="rounded-2xl">
              <Link to="/mypage/settings">設定に戻る</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-pink-500/30 blur-[160px]" />
        <div className="absolute -right-16 bottom-10 h-64 w-64 rounded-full bg-sky-500/20 blur-[140px]" />
      </div>
      <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pb-16 pt-10 sm:px-6">
        <LegalHeader slug={slug} externalUrl={externalFallback} />
        <DocumentSwitcher active={slug} />
        {documentQuery.isLoading && <DocumentSkeleton />}
        {documentQuery.isError && (
          <ErrorCallout
            message={
              documentQuery.error instanceof Error
                ? documentQuery.error.message
                : 'ドキュメントを読み込めませんでした。'
            }
            onRetry={() => documentQuery.refetch()}
          />
        )}
        {documentQuery.data && (
          <LegalDocumentBody
            document={documentQuery.data}
            externalUrl={externalFallback}
          />
        )}
      </main>
    </div>
  )
}

function LegalHeader({
  slug,
  externalUrl,
}: {
  slug: LegalDocumentSlug
  externalUrl?: string
}) {
  const isPrivacy = slug === 'privacy'
  const title = isPrivacy ? 'プライバシーポリシー' : '利用規約'
  const accent = isPrivacy
    ? 'from-sky-500/30 to-indigo-500/20'
    : 'from-pink-500/30 to-rose-500/20'

  return (
    <header className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Button
          asChild
          variant="ghost"
          className="rounded-2xl border border-white/10 text-white"
        >
          <Link
            to="/mypage/settings"
            className="flex items-center gap-2 text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            設定へ戻る
          </Link>
        </Button>
        <Badge
          variant="outline"
          className="rounded-full border-white/30 text-white/70"
        >
          C-06
        </Badge>
      </div>
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-slate-950/40">
        <div className="flex flex-wrap items-center gap-3 text-sm text-white/60">
          <BookOpen className="h-4 w-4" />
          <span>スクロールして全文を確認できます</span>
        </div>
        <h1 className="mt-4 text-3xl font-semibold text-white">{title}</h1>
        <p className="mt-2 text-sm text-white/70">
          アプリ内の通話・課金に関わる重要な情報をまとめています。
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <div
            className={cn(
              'rounded-2xl border border-white/10 bg-gradient-to-r px-4 py-2 text-sm text-white/80',
              accent,
            )}
          >
            {isPrivacy
              ? 'データと接続ログの取り扱い'
              : '利用条件とポイントポリシー'}
          </div>
          {externalUrl && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-2xl border-white/30 text-white"
            >
              <a
                href={externalUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                ブラウザで開く
              </a>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

function DocumentSwitcher({ active }: { active: LegalDocumentSlug }) {
  const tabs: Array<{ slug: LegalDocumentSlug; label: string }> = [
    { slug: 'terms', label: '利用規約' },
    { slug: 'privacy', label: 'プライバシーポリシー' },
  ]

  return (
    <div className="flex gap-3 rounded-3xl border border-white/10 bg-white/5 p-2 text-sm">
      {tabs.map((tab) => (
        <Link
          key={tab.slug}
          to={`/mypage/legal/${tab.slug}`}
          className={cn(
            'flex-1 rounded-2xl px-4 py-2 text-center font-medium transition',
            active === tab.slug
              ? 'bg-white text-slate-900'
              : 'text-white/70 hover:text-white',
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}

function LegalDocumentBody({
  document,
  externalUrl,
}: {
  document: LegalDocument
  externalUrl?: string
}) {
  return (
    <section className="space-y-6">
      <div className="rounded-[32px] border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/40">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-white/50">
              {document.subtitle}
            </p>
            <p className="mt-1 text-2xl font-semibold">{document.title}</p>
          </div>
          <Badge
            variant="outline"
            className="rounded-full border-white/20 text-xs text-white/70"
          >
            最終更新 {updatedFormatter.format(new Date(document.lastUpdated))}
          </Badge>
        </div>
        <p className="mt-4 text-[15px] leading-relaxed text-white/80">
          {document.summary}
        </p>
        {externalUrl && (
          <p className="mt-2 text-xs text-white/50">
            *ブラウザ版の最新情報は {externalUrl}
          </p>
        )}
        <div
          className="mt-6 space-y-5 overflow-y-auto pr-2"
          style={{ maxHeight: '70vh', scrollbarWidth: 'thin' }}
        >
          {document.sections.map((section, index) => (
            <DocumentSection key={section.id} section={section} index={index} />
          ))}
        </div>
      </div>
      <div className="flex flex-wrap justify-between gap-3 text-sm text-white/70">
        <span>通話アプリ特有の注意点を随時アップデートしています。</span>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="rounded-2xl border border-white/10"
        >
          <Link to="/mypage/settings" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            設定に戻る
          </Link>
        </Button>
      </div>
    </section>
  )
}

function DocumentSection({
  section,
  index,
}: {
  section: LegalDocument['sections'][number]
  index: number
}) {
  const accents = [
    'from-pink-500/15 to-orange-500/5',
    'from-sky-500/15 to-indigo-500/5',
  ]
  const accent = accents[index % accents.length]

  return (
    <article
      className={cn(
        'rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-slate-950/30',
        `bg-gradient-to-br ${accent}`,
      )}
    >
      <h2 className="text-xl font-semibold text-white">{section.heading}</h2>
      {section.description && (
        <p className="mt-1 text-sm text-white/60">{section.description}</p>
      )}
      <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-white/80">
        {section.paragraphs.map((paragraph, idx) => (
          <p key={`${section.id}-p-${idx}`}>{paragraph}</p>
        ))}
      </div>
      {section.bullets && (
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-white/75">
          {section.bullets.map((item, idx) => (
            <li key={`${section.id}-b-${idx}`}>{item}</li>
          ))}
        </ul>
      )}
    </article>
  )
}

function DocumentSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-20 w-full rounded-3xl" />
      <Skeleton className="h-[480px] w-full rounded-[32px]" />
    </div>
  )
}

function ErrorCallout({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <Card className="border-rose-500/30 bg-rose-500/10">
      <CardContent className="flex flex-col gap-4 p-5 text-sm text-rose-50">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>{message}</span>
        </div>
        <Button
          onClick={onRetry}
          variant="destructive"
          size="sm"
          className="rounded-2xl"
        >
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          再読み込み
        </Button>
      </CardContent>
    </Card>
  )
}

function normalizeSlug(value: string | undefined): LegalDocumentSlug | null {
  if (value === 'privacy') return 'privacy'
  if (value === 'terms') return 'terms'
  return null
}
