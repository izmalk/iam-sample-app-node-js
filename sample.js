const { TypeDB } = require("typedb-client/TypeDB");
const { SessionType } = require("typedb-client/api/connection/TypeDBSession");
const { TransactionType } = require("typedb-client/api/connection/TypeDBTransaction");
const { TypeDBOptions } = require("typedb-client/api/connection/TypeDBOptions");
const { ThingType } = require("typedb-client/api/concept/type/ThingType");
//const { Annotation } = ThingType.Annotation;
//const { Annotation } = require("typedb-client/api/connection/TypeDBOptions");
//import { Annotation } from 'typedb-client';
const Annotation = ThingType.Annotation;

async function main() {
    console.log("IAM Sample App");

    console.log("Connecting to the server");
    const client = await TypeDB.coreClient("0.0.0.0:1729"); // client is connected to the server
    console.log("Connecting to the `iam` database");
    let k; // define counter
    let session // define session for later use
    try {
        session = await client.session("iam", SessionType.DATA); // session is open

        console.log("");
        console.log("Request #1: User listing");
        let transaction;
        try {
            transaction = await session.transaction(TransactionType.READ); // READ transaction is open
            let match_query = "match $u isa user, has full-name $n, has email $e;"; // TypeQL query
            let iterator = transaction.query.match(match_query); // Executing query
            let answers = await iterator.collect();
            let result = await Promise.all(
                answers.map(answer =>
                    [answer.map.get("n").value,
                     answer.map.get("e").value]
                )
            );
            k = 0; // reset the counter
            for(let i = 0; i < result.length; i++) {
                k++;
                console.log("User #" + k + ": " + result[i][0] + ", has E-mail: " + result[i][1]);
            };
            console.log("Users found: " + k);
        } finally {
            transaction?.close();
        }

        console.log("");
        console.log("Request #2: Files that Kevin Morrison has access to");
        try {
            transaction = await session.transaction(TransactionType.READ); // READ transaction is open
            match_query = "match $u isa user, has full-name 'Kevin Morrison'; $p($u, $pa) isa permission; $o isa object, has path $fp; $pa($o, $va) isa access; get $fp;";
            iterator = transaction.query.match(match_query); // Executing query
            answers = await iterator.collect();
            result = await Promise.all(
                answers.map(answer =>
                    [answer.map.get("fp").value]
                )
            );
            k = 0; // reset the counter
            for(let i = 0; i < result.length; i++) {
                k++;
                console.log("File #" + k + ": " + result[i]);
            }
            console.log("Files found: " + k);
        } finally {
        await transaction.close();
        };

        console.log("");
        console.log("Request #3: Files that Kevin Morrison has view access to (with inference)");
        let options = TypeDBOptions.core();
        options.infer = true; // set option to enable inference
        try {
            transaction = await session.transaction(TransactionType.READ, options); // READ transaction is open
            match_query = "match $u isa user, has full-name 'Kevin Morrison'; $p($u, $pa) isa permission; $o isa object, has path $fp; $pa($o, $va) isa access; $va isa action, has name 'view_file'; get $fp; sort $fp asc; offset 0; limit 5;"
            iterator = transaction.query.match(match_query); // Executing query
            answers = await iterator.collect();
            result = await Promise.all(
                answers.map(answer =>
                    [answer.map.get("fp").value]
                )
            );
            k = 0; // reset the counter
            for(let i = 0; i < result.length; i++) {
                k++;
                console.log("File #" + k + ": " + result[i]);
            };
            //match_query = "match $u isa user, has full-name 'Kevin Morrison'; $p($u, $pa) isa permission; $o isa object, has path $fp; $pa($o, $va) isa access; $va isa action, has name 'view_file'; get $fp; sort $fp asc; offset 5; limit 5;"
            match_query = "match $u isa user;"
            iterator = transaction.query.match(match_query); // Executing query
            answers = await iterator.collect();
            //annotation_set = new Set();
            //annotation_set.add(ThingType.Annotation.KEY)
            //annotation_set.add(ThingType.Annotation.KEY)
            results = await Promise.all(
                answers.map(answer =>
                    //[answer.map.get("fp").value]
                    //answer.map.get("u").asThing().asRemote(transaction).getHas(annotations=annotation_set)
                    //answer.map.get("u")
                    answer.map.get("u").asThing().asRemote(transaction).getHas([Annotation.KEY])
                )
            );
            /*attr = await Promise.all(
                results(result =>
                    result.asThing().asRemote(transaction).getHas()
                )

            );

            for(let i = 0; i < attr.length; i++) {
            console.log("-->" + attr[i])

            }*/

            for(let i = 0; i < result.length; i++) {
                k++;
                console.log("File #" + k + ": " + result[i]);
            };
            console.log("Files found: " + k);
        } finally {
            await transaction.close();
        };

        console.log("");
        console.log("Request #4: Add a new file and a view access to it");
        const today = new Date(Date.now());
        try {
            transaction = await session.transaction(TransactionType.WRITE); // WRITE transaction is open
            let filepath = "logs/" + today.toISOString() + ".log";
            let insert_query = "insert $f isa file, has path '" + filepath + "';";
            console.log("Inserting file: " + filepath);
            transaction.query.insert(insert_query); // Executing query
            insert_query = "match $f isa file, has path '" + filepath + "'; $vav isa action, has name 'view_file'; insert ($vav, $f) isa access;";
            console.log("Adding view access to the file");
            await transaction.query.insert(insert_query); // Executing query
            await transaction.commit(); // to persist changes, a 'write' transaction must be committed
        } finally {
        if (transaction.isOpen()) {await transaction.close()};
        };
    } finally {
        await session?.close(); // close session
        client.close(); // close server connection
    };
};

main();
