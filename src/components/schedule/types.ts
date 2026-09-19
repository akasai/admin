import type { BroadcastType, ParticipantRole, StreamerItem } from '../../types'

export interface ParticipantDraft {
    streamerId: number
    role: ParticipantRole
    isBroadcasting: boolean
}

export interface BroadcastFormValues {
    title: string
    broadcastType: BroadcastType
    categoryId: string
    startDate: string
    startTime: string
    isTimeUndecided: boolean
    previousBroadcastId: string
    isVisible: boolean
    participants: ParticipantDraft[]
}

export interface BroadcastFormModalProps {
    title: string
    submitLabel: string
    initialValues: BroadcastFormValues
    pending: boolean
    categories: { id: number; name: string }[]
    streamers: StreamerItem[]
    onClose: () => void
    onSubmit: (values: BroadcastFormValues) => Promise<void>
}
