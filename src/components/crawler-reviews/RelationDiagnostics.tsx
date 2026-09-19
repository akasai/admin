import { CircleCheck, CircleMinus, Link2, TriangleAlert, Users } from 'lucide-react'
import type { CrawlerReviewDiagnostics, CrawlerReviewGraphDiagnostics } from '../../types/crawlerReview'

const STRONG_KIND_LABELS: Record<string, string> = {
    ROSTER: '상호·공동 명단 근거',
    EVENT_KEY: '동일 행사 근거',
    OFFICIAL_ROSTER: '공식 명단 근거',
}

function unavailableMessage(reason: string): string {
    switch (reason) {
        case 'LEGACY_COHORT':
            return '이 판정은 관계 진단 입력이 저장되기 전에 생성되어 비교할 수 없습니다.'
        case 'UNSUPPORTED_POLICY':
            return '저장된 판정 정책은 현재 관계 진단에서 지원하지 않습니다.'
        case 'UNSUPPORTED_CONTINUITY':
            return '세션 연속성 입력이 있는 과거 판정이라 비교 계산을 제공하지 않습니다.'
        default:
            return '저장된 관계 입력을 진단할 수 없습니다.'
    }
}

function connectivityLabel(value: boolean | null): string {
    if (value === null) return '관계 없음'
    return value ? '한 그룹으로 연결' : '여러 그룹으로 분리'
}

function GraphSummary({ title, graph, muted = false }: { title: string; graph: CrawlerReviewGraphDiagnostics; muted?: boolean }) {
    return (
        <section className="rounded-[var(--radius-input)] border border-border bg-bg p-3">
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-text">{title}</h4>
                <span className={muted ? 'text-xs font-semibold text-text-dim' : 'text-xs font-semibold text-primary'}>
                    {graph.coherent ? '관계 조건 충족' : '관계 조건 미충족'}
                </span>
            </div>
            <dl className="mt-3 grid min-w-0 grid-cols-1 gap-2 text-xs sm:grid-cols-3">
                <div>
                    <dt className="text-text-dim">평균 관계 강도</dt>
                    <dd className="mt-0.5 font-semibold text-text">{graph.strength === null ? '관계 없음' : graph.strength.toFixed(3)}</dd>
                </div>
                <div>
                    <dt className="text-text-dim">조건 충족 참여자</dt>
                    <dd className="mt-0.5 font-semibold text-text">
                        {graph.supportedCount}/{graph.confirmedCount}명
                    </dd>
                </div>
                <div>
                    <dt className="text-text-dim">연결 상태</dt>
                    <dd className="mt-0.5 font-semibold text-text">{connectivityLabel(graph.connected)}</dd>
                </div>
            </dl>
        </section>
    )
}

interface RelationDiagnosticsProps {
    diagnostics: CrawlerReviewDiagnostics
    compact?: boolean
}

