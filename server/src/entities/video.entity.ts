import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./user.entity.js";

@Entity()
export class Video {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  url: string;

  @Column({ type: "varchar" })
  title: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "integer" })
  duration: number;

  @Column({ type: "varchar" })
  author: string;

  @Column({ type: "text", nullable: true })
  thumbnail: string;

  @Column({ type: "varchar", default: "pending" })
  status: "pending" | "processing" | "completed" | "failed";

  @ManyToOne(() => User, (user) => user.videos, { nullable: false })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
