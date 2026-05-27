import dayjs from 'dayjs'
import type { BroadcastItem, BroadcastParticipantInput, CreateBroadcastRequest, ReviewBroadcastItem, UpdateBroadcastRequest } from '../../types'
import type { BroadcastFormValues } from './types'

export const KOREAN_DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']
export const WEEKDAY_MON_TO_SUN = ['월', '화', '수', '목', '금', '토', '일']
export const BROADCAST_TYPE_PRESETS = ['방송', '합방', '콘텐츠', '내전'] as const
export const HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'))
export const MINUTE_OPTIONS = ['00', '30'] as const

export function getBroadcastTypeBadgeClass(type: string | null): string {
    if (type === '방송') return 'border-green-500/40 bg-green-500/15 text-green-300'
    if (type === '합방') return 'border-purple-500/40 bg-purple-500/15 text-purple-300'
    if (type === '콘텐츠') return 'border-blue-500/40 bg-blue-500/15 text-blue-300'
    if (type === '내전') return 'border-orange-500/40 bg-orange-500/15 text-orange-300'
    return 'border-[#4a4a58] bg-[#2a2a34] text-[#b5b5c0]'
}

export function getInitialStartTime(date: dayjs.Dayjs): { date: string; time: string } {
    const currentHour = dayjs().hour()
    return {
        date: date.format('YYYY-MM-DD'),
        time: `${String(currentHour).padStart(2, '0')}:00`,
    }
}

export function parseTags(tagsInput: string): string[] {
    return tagsInput
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
}

export function toDateParam(date: dayjs.Dayjs): string {
    return date.format('YYYY-MM-DD')
}

export function getWeekStartMonday(date: dayjs.Dayjs): dayjs.Dayjs {
    const day = date.day()
    const diff = day === 0 ? -6 : 1 - day
    return date.add(diff, 'day').startOf('day')
}

export function getWeekDatesMonday(date: dayjs.Dayjs): dayjs.Dayjs[] {
    const weekStart = getWeekStartMonday(date)
    return Array.from({ length: 7 }, (_, index) => weekStart.add(index, 'day'))
}

export function getDateRangeText(view: 'daily' | 'weekly', selectedDate: dayjs.Dayjs): string {
    if (view === 'daily') {
        const dayName = KOREAN_DAY_NAMES[selectedDate.day()]
        return `${selectedDate.year()}년 ${selectedDate.month() + 1}월 ${selectedDate.date()}일 (${dayName})`
    }
    const weekStart = getWeekStartMonday(selectedDate)
    const weekEnd = weekStart.add(6, 'day')
    return `${weekStart.format('YYYY.M.D')} - ${weekEnd.format('M.D')}`
}

export function toCreatePayload(values: BroadcastFormValues): CreateBroadcastRequest {
    const startTime = values.isUndecidedTime
        ? null
        : (() => { const d = dayjs(`${values.startDate}T${values.startTime}`); return d.isValid() ? d.toISOString() : null })()
    const participants: BroadcastParticipantInput[] = values.participants.map((item) => ({
        name: item.name,
        streamerId: item.streamerId,
        isHost: item.isHost,
    }))

    return {
        title: values.title.trim(),
        startTime,
        broadcastType: values.broadcastType.trim() || undefined,
        categoryId: values.categoryId.length > 0 ? Number(values.categoryId) : undefined,
        tags: parseTags(values.tagsInput),
        isVisible: values.isVisible,
        isDrops: values.isDrops,
        isChzzkSupport: values.isChzzkSupport,
        participants,
        sourceUrl: values.sourceUrl.trim() || undefined,
        sourceImageUrl: values.sourceImageUrl.trim() || undefined,
    }
}

export function toUpdatePayload(values: BroadcastFormValues): UpdateBroadcastRequest {
    const startTime = values.isUndecidedTime
        ? null
        : (() => { const d = dayjs(`${values.startDate}T${values.startTime}`); return d.isValid() ? d.toISOString() : null })()
    const participants: BroadcastParticipantInput[] = values.participants.map((item) => ({
        name: item.name,
        streamerId: item.streamerId,
        isHost: item.isHost,
    }))

    return {
        title: values.title.trim(),
        startTime,
        broadcastType: values.broadcastType.trim() || undefined,
        categoryId: values.categoryId.length > 0 ? Number(values.categoryId) : undefined,
        tags: parseTags(values.tagsInput),
        isVisible: values.isVisible,
        isDrops: values.isDrops,
        isChzzkSupport: values.isChzzkSupport,
        participants,
        sourceUrl: values.sourceUrl.trim() || undefined,
        sourceImageUrl: values.sourceImageUrl.trim() || undefined,
    }
}

export function toFormValues(item: BroadcastItem | (BroadcastItem & { extraction?: ReviewBroadcastItem['extraction'] }) | null, selectedDate: dayjs.Dayjs): BroadcastFormValues {
    if (item === null) {
        const initialStart = getInitialStartTime(selectedDate)
        return {
            title: '',
            startDate: initialStart.date,
            startTime: initialStart.time,
            isUndecidedTime: false,
            broadcastType: '',
            categoryId: '',
            tagsInput: '',
            isVisible: true,
            isDrops: false,
            isChzzkSupport: false,
            participants: [],
            sourceUrl: '',
            sourceImageUrl: '',
        }
    }

    const isUndecided = item.startTime === null
    const parsed = isUndecided ? null : dayjs(item.startTime)
    const initialStart = getInitialStartTime(selectedDate)

    return {
        title: item.title,
        startDate: parsed !== null && parsed.isValid() ? parsed.format('YYYY-MM-DD') : initialStart.date,
        startTime: parsed !== null && parsed.isValid() ? parsed.format('HH:mm') : initialStart.time,
        isUndecidedTime: isUndecided,
        broadcastType: item.broadcastType ?? '',
        categoryId: item.category?.id !== undefined ? String(item.category.id) : '',
        tagsInput: item.tags.join(', '),
        isVisible: item.isVisible,
        isDrops: item.isDrops,
        isChzzkSupport: item.isChzzkSupport,
        participants: item.streamers.map((streamer) => ({
            name: streamer.name,
            streamerId: streamer.streamerId ?? undefined,
            isHost: streamer.isHost,
        })),
        sourceUrl: item.sourceUrl ?? '',
        sourceImageUrl: ('extraction' in item && item.extraction?.sourceImageUrl) ? item.extraction.sourceImageUrl : (item.sourceImageUrl ?? ''),
    }
}
