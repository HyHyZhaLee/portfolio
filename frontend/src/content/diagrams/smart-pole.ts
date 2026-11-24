import type { ArchitectureDiagram } from './types';

/**
 * Smart Pole (PF-022 D-3, Tier A): the four layers left to right, the sensor path on top and the camera path below.
 * The RS485 frames are drawn to the uplinks and the speed estimates to Firebase (the D-3 defaults).
 */
export const smartPoleDiagram: ArchitectureDiagram = {
    title: 'Smart Pole system layers',
    summary: 'Four layers, from sensor firmware on the pole to a real-time app.',
    description:
        "Sensor nodes on ESP32 with FreeRTOS send frames over the pole's RS485 bus with Stop-and-Wait ARQ, and data leaves the pole over NB-IoT, LoRa or MQTT. A Python MQTT gateway receives it and passes it to Firebase. Edge AI estimates vehicle speed from camera video and sends the estimates to Firebase. A Flutter app shows the data in real time on the web and Android.",
    ownership: '★ The parts I implemented. I led the team of three and defined the architecture; teammates built the other modules.',
    width: 1200,
    height: 312,
    zones: [
        { id: 'physical', label: 'Physical', x: 12, y: 12, w: 290, h: 288 },
        { id: 'network', label: 'Network', x: 310, y: 12, w: 250, h: 288 },
        { id: 'processing', label: 'Data processing', x: 568, y: 12, w: 330, h: 288 },
        { id: 'application', label: 'Application', x: 906, y: 12, w: 282, h: 288 },
    ],
    nodes: [
        { id: 'sensors', label: 'Sensor nodes', detail: 'ESP32, FreeRTOS', x: 30, y: 102, w: 200, h: 56, icon: { glyph: 'device' }, mine: true },
        { id: 'camera', label: 'Camera', x: 30, y: 222, w: 200, h: 56, icon: { glyph: 'device' } },
        { id: 'uplinks', label: 'Uplinks', detail: 'NB-IoT, LoRa, MQTT', x: 330, y: 102, w: 210, h: 56, icon: { glyph: 'external' } },
        { id: 'gateway', label: 'MQTT gateway', detail: 'Python', x: 590, y: 102, w: 180, h: 56, icon: { glyph: 'server' }, mine: true },
        { id: 'edge-ai', label: 'Edge AI', detail: 'vehicle speed', x: 590, y: 222, w: 180, h: 56, icon: { glyph: 'job' }, mine: true },
        { id: 'firebase', label: 'Firebase', x: 940, y: 102, w: 220, h: 56, icon: { glyph: 'database' } },
        { id: 'app', label: 'Monitoring app', detail: 'Flutter, web and Android', x: 940, y: 222, w: 220, h: 56, icon: { glyph: 'browser' }, mine: true },
    ],
    edges: [
        {
            id: 'frames',
            kind: 'main',
            from: { node: 'sensors', side: 'right', offset: -8 },
            to: { node: 'uplinks', side: 'left', offset: -8 },
            label: 'RS485 frames',
            labelAt: { x: 280, y: 112 },
        },
        {
            id: 'acks',
            kind: 'return',
            from: { node: 'uplinks', side: 'left', offset: 10 },
            to: { node: 'sensors', side: 'right', offset: 10 },
            label: 'ACK',
            labelAt: { x: 280, y: 158 },
        },
        { id: 'uplink-gateway', kind: 'main', from: { node: 'uplinks', side: 'right' }, to: { node: 'gateway', side: 'left' } },
        { id: 'gateway-firebase', kind: 'main', from: { node: 'gateway', side: 'right' }, to: { node: 'firebase', side: 'left' } },
        {
            id: 'camera-edge',
            kind: 'main',
            from: { node: 'camera', side: 'right' },
            to: { node: 'edge-ai', side: 'left' },
            label: 'video',
            labelAt: { x: 330, y: 242 },
        },
        {
            id: 'edge-firebase',
            kind: 'main',
            from: { node: 'edge-ai', side: 'right' },
            to: { node: 'firebase', side: 'left', offset: 14 },
            label: 'speed estimates',
            labelAt: { x: 816, y: 268 },
        },
        { id: 'firebase-app', kind: 'main', from: { node: 'firebase', side: 'bottom' }, to: { node: 'app', side: 'top' } },
    ],
    steps: [
        {
            text: 'Sensor nodes run FreeRTOS tasks with a watchdog, so a stuck task restarts the device.',
            edges: [],
            nodes: ['sensors'],
            badge: { x: 130, y: 190 },
            mine: true,
        },
        {
            text: "Frames cross the pole's RS485 bus with Stop-and-Wait ARQ: each frame waits for an acknowledgement and is resent if none arrives.",
            edges: ['frames', 'acks'],
            badge: { x: 280, y: 86 },
            mine: true,
        },
        { text: 'Data leaves the pole over NB-IoT, LoRa or MQTT.', edges: ['uplink-gateway'], badge: { x: 565, y: 104 } },
        { text: 'A Python MQTT gateway receives it and passes it on.', edges: ['gateway-firebase'], badge: { x: 812, y: 130 }, mine: true },
        {
            text: 'Edge AI estimates vehicle speed from camera video, at the edge.',
            edges: ['camera-edge', 'edge-firebase'],
            badge: { x: 470, y: 250 },
            mine: true,
        },
        { text: 'A Flutter app on Firebase shows it in real time on the web and Android.', edges: ['firebase-app'], badge: { x: 1074, y: 190 }, mine: true },
    ],
};
