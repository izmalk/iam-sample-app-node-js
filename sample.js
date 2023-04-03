const { TypeDB } = require("typedb-client/TypeDB");
const { SessionType } = require("typedb-client/api/connection/TypeDBSession");
const { TransactionType } = require("typedb-client/api/connection/TypeDBTransaction");
const { TypeDBOptions } = require("typedb-client/api/connection/TypeDBOptions");

const databaseName  = "iam";
const serverAddr = "localhost:1729";


async function main() {
    console.log("IAM Sample App")

    console.log("Connecting to the server")
    const client = TypeDB.coreClient("0.0.0.0:1729");
    console.log("Connecting to the `iam` database")
    const session = await client.session("iam", SessionType.DATA);
    
    console.log("")
    console.log("Request #1: User listing")
    let transaction = await session.transaction(TransactionType.READ);

    let match_query = "match $u isa user, has full-name $n, has email $e;";

    let iterator = transaction.query.match(match_query);
    let answers = await iterator.collect();
    let result = await Promise.all(
        answers.map(answer =>
            [answer.map.get("n").value,
             answer.map.get("e").value]
        )
    );

    k = 0;
    for(let i = 0; i < result.length; i++) {
        k++
        console.log("User #" + k + ": " + result[i][0] + ", has E-mail: " + result[i][1]);
    }
    console.log("Users found: " + k);
    await transaction.close();

    console.log("")
    console.log("Request #2: Files that Kevin Morrison has access to")
    transaction = await session.transaction(TransactionType.READ);

    match_query = "match $u isa user, has full-name 'Kevin Morrison'; $p($u, $pa) isa permission; $o isa object, has path $fp; $pa($o, $va) isa access; get $fp;";

    iterator = transaction.query.match(match_query);
    answers = await iterator.collect();
    result = await Promise.all(
        answers.map(answer =>
            [answer.map.get("fp").value]
        )
    );

    k = 0;
    for(let i = 0; i < result.length; i++) {
        k++
        console.log("File #" + k + ": " + result[i]);
    }
    console.log("Files found: " + k);
    await transaction.close();

    console.log("")
    console.log("Request #3: Files that Kevin Morrison has view access to (with inference)")
    let options =  TypeDBOptions.core();
    options.infer = true;
    transaction = await session.transaction(TransactionType.READ, options);

    match_query = "match $u isa user, has full-name 'Kevin Morrison'; $p($u, $pa) isa permission; $o isa object, has path $fp; $pa($o, $va) isa access; $va isa action, has action-name 'view_file'; get $fp; sort $fp asc; offset 0; limit 5;"

    iterator = transaction.query.match(match_query);
    answers = await iterator.collect();
    result = await Promise.all(
        answers.map(answer =>
            [answer.map.get("fp").value]
        )
    );

    k = 0;
    for(let i = 0; i < result.length; i++) {
        k++
        console.log("File #" + k + ": " + result[i]);
    }

    match_query = "match $u isa user, has full-name 'Kevin Morrison'; $p($u, $pa) isa permission; $o isa object, has path $fp; $pa($o, $va) isa access; $va isa action, has action-name 'view_file'; get $fp; sort $fp asc; offset 5; limit 5;"

    iterator = transaction.query.match(match_query);
    answers = await iterator.collect();
    result = await Promise.all(
        answers.map(answer =>
            [answer.map.get("fp").value]
        )
    );

    for(let i = 0; i < result.length; i++) {
        k++
        console.log("File #" + k + ": " + result[i]);
    }
    console.log("Files found: " + k);
    await transaction.close();

    console.log("")
    console.log("Request #4: Add a new file and a view access to it")
    const today = new Date(Date.now());
    transaction = await session.transaction(TransactionType.WRITE);
    let filepath = "logs/" + today.toISOString() + ".log";

    let insert_query = "insert $f isa file, has path '" + filepath + "';";
    console.log("Inserting file: " + filepath);
    transaction.query.insert(insert_query);
    insert_query = "match $f isa file, has path '" + filepath + "'; $vav isa action, has action-name 'view_file'; insert ($vav, $f) isa access;"
    console.log("Adding view access to the file");
    await transaction.query.insert(insert_query);
    await transaction.commit();

    await session.close();
    client.close();
}

main();
