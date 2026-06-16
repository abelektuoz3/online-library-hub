const mongoose = require('mongoose');

// MongoDB connection string
// Local MongoDB: 'mongodb://localhost:27017/libraryhub'
// MongoDB Atlas (cloud): Use your connection string from MongoDB Atlas
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/libraryhub';

const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ MongoDB connected successfully');
        
        // Initialize database with sample data
        await initializeDatabase();
        
    } catch (err) {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    }
};

// Initialize database with sample data
async function initializeDatabase() {
    const Resource = require('../models/Resource');
    const Announcement = require('../models/Announcement');
    
    // Check if resources collection is empty
    const resourceCount = await Resource.countDocuments();
    
    if (resourceCount === 0) {
        console.log('Seeding sample resources...');
        
        const sampleResources = [
            { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', category: 'Fiction', grade_level: 'Grade 10-12', resource_type: 'Book', description: 'A classic American novel about the Jazz Age.', available: true },
            { title: 'Introduction to JavaScript', author: 'John Doe', category: 'Programming', grade_level: 'Grade 9-12', resource_type: 'E-Book', description: 'Learn JavaScript from scratch.', available: true },
            { title: 'World History Volume 1', author: 'Sarah Johnson', category: 'History', grade_level: 'Grade 8-10', resource_type: 'Textbook', description: 'Comprehensive world history coverage.', available: true },
            { title: 'Calculus Made Easy', author: 'Michael Smith', category: 'Mathematics', grade_level: 'Grade 11-12', resource_type: 'Book', description: 'Simplified calculus concepts.', available: true },
            { title: 'Biology Basics', author: 'Emma Wilson', category: 'Science', grade_level: 'Grade 9-11', resource_type: 'E-Book', description: 'Introduction to biology.', available: true },
            { title: 'English Grammar Guide', author: 'Robert Brown', category: 'English', grade_level: 'Grade 8-12', resource_type: 'Reference', description: 'Complete grammar reference.', available: true },
            { title: 'Chemistry Experiments', author: 'Lisa Davis', category: 'Science', grade_level: 'Grade 10-12', resource_type: 'Lab Manual', description: 'Safe home chemistry experiments.', available: true },
            { title: 'Art History', author: 'David Miller', category: 'Arts', grade_level: 'Grade 9-12', resource_type: 'E-Book', description: 'Journey through art movements.', available: true }
        ];
        
        await Resource.insertMany(sampleResources);
        console.log('✅ Sample resources seeded');
    }

    // Check if announcements collection is empty
    const announcementCount = await Announcement.countDocuments();
    
    if (announcementCount === 0) {
        console.log('Seeding sample announcements...');
        
        const sampleAnnouncements = [
            { title: '📚 New Resources Added', content: '50+ new programming e-books now available' },
            { title: '🕐 Extended Hours', content: 'Library open until 10 PM during exam week' },
            { title: '🎓 Study Room Update', content: 'New study rooms now available for reservation' }
        ];
        
        await Announcement.insertMany(sampleAnnouncements);
        console.log('✅ Sample announcements seeded');
    }
}

module.exports = connectDB;