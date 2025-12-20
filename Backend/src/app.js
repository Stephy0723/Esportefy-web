import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import authRouters from './routers/auth.routers.js';
import userRouters from './routers/users.routers.js'

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/users', userRouters)

app.use('/api/auth', authRouters);

export default app;