import mongoose from "mongoose";
import { User } from "../models/User";
import { Book } from "../models/Book";
import { Community } from "../models/Community";
import { Post } from "../models/Post";

const MONGO_URI = "mongodb://127.0.0.1:27017/bookshare";

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // 1️⃣ Clear existing data
    await User.deleteMany({});
    await Book.deleteMany({});
    await Community.deleteMany({});
    await Post.deleteMany({});
    console.log("🗑️ Cleared existing collections");

    // 2️⃣ Create Users
    const users = await User.insertMany([
      { name: "Alice", email: "alice@example.com", password: "password123" },
      { name: "Bob", email: "bob@example.com", password: "password123" },
      { name: "Charlie", email: "charlie@example.com", password: "password123" },
    ]);
    console.log("👤 Users created:", users.map(u => u.name));

    // 3️⃣ Create Communities
    const communities = await Community.insertMany([
      { name: "Fantasy Lovers", description: "Discuss all fantasy books", createdBy: users[0]._id },
      { name: "Sci-Fi Fans", description: "Sci-Fi enthusiasts community", createdBy: users[1]._id },
    ]);
    console.log("🌐 Communities created:", communities.map(c => c.name));

    // 4️⃣ Create Books
    const books = await Book.insertMany([
      {
        title: "The Hobbit",
        author: "J.R.R. Tolkien",
        genre: "Fantasy",
        description: "Bilbo Baggins' adventure in Middle Earth",
        user: users[0]._id,
      },
      {
        title: "Harry Potter and the Sorcerer's Stone",
        author: "J.K. Rowling",
        genre: "Fantasy",
        description: "The first book in the Harry Potter series",
        user: users[1]._id,
      },
      {
        title: "Dune",
        author: "Frank Herbert",
        genre: "Sci-Fi",
        description: "Epic sci-fi novel on Arrakis",
        user: users[2]._id,
      },
    ]);
    console.log("📚 Books created:", books.map(b => b.title));

    // 5️⃣ Create Posts
    const posts = await Post.insertMany([
      {
        community: communities[0]._id,
        user: users[0]._id,
        content: "Just finished reading The Hobbit! Amazing!",
      },
      {
        community: communities[1]._id,
        user: users[1]._id,
        content: "Dune is such a masterpiece of sci-fi!",
      },
    ]);
    console.log("✏️ Posts created:", posts.length);

    console.log("🎉 Database seeding completed!");
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("🔥 Seed error:", err);
    process.exit(1);
  }
};

seedDatabase();
