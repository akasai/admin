/* Hallmark · pre-emit critique: P5 H5 E4 S5 R5 V4 */
import { ChevronDown } from 'lucide-react'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import type { BroadcastItem, ScheduleDay } from '../../types'
import { Badge } from '../ui/Badge'
import { DailyView } from './DailyView'

interface WeeklyViewProps {
    days: ScheduleDay[]
    selectedDate: string
    categoryNames: ReadonlyMap<number, string>
    onEdit: (item: BroadcastItem) => void
    onDelete: (item: BroadcastItem) => void
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

export function WeeklyView({ days, selectedDate, categoryNames, onEdit, onDelete }: WeeklyViewProps) {
    const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 639px)').matches)

    useEffect(() => {
        const updateViewport = () => setIsMobile(window.innerWidth < 640)
        window.addEventListener('resize', updateViewport)
        return () => window.removeEventListener('resize', updateViewport)
    }, [])

    return (
        <div className="space-y-3 sm:space-y-5">
            {days.map((day) => {
                const date = dayjs(day.date)
                const isToday = date.isSame(dayjs(), 'day')
                const dateLabel = `${date.format('M월 D일')} ${DAY_LABELS[date.day()]}요일`
                const scheduleContent =
                    day.items.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-border bg-card px-4 py-3.5 text-xs text-text-dim">
                            등록된 일정 없음
                        </div>
                    ) : (
                        <DailyView items={day.items} categoryNames={categoryNames} onEdit={onEdit} onDelete={onDelete} />
                    )

                if (isMobile) {
                    return (
                        <section key={day.date} aria-label={dateLabel} className="scroll-mt-20">
                            <details key={`${day.date}-${selectedDate}`} className="group" open={day.date === selectedDate}>
                                <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-semibold text-text transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary [&::-webkit-details-marker]:hidden">
                                    <span>{dateLabel}</span>
                                    {isToday && (
                                        <Badge variant="primary" size="sm">
                                            오늘
                                        </Badge>
                                    )}
                                    <Badge variant="outline" size="sm">
                                        {day.items.length}건
                                    </Badge>
                                    <ChevronDown
                                        className="ml-auto h-4 w-4 shrink-0 text-text-dim transition-transform group-open:rotate-180"
                                        aria-hidden="true"
                                    />
                                </summary>
                                <div className="mt-2.5">{scheduleContent}</div>
                            </details>
                        </section>
                    )
                }

                return (
                    <section key={day.date} aria-label={dateLabel} className="scroll-mt-20">
                        <div className="mb-2.5 flex min-h-7 items-center gap-2 px-1">
                            <h2 className="text-sm font-semibold tracking-[-0.01em] text-text">{dateLabel}</h2>
                            {isToday && (
                                <Badge variant="primary" size="sm">
                                    오늘
                                </Badge>
                            )}
                            <Badge variant="outline" size="sm">
                                {day.items.length}건
                            </Badge>
                            <span className="ml-auto font-mono text-[11px] text-text-dim">{day.date}</span>
                        </div>
                        {scheduleContent}
                    </section>
                )
            })}
        </div>
    )
}
