/**
 * Middleware to check if the authenticated user owns a course
 * Reduces duplicate permission checking code across routes
 */
async function checkCourseOwnership(req, res, next) {
    const prisma = req.app.locals.prisma;
    const userId = Number(req.params.userId);
    const courseId = Number(req.params.courseId);

    // Validate IDs
    if (!userId || isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID." });
    }
    if (!courseId || isNaN(courseId)) {
        return res.status(400).json({ error: "Invalid course ID." });
    }

    try {
        // Check if course exists
        const course = await prisma.course.findUnique({ where: { id: courseId } });
        if (!course) {
            return res.status(404).json({ error: "Course not found." });
        }

        // Check if course belongs to the specified user
        if (course.userId !== userId) {
            return res.status(403).json({
                error: "Course does not belong to the provided user ID.",
            });
        }

        // Check if authenticated user matches the userId
        if (Number(req.user.id) !== userId) {
            return res.status(403).json({
                error: "You do not have permission to access this course.",
            });
        }

        // Attach course to request for use in route handler
        req.course = course;
        next();
    } catch (err) {
        console.error("Course ownership check error:", err);
        res.status(500).json({ error: "Internal server error." });
    }
}

/**
 * Middleware to check if the authenticated user matches the userId parameter
 */
function checkUserOwnership(req, res, next) {
    const userId = Number(req.params.userId);

    if (!userId || isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID." });
    }

    if (Number(req.user.id) !== userId) {
        return res.status(403).json({
            error: "You do not have permission to access this resource.",
        });
    }

    next();
}

module.exports = { checkCourseOwnership, checkUserOwnership };
