import { useState } from 'react';
import { homeMeta } from '../app/routeMeta';
import { useDocumentMeta } from '../app/useDocumentMeta';
import type { Skill } from '../content/skills';
import { About } from '../sections/About';
import { Contact } from '../sections/Contact';
import { Education } from '../sections/Education';
import { Experience } from '../sections/Experience';
import { FeaturedWork } from '../sections/FeaturedWork';
import { Hero } from '../sections/Hero';
import { HowIWork } from '../sections/HowIWork';
import { Skills } from '../sections/Skills';

/** Every section renders from content at once; only the hero panel and the footer dot wait for the API (FR-1). */
export function HomePage() {
    useDocumentMeta(homeMeta());
    // The selected skill is shared by two sibling sections (P5).
    const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
    const toggleSkill = (skill: Skill) => {
        setSelectedSkill((current) => (current === skill ? null : skill));
    };

    return (
        <>
            <Hero />
            <About />
            <Experience />
            <FeaturedWork highlighted={selectedSkill ? new Set(selectedSkill.usedIn) : null} />
            <HowIWork />
            <Skills selected={selectedSkill} onToggle={toggleSkill} />
            <Education />
            <Contact />
        </>
    );
}
