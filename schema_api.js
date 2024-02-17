const { TypeDB } = require("typedb-driver/TypeDB");
const { SessionType } = require("typedb-driver/api/connection/TypeDBSession");
const { TransactionType } = require("typedb-driver/api/connection/TypeDBTransaction");
const { Concept } = require("typedb-driver/api/concept/Concept");

async function main() {
    const DB_NAME = "sample_db";
    const SERVER_ADDR = "127.0.0.1:1729";
    const driver = await TypeDB.coreDriver(SERVER_ADDR);
    try {
        session = await driver.session(DB_NAME, SessionType.SCHEMA);
        try {
            transaction = await session.transaction(TransactionType.WRITE);
            let tag = await transaction.concepts.putAttributeType("tag", Concept.ValueType.STRING);
            let rootEntity = await transaction.concepts.getRootEntityType();
            let entites = await rootEntity.getSubtypes(transaction, Concept.Transitivity.EXPLICIT);
            await entites.forEach(
                entity => entity.setOwns(transaction, tag) 
            );


/*             await transaction.concepts.getRootEntityType().then(
                (RootEntity) => {
                    RootEntity.getSubtypes(transaction, Concept.Transitivity.EXPLICIT).forEach(subtype => {
                        console.log(subtype.label);
                        //subtype.setOwns(transaction, tag).resolve();
                        //console.log(subtype.label); 
                    });
                }
            ); */
        
/*             let result = await Promise.all( // Retrieve results from Promise
                entities.map(answer =>
                    answer.label
                )
            );
            for(let i = 0; i < result.length; i++) { // Iterating through the results
                console.log(result[i]);
            }; */
            
            await transaction.commit();
        } 
        catch(e) {console.log(e);} 
        finally {if (transaction.isOpen()) {await transaction.close()};}
    } 
    catch(e) { console.log(e);}
    finally {await session?.close();}
}
main();
