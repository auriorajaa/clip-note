import {
    BeforeInsert,
    BeforeUpdate,
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import * as bcrypt from "bcrypt";
import {Video} from "./video.entity.js";

@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({type: "varchar", unique: true})
    email: string;

    @Column({type: "varchar"})
    password: string;

    @Column({type: "varchar", nullable: true})
    name: string;

    @Column({type: "boolean", default: false})
    isEmailVerified: boolean;

    @Column({nullable: true, type: "text"})
    emailverificationToken: string | null;

    @Column({nullable: true, type: "timestamp"})
    emailVerificationTokenExpires: Date | null;

    @Column({type: "timestamp", nullable: true})
    lastLogin: Date;

    @OneToMany(() => Video, (video) => video.user)
    videos: Video[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @BeforeInsert()
    @BeforeUpdate()
    async hashPassword() {
        if (this.password && this.password.length < 60) {
            this.password = await bcrypt.hash(this.password, 10);
        }
    }

    async comparePassword(candidatePassword: string): Promise<boolean> {
        return bcrypt.compare(candidatePassword, this.password);
    }
}
