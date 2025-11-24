const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/jwtAuth");
const { createAttendanceEvent } = require("../utils/calendar");

// Create a new course (protected)
router.post("/:userId", async (req, res) => {
  const prisma = req.app.locals.prisma;
  const {
    IndivCourse,
    timeofcourse,
    Totaldays = 35,
    present = 0,
    absent = 0,
    cancelled = 0,
    criteria = 75,
    days = [],
  } = req.body;



  if (!IndivCourse || typeof IndivCourse !== "string" || !IndivCourse.trim()) {
    return res.status(400).json({
      error: "Course name is required and must be a non-empty string.",
    });
  }
  try {
    const existing = await prisma.course.findFirst({
      where: { userId: Number(req.params.userId), IndivCourse },
    });
    if (existing)
      return res
        .status(409)
        .json({ error: "Course with that name already exists." });

    const course = await prisma.course.create({
      data: {
        IndivCourse,
        timeofcourse: timeofcourse || "",
        Totaldays: Number(Totaldays) || 35,
        present: Number(present) || 0,
        absent: Number(absent) || 0,
        cancelled: Number(cancelled) || 0,
        criteria: Number(criteria) || 75,
        userId: Number(req.params.userId),
        days: days || [],
      },
    });

    res.status(201).json({ ok: true, data: course });
  } catch (err) {
    console.error(err);
    if (err && err.code === "P2002")
      return res
        .status(409)
        .json({ error: "Course name must be unique for each user." });
    res.status(500).json({ error: err.message || "Unexpected server error." });
  }
});

// Update a course (protected, owner only) - /:userId/:courseId
router.put("/:userId/:courseId", requireAuth, async (req, res) => {
  const prisma = req.app.locals.prisma;
  const userId = Number(req.params.userId);
  const courseId = Number(req.params.courseId);
  if (!userId || isNaN(userId))
    return res.status(400).json({ error: "Invalid user ID." });
  if (!courseId || isNaN(courseId))
    return res.status(400).json({ error: "Invalid course ID." });

  try {
    const existing = await prisma.course.findUnique({ where: { id: courseId } });
    if (!existing) return res.status(404).json({ error: "Course not found." });
    if (existing.userId !== userId)
      return res.status(403).json({
        error: "Course does not belong to the provided user ID.",
      });
    if (Number(req.user.id) !== userId)
      return res
        .status(403)
        .json({ error: "You do not have permission to edit this course." });

    const payload = {};
    const updatable = [
      "IndivCourse",
      "timeofcourse",
      "Totaldays",
      "present",
      "absent",
      "cancelled",
      "criteria",
    ];
    updatable.forEach((k) => {
      if (req.body[k] !== undefined) payload[k] = req.body[k];
    });

    if (
      payload.IndivCourse &&
      (typeof payload.IndivCourse !== "string" || !payload.IndivCourse.trim())
    ) {
      return res
        .status(400)
        .json({ error: "Course name must be a non-empty string." });
    }

    if (payload.IndivCourse && payload.IndivCourse !== existing.IndivCourse) {
      const dup = await prisma.course.findFirst({
        where: { userId, IndivCourse: payload.IndivCourse },
      });
      if (dup)
        return res
          .status(409)
          .json({ error: "Course with that name already exists." });
    }

    if (req.body.days !== undefined) {
      payload.days = Array.isArray(req.body.days) ? req.body.days : [];
    }

    const updated = await prisma.course.update({
      where: { id: courseId },
      data: payload,
    });

    // Google Calendar Integration - Create event when attendance is marked
    const attendanceChanged =
      (payload.present !== undefined && payload.present !== existing.present) ||
      (payload.absent !== undefined && payload.absent !== existing.absent) ||
      (payload.cancelled !== undefined && payload.cancelled !== existing.cancelled);

    if (attendanceChanged) {
      const user = await prisma.user.findUnique({ where: { id: userId } });

      // Determine attendance status
      let status = "Unknown";
      if (payload.present !== undefined && payload.present > existing.present) {
        status = "Present";
      } else if (payload.absent !== undefined && payload.absent > existing.absent) {
        status = "Absent";
      } else if (payload.cancelled !== undefined && payload.cancelled > existing.cancelled) {
        status = "Cancelled";
      }

      // Create calendar event (non-blocking)
      createAttendanceEvent(user, updated.IndivCourse, status).catch(err => {
        console.error("Calendar event creation failed:", err);
      });
    }

    res.json({ ok: true, data: updated });
  } catch (err) {
    console.error(err);
    if (err && err.code === "P2002")
      return res
        .status(409)
        .json({ error: "Course name must be unique for each user." });
    res.status(500).json({ error: err.message || "Unexpected server error." });
  }
});

