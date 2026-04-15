import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_posts_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__posts_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_projects_stage" AS ENUM('In Progress', 'Planned', 'Concept', 'Stable', 'Archived');
  CREATE TYPE "public"."enum_projects_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__projects_v_version_stage" AS ENUM('In Progress', 'Planned', 'Concept', 'Stable', 'Archived');
  CREATE TYPE "public"."enum__projects_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_docs_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__docs_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_notes_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__notes_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_site_profile_social_links_icon" AS ENUM('github', 'mail', 'rss');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "posts_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag" varchar
  );
  
  CREATE TABLE "posts_sections_paragraphs" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "posts_sections_bullets" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "posts_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar
  );
  
  CREATE TABLE "posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"summary" varchar,
  	"category" varchar,
  	"orbit" varchar,
  	"published_at" timestamp(3) with time zone,
  	"read_time" varchar,
  	"featured" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_posts_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_posts_v_version_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"tag" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_posts_v_version_sections_paragraphs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_posts_v_version_sections_bullets" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_posts_v_version_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"title" varchar
  );
  
  CREATE TABLE "_posts_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_summary" varchar,
  	"version_category" varchar,
  	"version_orbit" varchar,
  	"version_published_at" timestamp(3) with time zone,
  	"version_read_time" varchar,
  	"version_featured" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__posts_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "projects_stack" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar
  );
  
  CREATE TABLE "projects_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag" varchar
  );
  
  CREATE TABLE "projects_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar
  );
  
  CREATE TABLE "projects_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "projects_sections_paragraphs" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "projects_sections_bullets" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "projects_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar
  );
  
  CREATE TABLE "projects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"summary" varchar,
  	"stage" "enum_projects_stage",
  	"orbit" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"featured" boolean DEFAULT false,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_projects_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_projects_v_version_stack" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"item" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_projects_v_version_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"tag" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_projects_v_version_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_projects_v_version_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_projects_v_version_sections_paragraphs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_projects_v_version_sections_bullets" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_projects_v_version_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"title" varchar
  );
  
  CREATE TABLE "_projects_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_summary" varchar,
  	"version_stage" "enum__projects_v_version_stage",
  	"version_orbit" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_featured" boolean DEFAULT false,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__projects_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "docs_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag" varchar
  );
  
  CREATE TABLE "docs_sections_paragraphs" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "docs_sections_bullets" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "docs_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar
  );
  
  CREATE TABLE "docs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"summary" varchar,
  	"version" varchar,
  	"orbit" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_docs_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_docs_v_version_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"tag" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_docs_v_version_sections_paragraphs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_docs_v_version_sections_bullets" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_docs_v_version_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"title" varchar
  );
  
  CREATE TABLE "_docs_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_summary" varchar,
  	"version_version" varchar,
  	"version_orbit" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__docs_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "notes_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag" varchar
  );
  
  CREATE TABLE "notes_sections_paragraphs" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "notes_sections_bullets" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "notes_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar
  );
  
  CREATE TABLE "notes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"summary" varchar,
  	"published_at" timestamp(3) with time zone,
  	"mood" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_notes_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_notes_v_version_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"tag" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_notes_v_version_sections_paragraphs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_notes_v_version_sections_bullets" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_notes_v_version_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"title" varchar
  );
  
  CREATE TABLE "_notes_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_summary" varchar,
  	"version_published_at" timestamp(3) with time zone,
  	"version_mood" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__notes_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "lab_experiments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"summary" varchar NOT NULL,
  	"status" varchar NOT NULL,
  	"href" varchar NOT NULL,
  	"tag" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"posts_id" integer,
  	"projects_id" integer,
  	"docs_id" integer,
  	"notes_id" integer,
  	"lab_experiments_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_profile_social_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL,
  	"icon" "enum_site_profile_social_links_icon" NOT NULL
  );
  
  CREATE TABLE "site_profile_pinned_repos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"owner" varchar NOT NULL,
  	"repo" varchar NOT NULL
  );
  
  CREATE TABLE "site_profile_tech_stack_frontend" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar NOT NULL
  );
  
  CREATE TABLE "site_profile_tech_stack_backend" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar NOT NULL
  );
  
  CREATE TABLE "site_profile_tech_stack_devops" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar NOT NULL
  );
  
  CREATE TABLE "site_profile_tech_stack_tools" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar NOT NULL
  );
  
  CREATE TABLE "site_profile_timeline" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"date" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"summary" varchar NOT NULL
  );
  
  CREATE TABLE "site_profile" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" varchar NOT NULL,
  	"avatar" varchar,
  	"summary" varchar NOT NULL,
  	"site_meta_title" varchar,
  	"site_meta_description" varchar,
  	"site_meta_location" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_tags" ADD CONSTRAINT "posts_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_sections_paragraphs" ADD CONSTRAINT "posts_sections_paragraphs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_sections_bullets" ADD CONSTRAINT "posts_sections_bullets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_sections" ADD CONSTRAINT "posts_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_version_tags" ADD CONSTRAINT "_posts_v_version_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_version_sections_paragraphs" ADD CONSTRAINT "_posts_v_version_sections_paragraphs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_posts_v_version_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_version_sections_bullets" ADD CONSTRAINT "_posts_v_version_sections_bullets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_posts_v_version_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_version_sections" ADD CONSTRAINT "_posts_v_version_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_parent_id_posts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_stack" ADD CONSTRAINT "projects_stack_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_tags" ADD CONSTRAINT "projects_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_links" ADD CONSTRAINT "projects_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_highlights" ADD CONSTRAINT "projects_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_sections_paragraphs" ADD CONSTRAINT "projects_sections_paragraphs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_sections_bullets" ADD CONSTRAINT "projects_sections_bullets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_sections" ADD CONSTRAINT "projects_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_stack" ADD CONSTRAINT "_projects_v_version_stack_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_tags" ADD CONSTRAINT "_projects_v_version_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_links" ADD CONSTRAINT "_projects_v_version_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_highlights" ADD CONSTRAINT "_projects_v_version_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_sections_paragraphs" ADD CONSTRAINT "_projects_v_version_sections_paragraphs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v_version_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_sections_bullets" ADD CONSTRAINT "_projects_v_version_sections_bullets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v_version_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_sections" ADD CONSTRAINT "_projects_v_version_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_parent_id_projects_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "docs_tags" ADD CONSTRAINT "docs_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "docs_sections_paragraphs" ADD CONSTRAINT "docs_sections_paragraphs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."docs_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "docs_sections_bullets" ADD CONSTRAINT "docs_sections_bullets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."docs_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "docs_sections" ADD CONSTRAINT "docs_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_docs_v_version_tags" ADD CONSTRAINT "_docs_v_version_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_docs_v_version_sections_paragraphs" ADD CONSTRAINT "_docs_v_version_sections_paragraphs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_docs_v_version_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_docs_v_version_sections_bullets" ADD CONSTRAINT "_docs_v_version_sections_bullets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_docs_v_version_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_docs_v_version_sections" ADD CONSTRAINT "_docs_v_version_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_docs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_docs_v" ADD CONSTRAINT "_docs_v_parent_id_docs_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."docs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "notes_tags" ADD CONSTRAINT "notes_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "notes_sections_paragraphs" ADD CONSTRAINT "notes_sections_paragraphs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."notes_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "notes_sections_bullets" ADD CONSTRAINT "notes_sections_bullets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."notes_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "notes_sections" ADD CONSTRAINT "notes_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_notes_v_version_tags" ADD CONSTRAINT "_notes_v_version_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_notes_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_notes_v_version_sections_paragraphs" ADD CONSTRAINT "_notes_v_version_sections_paragraphs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_notes_v_version_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_notes_v_version_sections_bullets" ADD CONSTRAINT "_notes_v_version_sections_bullets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_notes_v_version_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_notes_v_version_sections" ADD CONSTRAINT "_notes_v_version_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_notes_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_notes_v" ADD CONSTRAINT "_notes_v_parent_id_notes_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."notes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_docs_fk" FOREIGN KEY ("docs_id") REFERENCES "public"."docs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_notes_fk" FOREIGN KEY ("notes_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_lab_experiments_fk" FOREIGN KEY ("lab_experiments_id") REFERENCES "public"."lab_experiments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_profile_social_links" ADD CONSTRAINT "site_profile_social_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_profile"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_profile_pinned_repos" ADD CONSTRAINT "site_profile_pinned_repos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_profile"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_profile_tech_stack_frontend" ADD CONSTRAINT "site_profile_tech_stack_frontend_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_profile"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_profile_tech_stack_backend" ADD CONSTRAINT "site_profile_tech_stack_backend_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_profile"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_profile_tech_stack_devops" ADD CONSTRAINT "site_profile_tech_stack_devops_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_profile"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_profile_tech_stack_tools" ADD CONSTRAINT "site_profile_tech_stack_tools_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_profile"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_profile_timeline" ADD CONSTRAINT "site_profile_timeline_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_profile"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "posts_tags_order_idx" ON "posts_tags" USING btree ("_order");
  CREATE INDEX "posts_tags_parent_id_idx" ON "posts_tags" USING btree ("_parent_id");
  CREATE INDEX "posts_sections_paragraphs_order_idx" ON "posts_sections_paragraphs" USING btree ("_order");
  CREATE INDEX "posts_sections_paragraphs_parent_id_idx" ON "posts_sections_paragraphs" USING btree ("_parent_id");
  CREATE INDEX "posts_sections_bullets_order_idx" ON "posts_sections_bullets" USING btree ("_order");
  CREATE INDEX "posts_sections_bullets_parent_id_idx" ON "posts_sections_bullets" USING btree ("_parent_id");
  CREATE INDEX "posts_sections_order_idx" ON "posts_sections" USING btree ("_order");
  CREATE INDEX "posts_sections_parent_id_idx" ON "posts_sections" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "posts_slug_idx" ON "posts" USING btree ("slug");
  CREATE INDEX "posts_updated_at_idx" ON "posts" USING btree ("updated_at");
  CREATE INDEX "posts_created_at_idx" ON "posts" USING btree ("created_at");
  CREATE INDEX "posts__status_idx" ON "posts" USING btree ("_status");
  CREATE INDEX "_posts_v_version_tags_order_idx" ON "_posts_v_version_tags" USING btree ("_order");
  CREATE INDEX "_posts_v_version_tags_parent_id_idx" ON "_posts_v_version_tags" USING btree ("_parent_id");
  CREATE INDEX "_posts_v_version_sections_paragraphs_order_idx" ON "_posts_v_version_sections_paragraphs" USING btree ("_order");
  CREATE INDEX "_posts_v_version_sections_paragraphs_parent_id_idx" ON "_posts_v_version_sections_paragraphs" USING btree ("_parent_id");
  CREATE INDEX "_posts_v_version_sections_bullets_order_idx" ON "_posts_v_version_sections_bullets" USING btree ("_order");
  CREATE INDEX "_posts_v_version_sections_bullets_parent_id_idx" ON "_posts_v_version_sections_bullets" USING btree ("_parent_id");
  CREATE INDEX "_posts_v_version_sections_order_idx" ON "_posts_v_version_sections" USING btree ("_order");
  CREATE INDEX "_posts_v_version_sections_parent_id_idx" ON "_posts_v_version_sections" USING btree ("_parent_id");
  CREATE INDEX "_posts_v_parent_idx" ON "_posts_v" USING btree ("parent_id");
  CREATE INDEX "_posts_v_version_version_slug_idx" ON "_posts_v" USING btree ("version_slug");
  CREATE INDEX "_posts_v_version_version_updated_at_idx" ON "_posts_v" USING btree ("version_updated_at");
  CREATE INDEX "_posts_v_version_version_created_at_idx" ON "_posts_v" USING btree ("version_created_at");
  CREATE INDEX "_posts_v_version_version__status_idx" ON "_posts_v" USING btree ("version__status");
  CREATE INDEX "_posts_v_created_at_idx" ON "_posts_v" USING btree ("created_at");
  CREATE INDEX "_posts_v_updated_at_idx" ON "_posts_v" USING btree ("updated_at");
  CREATE INDEX "_posts_v_latest_idx" ON "_posts_v" USING btree ("latest");
  CREATE INDEX "projects_stack_order_idx" ON "projects_stack" USING btree ("_order");
  CREATE INDEX "projects_stack_parent_id_idx" ON "projects_stack" USING btree ("_parent_id");
  CREATE INDEX "projects_tags_order_idx" ON "projects_tags" USING btree ("_order");
  CREATE INDEX "projects_tags_parent_id_idx" ON "projects_tags" USING btree ("_parent_id");
  CREATE INDEX "projects_links_order_idx" ON "projects_links" USING btree ("_order");
  CREATE INDEX "projects_links_parent_id_idx" ON "projects_links" USING btree ("_parent_id");
  CREATE INDEX "projects_highlights_order_idx" ON "projects_highlights" USING btree ("_order");
  CREATE INDEX "projects_highlights_parent_id_idx" ON "projects_highlights" USING btree ("_parent_id");
  CREATE INDEX "projects_sections_paragraphs_order_idx" ON "projects_sections_paragraphs" USING btree ("_order");
  CREATE INDEX "projects_sections_paragraphs_parent_id_idx" ON "projects_sections_paragraphs" USING btree ("_parent_id");
  CREATE INDEX "projects_sections_bullets_order_idx" ON "projects_sections_bullets" USING btree ("_order");
  CREATE INDEX "projects_sections_bullets_parent_id_idx" ON "projects_sections_bullets" USING btree ("_parent_id");
  CREATE INDEX "projects_sections_order_idx" ON "projects_sections" USING btree ("_order");
  CREATE INDEX "projects_sections_parent_id_idx" ON "projects_sections" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "projects_slug_idx" ON "projects" USING btree ("slug");
  CREATE INDEX "projects_created_at_idx" ON "projects" USING btree ("created_at");
  CREATE INDEX "projects__status_idx" ON "projects" USING btree ("_status");
  CREATE INDEX "_projects_v_version_stack_order_idx" ON "_projects_v_version_stack" USING btree ("_order");
  CREATE INDEX "_projects_v_version_stack_parent_id_idx" ON "_projects_v_version_stack" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_version_tags_order_idx" ON "_projects_v_version_tags" USING btree ("_order");
  CREATE INDEX "_projects_v_version_tags_parent_id_idx" ON "_projects_v_version_tags" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_version_links_order_idx" ON "_projects_v_version_links" USING btree ("_order");
  CREATE INDEX "_projects_v_version_links_parent_id_idx" ON "_projects_v_version_links" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_version_highlights_order_idx" ON "_projects_v_version_highlights" USING btree ("_order");
  CREATE INDEX "_projects_v_version_highlights_parent_id_idx" ON "_projects_v_version_highlights" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_version_sections_paragraphs_order_idx" ON "_projects_v_version_sections_paragraphs" USING btree ("_order");
  CREATE INDEX "_projects_v_version_sections_paragraphs_parent_id_idx" ON "_projects_v_version_sections_paragraphs" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_version_sections_bullets_order_idx" ON "_projects_v_version_sections_bullets" USING btree ("_order");
  CREATE INDEX "_projects_v_version_sections_bullets_parent_id_idx" ON "_projects_v_version_sections_bullets" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_version_sections_order_idx" ON "_projects_v_version_sections" USING btree ("_order");
  CREATE INDEX "_projects_v_version_sections_parent_id_idx" ON "_projects_v_version_sections" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_parent_idx" ON "_projects_v" USING btree ("parent_id");
  CREATE INDEX "_projects_v_version_version_slug_idx" ON "_projects_v" USING btree ("version_slug");
  CREATE INDEX "_projects_v_version_version_created_at_idx" ON "_projects_v" USING btree ("version_created_at");
  CREATE INDEX "_projects_v_version_version__status_idx" ON "_projects_v" USING btree ("version__status");
  CREATE INDEX "_projects_v_created_at_idx" ON "_projects_v" USING btree ("created_at");
  CREATE INDEX "_projects_v_updated_at_idx" ON "_projects_v" USING btree ("updated_at");
  CREATE INDEX "_projects_v_latest_idx" ON "_projects_v" USING btree ("latest");
  CREATE INDEX "docs_tags_order_idx" ON "docs_tags" USING btree ("_order");
  CREATE INDEX "docs_tags_parent_id_idx" ON "docs_tags" USING btree ("_parent_id");
  CREATE INDEX "docs_sections_paragraphs_order_idx" ON "docs_sections_paragraphs" USING btree ("_order");
  CREATE INDEX "docs_sections_paragraphs_parent_id_idx" ON "docs_sections_paragraphs" USING btree ("_parent_id");
  CREATE INDEX "docs_sections_bullets_order_idx" ON "docs_sections_bullets" USING btree ("_order");
  CREATE INDEX "docs_sections_bullets_parent_id_idx" ON "docs_sections_bullets" USING btree ("_parent_id");
  CREATE INDEX "docs_sections_order_idx" ON "docs_sections" USING btree ("_order");
  CREATE INDEX "docs_sections_parent_id_idx" ON "docs_sections" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "docs_slug_idx" ON "docs" USING btree ("slug");
  CREATE INDEX "docs_created_at_idx" ON "docs" USING btree ("created_at");
  CREATE INDEX "docs__status_idx" ON "docs" USING btree ("_status");
  CREATE INDEX "_docs_v_version_tags_order_idx" ON "_docs_v_version_tags" USING btree ("_order");
  CREATE INDEX "_docs_v_version_tags_parent_id_idx" ON "_docs_v_version_tags" USING btree ("_parent_id");
  CREATE INDEX "_docs_v_version_sections_paragraphs_order_idx" ON "_docs_v_version_sections_paragraphs" USING btree ("_order");
  CREATE INDEX "_docs_v_version_sections_paragraphs_parent_id_idx" ON "_docs_v_version_sections_paragraphs" USING btree ("_parent_id");
  CREATE INDEX "_docs_v_version_sections_bullets_order_idx" ON "_docs_v_version_sections_bullets" USING btree ("_order");
  CREATE INDEX "_docs_v_version_sections_bullets_parent_id_idx" ON "_docs_v_version_sections_bullets" USING btree ("_parent_id");
  CREATE INDEX "_docs_v_version_sections_order_idx" ON "_docs_v_version_sections" USING btree ("_order");
  CREATE INDEX "_docs_v_version_sections_parent_id_idx" ON "_docs_v_version_sections" USING btree ("_parent_id");
  CREATE INDEX "_docs_v_parent_idx" ON "_docs_v" USING btree ("parent_id");
  CREATE INDEX "_docs_v_version_version_slug_idx" ON "_docs_v" USING btree ("version_slug");
  CREATE INDEX "_docs_v_version_version_created_at_idx" ON "_docs_v" USING btree ("version_created_at");
  CREATE INDEX "_docs_v_version_version__status_idx" ON "_docs_v" USING btree ("version__status");
  CREATE INDEX "_docs_v_created_at_idx" ON "_docs_v" USING btree ("created_at");
  CREATE INDEX "_docs_v_updated_at_idx" ON "_docs_v" USING btree ("updated_at");
  CREATE INDEX "_docs_v_latest_idx" ON "_docs_v" USING btree ("latest");
  CREATE INDEX "notes_tags_order_idx" ON "notes_tags" USING btree ("_order");
  CREATE INDEX "notes_tags_parent_id_idx" ON "notes_tags" USING btree ("_parent_id");
  CREATE INDEX "notes_sections_paragraphs_order_idx" ON "notes_sections_paragraphs" USING btree ("_order");
  CREATE INDEX "notes_sections_paragraphs_parent_id_idx" ON "notes_sections_paragraphs" USING btree ("_parent_id");
  CREATE INDEX "notes_sections_bullets_order_idx" ON "notes_sections_bullets" USING btree ("_order");
  CREATE INDEX "notes_sections_bullets_parent_id_idx" ON "notes_sections_bullets" USING btree ("_parent_id");
  CREATE INDEX "notes_sections_order_idx" ON "notes_sections" USING btree ("_order");
  CREATE INDEX "notes_sections_parent_id_idx" ON "notes_sections" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "notes_slug_idx" ON "notes" USING btree ("slug");
  CREATE INDEX "notes_updated_at_idx" ON "notes" USING btree ("updated_at");
  CREATE INDEX "notes_created_at_idx" ON "notes" USING btree ("created_at");
  CREATE INDEX "notes__status_idx" ON "notes" USING btree ("_status");
  CREATE INDEX "_notes_v_version_tags_order_idx" ON "_notes_v_version_tags" USING btree ("_order");
  CREATE INDEX "_notes_v_version_tags_parent_id_idx" ON "_notes_v_version_tags" USING btree ("_parent_id");
  CREATE INDEX "_notes_v_version_sections_paragraphs_order_idx" ON "_notes_v_version_sections_paragraphs" USING btree ("_order");
  CREATE INDEX "_notes_v_version_sections_paragraphs_parent_id_idx" ON "_notes_v_version_sections_paragraphs" USING btree ("_parent_id");
  CREATE INDEX "_notes_v_version_sections_bullets_order_idx" ON "_notes_v_version_sections_bullets" USING btree ("_order");
  CREATE INDEX "_notes_v_version_sections_bullets_parent_id_idx" ON "_notes_v_version_sections_bullets" USING btree ("_parent_id");
  CREATE INDEX "_notes_v_version_sections_order_idx" ON "_notes_v_version_sections" USING btree ("_order");
  CREATE INDEX "_notes_v_version_sections_parent_id_idx" ON "_notes_v_version_sections" USING btree ("_parent_id");
  CREATE INDEX "_notes_v_parent_idx" ON "_notes_v" USING btree ("parent_id");
  CREATE INDEX "_notes_v_version_version_slug_idx" ON "_notes_v" USING btree ("version_slug");
  CREATE INDEX "_notes_v_version_version_updated_at_idx" ON "_notes_v" USING btree ("version_updated_at");
  CREATE INDEX "_notes_v_version_version_created_at_idx" ON "_notes_v" USING btree ("version_created_at");
  CREATE INDEX "_notes_v_version_version__status_idx" ON "_notes_v" USING btree ("version__status");
  CREATE INDEX "_notes_v_created_at_idx" ON "_notes_v" USING btree ("created_at");
  CREATE INDEX "_notes_v_updated_at_idx" ON "_notes_v" USING btree ("updated_at");
  CREATE INDEX "_notes_v_latest_idx" ON "_notes_v" USING btree ("latest");
  CREATE INDEX "lab_experiments_updated_at_idx" ON "lab_experiments" USING btree ("updated_at");
  CREATE INDEX "lab_experiments_created_at_idx" ON "lab_experiments" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("posts_id");
  CREATE INDEX "payload_locked_documents_rels_projects_id_idx" ON "payload_locked_documents_rels" USING btree ("projects_id");
  CREATE INDEX "payload_locked_documents_rels_docs_id_idx" ON "payload_locked_documents_rels" USING btree ("docs_id");
  CREATE INDEX "payload_locked_documents_rels_notes_id_idx" ON "payload_locked_documents_rels" USING btree ("notes_id");
  CREATE INDEX "payload_locked_documents_rels_lab_experiments_id_idx" ON "payload_locked_documents_rels" USING btree ("lab_experiments_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "site_profile_social_links_order_idx" ON "site_profile_social_links" USING btree ("_order");
  CREATE INDEX "site_profile_social_links_parent_id_idx" ON "site_profile_social_links" USING btree ("_parent_id");
  CREATE INDEX "site_profile_pinned_repos_order_idx" ON "site_profile_pinned_repos" USING btree ("_order");
  CREATE INDEX "site_profile_pinned_repos_parent_id_idx" ON "site_profile_pinned_repos" USING btree ("_parent_id");
  CREATE INDEX "site_profile_tech_stack_frontend_order_idx" ON "site_profile_tech_stack_frontend" USING btree ("_order");
  CREATE INDEX "site_profile_tech_stack_frontend_parent_id_idx" ON "site_profile_tech_stack_frontend" USING btree ("_parent_id");
  CREATE INDEX "site_profile_tech_stack_backend_order_idx" ON "site_profile_tech_stack_backend" USING btree ("_order");
  CREATE INDEX "site_profile_tech_stack_backend_parent_id_idx" ON "site_profile_tech_stack_backend" USING btree ("_parent_id");
  CREATE INDEX "site_profile_tech_stack_devops_order_idx" ON "site_profile_tech_stack_devops" USING btree ("_order");
  CREATE INDEX "site_profile_tech_stack_devops_parent_id_idx" ON "site_profile_tech_stack_devops" USING btree ("_parent_id");
  CREATE INDEX "site_profile_tech_stack_tools_order_idx" ON "site_profile_tech_stack_tools" USING btree ("_order");
  CREATE INDEX "site_profile_tech_stack_tools_parent_id_idx" ON "site_profile_tech_stack_tools" USING btree ("_parent_id");
  CREATE INDEX "site_profile_timeline_order_idx" ON "site_profile_timeline" USING btree ("_order");
  CREATE INDEX "site_profile_timeline_parent_id_idx" ON "site_profile_timeline" USING btree ("_parent_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "posts_tags" CASCADE;
  DROP TABLE "posts_sections_paragraphs" CASCADE;
  DROP TABLE "posts_sections_bullets" CASCADE;
  DROP TABLE "posts_sections" CASCADE;
  DROP TABLE "posts" CASCADE;
  DROP TABLE "_posts_v_version_tags" CASCADE;
  DROP TABLE "_posts_v_version_sections_paragraphs" CASCADE;
  DROP TABLE "_posts_v_version_sections_bullets" CASCADE;
  DROP TABLE "_posts_v_version_sections" CASCADE;
  DROP TABLE "_posts_v" CASCADE;
  DROP TABLE "projects_stack" CASCADE;
  DROP TABLE "projects_tags" CASCADE;
  DROP TABLE "projects_links" CASCADE;
  DROP TABLE "projects_highlights" CASCADE;
  DROP TABLE "projects_sections_paragraphs" CASCADE;
  DROP TABLE "projects_sections_bullets" CASCADE;
  DROP TABLE "projects_sections" CASCADE;
  DROP TABLE "projects" CASCADE;
  DROP TABLE "_projects_v_version_stack" CASCADE;
  DROP TABLE "_projects_v_version_tags" CASCADE;
  DROP TABLE "_projects_v_version_links" CASCADE;
  DROP TABLE "_projects_v_version_highlights" CASCADE;
  DROP TABLE "_projects_v_version_sections_paragraphs" CASCADE;
  DROP TABLE "_projects_v_version_sections_bullets" CASCADE;
  DROP TABLE "_projects_v_version_sections" CASCADE;
  DROP TABLE "_projects_v" CASCADE;
  DROP TABLE "docs_tags" CASCADE;
  DROP TABLE "docs_sections_paragraphs" CASCADE;
  DROP TABLE "docs_sections_bullets" CASCADE;
  DROP TABLE "docs_sections" CASCADE;
  DROP TABLE "docs" CASCADE;
  DROP TABLE "_docs_v_version_tags" CASCADE;
  DROP TABLE "_docs_v_version_sections_paragraphs" CASCADE;
  DROP TABLE "_docs_v_version_sections_bullets" CASCADE;
  DROP TABLE "_docs_v_version_sections" CASCADE;
  DROP TABLE "_docs_v" CASCADE;
  DROP TABLE "notes_tags" CASCADE;
  DROP TABLE "notes_sections_paragraphs" CASCADE;
  DROP TABLE "notes_sections_bullets" CASCADE;
  DROP TABLE "notes_sections" CASCADE;
  DROP TABLE "notes" CASCADE;
  DROP TABLE "_notes_v_version_tags" CASCADE;
  DROP TABLE "_notes_v_version_sections_paragraphs" CASCADE;
  DROP TABLE "_notes_v_version_sections_bullets" CASCADE;
  DROP TABLE "_notes_v_version_sections" CASCADE;
  DROP TABLE "_notes_v" CASCADE;
  DROP TABLE "lab_experiments" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "site_profile_social_links" CASCADE;
  DROP TABLE "site_profile_pinned_repos" CASCADE;
  DROP TABLE "site_profile_tech_stack_frontend" CASCADE;
  DROP TABLE "site_profile_tech_stack_backend" CASCADE;
  DROP TABLE "site_profile_tech_stack_devops" CASCADE;
  DROP TABLE "site_profile_tech_stack_tools" CASCADE;
  DROP TABLE "site_profile_timeline" CASCADE;
  DROP TABLE "site_profile" CASCADE;
  DROP TYPE "public"."enum_posts_status";
  DROP TYPE "public"."enum__posts_v_version_status";
  DROP TYPE "public"."enum_projects_stage";
  DROP TYPE "public"."enum_projects_status";
  DROP TYPE "public"."enum__projects_v_version_stage";
  DROP TYPE "public"."enum__projects_v_version_status";
  DROP TYPE "public"."enum_docs_status";
  DROP TYPE "public"."enum__docs_v_version_status";
  DROP TYPE "public"."enum_notes_status";
  DROP TYPE "public"."enum__notes_v_version_status";
  DROP TYPE "public"."enum_site_profile_social_links_icon";`)
}
