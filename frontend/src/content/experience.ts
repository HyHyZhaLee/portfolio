export interface Role {
    organization: string;
    title: string;
    period: string;
    summary: string;
    current: boolean;
}

/** Three roles, newest first (content plan §7.1). */
export const roles: readonly Role[] = [
    {
        organization: 'Xolv Technology Solutions',
        title: 'Software Engineer',
        period: '08/2025 – Present',
        summary:
            'Full-stack engineer on three products of a U.S. healthtech company that builds software for people with autism and intellectual and developmental disabilities, and for the clinicians, providers and families who support them. I work remotely on FAST (client intake), MyBrightLink (treatment plans, session data and clinical reports) and Clockwork (appointment scheduling). The five case studies above come from this role.',
        current: true,
    },
    {
        organization: 'FPT Digital',
        title: 'Technology Solution Architect Associate',
        period: '11/2024 – 05/2025',
        summary:
            'Supported senior architects on digital-transformation consulting engagements for domestic and international clients. For Saigon Trading Group (SATRA) I prepared IT survey questionnaires, joined stakeholder interviews, worked on the gap analysis and helped draft a future-state architecture and a phased 2025–2030 roadmap.',
        current: false,
    },
    {
        organization: 'Lotus Viet Nam Electronic Service',
        title: 'Embedded Systems Intern',
        period: '03/2023 – 08/2023',
        summary:
            'Industrial internship run with a university partner, with training in embedded fundamentals such as RTOS, UART/I2C/RS485 and watchdog timers. I built reusable object-oriented I/O libraries for new microcontrollers and RS485 industrial sensors, and supported field IoT projects in smart agriculture and air-quality monitoring.',
        current: false,
    },
];
