const mongoose = require('mongoose');
require('dotenv').config();

async function clearDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/vizflow');
    
    console.log('✅ Connected to MongoDB');
    
    // Get all collection names
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📋 Current collections in VizFlow database:');
    collections.forEach(collection => {
      console.log(`   - ${collection.name}`);
    });
    
    if (collections.length === 0) {
      console.log('\n📭 Database is already empty - no collections to delete');
    } else {
      console.log('\n🗑️  Deleting all collections...');
      
      for (const collection of collections) {
        await mongoose.connection.db.dropCollection(collection.name);
        console.log(`   ✅ Deleted collection: ${collection.name}`);
      }
      
      console.log('\n🎉 All collections deleted successfully!');
    }
    
    // Verify database is empty
    const remainingCollections = await mongoose.connection.db.listCollections().toArray();
    console.log(`\n📊 Collections remaining: ${remainingCollections.length}`);
    
    if (remainingCollections.length === 0) {
      console.log('✅ VizFlow database is now completely clean!');
    }
    
  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

console.log('🧹 VizFlow Database Cleaner');
console.log('==========================');
clearDatabase();