import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./user.entity.js";
import { SubscriptionPlan } from "./subscription-plan.entity.js";

@Entity()
export class UserSubscription {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, (user) => user.subscriptions)
  user: User;

  @ManyToOne(() => SubscriptionPlan, (plan) => plan.subscriptions)
  plan: SubscriptionPlan;

  @Column({ type: "varchar" })
  status:
    "active" | "past_due" | "canceled" | "unpaid" | "incomplete" | "trial";

  @Column({ type: "varchar", nullable: true })
  stripeCustomerId: string | null;

  @Column({ type: "varchar", nullable: true })
  stripeSubscriptionId: string | null;

  @Column({ type: "timestamp" })
  currentPeriodStart: Date | null;

  @Column({ type: "timestamp" })
  currentPeriodEnd: Date | null;

  @Column({ type: "timestamp", nullable: true })
  cancelAt: Date | null;

  @Column({ type: "timestamp", nullable: true })
  canceledAt: Date | null;

  @Column({ type: "integer", default: 0 })
  videosUsed: number;

  @Column({ type: "integer", default: 0 })
  minutesUsed: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
