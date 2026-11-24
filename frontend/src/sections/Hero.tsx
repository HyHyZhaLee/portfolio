import portrait from '../assets/portrait.webp';
import { ButtonLink } from '../components/ButtonLink';
import { ChipList } from '../components/ChipList';
import { DownloadIcon } from '../components/DownloadIcon';
import { getTestIdProp, TestIds } from '../config/test-ids.config';
import { profile } from '../content/profile';
import { SystemPanel } from '../features/api-status';
import { t } from '../i18n/en';
import { ProofPoints } from './ProofPoints';

/** Portrait, name, title, pitch, stack, proof points, and the three actions: the 10-second test (FR-2). */
export function Hero() {
    return (
        <section aria-labelledby='hero-heading' className='pt-8 pb-14 lg:pt-8 lg:pb-12'>
            <div className='wrap grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-center lg:gap-12'>
                <div>
                    <div className='flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6'>
                        <img
                            src={portrait}
                            alt={t('hero.portraitAlt', { name: profile.name })}
                            width={480}
                            height={480}
                            fetchPriority='high'
                            className='size-28 shrink-0 rounded-full border-4 border-surface-raised bg-surface-sunk object-cover shadow-panel sm:size-32 lg:size-36'
                            {...getTestIdProp(TestIds.hero.portrait)}
                        />
                        <div className='min-w-0'>
                            <h1 id='hero-heading' className='text-display font-bold' {...getTestIdProp(TestIds.home.heading)}>
                                {profile.name}
                            </h1>
                            <p className='mt-3 font-ui text-subtitle font-medium tracking-tight'>{profile.title}</p>
                            <p className='mt-1.5 font-ui text-label text-pretty text-muted'>{profile.where}</p>
                        </div>
                    </div>
                    <p className='mt-4 max-w-[52ch] text-lead'>{profile.pitch}</p>
                    <ChipList items={profile.stack} label={t('hero.stackLabel')} className='mt-4' />
                    <ProofPoints />
                    <div className='mt-6 flex flex-wrap items-center gap-2.5'>
                        <ButtonLink variant='primary' to={{ pathname: '/', hash: '#work' }} {...getTestIdProp(TestIds.hero.workLink)}>
                            {t('hero.viewWork')}
                        </ButtonLink>
                        <ButtonLink href={profile.cvPath} {...getTestIdProp(TestIds.hero.cvLink)}>
                            <DownloadIcon />
                            {t('hero.downloadCv')}
                        </ButtonLink>
                        <ButtonLink variant='quiet' to={{ pathname: '/', hash: '#contact' }} {...getTestIdProp(TestIds.hero.contactLink)}>
                            {t('hero.contact')}
                        </ButtonLink>
                    </div>
                </div>
                <SystemPanel />
            </div>
        </section>
    );
}
