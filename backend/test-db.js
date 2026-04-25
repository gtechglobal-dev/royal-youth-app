const mongoose = require('mongoose');

const testConnection = async () => {
  const uri = "mongodb+srv://RoyalYouthdb:gaa6dfyvZXf846bB@cluster0.hpvjnlg.mongodb.net/royal_youth_db?appName=Cluster0";
  
  try {
    console.log('Trying to connect...');
    await mongoose.connect(uri);
    console.log('MongoDB Connected Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Connection error:', error.message);
    console.log('\nTrying direct connection...');
    
    // Try direct connection
    const directUri = "mongodb://cluster0-shard-00-00.hpvjnlg.mongodb.net:27017,cluster0-shard-00-01.hpvjnlg.mongodb.net:27017,cluster0-shard-00-02.hpvjnlg.mongodb.net:27017/royal_youth_db?replicaSet=atlas-hp1vjl6-shard-0&authSource=admin&user=RoyalYouthdb";
    
    try {
      await mongoose.connect(directUri, { password: "gaa6dfyvZXf846bB" });
      console.log('Direct connection successful!');
      process.exit(0);
    } catch (err2) {
      console.error('Direct connection also failed:', err2.message);
    }
    process.exit(1);
  }
};

testConnection();