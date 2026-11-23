export type StatusTone = 'ok' | 'wake' | 'idle';

const toneClass: Record<StatusTone, string> = {
    ok: 'bg-status-ok',
    wake: 'bg-status-wake motion-safe:animate-breathe',
    idle: 'bg-status-idle',
};

/** A decorative status dot. The colour never carries meaning alone: the caller always renders a text label next to it. */
export function StatusDot({ tone }: { tone: StatusTone }) {
    return <span aria-hidden='true' className={`size-2.5 flex-none rounded-full ${toneClass[tone]}`} />;
}
