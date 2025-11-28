import { DataSource } from "typeorm";
import { User } from "../entities/user.entity";
import { BaseRepository } from "./base.repository";
import { Injectable } from "@nestjs/common";


@Injectable()
export class UserRepository extends BaseRepository<User> {
    constructor(dataSource: DataSource) {
        super(dataSource, User);
    }
}