import { Db } from "mongodb";

export const up = async (db: Db): Promise<void> => {
  // This is an example migration script.
  // You can use the `db` object to interact with the database.
  // For example, you can create a collection, insert documents, etc.

  // Example: Create a collection named 'example'
  // await db.createCollection('example');

  // Example: Insert a document into the 'example' collection
  // await db.collection('example').insertOne({ name: 'example' });
  console.log("Example migration executed");
};
