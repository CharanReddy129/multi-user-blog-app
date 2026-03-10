/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  pgm.sql(`
    -- CreateEnum
    CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

    -- CreateTable
    CREATE TABLE "User" (
        "id" SERIAL NOT NULL,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "passwordHash" TEXT NOT NULL,
        "role" "Role" NOT NULL DEFAULT 'USER',
        "avatar" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "User_pkey" PRIMARY KEY ("id")
    );

    -- CreateTable
    CREATE TABLE "Post" (
        "id" SERIAL NOT NULL,
        "title" TEXT NOT NULL,
        "slug" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "coverImage" TEXT,
        "published" BOOLEAN NOT NULL DEFAULT false,
        "authorId" INTEGER NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
    );

    -- CreateTable
    CREATE TABLE "Comment" (
        "id" SERIAL NOT NULL,
        "content" TEXT NOT NULL,
        "authorId" INTEGER NOT NULL,
        "postId" INTEGER NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
    );

    -- CreateIndex
    CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

    -- CreateIndex
    CREATE UNIQUE INDEX "Post_slug_key" ON "Post"("slug");

    -- AddForeignKey
    ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

    -- AddForeignKey
    ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

    -- AddForeignKey
    ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE "Comment";
    DROP TABLE "Post";
    DROP TABLE "User";
    DROP TYPE "Role";
  `);
};
