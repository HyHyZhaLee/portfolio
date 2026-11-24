export interface EducationItem {
    title: string;
    detail: string;
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
    { title: 'Top 20 in Bach Khoa Innovation 2024, University Category', detail: '11/2024' },
    { title: 'Top 12 in Bosch Code Race Challenge 2023, "Exceed the Limitless Mind"', detail: '04/2023' },
    { title: 'BGSW-VN Embedded Academy', detail: 'Bosch Global Software Technologies Vietnam, 10/2023' },
];