// Delete a single course (protected, owner only) - /:userId/:courseId
router.delete("/:userId/:courseId", requireAuth, async (req, res) => {
  const prisma = req.app.locals.prisma;
  const userId = Number(req.params.userId);
  const courseId = Number(req.params.courseId);
  if (!userId || isNaN(userId))
    return res.status(400).json({ error: "Invalid user ID." });
  if (!courseId || isNaN(courseId))
    return res.status(400).json({ error: "Invalid course ID." });

  try {
    const existing = await prisma.course.findUnique({ where: { id: courseId } });
    if (!existing) return res.status(404).json({ error: "Course not found." });
    if (existing.userId !== userId)
      return res.status(403).json({
        error: "Course does not belong to the provided user ID.",
      });
    if (Number(req.user.id) !== userId)
      return res
        .status(403)
        .json({ error: "You do not have permission to delete this course." });

    // Delete related Day_Course records first to avoid foreign key constraint error


    // Now delete the course
    await prisma.course.delete({ where: { id: courseId } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Unexpected server error." });
  }
});

// Delete all courses for a specified user (protected) - /:userId
router.delete("/:userId", requireAuth, async (req, res) => {
  const prisma = req.app.locals.prisma;
  const userId = Number(req.params.userId);
  if (!userId || isNaN(userId))
    return res.status(400).json({ error: "Invalid user ID." });
  try {
    if (Number(req.user.id) !== userId)
      return res
        .status(403)
        .json({ error: "You do not have permission to delete these courses." });

    const courses = await prisma.course.findMany({
      where: { userId },
      select: { id: true },
    });
    const ids = courses.map((c) => c.id);
    if (ids.length === 0) return res.json({ ok: true });


    await prisma.course.deleteMany({ where: { id: { in: ids } } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Unexpected server error." });
  }
});

// Public list of courses for a user by userId
router.get("/:userId", async (req, res) => {
  const prisma = req.app.locals.prisma;
  const userId = Number(req.params.userId);
  if (!userId || isNaN(userId))
    return res.status(400).json({ ok: false, error: "Invalid user ID." });
  try {
    const courses = await prisma.course.findMany({
      where: { userId },
      take: 100,
    });
    return res.json({ ok: true, data: courses });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ ok: false, error: err.message || "Unexpected server error." });
  }
});

// Get single course (protected) - /:userId/:courseId
router.get("/:userId/:courseId", requireAuth, async (req, res) => {
  const prisma = req.app.locals.prisma;
  const userId = Number(req.params.userId);
  const courseId = Number(req.params.courseId);
  if (!userId || isNaN(userId))
    return res.status(400).json({ error: "Invalid user ID." });
  if (!courseId || isNaN(courseId))
    return res.status(400).json({ error: "Invalid course ID." });

  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) return res.status(404).json({ error: "Course not found." });
    if (course.userId !== userId)
      return res
        .status(403)
        .json({ error: "Course does not belong to the provided user ID." });
    if (Number(req.user.id) !== userId)
      return res
        .status(403)
        .json({ error: "You do not have permission to view this course." });
    res.json({ ok: true, data: course });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Unexpected server error." });
  }
});

// Reset all course stats for the specified user (protected) - /:userId/reset
router.post("/:userId/reset", requireAuth, async (req, res) => {
  const prisma = req.app.locals.prisma;
  const userId = Number(req.params.userId);
  if (!userId || isNaN(userId))
    return res.status(400).json({ error: "Invalid user ID." });
  try {
    if (Number(req.user.id) !== userId)
      return res
        .status(403)
        .json({ error: "You do not have permission to reset these courses." });
    await prisma.course.updateMany({
      where: { userId },
      data: { present: 0, absent: 0, cancelled: 0 },
    });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Unexpected server error." });
  }
});

// Reset stats for a single course (protected) - /:userId/:courseId/reset
router.post("/:userId/:courseId/reset", requireAuth, async (req, res) => {
  const prisma = req.app.locals.prisma;
  const userId = Number(req.params.userId);
  const courseId = Number(req.params.courseId);
  if (!userId || isNaN(userId))
    return res.status(400).json({ error: "Invalid user ID." });
  if (!courseId || isNaN(courseId))
    return res.status(400).json({ error: "Invalid course ID." });

  try {
    const existing = await prisma.course.findUnique({ where: { id: courseId } });
    if (!existing) return res.status(404).json({ error: "Course not found." });
    if (existing.userId !== userId)
      return res.status(403).json({
        error: "Course does not belong to the provided user ID.",
      });
    if (Number(req.user.id) !== userId)
      return res
        .status(403)
        .json({ error: "You do not have permission to reset this course." });

    const updated = await prisma.course.update({
      where: { id: courseId },
      data: { present: 0, absent: 0, cancelled: 0 },
    });

    res.json({ ok: true, data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Unexpected server error." });
  }
});

module.exports = router;
