-- CreateIndex
CREATE INDEX "Course_userId_idx" ON "Course"("userId");

-- CreateIndex
CREATE INDEX "Day_Course_courseId_idx" ON "Day_Course"("courseId");
