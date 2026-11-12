-- CreateTable
CREATE TABLE "SizeGroup" (
    "sizeId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SizeGroup_pkey" PRIMARY KEY ("sizeId","groupId")
);

-- AddForeignKey
ALTER TABLE "SizeGroup" ADD CONSTRAINT "SizeGroup_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "ItemSize"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SizeGroup" ADD CONSTRAINT "SizeGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "OptionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
