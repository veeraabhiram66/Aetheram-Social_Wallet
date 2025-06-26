const { initializeDatabase, closeDatabase } = require('./database');

async function setupDatabase() {
    try {
        console.log('🔧 Setting up database...');
        await initializeDatabase();
        console.log('✅ Database setup completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Database setup failed:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down database setup...');
    await closeDatabase();
    process.exit(0);
});

setupDatabase();
