const { TypeDB } = require("typedb-driver/TypeDB");
const { SessionType } = require("typedb-driver/api/connection/TypeDBSession");
const { TransactionType } = require("typedb-driver/api/connection/TypeDBTransaction");

async function main() {
    const DB_NAME = "people4";
    const SERVER_ADDR = "127.0.0.1:1729";
    const driver = await TypeDB.coreDriver(SERVER_ADDR);
    if (driver.databases.contains(DB_NAME)) {
        await driver.databases.get(DB_NAME).then(db => db.delete());
    }
    await driver.databases.create(DB_NAME);
    try {
        session = await driver.session(DB_NAME, SessionType.SCHEMA);
        try {
            transaction = await session.transaction(TransactionType.WRITE);
            await transaction.query.define("define person sub entity;");
            await transaction.query.define("define name sub attribute, value string; person owns name;");
            await transaction.commit();
        } finally {if (transaction.isOpen()) {await transaction.close()};}
    } finally {await session?.close();}
    try {
        session = await driver.session(DB_NAME, SessionType.DATA);
        try {
            transaction = await session.transaction(TransactionType.WRITE);
            await transaction.query.insert("insert $p isa person, has name 'Alice';");
            await transaction.query.insert("insert $p isa person, has name 'Bob';");
            await transaction.commit();
        } finally {if (transaction.isOpen()) {await transaction.close()};}
        try {
            transaction = await session.transaction(TransactionType.READ);
            await transaction.query.fetch("match $p isa person; fetch $p: name;").forEach(element => {
                console.log(JSON.stringify(element));                
            });
        } finally {if (transaction.isOpen()) {await transaction.close()};}
    } finally {await session?.close();}
}
main();
