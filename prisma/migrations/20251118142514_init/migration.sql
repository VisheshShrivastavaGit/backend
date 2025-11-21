/*
  Warnings:

  - You are about to drop the column `semesterId` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the `Semester` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `userId` to the `Course` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Course" DROP CONSTRAINT "Course_semesterId_fkey";

-- DropForeignKey
ALTER TABLE "Semester" DROP CONSTRAINT "Semester_userId_fkey";

-- AlterTable
ALTER TABLE "Course" DROP COLUMN "semesterId",
ADD COLUMN     "userId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "Semester";

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
