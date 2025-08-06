import dotenv from 'dotenv';
dotenv.config();

const db = {
    mongoURI: process.env.NODE_ENV === "production"
        ? process.env.MONGO_URI
        : "mongodb://localhost/blogapp"
};

export default db;