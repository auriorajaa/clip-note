import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import {User} from "./user.entity.js";
import {Transcription} from "./transcription.entity.js";
import {Analysis} from "./analysis.entity.js";

@Entity()
export class Video {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({type: "varchar"})
    url: string;

    @Column({type: "varchar"})
    title: string;

    @Column({type: "text", nullable: true})
    description: string;

    @Column({type: "integer"})
    duration: number;

    @Column({type: "varchar"})
    author: string;

    @Column({type: "text", nullable: true})
    thumbnail: string;

    @Column({type: "varchar", default: "pending"})
    status: "pending" | "processing" | "completed" | "failed";

    @ManyToOne(() => User, (user) => user.videos, {nullable: false})
    user: User;

    @OneToOne(() => Transcription, (transciption) => transciption.video)
    transcription: Transcription;

    @OneToOne(() => Analysis, (analysis) => analysis.video)
    analysis: Analysis;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
