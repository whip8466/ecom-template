"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { MikroORM } = require('@mikro-orm/postgresql');
const mikroOrmConfig = require('../../mikro-orm.config');
let ormInstance;
async function initORM() {
    if (!ormInstance) {
        ormInstance = await MikroORM.init(mikroOrmConfig);
    }
    return ormInstance;
}
module.exports = { initORM };
