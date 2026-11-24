import bachKhoaInnovation2024 from '../assets/certificates/bach-khoa-innovation-2024.webp';
import bgswEmbeddedAcademy from '../assets/certificates/bgsw-embedded-academy.webp';
import boschCodeRace2023 from '../assets/certificates/bosch-code-race-2023.webp';

/** A scan or photo of an award certificate, shown on request in the Education section. */
export interface Certificate {
    src: string;
    alt: string;
    width: number;
    height: number;
}

export interface EducationItem {
    title: string;
    detail: string;
    certificate?: Certificate;
}

export const degrees: readonly EducationItem[] = [
    {
        title: "Master's in Computer Science (in progress)",
        detail: 'Bach Khoa University (formerly Ho Chi Minh City University of Technology), 08/2025 – Present',
    },
    {
        title: 'Bachelor of Computer Engineering',
        detail: 'Bach Khoa University (formerly Ho Chi Minh City University of Technology), 2020 – 2025',
    },
];

export const awards: readonly EducationItem[] = [
    {
        title: 'Top 20 in Bach Khoa Innovation 2024, University Category',
        detail: '11/2024',
        certificate: {
            src: bachKhoaInnovation2024,
            alt: 'Certificate of recognition from Ho Chi Minh City University of Technology: Top 20, University Category, Bach Khoa Innovation 2024, for the Smart Pole System project.',
            width: 1560,
            height: 1100,
        },
    },
    {
        title: 'Top 12 in Bosch Code Race Challenge 2023, "Exceed the Limitless Mind"',
        detail: '04/2023',
        certificate: {
            src: boschCodeRace2023,
            alt: 'Certificate of achievement from Bosch Global Software Technologies: Top 12 in the CodeRace Competition 2023.',
            width: 1600,
            height: 1131,
        },
    },
    {
        title: 'BGSW-VN Embedded Academy',
        detail: 'Bosch Global Software Technologies Vietnam, 10/2023',
        certificate: {
            src: bgswEmbeddedAcademy,
            alt: 'Certificate from Bosch Global Software Technologies: completed the BGSW-VN Embedded Academy, October 2023.',
            width: 1131,
            height: 1600,
        },
    },
];
