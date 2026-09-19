/* Hallmark · pre-emit critique: P5 H5 E4 S5 R5 V4 */
import { ChevronDown, X } from 'lucide-react'
import { Popover } from 'radix-ui'
import { useMemo, useRef, useState } from 'react'
import { ModalOverlay } from '../ModalOverlay'
import { Button } from '../ui/Button'
import {
    BroadcastParticipantPicker,
    BroadcastParticipantRow,
    BroadcastPreviousField,
    BroadcastScheduleFields,
    BroadcastTitleField,
    BroadcastTypeCategoryFields,
    BroadcastVisibilityField,
} from './BroadcastFormFields'
import type { BroadcastFormModalProps, BroadcastFormValues, ParticipantDraft } from './types'

export function BroadcastFormModal({
    title,
    submitLabel,
    initialValues,
    pending,
    categories,
    streamers,
    onClose,
    onSubmit,
}: BroadcastFormModalProps) {
    const [values, setValues] = useState<BroadcastFormValues>(initialValues)
    const [error, setError] = useState<string | null>(null)
    const nextParticipantKey = useRef(initialValues.participants.length)
    const [participantKeys, setParticipantKeys] = useState(() => initialValues.participants.map((_, index) => `participant-${index}`))
    const [replacingParticipantKey, setReplacingParticipantKey] = useState<string | null>(null)
    const participantSearchRef = useRef<HTMLInputElement>(null)
    const participantOptions = useMemo(
        () =>
            streamers.map((streamer) => {
                const preferredChannel =
                    streamer.channels.find((channel) => channel.isPrimary) ??
                    streamer.channels.find((channel) => channel.isActive) ??
                    streamer.channels[0]
                return {
                    id: String(streamer.id),
                    name: streamer.name,
                    keywords: streamer.channels.flatMap((channel) => [channel.channelName, channel.externalChannelId]),
                    metadata: !streamer.isActive
                        ? '비활성'
                        : preferredChannel === undefined
                          ? '채널 없음'
                          : preferredChannel.channelName === streamer.name
                            ? null
                            : preferredChannel.channelName,
                }
            }),
        [streamers],
    )
    const selectedParticipantIds = useMemo(
        () => new Set(values.participants.map((participant) => String(participant.streamerId))),
        [values.participants],
    )

    async function submit() {
        if (values.title.trim().length === 0 || values.startDate.length === 0) {
            setError('제목과 시작 날짜는 필수입니다.')
            return
        }
        if (!values.isTimeUndecided && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(values.startTime)) {
            setError('시작 시간을 확인해 주세요.')
            return
        }
        if (values.participants.length === 0) {
            setError('참여자를 한 명 이상 추가해 주세요.')
            return
        }
        if (new Set(values.participants.map((participant) => participant.streamerId)).size !== values.participants.length) {
            setError('같은 스트리머를 중복으로 추가할 수 없습니다.')
            return
        }
        setError(null)
        await onSubmit(values)
    }

    function addParticipant(streamerId: number) {
        if (selectedParticipantIds.has(String(streamerId))) return
        const participantKey = `participant-${nextParticipantKey.current}`
        nextParticipantKey.current += 1
        setParticipantKeys((previous) => [...previous, participantKey])
        setValues((previous) => ({
            ...previous,
            participants: [...previous.participants, { streamerId, role: 'participant', isBroadcasting: true }],
        }))
    }

    function updateParticipant(index: number, update: Partial<ParticipantDraft>) {
        setValues((previous) => ({
            ...previous,
            participants: previous.participants.map((participant, participantIndex) =>
                participantIndex === index ? { ...participant, ...update } : participant,
            ),
        }))
    }

    function removeParticipant(index: number) {
        const participantKey = participantKeys[index]
        setReplacingParticipantKey((current) => (current === participantKey ? null : current))
        setParticipantKeys((previous) => previous.filter((_, participantIndex) => participantIndex !== index))
        setValues((previous) => ({
            ...previous,
            participants: previous.participants.filter((_, participantIndex) => participantIndex !== index),
        }))
        requestAnimationFrame(() => participantSearchRef.current?.focus())
    }

    return (
        <ModalOverlay ariaLabel={title} size="2xl" disabled={pending} onClose={onClose}>
            <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
                <div className="min-w-0">
                    <h2 className="text-lg font-[650] tracking-[-0.02em] text-text">{title}</h2>
                    <p className="mt-1 text-xs text-text-muted">방송 정보와 편성을 정한 뒤 참여자를 구성합니다.</p>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={onClose} disabled={pending} aria-label="닫기">
                    <X className="h-4 w-4" aria-hidden="true" />
                </Button>
            </div>

            <div className="max-h-[calc(100dvh-12rem)] space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
                <section className="space-y-4" aria-labelledby="broadcast-info-heading">
                    <h3 id="broadcast-info-heading" className="text-sm font-semibold text-text">
                        방송 정보
                    </h3>
                    <BroadcastTitleField
                        value={values.title}
                        onChange={(value) => setValues((previous) => ({ ...previous, title: value }))}
                        autoFocus
                        invalid={error !== null && values.title.trim().length === 0}
                    />
                    <BroadcastTypeCategoryFields
                        broadcastType={values.broadcastType}
                        onBroadcastTypeChange={(broadcastType) => setValues((previous) => ({ ...previous, broadcastType }))}
                        categories={categories}
                        categoryId={values.categoryId}
                        onCategoryChange={(categoryId) => setValues((previous) => ({ ...previous, categoryId }))}
                    />
                </section>

                <section className="space-y-4 border-t border-border pt-5" aria-labelledby="broadcast-time-heading">
                    <h3 id="broadcast-time-heading" className="text-sm font-semibold text-text">
                        편성
                    </h3>
                    <BroadcastScheduleFields
                        startDate={values.startDate}
                        startTime={values.isTimeUndecided ? null : values.startTime}
                        onStartDateChange={(startDate) => setValues((previous) => ({ ...previous, startDate }))}
                        onStartTimeChange={(startTime) =>
                            setValues((previous) =>
                                startTime === null
                                    ? { ...previous, isTimeUndecided: true }
                                    : { ...previous, startTime, isTimeUndecided: false },
                            )
                        }
                    />
                </section>

                <section className="border-t border-border pt-5" aria-labelledby="participant-heading">
                    <div className="mb-3">
                        <h3 id="participant-heading" className="text-sm font-semibold text-text">
                            참여자 <span className="ml-1 text-text-muted">{values.participants.length}명</span>
                        </h3>
                        <p className="mt-1 text-xs text-text-muted">
                            검색으로 추가하고, 이름을 눌러 교체합니다. 역할과 송출은 바로 변경할 수 있습니다.
                        </p>
                    </div>
                    <div className="mb-4">
                        <BroadcastParticipantPicker
                            options={participantOptions}
                            selectedIds={selectedParticipantIds}
                            onChange={(streamerId) => addParticipant(Number(streamerId))}
                            inputRef={participantSearchRef}
                        />
                    </div>

                    <div className="space-y-3">
                        {values.participants.length === 0 && (
                            <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-xs text-text-dim">
                                위에서 스트리머를 검색해 참여자를 추가하세요.
                            </p>
                        )}
                        {values.participants.map((participant, index) => {
                            const participantKey = participantKeys[index]
                            const selectedStreamer = streamers.find((streamer) => streamer.id === participant.streamerId)
                            const selectedName = selectedStreamer?.name ?? `스트리머 #${participant.streamerId}`

                            return (
                                <BroadcastParticipantRow
                                    key={participantKey}
                                    name={selectedName}
                                    role={participant.role}
                                    isBroadcasting={participant.isBroadcasting}
                                    selector={
                                        <Popover.Root
                                            open={replacingParticipantKey === participantKey}
                                            onOpenChange={(open) => setReplacingParticipantKey(open ? participantKey : null)}
                                        >
                                            <Popover.Trigger asChild>
                                                <button
                                                    type="button"
                                                    aria-label={`${selectedName} 교체`}
                                                    className="flex min-h-10 min-w-0 cursor-pointer items-center gap-2 rounded-md px-2 text-left text-sm font-semibold text-text hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                                >
                                                    <span className="min-w-0 flex-1 truncate">{selectedName}</span>
                                                    <ChevronDown className="h-4 w-4 shrink-0 text-text-dim" aria-hidden="true" />
                                                </button>
                                            </Popover.Trigger>
                                            <Popover.Portal>
                                                <Popover.Content
                                                    aria-label={`${selectedName} 교체 검색`}
                                                    align="start"
                                                    sideOffset={8}
                                                    collisionPadding={16}
                                                    className="z-[70] max-h-[var(--radix-popover-content-available-height)] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto overscroll-contain rounded-lg border border-border bg-bg-secondary p-3 text-text shadow-modal-center outline-none"
                                                >
                                                    <BroadcastParticipantPicker
                                                        options={participantOptions}
                                                        selectedIds={selectedParticipantIds}
                                                        label="교체할 스트리머 검색"
                                                        onChange={(streamerId) => {
                                                            updateParticipant(index, { streamerId: Number(streamerId) })
                                                            setReplacingParticipantKey(null)
                                                        }}
                                                    />
                                                </Popover.Content>
                                            </Popover.Portal>
                                        </Popover.Root>
                                    }
                                    onRoleChange={(role) => updateParticipant(index, { role })}
                                    onBroadcastingChange={(isBroadcasting) => updateParticipant(index, { isBroadcasting })}
                                    onRemove={() => removeParticipant(index)}
                                />
                            )
                        })}
                    </div>
                </section>

                <section className="space-y-4 border-t border-border pt-5" aria-labelledby="broadcast-settings-heading">
                    <h3 id="broadcast-settings-heading" className="text-sm font-semibold text-text">
                        추가 설정
                    </h3>
                    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
                        <BroadcastPreviousField
                            value={values.previousBroadcastId}
                            onChange={(previousBroadcastId) => setValues((previous) => ({ ...previous, previousBroadcastId }))}
                        />
                        <BroadcastVisibilityField
                            visible={values.isVisible}
                            onChange={(isVisible) => setValues((previous) => ({ ...previous, isVisible }))}
                        />
                    </div>
                </section>

                {error !== null && (
                    <p
                        role="alert"
                        className="rounded-md border border-live/30 bg-[var(--color-danger-soft)] px-3 py-2 text-xs text-[var(--color-danger)]"
                    >
                        {error}
                    </p>
                )}
            </div>

            <div className="flex gap-2 border-t border-border bg-bg px-5 py-4 sm:justify-end sm:px-6">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={pending}
                    className="min-w-0 flex-1 sm:flex-none sm:px-6"
                >
                    취소
                </Button>
                <Button type="button" onClick={() => void submit()} loading={pending} className="min-w-0 flex-1 sm:flex-none sm:px-6">
                    {pending ? '저장 중...' : submitLabel}
                </Button>
            </div>
        </ModalOverlay>
    )
}
