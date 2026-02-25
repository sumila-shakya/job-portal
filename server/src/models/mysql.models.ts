import { serial, timestamp, mysqlEnum, varchar, boolean, mysqlTable } from "drizzle-orm/mysql-core";

export const users = mysqlTable('users', {
    users_id: serial('users_id').primaryKey(),
    name: varchar('name', {length: 255}).notNull(),
    email: varchar('email',{length: 255}).notNull().unique(),
    password: varchar('password',{length: 255}).notNull(),
    role: mysqlEnum('role',['job_seeker','employer','admin']).notNull(),
    createdAt: timestamp('created_at',{mode:'date'}).defaultNow(),
    updatedAt: timestamp('updated_at',{ mode:'date'}).defaultNow().onUpdateNow(),
    isActive: boolean('is_active').notNull().default(true)
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert