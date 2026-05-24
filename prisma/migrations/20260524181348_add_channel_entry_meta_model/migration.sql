-- CreateEnum
CREATE TYPE "ChannelKind" AS ENUM ('ARTICLES', 'NOTES', 'LINKS', 'STREAM', 'GUESTBOOK', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ChannelLayout" AS ENUM ('CHRONICLE', 'CARDS', 'TIMELINE', 'GREP', 'FEED');

-- CreateEnum
CREATE TYPE "EntryKind" AS ENUM ('ARTICLE', 'NOTE', 'LINK', 'JOKE', 'HOT_TAKE', 'REVIEW', 'QUOTE', 'GUESTBOOK_THREAD');

-- CreateEnum
CREATE TYPE "EntryStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CommentVisibility" AS ENUM ('PUBLIC', 'PRIVATE_TO_THREAD', 'DELETED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'VISITOR';

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "authorUserId" TEXT,
ADD COLUMN     "entryId" TEXT,
ADD COLUMN     "visibility" "CommentVisibility" NOT NULL DEFAULT 'PUBLIC',
ALTER COLUMN "postId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'VISITOR';

-- CreateTable
CREATE TABLE "Channel" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "icon" TEXT,
    "accentColor" TEXT,
    "kind" "ChannelKind" NOT NULL,
    "layout" "ChannelLayout" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelTranslation" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tagline" TEXT,

    CONSTRAINT "ChannelTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Series" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeriesTranslation" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "SeriesTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entry" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "kind" "EntryKind" NOT NULL,
    "status" "EntryStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "body" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "seriesId" TEXT,
    "seriesOrder" INTEGER,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "trendingScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntryTranslation" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,

    CONSTRAINT "EntryTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TagsOnEntries" (
    "entryId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "TagsOnEntries_pkey" PRIMARY KEY ("entryId","tagId")
);

-- CreateTable
CREATE TABLE "EntryView" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "visitorHash" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntryView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntryLike" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "visitorHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntryLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitLog" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimitLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Channel_slug_key" ON "Channel"("slug");

-- CreateIndex
CREATE INDEX "Channel_enabled_order_idx" ON "Channel"("enabled", "order");

-- CreateIndex
CREATE INDEX "Channel_kind_idx" ON "Channel"("kind");

-- CreateIndex
CREATE UNIQUE INDEX "ChannelTranslation_channelId_locale_key" ON "ChannelTranslation"("channelId", "locale");

-- CreateIndex
CREATE INDEX "Series_channelId_idx" ON "Series"("channelId");

-- CreateIndex
CREATE UNIQUE INDEX "Series_channelId_slug_key" ON "Series"("channelId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "SeriesTranslation_seriesId_locale_key" ON "SeriesTranslation"("seriesId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "Entry_slug_key" ON "Entry"("slug");

-- CreateIndex
CREATE INDEX "Entry_channelId_status_publishedAt_idx" ON "Entry"("channelId", "status", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "Entry_status_publishedAt_idx" ON "Entry"("status", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "Entry_kind_status_idx" ON "Entry"("kind", "status");

-- CreateIndex
CREATE INDEX "Entry_authorId_idx" ON "Entry"("authorId");

-- CreateIndex
CREATE INDEX "Entry_seriesId_seriesOrder_idx" ON "Entry"("seriesId", "seriesOrder");

-- CreateIndex
CREATE INDEX "Entry_trendingScore_idx" ON "Entry"("trendingScore" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "EntryTranslation_entryId_locale_key" ON "EntryTranslation"("entryId", "locale");

-- CreateIndex
CREATE INDEX "TagsOnEntries_tagId_idx" ON "TagsOnEntries"("tagId");

-- CreateIndex
CREATE INDEX "EntryView_entryId_createdAt_idx" ON "EntryView"("entryId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EntryView_entryId_visitorHash_dayKey_key" ON "EntryView"("entryId", "visitorHash", "dayKey");

-- CreateIndex
CREATE INDEX "EntryLike_entryId_idx" ON "EntryLike"("entryId");

-- CreateIndex
CREATE UNIQUE INDEX "EntryLike_entryId_visitorHash_key" ON "EntryLike"("entryId", "visitorHash");

-- CreateIndex
CREATE INDEX "RateLimitLog_scope_key_createdAt_idx" ON "RateLimitLog"("scope", "key", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_entryId_status_idx" ON "Comment"("entryId", "status");

-- CreateIndex
CREATE INDEX "Comment_entryId_visibility_idx" ON "Comment"("entryId", "visibility");

-- AddForeignKey
ALTER TABLE "ChannelTranslation" ADD CONSTRAINT "ChannelTranslation_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Series" ADD CONSTRAINT "Series_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeriesTranslation" ADD CONSTRAINT "SeriesTranslation_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntryTranslation" ADD CONSTRAINT "EntryTranslation_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagsOnEntries" ADD CONSTRAINT "TagsOnEntries_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagsOnEntries" ADD CONSTRAINT "TagsOnEntries_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntryView" ADD CONSTRAINT "EntryView_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntryLike" ADD CONSTRAINT "EntryLike_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
