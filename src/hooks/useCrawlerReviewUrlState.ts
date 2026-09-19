import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type {
    CrawlerAliasStatus,
    CrawlerContentType,
    CrawlerDecisionState,
    CrawlerExclusionStatus,
    CrawlerLearningLabel,
    CrawlerReviewRisk,
    CrawlerWorkspaceTab,
} from '../types/crawlerReview'

const TABS: Record<CrawlerWorkspaceTab, true> = {
    review: true,
    changes: true,
    'auto-audit': true,
    completed: true,
    exclusions: true,
    aliases: true,
    learning: true,
}
const DECISIONS: Record<CrawlerDecisionState, true> = {
    AUTO_READY: true,
    EVIDENCE_WAIT: true,
    REVIEW: true,
    APPROVED: true,
    DISPUTED: true,
    REJECTED: true,
    SUPPRESSED: true,
    HOLD: true,
    PROMOTED: true,
    DRAFT_APPLIED: true,
}
const CONTENT_TYPES: Record<CrawlerContentType, true> = {
    COLLAB: true,
    TOURNAMENT: true,
    INTERNAL_MATCH: true,
    GAME: true,
    TALK: true,
    CONTENT: true,
    OTHER: true,
}
const ALIAS_STATUSES: Record<CrawlerAliasStatus, true> = { PROPOSED: true, ACTIVE: true, REJECTED: true, RETIRED: true }
const EXCLUSION_STATUSES: Record<CrawlerExclusionStatus, true> = { ACTIVE: true, RELEASED: true }
const LEARNING_LABELS: Record<CrawlerLearningLabel, true> = { COLLAB: true, NOT_COLLAB: true }

export interface CrawlerReviewUrlState {
    tab: CrawlerWorkspaceTab
    cursor: string | undefined
    selectedId: string | null
    checkedIds: string[]
    query: string
    decisionState: CrawlerDecisionState | undefined
    contentType: CrawlerContentType | undefined
    risk: CrawlerReviewRisk | undefined
    aliasStatus: CrawlerAliasStatus | undefined
    exclusionStatus: CrawlerExclusionStatus | undefined
    learningLabel: CrawlerLearningLabel | undefined
}

export interface CrawlerReviewUrlController {
    state: CrawlerReviewUrlState
    setTab: (tab: CrawlerWorkspaceTab) => void
    setFilters: (changes: Record<string, string | null>) => void
    setCursor: (cursor: string | null) => void
    setSelectedId: (selectedId: string | null) => void
    setCheckedIds: (ids: string[]) => void
    toggleChecked: (id: string) => void
}

export function useCrawlerReviewUrlState(): CrawlerReviewUrlController {
    const [searchParams, setSearchParams] = useSearchParams()
    const state = useMemo<CrawlerReviewUrlState>(() => {
        const tabValue = searchParams.get('tab')
        const decisionValue = searchParams.get('state')
        const contentTypeValue = searchParams.get('contentType')
        const riskValue = searchParams.get('risk')
        const aliasStatusValue = searchParams.get('aliasStatus')
        const exclusionStatusValue = searchParams.get('exclusionStatus')
        const learningLabelValue = searchParams.get('label')
        return {
            tab: tabValue !== null && TABS[tabValue as CrawlerWorkspaceTab] === true ? (tabValue as CrawlerWorkspaceTab) : 'review',
            cursor: searchParams.get('cursor') ?? undefined,
            selectedId: searchParams.get('selected'),
            checkedIds: Array.from(new Set((searchParams.get('checked') ?? '').split(',').filter((id) => id.length > 0))).slice(0, 100),
            query: searchParams.get('query') ?? '',
            decisionState:
                decisionValue !== null && DECISIONS[decisionValue as CrawlerDecisionState] === true
                    ? (decisionValue as CrawlerDecisionState)
                    : undefined,
            contentType:
                contentTypeValue !== null && CONTENT_TYPES[contentTypeValue as CrawlerContentType] === true
                    ? (contentTypeValue as CrawlerContentType)
                    : undefined,
            risk:
                riskValue === 'failed' || riskValue === 'unprepared' || riskValue === 'incomplete' || riskValue === 'ready'
                    ? riskValue
                    : undefined,
            aliasStatus:
                aliasStatusValue !== null && ALIAS_STATUSES[aliasStatusValue as CrawlerAliasStatus] === true
                    ? (aliasStatusValue as CrawlerAliasStatus)
                    : undefined,
            exclusionStatus:
                exclusionStatusValue !== null && EXCLUSION_STATUSES[exclusionStatusValue as CrawlerExclusionStatus] === true
                    ? (exclusionStatusValue as CrawlerExclusionStatus)
                    : undefined,
            learningLabel:
                learningLabelValue !== null && LEARNING_LABELS[learningLabelValue as CrawlerLearningLabel] === true
                    ? (learningLabelValue as CrawlerLearningLabel)
                    : undefined,
        }
    }, [searchParams])

    const update = useCallback(
        (changes: Record<string, string | null>, replace = false) => {
            const next = new URLSearchParams(searchParams)
            Object.entries(changes).forEach(([key, value]) => {
                if (value === null || value.length === 0) next.delete(key)
                else next.set(key, value)
            })
            setSearchParams(next, { replace })
        },
        [searchParams, setSearchParams],
    )

    const setTab = useCallback(
        (tab: CrawlerWorkspaceTab) => {
            const next = new URLSearchParams()
            if (tab !== 'review') next.set('tab', tab)
            setSearchParams(next)
        },
        [setSearchParams],
    )

    const setFilters = useCallback(
        (changes: Record<string, string | null>) => update({ ...changes, cursor: null, selected: null, checked: null }),
        [update],
    )

    const toggleChecked = useCallback(
        (id: string) => {
            const next = state.checkedIds.includes(id) ? state.checkedIds.filter((value) => value !== id) : [...state.checkedIds, id]
            update({ checked: next.length > 0 ? next.join(',') : null })
        },
        [state.checkedIds, update],
    )

    return {
        state,
        setTab,
        setFilters,
        setCursor: (cursor: string | null) => update({ cursor, selected: null, checked: null }),
        setSelectedId: (selectedId: string | null) => update({ selected: selectedId }),
        setCheckedIds: (ids: string[]) => update({ checked: ids.length > 0 ? Array.from(new Set(ids)).slice(0, 100).join(',') : null }),
        toggleChecked,
    }
}
