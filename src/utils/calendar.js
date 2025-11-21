const { OAuth2Client } = require("google-auth-library");

/**
 * Creates a Google Calendar event for attendance tracking
 * @param {Object} user - User object with refreshToken
 * @param {string} courseName - Name of the course
 * @param {string} status - Attendance status (Present/Absent/Cancelled)
 * @returns {Promise<Object|null>} Calendar event data or null if failed
 */
async function createAttendanceEvent(user, courseName, status) {
    if (!user || !user.refreshToken) {
        console.log("No refresh token available for calendar event");
        return null;
    }

    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        console.error("Missing Google credentials");
        return null;
    }

    try {
        const client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
        client.setCredentials({ refresh_token: user.refreshToken });

        const { token } = await client.getAccessToken();
        if (!token) {
            console.error("Failed to get access token");
            return null;
        }

        // Determine color based on status
        let colorId = "0"; // Default
        switch (status) {
            case "Present":
                colorId = "10"; // Green
                break;
            case "Absent":
                colorId = "11"; // Red
                break;
            case "Cancelled":
                colorId = "5"; // Yellow
                break;
        }

        // Create calendar event
        const now = new Date();
        const eventStart = new Date(now);
        const eventEnd = new Date(now);
        eventEnd.setHours(eventEnd.getHours() + 1); // 1 hour duration

        const event = {
            summary: `${courseName} - ${status}`,
            description: `Attendance marked as ${status} for ${courseName}`,
            start: {
                dateTime: eventStart.toISOString(),
                timeZone: "Asia/Kolkata",
            },
            end: {
                dateTime: eventEnd.toISOString(),
                timeZone: "Asia/Kolkata",
            },
            colorId: colorId,
        };

        const calRes = await fetch(
            "https://www.googleapis.com/calendar/v3/calendars/primary/events",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(event),
            }
        );

        const calData = await calRes.json();
        if (calRes.ok) {
            console.log("✅ Calendar event created:", calData.htmlLink);
            return calData;
        } else {
            console.error("❌ Calendar event creation failed:", calData);
            return null;
        }
    } catch (error) {
        console.error("Google Calendar Integration Error:", error);
        return null;
    }
}

module.exports = { createAttendanceEvent };
