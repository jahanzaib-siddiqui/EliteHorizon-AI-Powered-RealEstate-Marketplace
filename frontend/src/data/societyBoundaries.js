// simplified polygon coordinates for demo purposes
// In a real app, these would be precise GeoJSON coordinates
export const SOCIETY_BOUNDARIES = {
    lahore: [
        {
            name: "DHA Lahore",
            color: "#d93025", // Prime Red
            positions: [
                [31.4886, 74.3820], // Top Left
                [31.4920, 74.4300], // Top Right
                [31.4500, 74.4500], // Bottom Right
                [31.4400, 74.3900], // Bottom Left
            ]
        },
        {
            name: "Bahria Town",
            color: "#1a73e8", // Luxury Blue
            positions: [
                [31.3900, 74.1600],
                [31.3950, 74.2000],
                [31.3500, 74.2100],
                [31.3400, 74.1700],
            ]
        },
        {
            name: "Johar Town",
            color: "#1a73e8",
            positions: [
                [31.4700, 74.2700],
                [31.4750, 74.2900],
                [31.4550, 74.2950],
                [31.4500, 74.2750],
            ]
        }
    ],
    islamabad: [
        {
            name: "F-Sectors (Prime)",
            color: "#d93025",
            positions: [
                [33.7350, 73.0400],
                [33.7400, 73.0800],
                [33.7100, 73.0900],
                [33.7000, 73.0500],
            ]
        },
        {
            name: "DHA Islamabad",
            color: "#1a73e8",
            positions: [
                [33.5800, 73.1000],
                [33.5850, 73.1600],
                [33.5400, 73.1700],
                [33.5350, 73.1100],
            ]
        }
    ],
    karachi: [
        {
            name: "DHA Karachi & Clifton",
            color: "#d93025",
            positions: [
                [24.8400, 67.0300],
                [24.8450, 67.0800],
                [24.7900, 67.0900],
                [24.7850, 67.0200],
            ]
        },
        {
            name: "Bahria Town Karachi",
            color: "#1a73e8",
            positions: [
                [25.0700, 67.3000],
                [25.0800, 67.3600],
                [25.0100, 67.3700],
                [25.0000, 67.3100],
            ]
        }
    ],
    multan: [
        {
            name: "DHA Multan",
            color: "#d93025",
            positions: [
                [30.2400, 71.5000],
                [30.2500, 71.5500],
                [30.2000, 71.5600],
                [30.1900, 71.5100],
            ]
        }
    ]
};
