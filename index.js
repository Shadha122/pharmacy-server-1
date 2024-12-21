const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Models
const User = require('./Models/User');
const Product = require('./Models/Product');
const Order = require('./Models/Order');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(
    "mongodb+srv://Admin:1234@cluster0.gg49p.mongodb.net/PharmacyDB?retryWrites=true&w=majority&appName=Cluster0",
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Endpoints

// User Registration
app.post('/signup', async (req, res) => {
  try {
    const { fullName, username, email, password } = req.body;
    const newUser = new User({ fullName, username, email, password });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User Login
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });

    if (!user) {
      return res.status(404).json({ error: 'Invalid username or password' });
    }

    res.status(200).json({ 
      message: 'Login successful', 
      userId: user._id, // user's ID
      role: user.role 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get All Products
app.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a New Product
app.post('/products', async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.status(201).json({ message: 'Product added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a Product
app.put('/products/:id', async (req, res) => {
  try {
    const { quantity } = req.body; // Get the quantity from the request body

    if (quantity === undefined) {
      return res.status(400).json({ message: 'Quantity is required to update product' });
    }

    // Find the product and update the quantity field
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,  // Find product by ID
      { quantity: quantity },  // Only update the quantity field
      { new: true }  // Return the updated product
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ message: 'Product updated successfully', updatedProduct });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Delete a Product
app.delete('/products/:id', async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id); // Match by product ID
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product deleted successfully', deletedProduct });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Place an Order
app.post('/orders', async (req, res) => {
  try {
    const { userId, items, totalAmount, deliveryAddress } = req.body;

    // Debugging logs
    console.log('Received order data:', { userId, items, totalAmount, deliveryAddress });

    if (!userId || !items || items.length === 0 || !totalAmount || !deliveryAddress) {
      return res.status(400).json({ error: 'Missing required fields in order data.' });
    }

    const newOrder = new Order({
      userId,
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      })),
      totalAmount,
      deliveryAddress,
    });

    await newOrder.save();
    res.status(201).json({ message: 'Order placed successfully' });
  } catch (err) {
    console.error('Error placing order:', err);
    res.status(500).json({ error: 'Failed to place the order. Please check the server logs.' });
  }
});



// Get All Orders for a User
app.get('/orders/:userId', async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId }).populate('items.productId');
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start the Server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
