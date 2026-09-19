import dayjs from 'dayjs'
import type { BroadcastItem, BroadcastParticipantInput, CreateBroadcastRequest, UpdateBroadcastRequest } from '../../types'
import type { BroadcastFormValues } from './types'

export const BROADCAST_TYPES = ['collab', 'tournament', 'internal_match', 'game', 'talk', 'content', 'other'] as const
export const PARTICIPANT_ROLES = ['host', 'participant', 'guest'] as const

export const BROADCAST_TYPE_LABELS: Record<(typeof BROADCAST_TYPES)[number], string> = {
    collab: '합방',
    tournament: '대회',
    internal_match: '내전',
    game: '게임',
    talk: '토크',
    content: '콘텐츠',
    other: '기타',
}

export const PARTICIPANT_ROLE_LABELS: Record<(typeof PARTICIPANT_ROLES)[number], string> = {
    host: '진행자',
    participant: '참여자',
    guest: '게스트',
}

export function toDateParam(date: dayjs.Dayjs): string {
    return date.format('YYYY-MM-DD')
}

export function getWeekStartMonday(date: dayjs.Dayjs): dayjs.Dayjs {
    const day = date.day()
    return date.add(day === 0 ? -6 : 1 - day, 'day').startOf('day')
}

export function getDateRangeText(selectedDate: dayjs.Dayjs): string {
    const start = getWeekStartMonday(selectedDate)
    return `${start.format('YYYY.M.D')} - ${start.add(6, 'day').format('M.D')}`
}

function toPayload(values: BroadcastFormValues): CreateBroadcastRequest {
    const participants: BroadcastParticipantInput[] = values.participants.map(({ streamerId, role, isBroadcasting }) => ({
        streamerId,
        role,
        isBroadcasting,
    }))
    const categoryId = values.categoryId.trim()
    const previousBroadcastId = values.previousBroadcastId.trim()
    return {
        title: values.title.trim(),
        broadcastType: values.broadcastType,
        categoryId: categoryId.length === 0 ? null : Number(categoryId),
        startDate: values.startDate,
        startTime: values.isTimeUndecided ? null : `${values.startTime}:00`,
        previousBroadcastId: previousBroadcastId.length === 0 ? null : Number(previousBroadcastId),
        isVisible: values.isVisible,
        participants,
    }
}

export function toCreatePayload(values: BroadcastFormValues): CreateBroadcastRequest {
    return toPayload(values)
}

export function toUpdatePayload(values: BroadcastFormValues): UpdateBroadcastRequest {
    return toPayload(values)
}

export function toFormValues(item: BroadcastItem | null, selectedDate: dayjs.Dayjs): BroadcastFormValues {
    if (item === null) {
        return {
            title: '',
            broadcastType: 'other',
            categoryId: '',
            startDate: toDateParam(selectedDate),
            startTime: '19:00',
            isTimeUndecided: false,
            previousBroadcastId: '',
            isVisible: true,
            participants: [],
        }
    }
    return {
        title: item.title,
        broadcastType: item.broadcastType,
        categoryId: item.categoryId === null ? '' : String(item.categoryId),
        startDate: item.startDate,
        startTime: item.startTime?.slice(0, 5) ?? '19:00',
        isTimeUndecided: item.startTime === null,
        previousBroadcastId: item.previousBroadcastId === null ? '' : String(item.previousBroadcastId),
        isVisible: item.isVisible,
        participants: item.participants.map(({ streamerId, role, isBroadcasting }) => ({ streamerId, role, isBroadcasting })),
    }
}