export function RelationDiagnostics({ diagnostics, compact = false }: RelationDiagnosticsProps) {
    if (diagnostics.unavailableReason !== null) {
        return (
            <p className="flex min-w-0 items-start gap-2 rounded-[var(--radius-input)] border border-[var(--color-warning)]/40 bg-[var(--color-warning-soft)] p-3 text-xs leading-relaxed text-text">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-warning)]" aria-hidden="true" />
                <span>{unavailableMessage(diagnostics.unavailableReason)}</span>
            </p>
        )
    }

    const confirmedMembers = diagnostics.members.filter((member) => member.membershipStatus === 'CONFIRMED')
    const claimedCount = diagnostics.members.length - confirmedMembers.length
    const memberNames = new Map(diagnostics.members.map((member) => [member.participantId, member.displayName]))
    const current = diagnostics.current

    if (compact && current !== null) {
        const criteria = [
            {
                label: '확인된 방송 참여자',
                value: `${current.confirmedCount}명`,
                met: current.confirmedCount >= 2,
            },
            {
                label: '각 참여자의 관계 근거',
                value: `${current.supportedCount}/${current.confirmedCount}명 충족`,
                met: current.confirmedCount >= 2 && current.supportedCount === current.confirmedCount,
            },
            {
                label: '하나의 관계 그룹',
                value: connectivityLabel(current.connected),
                met: current.connected === true,
            },
        ]
        const representativeEdges = current.edges.filter((edge) => edge.strong || edge.medium).slice(0, 2)

        return (
            <div className="min-w-0 space-y-3">
                <section aria-labelledby="review-criteria-heading">
                    <div className="flex min-w-0 items-center justify-between gap-3">
                        <h4 id="review-criteria-heading" className="text-xs font-bold text-text">
                            자동 판정 기준
                        </h4>
                        <span
                            className={
                                current.coherent
                                    ? 'text-xs font-semibold text-primary'
                                    : 'text-xs font-semibold text-[var(--color-warning)]'
                            }
                        >
                            {current.coherent ? '모두 충족' : '직접 확인 필요'}
                        </span>
                    </div>
                    <ul className="mt-2 grid min-w-0 gap-1.5 sm:grid-cols-3">
                        {criteria.map((criterion) => (
                            <li
                                key={criterion.label}
                                className="flex min-w-0 items-center gap-2 rounded-[var(--radius-input)] border border-border bg-bg-secondary px-2.5 py-2 text-xs"
                            >
                                {criterion.met ? (
                                    <CircleCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                                ) : (
                                    <CircleMinus className="h-4 w-4 shrink-0 text-[var(--color-warning)]" aria-hidden="true" />
                                )}
                                <span className="min-w-0">
                                    <span className="block break-words text-text-muted">{criterion.label}</span>
                                    <span className="mt-0.5 block break-words font-semibold text-text">{criterion.value}</span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>

                <details className="group overflow-hidden rounded-[var(--radius-input)] border border-border bg-bg">
                    <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-xs font-semibold text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary">
                        <span>관계 계산 상세</span>
                        <span className="text-text-dim group-open:hidden">보기</span>
                        <span className="hidden text-text-dim group-open:inline">닫기</span>
                    </summary>
                    <div className="space-y-3 border-t border-border p-3">
                        <GraphSummary title="현재 관계 계산" graph={current} />
                        <section aria-labelledby="review-evidence-summary-heading" className="border-t border-border pt-3">
                            <h4 id="review-evidence-summary-heading" className="flex items-center gap-2 text-xs font-bold text-text">
                                <Link2 className="h-4 w-4 text-primary" aria-hidden="true" />
                                핵심 관계 근거
                            </h4>
                            {representativeEdges.length > 0 ? (
                                <ul className="mt-2 space-y-1.5">
                                    {representativeEdges.map((edge) => {
                                        const labels = edge.strongKinds.map((kind) => STRONG_KIND_LABELS[kind] ?? kind)
                                        if (edge.medium && labels.length === 0) labels.push('보조 근거 기준 충족')
                                        if (edge.oneWayMention) labels.push('한쪽 제목 언급')
                                        return (
                                            <li key={`${edge.fromParticipantId}:${edge.toParticipantId}`} className="min-w-0 text-xs">
                                                <span className="break-words font-semibold text-text">
                                                    {memberNames.get(edge.fromParticipantId) ?? `#${edge.fromParticipantId}`} ↔{' '}
                                                    {memberNames.get(edge.toParticipantId) ?? `#${edge.toParticipantId}`}
                                                </span>
                                                <span className="break-words text-text-muted"> · {labels.join(' · ')}</span>
                                            </li>
                                        )
                                    })}
                                </ul>
                            ) : (
                                <p className="mt-2 text-xs text-[var(--color-warning)]">조건을 충족한 관계 근거가 없습니다.</p>
                            )}
                        </section>
                        {current.gaps.length > 0 && (
                            <section>
                                <h5 className="text-xs font-bold text-text">관계 조건이 부족한 참여자</h5>
                                <ul className="mt-2 space-y-1.5">
                                    {current.gaps.map((gap) => (
                                        <li key={gap.participantId} className="break-words text-xs text-text-muted">
                                            <strong className="text-text">
                                                {memberNames.get(gap.participantId) ?? `#${gap.participantId}`}
                                            </strong>{' '}
                                            · 관계 {gap.requiredEdges - gap.mediumEdges}개 추가 필요
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}
                        {current.edges.length > 0 && (
                            <section>
                                <h5 className="text-xs font-bold text-text">관계별 계산</h5>
                                <ul className="mt-2 divide-y divide-border overflow-hidden rounded-[var(--radius-input)] border border-border">
                                    {current.edges.map((edge) => {
                                        const labels = edge.strongKinds.map((kind) => STRONG_KIND_LABELS[kind] ?? kind)
                                        if (edge.oneWayMention) labels.push('한쪽 제목 언급')
                                        return (
                                            <li key={`${edge.fromParticipantId}:${edge.toParticipantId}`} className="min-w-0 p-3 text-xs">
                                                <p className="break-words font-semibold text-text">
                                                    {memberNames.get(edge.fromParticipantId) ?? `#${edge.fromParticipantId}`} ↔{' '}
                                                    {memberNames.get(edge.toParticipantId) ?? `#${edge.toParticipantId}`}
                                                </p>
                                                <p className="mt-1 break-words text-text-muted">
                                                    {labels.join(' · ') || '가중 입력만 있음'} · 관계 강도 {edge.score.toFixed(3)}
                                                </p>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </section>
                        )}
                        {diagnostics.shadow !== null && (
                            <details className="group/shadow overflow-hidden rounded-[var(--radius-input)] border border-border bg-bg">
                                <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-xs font-semibold text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary">
                                    <span>비교 계산 · 자동 판단에 미적용</span>
                                    <span className="text-text-dim group-open/shadow:hidden">보기</span>
                                    <span className="hidden text-text-dim group-open/shadow:inline">닫기</span>
                                </summary>
                                <div className="border-t border-border p-3">
                                    {diagnostics.shadow.graph !== null ? (
                                        <GraphSummary title={diagnostics.shadow.version} graph={diagnostics.shadow.graph} muted />
                                    ) : diagnostics.shadow.unavailableReason !== null ? (
                                        <p className="text-xs leading-relaxed text-text-muted">
                                            비교 계산 미지원 · {unavailableMessage(diagnostics.shadow.unavailableReason)}
                                        </p>
                                    ) : (
                                        <p className="text-xs text-text-muted">비교 계산 결과가 없습니다.</p>
                                    )}
                                </div>
                            </details>
                        )}
                        <p className="text-xs leading-relaxed text-text-dim">
                            관계 강도는 저장된 계산값이며 확률이나 자동 승인 신뢰도가 아닙니다.
                        </p>
                    </div>
                </details>
            </div>
        )
    }

    return (
        <div className="min-w-0 space-y-3">
            <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-muted">
                <Users className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span>확인된 참여자 {confirmedMembers.length}명</span>
                <span aria-hidden="true">·</span>
                <span>제목에서만 언급 {claimedCount}명</span>
                {current !== null && (
                    <>
                        <span aria-hidden="true">·</span>
                        <span>연결된 그룹 {current.groups.length}개</span>
                    </>
                )}
            </p>

            {current !== null && <GraphSummary title="현재 관계 계산" graph={current} />}

            {diagnostics.shadow !== null && (
                <details className="group overflow-hidden rounded-[var(--radius-input)] border border-border bg-bg">
                    <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-xs font-semibold text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary">
                        <span>비교 계산 · 자동 판단에 미적용</span>
                        <span className="text-text-dim group-open:hidden">열기</span>
                        <span className="hidden text-text-dim group-open:inline">닫기</span>
                    </summary>
                    <div className="border-t border-border p-3">
                        {diagnostics.shadow.graph !== null ? (
                            <GraphSummary title={diagnostics.shadow.version} graph={diagnostics.shadow.graph} muted />
                        ) : diagnostics.shadow.unavailableReason !== null ? (
                            <p className="text-xs leading-relaxed text-text-muted">
                                비교 계산 미지원 · {unavailableMessage(diagnostics.shadow.unavailableReason)}
                            </p>
                        ) : (
                            <p className="text-xs text-text-muted">비교 계산 결과가 없습니다.</p>
                        )}
                    </div>
                </details>
            )}

            {current !== null && current.gaps.length > 0 && (
                <section>
                    <h4 className="text-xs font-bold text-text">현재 관계 조건이 부족한 참여자</h4>
                    <ul className="mt-2 space-y-1.5">
                        {current.gaps.map((gap) => (
                            <li key={gap.participantId} className="break-words text-xs text-text-muted">
                                <strong className="text-text">{memberNames.get(gap.participantId) ?? `#${gap.participantId}`}</strong> ·
                                관계 {gap.requiredEdges - gap.mediumEdges}개 추가 필요
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {current !== null && current.edges.length > 0 && (
                <section>
                    <h4 className="flex items-center gap-2 text-xs font-bold text-text">
                        <Link2 className="h-4 w-4 text-primary" aria-hidden="true" />
                        관계별 근거
                    </h4>
                    <ul className="mt-2 divide-y divide-border overflow-hidden rounded-[var(--radius-input)] border border-border bg-bg">
                        {current.edges.map((edge) => {
                            const labels = edge.strongKinds.map((kind) => STRONG_KIND_LABELS[kind] ?? kind)
                            if (edge.oneWayMention) labels.push('한쪽 제목 언급')
                            return (
                                <li key={`${edge.fromParticipantId}:${edge.toParticipantId}`} className="min-w-0 p-3 text-xs">
                                    <p className="break-words font-semibold text-text">
                                        {memberNames.get(edge.fromParticipantId) ?? `#${edge.fromParticipantId}`} ↔{' '}
                                        {memberNames.get(edge.toParticipantId) ?? `#${edge.toParticipantId}`}
                                    </p>
                                    <p className="mt-1 break-words text-text-muted">
                                        {labels.join(' · ') || '가중 입력만 있음'} · 관계 강도 {edge.score.toFixed(3)}
                                    </p>
                                </li>
                            )
                        })}
                    </ul>
                </section>
            )}

            <p className="text-xs leading-relaxed text-text-dim">
                관계 강도는 저장된 입력의 계산값이며 확률이나 자동 승인 신뢰도가 아닙니다.
            </p>
        </div>
    )
}
