import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1730123456789 implements MigrationInterface {
    name = 'InitialSchema1730123456789'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create organizations table
        await queryRunner.query(`
            CREATE TABLE "organizations" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "slug" character varying NOT NULL,
                "description" text,
                "logo" character varying,
                "settings" jsonb,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_organizations_slug" UNIQUE ("slug"),
                CONSTRAINT "PK_organizations" PRIMARY KEY ("id")
            )
        `);

        // Create users table
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying NOT NULL,
                "password" character varying NOT NULL,
                "firstName" character varying NOT NULL,
                "lastName" character varying NOT NULL,
                "role" character varying NOT NULL,
                "isActive" boolean NOT NULL DEFAULT true,
                "isEmailVerified" boolean NOT NULL DEFAULT false,
                "lastLogin" TIMESTAMP,
                "organizationId" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_users_email" UNIQUE ("email"),
                CONSTRAINT "PK_users" PRIMARY KEY ("id")
            )
        `);

        // Create posts table
        await queryRunner.query(`
            CREATE TABLE "posts" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "content" text NOT NULL,
                "platform" character varying NOT NULL,
                "scheduledAt" TIMESTAMP,
                "publishedAt" TIMESTAMP,
                "status" character varying NOT NULL,
                "metadata" jsonb,
                "authorId" uuid NOT NULL,
                "organizationId" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_posts" PRIMARY KEY ("id")
            )
        `);

        // Create assets table
        await queryRunner.query(`
            CREATE TABLE "assets" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "fileName" character varying NOT NULL,
                "originalName" character varying NOT NULL,
                "mimeType" character varying NOT NULL,
                "size" integer NOT NULL,
                "url" character varying NOT NULL,
                "thumbnailUrl" character varying,
                "type" character varying NOT NULL,
                "metadata" jsonb,
                "uploadedById" uuid NOT NULL,
                "organizationId" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_assets" PRIMARY KEY ("id")
            )
        `);

        // Create licenses table
        await queryRunner.query(`
            CREATE TABLE "licenses" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "description" text,
                "provider" character varying NOT NULL,
                "licenseUrl" character varying,
                "terms" text,
                "assetId" uuid NOT NULL,
                "organizationId" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_licenses" PRIMARY KEY ("id")
            )
        `);

        // Create approval_workflows table
        await queryRunner.query(`
            CREATE TABLE "approval_workflows" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "status" character varying NOT NULL,
                "postId" uuid NOT NULL,
                "organizationId" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_approval_workflows" PRIMARY KEY ("id")
            )
        `);

        // Create approval_steps table
        await queryRunner.query(`
            CREATE TABLE "approval_steps" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "order" integer NOT NULL,
                "status" character varying NOT NULL,
                "comment" text,
                "reviewedAt" TIMESTAMP,
                "workflowId" uuid NOT NULL,
                "reviewerId" uuid,
                "organizationId" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_approval_steps" PRIMARY KEY ("id")
            )
        `);

        // Create audit_logs table
        await queryRunner.query(`
            CREATE TABLE "audit_logs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "action" character varying NOT NULL,
                "entityType" character varying NOT NULL,
                "entityId" character varying NOT NULL,
                "changes" jsonb,
                "metadata" jsonb,
                "ipAddress" character varying,
                "userAgent" character varying,
                "userId" uuid NOT NULL,
                "organizationId" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
            )
        `);

        // Add foreign keys
        await queryRunner.query(`
            ALTER TABLE "users" ADD CONSTRAINT "FK_users_organizationId" 
            FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "posts" ADD CONSTRAINT "FK_posts_authorId" 
            FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "posts" ADD CONSTRAINT "FK_posts_organizationId" 
            FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "assets" ADD CONSTRAINT "FK_assets_uploadedById" 
            FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "assets" ADD CONSTRAINT "FK_assets_organizationId" 
            FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "licenses" ADD CONSTRAINT "FK_licenses_assetId" 
            FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "licenses" ADD CONSTRAINT "FK_licenses_organizationId" 
            FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "approval_workflows" ADD CONSTRAINT "FK_approval_workflows_postId" 
            FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "approval_workflows" ADD CONSTRAINT "FK_approval_workflows_organizationId" 
            FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "approval_steps" ADD CONSTRAINT "FK_approval_steps_workflowId" 
            FOREIGN KEY ("workflowId") REFERENCES "approval_workflows"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "approval_steps" ADD CONSTRAINT "FK_approval_steps_reviewerId" 
            FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE SET NULL
        `);

        await queryRunner.query(`
            ALTER TABLE "approval_steps" ADD CONSTRAINT "FK_approval_steps_organizationId" 
            FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_audit_logs_userId" 
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_audit_logs_organizationId" 
            FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE
        `);

        // Create indexes
        await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);
        await queryRunner.query(`CREATE INDEX "IDX_users_organizationId" ON "users" ("organizationId")`);
        await queryRunner.query(`CREATE INDEX "IDX_posts_organizationId" ON "posts" ("organizationId")`);
        await queryRunner.query(`CREATE INDEX "IDX_posts_authorId" ON "posts" ("authorId")`);
        await queryRunner.query(`CREATE INDEX "IDX_posts_status" ON "posts" ("status")`);
        await queryRunner.query(`CREATE INDEX "IDX_assets_organizationId" ON "assets" ("organizationId")`);
        await queryRunner.query(`CREATE INDEX "IDX_audit_logs_organizationId" ON "audit_logs" ("organizationId")`);
        await queryRunner.query(`CREATE INDEX "IDX_audit_logs_userId" ON "audit_logs" ("userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_audit_logs_entityType" ON "audit_logs" ("entityType")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_audit_logs_organizationId"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_audit_logs_userId"`);
        await queryRunner.query(`ALTER TABLE "approval_steps" DROP CONSTRAINT "FK_approval_steps_organizationId"`);
        await queryRunner.query(`ALTER TABLE "approval_steps" DROP CONSTRAINT "FK_approval_steps_reviewerId"`);
        await queryRunner.query(`ALTER TABLE "approval_steps" DROP CONSTRAINT "FK_approval_steps_workflowId"`);
        await queryRunner.query(`ALTER TABLE "approval_workflows" DROP CONSTRAINT "FK_approval_workflows_organizationId"`);
        await queryRunner.query(`ALTER TABLE "approval_workflows" DROP CONSTRAINT "FK_approval_workflows_postId"`);
        await queryRunner.query(`ALTER TABLE "licenses" DROP CONSTRAINT "FK_licenses_organizationId"`);
        await queryRunner.query(`ALTER TABLE "licenses" DROP CONSTRAINT "FK_licenses_assetId"`);
        await queryRunner.query(`ALTER TABLE "assets" DROP CONSTRAINT "FK_assets_organizationId"`);
        await queryRunner.query(`ALTER TABLE "assets" DROP CONSTRAINT "FK_assets_uploadedById"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_posts_organizationId"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_posts_authorId"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_users_organizationId"`);

        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_audit_logs_entityType"`);
        await queryRunner.query(`DROP INDEX "IDX_audit_logs_userId"`);
        await queryRunner.query(`DROP INDEX "IDX_audit_logs_organizationId"`);
        await queryRunner.query(`DROP INDEX "IDX_assets_organizationId"`);
        await queryRunner.query(`DROP INDEX "IDX_posts_status"`);
        await queryRunner.query(`DROP INDEX "IDX_posts_authorId"`);
        await queryRunner.query(`DROP INDEX "IDX_posts_organizationId"`);
        await queryRunner.query(`DROP INDEX "IDX_users_organizationId"`);
        await queryRunner.query(`DROP INDEX "IDX_users_email"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP TABLE "approval_steps"`);
        await queryRunner.query(`DROP TABLE "approval_workflows"`);
        await queryRunner.query(`DROP TABLE "licenses"`);
        await queryRunner.query(`DROP TABLE "assets"`);
        await queryRunner.query(`DROP TABLE "posts"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "organizations"`);
    }
}
