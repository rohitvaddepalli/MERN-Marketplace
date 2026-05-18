import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function analyzeIndexes() {
    if (!process.env.MONGODB_URI) {
        console.error('Error: MONGODB_URI environment variable is required');
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;

    const collections = await db.listCollections().toArray();

    for (const collection of collections) {
        const name = collection.name;
        console.log(`\n=== ${name} ===`);

        const indexes = await db.collection(name).indexes();
        console.log('Indexes:');
        for (const idx of indexes) {
            const keys = Object.entries(idx.key)
                .map(([k, v]) => `${k}:${v === 1 ? 'asc' : 'desc'}`)
                .join(', ');
            console.log(
                `  ${idx.name}: { ${keys} }${idx.unique ? ' [unique]' : ''}${idx.sparse ? ' [sparse]' : ''}`
            );
        }

        const stats = await db.collection(name).stats();
        console.log(`Documents: ${stats.count}`);
        console.log(`Total size: ${(stats.size / 1024).toFixed(1)} KB`);
        console.log(
            `Avg doc size: ${stats.avgObjSize ? stats.avgObjSize.toFixed(0) : 'N/A'} bytes`
        );
    }

    await mongoose.disconnect();
    console.log('\nDone.');
    process.exit(0);
}

analyzeIndexes().catch((err) => {
    console.error('Analysis failed:', err.message);
    process.exit(1);
});
