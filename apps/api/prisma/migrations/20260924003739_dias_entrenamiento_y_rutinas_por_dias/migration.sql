/*
  Warnings:

  - You are about to drop the column `ejercicios` on the `Rutina` table. All the data in the column will be lost.
  - Added the required column `dias` to the `Rutina` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Rutina" DROP COLUMN "ejercicios",
ADD COLUMN     "dias" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "Socio" ADD COLUMN     "diasEntrenamiento" INTEGER;
