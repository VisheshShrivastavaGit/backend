/*
  Warnings:

  - You are about to drop the column `clerk_id` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,IndivCourse]` on the table `Course` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[googleId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "User_clerk_id_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "clerk_id",
DROP COLUMN "password",
ADD COLUMN     "googleId" TEXT,
ADD COLUMN     "refreshToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Course_userId_IndivCourse_key" ON "Course"("userId", "IndivCourse");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
