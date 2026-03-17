import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await mongoose.connection.db.collection('users').findOne({ email: 'steliantsoft@gmail.com' });
        if (user) {
            console.log('USER_FOUND');
            console.log(JSON.stringify({
                id: user._id,
                email: user.email,
                username: user.username,
                twoFactorEnabled: user.twoFactorEnabled,
                hasPassword: !!user.password
            }, null, 2));
        } else {
            console.log('USER_NOT_FOUND');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

checkUser();
