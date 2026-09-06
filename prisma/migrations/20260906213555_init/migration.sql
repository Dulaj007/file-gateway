-- CreateTable
CREATE TABLE "Setting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "siteName" TEXT NOT NULL DEFAULT 'FileGateway',
    "siteTagline" TEXT NOT NULL DEFAULT '',
    "metaTitle" TEXT NOT NULL DEFAULT '',
    "metaDescription" TEXT NOT NULL DEFAULT '',
    "ogImageUrl" TEXT NOT NULL DEFAULT '',
    "faviconUrl" TEXT NOT NULL DEFAULT '',
    "themeDefault" TEXT NOT NULL DEFAULT 'system',
    "accentColor" TEXT NOT NULL DEFAULT '#6366f1',
    "storageCapBytes" BIGINT NOT NULL DEFAULT 32212254720,
    "imageMaxBytes" BIGINT NOT NULL DEFAULT 10485760,
    "videoMaxBytes" BIGINT NOT NULL DEFAULT 524288000,
    "zipMaxBytes" BIGINT NOT NULL DEFAULT 524288000,
    "ipDailyMaxUploads" INTEGER NOT NULL DEFAULT 20,
    "ipDailyMaxBytes" BIGINT NOT NULL DEFAULT 1073741824,
    "timerStartSeconds" INTEGER NOT NULL DEFAULT 5,
    "timerArticleSeconds" INTEGER NOT NULL DEFAULT 8,
    "timerFinalSeconds" INTEGER NOT NULL DEFAULT 5,
    "defaultExpiry" TEXT NOT NULL DEFAULT '7d',
    "articleHops" INTEGER NOT NULL DEFAULT 2,
    "mainDomain" TEXT NOT NULL DEFAULT '',
    "article1Domain" TEXT NOT NULL DEFAULT '',
    "article2Domain" TEXT NOT NULL DEFAULT '',
    "displayDomain" TEXT,
    "adminSecretPath" TEXT NOT NULL DEFAULT 'admin',
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FileItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "publicSlug" TEXT NOT NULL,
    "finalSlug" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "sha256" TEXT,
    "uploaderIp" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "downloadEnabled" BOOLEAN NOT NULL DEFAULT true,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME
);

-- CreateTable
CREATE TABLE "DownloadSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileId" TEXT NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "nonce" TEXT NOT NULL,
    "visitorIp" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ArticlePage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteKey" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "detail" TEXT,
    "ip" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "FileItem_publicSlug_key" ON "FileItem"("publicSlug");

-- CreateIndex
CREATE UNIQUE INDEX "FileItem_finalSlug_key" ON "FileItem"("finalSlug");

-- CreateIndex
CREATE UNIQUE INDEX "FileItem_storedName_key" ON "FileItem"("storedName");

-- CreateIndex
CREATE INDEX "FileItem_status_expiresAt_idx" ON "FileItem"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "FileItem_uploaderIp_createdAt_idx" ON "FileItem"("uploaderIp", "createdAt");

-- CreateIndex
CREATE INDEX "DownloadSession_expiresAt_idx" ON "DownloadSession"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ArticlePage_siteKey_slug_key" ON "ArticlePage"("siteKey", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_username_key" ON "AdminUser"("username");
