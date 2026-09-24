-- Complete CMS Schema with RLS
-- Created: 2024-12-25

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR', 'VIEWER');
CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED', 'SCHEDULED');
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'ACTIVE', 'COMPLETED', 'ARCHIVED', 'ON_HOLD');
CREATE TYPE "VideoPlatform" AS ENUM ('YOUTUBE', 'VIMEO', 'TIKTOK', 'FACEBOOK', 'INSTAGRAM', 'CUSTOM');
CREATE TYPE "SettingType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'TEXT');
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'UPLOAD', 'DOWNLOAD');

-- Users table
CREATE TABLE "users" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "avatar" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'EDITOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Sessions table
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "ipAddress" TEXT,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- Categories table
CREATE TABLE "categories" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- Tags table
CREATE TABLE "tags" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- Posts table
CREATE TABLE "posts" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "status" "PostStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorId" TEXT NOT NULL,
    "categoryId" TEXT,
    "thumbnail" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoKeywords" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- Videos table
CREATE TABLE "videos" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "platform" "VideoPlatform" NOT NULL,
    "platformId" TEXT,
    "thumbnail" TEXT,
    "duration" INTEGER,
    "status" "PostStatus" NOT NULL DEFAULT 'PUBLISHED',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorId" TEXT NOT NULL,
    "categoryId" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

-- Technologies table
CREATE TABLE "technologies" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "website" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "technologies_pkey" PRIMARY KEY ("id")
);

-- Projects table
CREATE TABLE "projects" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT,
    "url" TEXT,
    "githubUrl" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorId" TEXT NOT NULL,
    "categoryId" TEXT,
    "thumbnail" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- Media table
CREATE TABLE "media" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "caption" TEXT,
    "folder" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedBy" TEXT NOT NULL,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- Settings table
CREATE TABLE "settings" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" "SettingType" NOT NULL DEFAULT 'STRING',
    "group" TEXT,
    "label" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- Audit logs table
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "action" "AuditAction" NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "oldData" JSONB,
    "newData" JSONB,
    "userId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- Analytics table
CREATE TABLE "analytics" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "path" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'GET',
    "userAgent" TEXT,
    "referer" TEXT,
    "ipAddress" TEXT,
    "country" TEXT,
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_pkey" PRIMARY KEY ("id")
);

-- Junction tables
CREATE TABLE "post_tags" (
    "postId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "post_tags_pkey" PRIMARY KEY ("postId","tagId")
);

CREATE TABLE "video_tags" (
    "videoId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "video_tags_pkey" PRIMARY KEY ("videoId","tagId")
);

CREATE TABLE "project_tags" (
    "projectId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "project_tags_pkey" PRIMARY KEY ("projectId","tagId")
);

CREATE TABLE "project_technologies" (
    "projectId" TEXT NOT NULL,
    "technologyId" TEXT NOT NULL,

    CONSTRAINT "project_technologies_pkey" PRIMARY KEY ("projectId","technologyId")
);

CREATE TABLE "post_media" (
    "postId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "post_media_pkey" PRIMARY KEY ("postId","mediaId")
);

CREATE TABLE "project_media" (
    "projectId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "project_media_pkey" PRIMARY KEY ("projectId","mediaId")
);

-- Create unique indexes
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");
CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");
CREATE UNIQUE INDEX "posts_slug_key" ON "posts"("slug");
CREATE UNIQUE INDEX "technologies_name_key" ON "technologies"("name");
CREATE UNIQUE INDEX "technologies_slug_key" ON "technologies"("slug");
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

