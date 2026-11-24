import { homeMeta } from '../app/routeMeta';
import { useDocumentMeta } from '../app/useDocumentMeta';
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

    return (
        <>
            <Hero />
            <About />
            <Experience />
            <FeaturedWork />
            <HowIWork />
            <Skills />
            <Education />
            <Contact />
        </>
    );
}
