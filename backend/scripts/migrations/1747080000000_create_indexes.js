export async function up(db) {
    const collections = await db.listCollections().toArray();
    const collectionNames = new Set(collections.map((c) => c.name));

    if (collectionNames.has('products')) {
        await db.collection('products').createIndex({ store: 1 });
        await db.collection('products').createIndex({ seller: 1 });
        await db.collection('products').createIndex({ category: 1 });
        await db.collection('products').createIndex({ isActive: 1, category: 1, price: 1 });
        await db.collection('products').createIndex({ isActive: 1, rating: -1 });
        await db.collection('products').createIndex({ name: 'text', description: 'text' });
        console.log('Created product indexes');
    }

    if (collectionNames.has('orders')) {
        await db.collection('orders').createIndex({ customer: 1 });
        await db.collection('orders').createIndex({ 'items.store': 1 });
        await db.collection('orders').createIndex({ status: 1 });
        await db.collection('orders').createIndex({ createdAt: -1 });
        console.log('Created order indexes');
    }

    if (collectionNames.has('users')) {
        await db.collection('users').createIndex({ email: 1 }, { unique: true });
        await db.collection('users').createIndex({ role: 1 });
        console.log('Created user indexes');
    }

    if (collectionNames.has('stores')) {
        await db.collection('stores').createIndex({ owner: 1 }, { unique: true });
        await db.collection('stores').createIndex({ isActive: 1 });
        console.log('Created store indexes');
    }
}

export async function down(db) {
    const collections = await db.listCollections().toArray();
    const collectionNames = new Set(collections.map((c) => c.name));

    if (collectionNames.has('products')) {
        await db.collection('products').dropIndexes();
        console.log('Dropped product indexes');
    }
    if (collectionNames.has('orders')) {
        await db.collection('orders').dropIndexes();
        console.log('Dropped order indexes');
    }
    if (collectionNames.has('users')) {
        await db.collection('users').dropIndexes();
        console.log('Dropped user indexes');
    }
    if (collectionNames.has('stores')) {
        await db.collection('stores').dropIndexes();
        console.log('Dropped store indexes');
    }
}