-- Add foreign key constraints
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "posts" ADD CONSTRAINT "posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "posts" ADD CONSTRAINT "posts_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "videos" ADD CONSTRAINT "videos_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "videos" ADD CONSTRAINT "videos_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "projects" ADD CONSTRAINT "projects_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "projects" ADD CONSTRAINT "projects_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "media" ADD CONSTRAINT "media_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "post_tags" ADD CONSTRAINT "post_tags_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "post_tags" ADD CONSTRAINT "post_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "video_tags" ADD CONSTRAINT "video_tags_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "video_tags" ADD CONSTRAINT "video_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_tags" ADD CONSTRAINT "project_tags_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_tags" ADD CONSTRAINT "project_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_technologies" ADD CONSTRAINT "project_technologies_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_technologies" ADD CONSTRAINT "project_technologies_technologyId_fkey" FOREIGN KEY ("technologyId") REFERENCES "technologies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "post_media" ADD CONSTRAINT "post_media_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "post_media" ADD CONSTRAINT "post_media_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_media" ADD CONSTRAINT "project_media_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_media" ADD CONSTRAINT "project_media_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create function to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updatedAt
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "users" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON "categories" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON "tags" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON "posts" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON "videos" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_technologies_updated_at BEFORE UPDATE ON "technologies" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON "projects" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_media_updated_at BEFORE UPDATE ON "media" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON "settings" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "videos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "technologies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "media" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "analytics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "post_tags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "video_tags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "project_tags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "project_technologies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "post_media" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "project_media" ENABLE ROW LEVEL SECURITY;

-- Create function to get current user role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS "UserRole" AS $$
DECLARE
    user_role "UserRole";
BEGIN
    -- For service role, return SUPER_ADMIN
    IF current_setting('role') = 'service_role' THEN
        RETURN 'SUPER_ADMIN';
    END IF;
    
    -- Get user role from JWT claims or session
    SELECT role INTO user_role
    FROM "users"
    WHERE id = auth.uid()::text
    AND "isActive" = true;
    
    RETURN COALESCE(user_role, 'VIEWER');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is authenticated
CREATE OR REPLACE FUNCTION is_authenticated()
RETURNS boolean AS $$
BEGIN
    RETURN auth.uid() IS NOT NULL OR current_setting('role') = 'service_role';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user owns resource
CREATE OR REPLACE FUNCTION is_owner(resource_user_id text)
RETURNS boolean AS $$
BEGIN
    RETURN auth.uid()::text = resource_user_id OR current_setting('role') = 'service_role';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check user permissions
CREATE OR REPLACE FUNCTION has_permission(required_role "UserRole")
RETURNS boolean AS $$
DECLARE
    user_role "UserRole";
BEGIN
    -- Service role has all permissions
    IF current_setting('role') = 'service_role' THEN
        RETURN true;
    END IF;
    
    user_role := get_current_user_role();
    
    -- Super admin can do everything
    IF user_role = 'SUPER_ADMIN' THEN
        RETURN true;
    END IF;
    
    -- Check role hierarchy
    CASE required_role
        WHEN 'VIEWER' THEN
            RETURN user_role IN ('VIEWER', 'AUTHOR', 'EDITOR', 'ADMIN', 'SUPER_ADMIN');
        WHEN 'AUTHOR' THEN
            RETURN user_role IN ('AUTHOR', 'EDITOR', 'ADMIN', 'SUPER_ADMIN');
        WHEN 'EDITOR' THEN
            RETURN user_role IN ('EDITOR', 'ADMIN', 'SUPER_ADMIN');
        WHEN 'ADMIN' THEN
            RETURN user_role IN ('ADMIN', 'SUPER_ADMIN');
        WHEN 'SUPER_ADMIN' THEN
            RETURN user_role = 'SUPER_ADMIN';
        ELSE
            RETURN false;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== RLS POLICIES =====

-- Users table policies
CREATE POLICY "users_select_policy" ON "users"
    FOR SELECT USING (
        current_setting('role') = 'service_role' OR
        is_owner(id) OR 
        has_permission('ADMIN')
    );

CREATE POLICY "users_insert_policy" ON "users"
    FOR INSERT WITH CHECK (
        current_setting('role') = 'service_role' OR
        has_permission('SUPER_ADMIN')
    );

CREATE POLICY "users_update_policy" ON "users"
    FOR UPDATE USING (
        current_setting('role') = 'service_role' OR
        is_owner(id) OR 
        has_permission('ADMIN')
    ) WITH CHECK (
        current_setting('role') = 'service_role' OR
        is_owner(id) OR 
        has_permission('ADMIN')
    );

CREATE POLICY "users_delete_policy" ON "users"
    FOR DELETE USING (
        current_setting('role') = 'service_role' OR
        has_permission('SUPER_ADMIN')
    );

