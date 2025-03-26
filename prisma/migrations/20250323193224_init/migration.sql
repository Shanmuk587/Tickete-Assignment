-- CreateTable
CREATE TABLE "Product" (
    "id" INTEGER NOT NULL,
    "name" TEXT,
    "description" TEXT,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DateAvailability" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "date" DATE NOT NULL,

    CONSTRAINT "DateAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Slot" (
    "id" SERIAL NOT NULL,
    "dateAvailabilityId" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT,
    "providerSlotId" TEXT,
    "variantId" INTEGER,
    "remaining" INTEGER NOT NULL,
    "currencyCode" TEXT,

    CONSTRAINT "Slot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaxType" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,

    CONSTRAINT "PaxType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlotPaxAvailability" (
    "slotId" INTEGER NOT NULL,
    "paxTypeId" INTEGER NOT NULL,
    "min" INTEGER,
    "max" INTEGER,
    "remaining" INTEGER NOT NULL,
    "isPrimary" BOOLEAN,
    "priceFinal" DOUBLE PRECISION NOT NULL,
    "priceCurrency" TEXT NOT NULL,
    "priceOriginal" DOUBLE PRECISION NOT NULL,
    "priceDiscount" DOUBLE PRECISION,

    CONSTRAINT "SlotPaxAvailability_pkey" PRIMARY KEY ("slotId","paxTypeId")
);

-- CreateIndex
CREATE UNIQUE INDEX "DateAvailability_productId_date_key" ON "DateAvailability"("productId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Slot_dateAvailabilityId_startTime_key" ON "Slot"("dateAvailabilityId", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "PaxType_type_key" ON "PaxType"("type");

-- AddForeignKey
ALTER TABLE "DateAvailability" ADD CONSTRAINT "DateAvailability_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Slot" ADD CONSTRAINT "Slot_dateAvailabilityId_fkey" FOREIGN KEY ("dateAvailabilityId") REFERENCES "DateAvailability"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlotPaxAvailability" ADD CONSTRAINT "SlotPaxAvailability_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "Slot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlotPaxAvailability" ADD CONSTRAINT "SlotPaxAvailability_paxTypeId_fkey" FOREIGN KEY ("paxTypeId") REFERENCES "PaxType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
