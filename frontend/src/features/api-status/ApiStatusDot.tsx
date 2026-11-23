import { StatusDot } from '../../components/StatusDot';
import { getTestIdProp, TestIds } from '../../config/test-ids.config';
import { t } from '../../i18n/en';
import { apiTone } from './statusTone';
import { useApiStatus } from './useApiStatus';

/** The footer's API status, from the same health check as the hero panel. */
export function ApiStatusDot() {
    const { api } = useApiStatus();
    return (
        <span className='inline-flex items-center gap-1.5 font-medium whitespace-nowrap' {...getTestIdProp(TestIds.apiStatus.footerState)}>
            <StatusDot tone={apiTone[api]} />
            <span>{t(`apiStatus.footer.${api}`)}</span>
        </span>
    );
}