-- Sessions table policies
CREATE POLICY "sessions_select_policy" ON "sessions"
    FOR SELECT USING (
        current_setting('role') = 'service_role' OR
        is_owner("userId") OR 
        has_permission('ADMIN')
    );

CREATE POLICY "sessions_insert_policy" ON "sessions"
    FOR INSERT WITH CHECK (
        current_setting('role') = 'service_role' OR
        is_owner("userId")
    );

CREATE POLICY "sessions_delete_policy" ON "sessions"
    FOR DELETE USING (
        current_setting('role') = 'service_role' OR
        is_owner("userId") OR 
        has_permission('ADMIN')
    );

-- Categories table policies
CREATE POLICY "categories_select_policy" ON "categories"
    FOR SELECT USING (true);

CREATE POLICY "categories_insert_policy" ON "categories"
    FOR INSERT WITH CHECK (
        current_setting('role') = 'service_role' OR
        has_permission('EDITOR')
    );

CREATE POLICY "categories_update_policy" ON "categories"
    FOR UPDATE USING (
        current_setting('role') = 'service_role' OR
        has_permission('EDITOR')
    ) WITH CHECK (
        current_setting('role') = 'service_role' OR
        has_permission('EDITOR')
    );

CREATE POLICY "categories_delete_policy" ON "categories"
    FOR DELETE USING (
        current_setting('role') = 'service_role' OR
        has_permission('EDITOR')
    );

-- Tags table policies
CREATE POLICY "tags_select_policy" ON "tags"
    FOR SELECT USING (true);

CREATE POLICY "tags_insert_policy" ON "tags"
    FOR INSERT WITH CHECK (
        current_setting('role') = 'service_role' OR
        has_permission('AUTHOR')
    );

CREATE POLICY "tags_update_policy" ON "tags"
    FOR UPDATE USING (
        current_setting('role') = 'service_role' OR
        has_permission('EDITOR')
    ) WITH CHECK (
        current_setting('role') = 'service_role' OR
        has_permission('EDITOR')
    );

CREATE POLICY "tags_delete_policy" ON "tags"
    FOR DELETE USING (
        current_setting('role') = 'service_role' OR
        has_permission('EDITOR')
    );

-- Posts table policies
CREATE POLICY "posts_select_policy" ON "posts"
    FOR SELECT USING (
        current_setting('role') = 'service_role' OR
        status = 'PUBLISHED' OR 
        is_owner("authorId") OR 
        has_permission('EDITOR')
    );

CREATE POLICY "posts_insert_policy" ON "posts"
    FOR INSERT WITH CHECK (
        current_setting('role') = 'service_role' OR
        (has_permission('AUTHOR') AND is_owner("authorId"))
    );

CREATE POLICY "posts_update_policy" ON "posts"
    FOR UPDATE USING (
        current_setting('role') = 'service_role' OR
        is_owner("authorId") OR 
        has_permission('EDITOR')
    ) WITH CHECK (
        current_setting('role') = 'service_role' OR
        is_owner("authorId") OR 
        has_permission('EDITOR')
    );

CREATE POLICY "posts_delete_policy" ON "posts"
    FOR DELETE USING (
        current_setting('role') = 'service_role' OR
        is_owner("authorId") OR 
        has_permission('EDITOR')
    );

-- Videos table policies
CREATE POLICY "videos_select_policy" ON "videos"
    FOR SELECT USING (
        current_setting('role') = 'service_role' OR
        status = 'PUBLISHED' OR 
        is_owner("authorId") OR 
        has_permission('EDITOR')
    );

CREATE POLICY "videos_insert_policy" ON "videos"
    FOR INSERT WITH CHECK (
        current_setting('role') = 'service_role' OR
        (has_permission('AUTHOR') AND is_owner("authorId"))
    );

CREATE POLICY "videos_update_policy" ON "videos"
    FOR UPDATE USING (
        current_setting('role') = 'service_role' OR
        is_owner("authorId") OR 
        has_permission('EDITOR')
    ) WITH CHECK (
        current_setting('role') = 'service_role' OR
        is_owner("authorId") OR 
        has_permission('EDITOR')
    );

CREATE POLICY "videos_delete_policy" ON "videos"
    FOR DELETE USING (
        current_setting('role') = 'service_role' OR
        is_owner("authorId") OR 
        has_permission('EDITOR')
    );

