import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import type { Relation } from "typeorm";
import { UserSubscription } from "./user-subscription.entity.js";

@Entity()
export class SubscriptionPlan {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  name: string;

  @Column({ type: "varchar" })
  description: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price: number;

  @Column({ type: "varchar" })
  currency: string;

  @Column({ type: "varchar" })
  billingInterval: "monthly" | "yearly";

  @Column({ type: "varchar" })
  stripePriceId: string;

  @Column({ type: "integer", default: 0 })
  videoLimit: number;

  @Column({ type: "integer", default: 0 })
  minutesLimit: number;

  @Column({ type: "boolean", default: false })
  isActive: boolean;

  @OneToMany(() => UserSubscription, (subscription) => subscription.plan)
  subscriptions: Relation<UserSubscription>[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
