import type {
    CrawlerAssessmentDecision,
    CrawlerContentType,
    CrawlerDecisionState,
    CrawlerReadinessState,
    CrawlerReviewAssessment,
} from '../../types/crawlerReview'

export const DECISION_LABELS: Record<CrawlerDecisionState, string> = {
    AUTO_READY: '자동 반영 준비',
    EVIDENCE_WAIT: '근거 수집 중',
    REVIEW: '검토 필요',
    APPROVED: '승인됨',
    DISPUTED: '문제 있음',
    REJECTED: '거절됨',
    SUPPRESSED: '제외됨',
    HOLD: '보류',
    PROMOTED: '공개 반영됨',
    DRAFT_APPLIED: '비공개 초안 반영됨',
}

export const READINESS_LABELS: Record<CrawlerReadinessState, string> = {
    NOT_PREPARED: '초안 미생성',
    INCOMPLETE: '필수 정보 부족',
    READY: '기본 정보 준비됨',
}

export const ASSESSMENT_DECISION_LABELS: Record<CrawlerAssessmentDecision, string> = {
    AUTO_READY: '자동 반영 추천',
    EVIDENCE_WAIT: '추가 근거 대기',
    REVIEW: '운영자 판단 필요',
    SUPPRESSED: '자동 반영 제외',
}

export function assessmentMethodLabel(assessment: CrawlerReviewAssessment): string {
    if (assessment.reasonCodes.includes('HARD_EXCLUSION')) return '자동 제외 규칙'
    if (assessment.reasonCodes.includes('MANUAL_CONFLICT')) return '수동 충돌 확인'
    if (assessment.reasonCodes.includes('INCOMPLETE_RUN')) return '수집 미완료 판정'
    if (assessment.reasonCodes.includes('VERIFIED_PARTICIPANTS_LT_2')) return '참여자 확인 조건'
    if (assessment.reasonCodes.includes('CLUSTER_INCOHERENT')) return '관계 연결 조건'
    if (assessment.reasonCodes.includes('DETERMINISTIC_STRONG')) return '강한 근거 규칙'
    if (assessment.reasonCodes.includes('WEIGHTED_HIGH') || assessment.reasonCodes.includes('WEIGHTED_LOW')) return '가중 관계 기준'
    if (assessment.reasonCodes.includes('EVIDENCE_ACCUMULATING')) return '추가 관측 대기'
    return '저장된 판정 기준'
}

export function assessmentReasonLabel(assessment: CrawlerReviewAssessment): string {
    if (assessment.reasonCodes.includes('HARD_EXCLUSION')) return '제외 규칙 충족'
    if (assessment.reasonCodes.includes('MANUAL_CONFLICT')) return '수동 정보와 충돌'
    if (assessment.reasonCodes.includes('INCOMPLETE_RUN')) return '수집 완료 전 임시 판정'
    if (assessment.reasonCodes.includes('VERIFIED_PARTICIPANTS_LT_2')) return '확인된 방송 참여자 부족'
    if (assessment.reasonCodes.includes('CLUSTER_INCOHERENT')) return '참여자 사이의 관계 연결 조건 부족'
    if (assessment.reasonCodes.includes('DETERMINISTIC_STRONG')) return '상호·공동 명단 또는 공식 행사 근거 확인'
    if (assessment.reasonCodes.includes('WEIGHTED_HIGH')) return '가중 관계 기준 충족'
    if (assessment.reasonCodes.includes('WEIGHTED_LOW')) return '가중 관계 기준 미달'
    if (assessment.reasonCodes.includes('EVIDENCE_ACCUMULATING')) return '추가 관측으로 근거 수집 중'
    return '저장된 최신 classifier 판정'
}

export const DECISION_FILTER_OPTIONS: readonly CrawlerDecisionState[] = [
    'REVIEW',
    'EVIDENCE_WAIT',
    'AUTO_READY',
    'APPROVED',
    'DISPUTED',
    'HOLD',
    'REJECTED',
    'SUPPRESSED',
    'PROMOTED',
    'DRAFT_APPLIED',
]

export const CONTENT_TYPE_LABELS: Record<CrawlerContentType, string> = {
    COLLAB: '합방',
    TOURNAMENT: '대회',
    INTERNAL_MATCH: '내전',
    GAME: '게임',
    TALK: '토크',
    CONTENT: '콘텐츠',
    OTHER: '기타',
}

export const CONTENT_TYPE_FILTER_OPTIONS: readonly CrawlerContentType[] = [
    'COLLAB',
    'TOURNAMENT',
    'INTERNAL_MATCH',
    'GAME',
    'TALK',
    'CONTENT',
    'OTHER',
]