-- Projects table policies
CREATE POLICY "projects_select_policy" ON "projects"
    FOR SELECT USING (true);

CREATE POLICY "projects_insert_policy" ON "projects"
    FOR INSERT WITH CHECK (
        current_setting('role') = 'service_role' OR
        (has_permission('AUTHOR') AND is_owner("authorId"))
    );

CREATE POLICY "projects_update_policy" ON "projects"
    FOR UPDATE USING (
        current_setting('role') = 'service_role' OR
        is_owner("authorId") OR 
        has_permission('EDITOR')
    ) WITH CHECK (
        current_setting('role') = 'service_role' OR
        is_owner("authorId") OR 
        has_permission('EDITOR')
    );

CREATE POLICY "projects_delete_policy" ON "projects"
    FOR DELETE USING (
        current_setting('role') = 'service_role' OR
        is_owner("authorId") OR 
        has_permission('EDITOR')
    );

-- Technologies table policies
CREATE POLICY "technologies_select_policy" ON "technologies"
    FOR SELECT USING (true);

CREATE POLICY "technologies_insert_policy" ON "technologies"
    FOR INSERT WITH CHECK (
        current_setting('role') = 'service_role' OR
        has_permission('EDITOR')
    );

CREATE POLICY "technologies_update_policy" ON "technologies"
    FOR UPDATE USING (
        current_setting('role') = 'service_role' OR
        has_permission('EDITOR')
    ) WITH CHECK (
        current_setting('role') = 'service_role' OR
        has_permission('EDITOR')
    );

CREATE POLICY "technologies_delete_policy" ON "technologies"
    FOR DELETE USING (
        current_setting('role') = 'service_role' OR
        has_permission('EDITOR')
    );

-- Media table policies
CREATE POLICY "media_select_policy" ON "media"
    FOR SELECT USING (
        current_setting('role') = 'service_role' OR
        is_owner("uploadedBy") OR 
        has_permission('EDITOR')
    );

CREATE POLICY "media_insert_policy" ON "media"
    FOR INSERT WITH CHECK (
        current_setting('role') = 'service_role' OR
        (has_permission('AUTHOR') AND is_owner("uploadedBy"))
    );

CREATE POLICY "media_update_policy" ON "media"
    FOR UPDATE USING (
        current_setting('role') = 'service_role' OR
        is_owner("uploadedBy") OR 
        has_permission('EDITOR')
    ) WITH CHECK (
        current_setting('role') = 'service_role' OR
        is_owner("uploadedBy") OR 
        has_permission('EDITOR')
    );

CREATE POLICY "media_delete_policy" ON "media"
    FOR DELETE USING (
        current_setting('role') = 'service_role' OR
        is_owner("uploadedBy") OR 
        has_permission('EDITOR')
    );

-- Settings table policies
CREATE POLICY "settings_select_policy" ON "settings"
    FOR SELECT USING (true);

CREATE POLICY "settings_insert_policy" ON "settings"
    FOR INSERT WITH CHECK (
        current_setting('role') = 'service_role' OR
        has_permission('ADMIN')
    );

CREATE POLICY "settings_update_policy" ON "settings"
    FOR UPDATE USING (
        current_setting('role') = 'service_role' OR
        has_permission('ADMIN')
    ) WITH CHECK (
        current_setting('role') = 'service_role' OR
        has_permission('ADMIN')
    );

CREATE POLICY "settings_delete_policy" ON "settings"
    FOR DELETE USING (
        current_setting('role') = 'service_role' OR
        has_permission('ADMIN')
    );

-- Audit logs table policies
CREATE POLICY "audit_logs_select_policy" ON "audit_logs"
    FOR SELECT USING (
        current_setting('role') = 'service_role' OR
        has_permission('ADMIN')
    );

CREATE POLICY "audit_logs_insert_policy" ON "audit_logs"
    FOR INSERT WITH CHECK (true);

-- Analytics table policies
CREATE POLICY "analytics_select_policy" ON "analytics"
    FOR SELECT USING (
        current_setting('role') = 'service_role' OR
        has_permission('ADMIN')
    );

CREATE POLICY "analytics_insert_policy" ON "analytics"
    FOR INSERT WITH CHECK (true);

