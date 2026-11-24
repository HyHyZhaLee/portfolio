import type { CaseStudy } from './types';

export const smartPole: CaseStudy = {
    slug: 'smart-pole',
    title: 'Smart Pole System - Smart-City IoT Capstone',
    metaDescription:
        'How I led a university capstone team that built a four-layer IoT prototype: ESP32 firmware, an MQTT gateway, edge-AI vehicle-speed estimation and a Flutter monitoring app.',
    angle: 'Leading a four-layer IoT capstone, from sensor firmware to a real-time app.',
    role: 'Led the team and implemented the core firmware, gateway and app',
    problemLine: 'Cities need traffic, environmental and device data from the street, managed in one place.',
    outcomeLine: 'A four-layer prototype from ESP32 firmware to a Flutter app, with vehicle-speed estimation from camera video.',
    chips: ['ESP32 and FreeRTOS', 'MQTT and Python', 'Flutter and Firebase'],
    period: '05/2024',
    team: 'Team of three; I was the team lead.',
    stack: ['ESP32', 'FreeRTOS', 'MQTT', 'Python', 'Firebase', 'Flutter'],
    outcomes: [
        'A prototype spanning the Physical, Network, Data Processing and Application layers',
        'Firmware with a watchdog and reliable RS485 messaging (Stop-and-Wait ARQ)',
        'Edge-AI vehicle-speed estimation from camera video',
    ],
    links: [{ label: 'Source on GitHub', href: 'https://github.com/HyHyZhaLee/BK2023_Thesis_SmartPole' }],
    context: [
        'The smart pole is a street pole that senses its surroundings and reports what it sees. Our university capstone treated it as a smart-city building block: a pole that could support traffic monitoring, environmental awareness and central management of street devices through real-time sensing, wireless communication, edge AI and an app that people can use on the web and on a phone.',
        'The public repository describes the wider vision, including adaptive lighting, AI traffic cameras, EV charging, information screens and air-quality sensing. I describe below only the parts I led and built.',
    ],
    problem: [
        'A city that wants to manage its street devices needs data from the street and a way to see it. That raises four problems at once. Devices on a pole must run reliably without anyone resetting them. Their data has to travel over links that are slow or unreliable. Something has to receive, translate and process it, including video. Finally, someone has to see the result in real time. The project had to cover every one of those steps, not just one, so the real challenge was making four layers work together as one system.',
    ],
    roleAndScope: [
        'I led the team. I defined the system architecture and the roadmap across all four layers (Physical, Network, Data Processing and Application), assigned modules to team members and supervised code quality. Alongside the lead work I implemented the core firmware, a Python MQTT gateway, the edge-AI vehicle-speed estimation and the Flutter app.',
        'The repository lists three contributors. My teammates built the other modules I assigned to them.',
    ],
    built: [
        'Core firmware on ESP32. FreeRTOS tasks and a watchdog timer, so a stuck task restarts the device instead of leaving a pole silent.',
        'Reliable messaging on constrained links. Stop-and-Wait ARQ over RS485, plus NB-IoT, LoRa and MQTT as the ways data leaves the pole.',
        'A Python MQTT gateway that receives device data and passes it on for processing and display.',
        'Edge-AI vehicle-speed estimation from camera video, running at the edge rather than in a data centre.',
        'A cross-platform Flutter app for web and Android, on Firebase, for real-time monitoring.',
    ],
    deepDive: {
        topic: 'Reliable messages over a wired bus',
        paragraphs: [
            'Sensor nodes on the pole talk over RS485, a simple wired bus that carries bytes but promises nothing about delivery: noise can corrupt a frame and a busy receiver can miss one. I used Stop-and-Wait ARQ. The sender transmits one frame, waits for an acknowledgement, and sends the frame again if none arrives in time.',
        ],
    },
    outcome: [
        'We delivered a working prototype that covers all four layers of the system, from sensor firmware to a live monitoring app. It was completed as a university capstone in 05/2024. I have no deployment, user or performance numbers to report, and I do not claim any: this was a prototype, not a deployed city system.',
    ],
    tech: ['ESP32', 'FreeRTOS', 'RS485', 'NB-IoT', 'LoRa', 'MQTT', 'Python', 'Firebase', 'Flutter'],
};
