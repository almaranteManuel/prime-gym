-- Vínculo 1-1 opcional Usuario ↔ Socio (socioId null en admins).
-- La cuenta ALUMNO del socio se crea en la misma transacción del alta.
ALTER TABLE "Usuario" ADD COLUMN     "socioId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_socioId_key" ON "Usuario"("socioId");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_socioId_fkey" FOREIGN KEY ("socioId") REFERENCES "Socio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