-- Junction tables policies
CREATE POLICY "post_tags_select_policy" ON "post_tags"
    FOR SELECT USING (true);

CREATE POLICY "post_tags_insert_policy" ON "post_tags"
    FOR INSERT WITH CHECK (
        current_setting('role') = 'service_role' OR
        has_permission('AUTHOR')
    );

CREATE POLICY "post_tags_delete_policy" ON "post_tags"
    FOR DELETE USING (
        current_setting('role') = 'service_role' OR
        has_permission('AUTHOR')
    );

CREATE POLICY "video_tags_select_policy" ON "video_tags"
    FOR SELECT USING (true);

CREATE POLICY "video_tags_insert_policy" ON "video_tags"
    FOR INSERT WITH CHECK (
        current_setting('role') = 'service_role' OR
        has_permission('AUTHOR')
    );

CREATE POLICY "video_tags_delete_policy" ON "video_tags"
    FOR DELETE USING (
        current_setting('role') = 'service_role' OR
        has_permission('AUTHOR')
    );

CREATE POLICY "project_tags_select_policy" ON "project_tags"
    FOR SELECT USING (true);

CREATE POLICY "project_tags_insert_policy" ON "project_tags"
    FOR INSERT WITH CHECK (
        current_setting('role') = 'service_role' OR
        has_permission('AUTHOR')
    );

CREATE POLICY "project_tags_delete_policy" ON "project_tags"
    FOR DELETE USING (
        current_setting('role') = 'service_role' OR
        has_permission('AUTHOR')
    );

CREATE POLICY "project_technologies_select_policy" ON "project_technologies"
    FOR SELECT USING (true);

CREATE POLICY "project_technologies_insert_policy" ON "project_technologies"
    FOR INSERT WITH CHECK (
        current_setting('role') = 'service_role' OR
        has_permission('AUTHOR')
    );

CREATE POLICY "project_technologies_delete_policy" ON "project_technologies"
    FOR DELETE USING (
        current_setting('role') = 'service_role' OR
        has_permission('AUTHOR')
    );

CREATE POLICY "post_media_select_policy" ON "post_media"
    FOR SELECT USING (true);

CREATE POLICY "post_media_insert_policy" ON "post_media"
    FOR INSERT WITH CHECK (
        current_setting('role') = 'service_role' OR
        has_permission('AUTHOR')
    );

CREATE POLICY "post_media_delete_policy" ON "post_media"
    FOR DELETE USING (
        current_setting('role') = 'service_role' OR
        has_permission('AUTHOR')
    );

CREATE POLICY "project_media_select_policy" ON "project_media"
    FOR SELECT USING (true);

CREATE POLICY "project_media_insert_policy" ON "project_media"
    FOR INSERT WITH CHECK (
        current_setting('role') = 'service_role' OR
        has_permission('AUTHOR')
    );

CREATE POLICY "project_media_delete_policy" ON "project_media"
    FOR DELETE USING (
        current_setting('role') = 'service_role' OR
        has_permission('AUTHOR')
    );

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON "users"("email");
CREATE INDEX IF NOT EXISTS idx_users_username ON "users"("username");
CREATE INDEX IF NOT EXISTS idx_users_role ON "users"("role");
CREATE INDEX IF NOT EXISTS idx_sessions_token ON "sessions"("token");
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON "sessions"("expiresAt");
CREATE INDEX IF NOT EXISTS idx_posts_status ON "posts"("status");
CREATE INDEX IF NOT EXISTS idx_posts_author ON "posts"("authorId");
CREATE INDEX IF NOT EXISTS idx_posts_published ON "posts"("publishedAt");
CREATE INDEX IF NOT EXISTS idx_videos_status ON "videos"("status");
CREATE INDEX IF NOT EXISTS idx_videos_author ON "videos"("authorId");
CREATE INDEX IF NOT EXISTS idx_projects_author ON "projects"("authorId");
CREATE INDEX IF NOT EXISTS idx_media_uploader ON "media"("uploadedBy");
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON "audit_logs"("userId");
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON "audit_logs"("createdAt");
CREATE INDEX IF NOT EXISTS idx_analytics_path ON "analytics"("path");
CREATE INDEX IF NOT EXISTS idx_analytics_created ON "analytics"("createdAt");

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;