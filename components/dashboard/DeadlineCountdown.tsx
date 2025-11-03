'use client'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime)
export default function DeadlineCountdown({ deadlineISO }: { deadlineISO: string }) {
  const d = dayjs(deadlineISO)
  const now = dayjs()
  return (
    <div className="text-sm text-gray-700">
      Application deadline: <b>{d.format('MMM D, YYYY')}</b>
      <div className="mt-1 text-gray-600">Time left: {now.to(d)}</div>
    </div>
  )
}
