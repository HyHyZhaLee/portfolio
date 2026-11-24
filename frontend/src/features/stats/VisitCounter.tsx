import { getTestIdProp, TestIds } from '../../config/test-ids.config';
import { t } from '../../i18n/en';
import { formatCount } from '../../utils/format';
import { useApiStatus } from '../api-status';
import { useRecordedVisitCount } from '../visits';
import { useStatsSummary } from './queries';

function visitsText(count: number): string {
    return count === 1 ? t('stats.visitsOne') : t('stats.visitsMany', { count: formatCount(count) });
}

function visitorsText(count: number): string {
    return count === 1 ? t('stats.visitorsOne') : t('stats.visitorsMany', { count: formatCount(count) });
}

/**
 * The footer's "N visits from M visitors", asked for only once the API is online (D2), without the since date (D6), and
 * asked again after each recorded view so it includes the visitor's own (PF-023 D5).
 * The span keeps its width and one line of height while empty, so the counter appearing never shifts the footer (FR-10).
 */
export function VisitCounter() {
    const { api } = useApiStatus();
    const { data, isSuccess } = useStatsSummary(api === 'online', useRecordedVisitCount());
    return (
        <span className='inline-block min-h-5 min-w-56' {...getTestIdProp(TestIds.stats.counterText)}>
            {isSuccess ? t('stats.counter', { visits: visitsText(data.totalViews), visitors: visitorsText(data.uniqueVisitors) }) : null}
        </span>
    );
}
