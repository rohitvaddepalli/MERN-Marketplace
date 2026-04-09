import { db } from '../firebase';
import { collection, doc, writeBatch, getDocs } from 'firebase/firestore';
import logger from './logger';

const sampleProducts = [
    {
        name: "Wireless Noise-Canceling Headphones",
        description: "Experience premium sound with our latest noise-canceling technology. Perfect for travelers and audiophiles.",
        price: 299.99,
        category: "Electronics",
        images: [{ url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80" }],
        stock: 50,
        rating: 4.8,
        numReviews: 124,
        isFeatured: true,
        seller: "TechWorld"
    },
    {
        name: "Minimalist Leather Backpack",
        description: "Handcrafted from genuine leather. Sleek design fits 15-inch laptops comfortably.",
        price: 129.50,
        category: "Fashion",
        images: [{ url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80" }],
        stock: 20,
        rating: 4.5,
        numReviews: 45,
        isFeatured: true,
        seller: "LeatherCo"
    },
    {
        name: "Smart Fitness Watch",
        description: "Track your health metrics, sleep, and workouts with precision. Waterproof and 7-day battery life.",
        price: 89.99,
        category: "Electronics",
        images: [{ url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80" }],
        stock: 100,
        rating: 4.2,
        numReviews: 89,
        isFeatured: false,
        seller: "TechWorld"
    },
    {
        name: "Organic Coffee Beans (1kg)",
        description: "Sourced from the highlands of Ethiopia. Rich, dark roast with notes of chocolate and berry.",
        price: 24.00,
        category: "Groceries",
        images: [{ url: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&q=80" }],
        stock: 200,
        rating: 4.9,
        numReviews: 210,
        isFeatured: true,
        seller: "BeanMasters"
    },
    {
        name: "Ceramic Plant Pot Set",
        description: "Set of 3 minimalist ceramic pots. Perfect for succulents and small indoor plants.",
        price: 35.00,
        category: "Home & Garden",
        images: [{ url: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=500&q=80" }],
        stock: 45,
        rating: 4.7,
        numReviews: 32,
        isFeatured: false,
        seller: "HomeDecor"
    }
];

export const seedDatabase = async () => {
    try {
        const batch = writeBatch(db);

        // Add Products
        sampleProducts.forEach((product) => {
            const docRef = doc(collection(db, "products"));
            batch.set(docRef, {
                ...product,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        });

        await batch.commit();
        logger.log("Database seeded successfully!");
        return { success: true, message: "Database seeded with sample products!" };
    } catch (error) {
        logger.error("Error seeding database:", error);
        return { success: false, message: error.message };
    }
};

export const clearDatabase = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const batch = writeBatch(db);

        querySnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        logger.log("Database cleared successfully!");
        return { success: true, message: "Database cleared!" };
    } catch (error) {
        logger.error("Error clearing database:", error);
        return { success: false, message: error.message };
    }
};
