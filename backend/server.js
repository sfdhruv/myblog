import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';

const app = express();
const PORT = 5000;

// MongoDB configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'blogapp';
const COLLECTION_NAME = 'posts';

let db;
let postsCollection;

// Enable CORS for all routes
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// Connect to MongoDB
async function connectToDatabase() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    postsCollection = db.collection(COLLECTION_NAME);
    console.log('✅ Connected to MongoDB successfully');
    
    // Create index for better performance
    await postsCollection.createIndex({ createdAt: -1 });
    
    // Initialize with some sample data if collection is empty
    const count = await postsCollection.countDocuments();
    if (count === 0) {
      await postsCollection.insertOne({
        title: 'Welcome to the Blog!',
        content: 'This is your first post. Edit or delete it to get started.',
        author: 'Admin',
        createdAt: new Date().toISOString()
      });
      console.log('📝 Sample post created');
    }
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Backend server is running!',
    database: db ? 'Connected' : 'Disconnected'
  });
});

// Health check with DB status
app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = db ? 'Connected' : 'Disconnected';
    const postsCount = db ? await postsCollection.countDocuments() : 0;
    
    res.json({ 
      status: 'OK', 
      message: 'Backend is working!',
      database: dbStatus,
      totalPosts: postsCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      message: 'Database connection issue',
      error: error.message
    });
  }
});

// Get all posts
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await postsCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    console.log('GET /api/posts - Returning', posts.length, 'posts');
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Error fetching posts' });
  }
});

// Get single post by ID
app.get('/api/posts/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid post ID format' });
    }

    const post = await postsCollection.findOne({ _id: new ObjectId(id) });
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ message: 'Error fetching post' });
  }
});

// Create new post
app.post('/api/posts', async (req, res) => {
  try {
    console.log('POST /api/posts - Body:', req.body);
    
    const { title, content, author } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const newPost = {
      title,
      content,
      author: author || 'Anonymous',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await postsCollection.insertOne(newPost);
    const createdPost = { ...newPost, _id: result.insertedId };
    
    res.status(201).json(createdPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Error creating post' });
  }
});

// Update post
app.put('/api/posts/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { title, content, author } = req.body;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid post ID format' });
    }

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const updateData = {
      title,
      content,
      author: author || 'Anonymous',
      updatedAt: new Date().toISOString()
    };

    const result = await postsCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(result.value);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ message: 'Error updating post' });
  }
});

// Delete post
app.delete('/api/posts/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid post ID format' });
    }

    const result = await postsCollection.findOneAndDelete({ 
      _id: new ObjectId(id) 
    });

    if (!result.value) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Error deleting post' });
  }
});

// Handle preflight requests
app.options('*', cors());

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ message: 'Internal server error' });
});

// Start server
async function startServer() {
  await connectToDatabase();
  
  app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔗 CORS enabled for: http://localhost:3000`);
    console.log(`🗄️  MongoDB connected: ${MONGODB_URI}`);
    console.log(`📚 Database: ${DB_NAME}, Collection: ${COLLECTION_NAME}`);
  });
}

startServer().catch(console.error);