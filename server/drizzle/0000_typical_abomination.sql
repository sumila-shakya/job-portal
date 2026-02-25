CREATE TABLE `users` (
	`users_id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`role` enum('job_seeker','employer','admin') NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`is_active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `users_users_id` PRIMARY KEY(`users_id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
