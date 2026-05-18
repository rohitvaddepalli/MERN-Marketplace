import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const _MIGRATIONS_COLLECTION = '_migrations';
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

const Migration = mongoose.model(
    '_Migration',
    new mongoose.Schema({
        name: { type: String, unique: true },
        executedAt: { type: Date, default: Date.now },
    })
);

async function ensureMigrationsDir() {
    if (!fs.existsSync(MIGRATIONS_DIR)) {
        fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
        console.log('Created migrations directory');
    }
}

async function getExecutedMigrations() {
    try {
        const migrations = await Migration.find({}).sort({ name: 1 });
        return new Set(migrations.map((m) => m.name));
    } catch {
        return new Set();
    }
}

async function runMigrations(direction = 'up') {
    await ensureMigrationsDir();

    const files = fs
        .readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith('.js'))
        .sort();

    if (files.length === 0) {
        console.log('No migration files found. Create them in scripts/migrations/');
        return;
    }

    const executed = await getExecutedMigrations();

    for (const file of files) {
        const migrationName = path.basename(file, '.js');

        if (direction === 'up') {
            if (executed.has(migrationName)) {
                console.log(`SKIP ${migrationName} (already executed)`);
                continue;
            }

            console.log(`RUN ${migrationName}...`);
            const migration = await import(`./migrations/${file}`);
            await migration.up(mongoose.connection.db);
            await Migration.create({ name: migrationName });
            console.log(`DONE ${migrationName}`);
        } else if (direction === 'down') {
            if (!executed.has(migrationName)) {
                console.log(`SKIP ${migrationName} (not executed)`);
                continue;
            }

            console.log(`REVERT ${migrationName}...`);
            const migration = await import(`./migrations/${file}`);
            if (migration.down) {
                await migration.down(mongoose.connection.db);
            }
            await Migration.deleteOne({ name: migrationName });
            console.log(`DONE ${migrationName}`);
        }
    }
}

async function createMigration(name) {
    await ensureMigrationsDir();

    const timestamp = Date.now();
    const filename = `${timestamp}_${name}.js`;
    const filepath = path.join(MIGRATIONS_DIR, filename);

    const template = `export async function up(db) {
    // TODO: implement migration
}

export async function down(db) {
    // TODO: implement rollback
}
`;

    fs.writeFileSync(filepath, template, 'utf-8');
    console.log(`Created migration: ${filename}`);
}

async function main() {
    const command = process.argv[2];
    const name = process.argv[3];

    if (!command) {
        console.log('Usage:');
        console.log('  node scripts/migrate.js up          Run pending migrations');
        console.log('  node scripts/migrate.js down        Revert last migration');
        console.log('  node scripts/migrate.js create <name>  Scaffold a new migration');
        process.exit(1);
    }

    if (command === 'create') {
        if (!name) {
            console.error('Error: Migration name is required');
            process.exit(1);
        }
        await createMigration(name);
        process.exit(0);
    }

    if (!process.env.MONGODB_URI) {
        console.error('Error: MONGODB_URI environment variable is required');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        await runMigrations(command);

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
}

main();
