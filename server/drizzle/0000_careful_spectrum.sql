CREATE TABLE `job_applications` (
	`application_id` serial AUTO_INCREMENT NOT NULL,
	`job_id` bigint unsigned NOT NULL,
	`applicant_id` bigint unsigned NOT NULL,
	`applied_date` timestamp DEFAULT (now()),
	`application_status` enum('pending','rejected','accepted','shortlisted','interviewed','withdrawn') NOT NULL DEFAULT 'pending',
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `job_applications_application_id` PRIMARY KEY(`application_id`),
	CONSTRAINT `unique_application` UNIQUE(`job_id`,`applicant_id`)
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`job_id` serial AUTO_INCREMENT NOT NULL,
	`posted_by` bigint unsigned NOT NULL,
	`title` varchar(255) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deadline_date` timestamp NOT NULL,
	`is_closed` boolean NOT NULL DEFAULT false,
	`is_deleted` boolean NOT NULL DEFAULT false,
	CONSTRAINT `jobs_job_id` PRIMARY KEY(`job_id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`user_id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`role` enum('job_seeker','company','admin') NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`is_active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `users_user_id` PRIMARY KEY(`user_id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `job_applications` ADD CONSTRAINT `job_applications_job_id_jobs_job_id_fk` FOREIGN KEY (`job_id`) REFERENCES `jobs`(`job_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `job_applications` ADD CONSTRAINT `job_applications_applicant_id_users_user_id_fk` FOREIGN KEY (`applicant_id`) REFERENCES `users`(`user_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `jobs` ADD CONSTRAINT `jobs_posted_by_users_user_id_fk` FOREIGN KEY (`posted_by`) REFERENCES `users`(`user_id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `title_idx` ON `jobs` (`title`);