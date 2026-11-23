import { Fragment } from 'react';
import { Link } from 'react-router';
import { Section } from '../components/Section';
import { getTestIdProp, TestIds } from '../config/test-ids.config';
import { caseStudies } from '../content/caseStudies';
import { caseStudyPath } from '../content/caseStudies/slugs';
import { skillGroups, skillsIntro, type Skill } from '../content/skills';
import { t } from '../i18n/en';

interface SkillsProps {
    selected: Skill | null;
    /** Selects `skill`, or clears the selection when `skill` is already selected (FR-8). */
    onToggle: (skill: Skill) => void;
}

/** ", " between items, " and " before the last, "." after it. */
function separator(index: number, count: number): string {
    if (index === count - 1) {
        return '.';
    }
    return index === count - 2 ? ` ${t('skills.and')} ` : ', ';
}

function countLabel(count: number): string {
    return count === 1 ? t('skills.countOne') : t('skills.countMany', { count });
}

export function Skills({ selected, onToggle }: SkillsProps) {
    return (
        <Section id='skills' heading={t('skills.heading')} intro={skillsIntro}>
            {skillGroups.map((group) => {
                const groupSelection = selected !== null && group.skills.includes(selected) ? selected : null;
                return (
                    <div key={group.name} className='grid gap-3 border-t border-line py-4.5 last-of-type:border-b md:grid-cols-[11rem_minmax(0,1fr)] md:gap-6'>
                        <h3 className='pt-1.5 text-base font-semibold'>{group.name}</h3>
                        <div className='min-w-0'>
                            <ul className='flex flex-wrap gap-1.5'>
                                {group.skills.map((skill) => (
                                    <li key={skill.name}>
                                        <button
                                            type='button'
                                            aria-pressed={skill === selected}
                                            onClick={() => {
                                                onToggle(skill);
                                            }}
                                            className='group inline-flex items-center gap-2 rounded-full border border-line bg-surface-raised px-3 py-2 text-sm leading-none font-medium text-ink hover:border-ink aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-accent-ink'
                                            {...getTestIdProp(TestIds.skills.skillButton)}
                                        >
                                            <span>{skill.name}</span>
                                            <span aria-hidden='true' className='text-xs text-muted group-aria-pressed:text-accent-ink'>
                                                {skill.usedIn.length}
                                            </span>
                                            <span className='sr-only'>, {countLabel(skill.usedIn.length)}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            <p aria-live='polite' className='font-ui text-sm text-muted not-empty:mt-3'>
                                {groupSelection && (
                                    <>
                                        {t('skills.usedIn')}{' '}
                                        {groupSelection.usedIn.map((slug, index) => (
                                            <Fragment key={slug}>
                                                <Link to={caseStudyPath(slug)} className='font-semibold' {...getTestIdProp(TestIds.skills.usedInLink)}>
                                                    {caseStudies[slug].title}
                                                </Link>
                                                {separator(index, groupSelection.usedIn.length)}
                                            </Fragment>
                                        ))}
                                    </>
                                )}
                            </p>
                        </div>
                    </div>
                );
            })}
            <p className='mt-4 font-ui text-sm text-muted'>{t('skills.hint')}</p>
        </Section>
    );
}
