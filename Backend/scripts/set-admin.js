import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    const result = await mongoose.connection.db.collection('users').updateOne(
        { email: 'steliantsoft@gmail.com' },
        { $set: { isAdmin: true } }
    );
    console.log(result.modifiedCount ? '✅ STELIANT ahora es Admin.' : '⚠️ No se encontro el usuario o ya es admin.');
    process.exit(0);
};

run().catch(err => { console.error('Error:', err); process.exit(1); });
