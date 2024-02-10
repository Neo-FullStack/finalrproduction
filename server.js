const express = require('express');
const http = require('http');
const path = require('path'); // Import the 'path' module
const WebSocket = require('ws');
const { Client } = require('pg'); 

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

client.connect()
  .then(() => console.log('Connected to PostgreSQL database'))
  .catch(err => console.error('Error connecting to PostgreSQL database:', err));

const indexPath = path.join(__dirname, 'index.html');
const clientScriptPath = path.join(__dirname, 'client.js');

// Serve the HTML file
app.get('/', (req, res) => {
  res.sendFile(indexPath);
});

// Serve the client-side JavaScript file
app.get('/client.js', (req, res) => {
  res.sendFile(clientScriptPath);
});

wss.on('connection', (ws) => {
  console.log('Client connected');

  // Send existing orders to the newly connected client
  getOrders()
    .then(orders => {
      ws.send(JSON.stringify(orders));
    })
    .catch(err => console.error('Error sending orders to client:', err));

  ws.on('message', (message) => {
    const data = JSON.parse(message);

    switch (data.type) {
      case 'placeOrder':
        handlePlaceOrder(data.data);
        break;
      case 'markOrderCompleted':
        handleMarkOrderCompleted(data.data);
        break;
      case 'markOrderBusy':
        handleMarkOrderBusy(data.data);
        break;
      case 'deleteOrder':
        handleDeleteOrder(data.data);
        break;
      default:
        // Handle other message types if needed
        break;
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

async function handlePlaceOrder(orderDetails) {
  try {
    // Insert the new order into the database
    await insertOrder(orderDetails);
    
    // Broadcast updated orders to all clients
    broadcastOrders();
  } catch (error) {
    console.error('Error placing order:', error);
  }
}

async function handleMarkOrderCompleted(orderId) {
  try {
    // Update the status of the order in the database
    await updateOrderStatus(orderId, 'Completed');
    
    // Broadcast updated orders to all clients
    broadcastOrders();
  } catch (error) {
    console.error('Error marking order as completed:', error);
  }
}

async function handleMarkOrderBusy(orderId) {
  try {
    // Update the status of the order in the database
    await updateOrderStatus(orderId, 'Busy');
    
    // Broadcast updated orders to all clients
    broadcastOrders();
  } catch (error) {
    console.error('Error marking order as busy:', error);
  }
}

async function handleDeleteOrder(orderId) {
  try {
    // Delete the order from the database
    await deleteOrder(orderId);
    
    // Broadcast updated orders to all clients
    broadcastOrders();
  } catch (error) {
    console.error('Error deleting order:', error);
  }
}

async function getOrders() {
  try {
    // Retrieve orders from the database
    const res = await client.query('SELECT * FROM orders');
    return res.rows;
  } catch (error) {
    console.error('Error retrieving orders:', error);
    return [];
  }
}

function broadcastOrders() {
  getOrders()
    .then(orders => {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(orders));
        }
      });
    })
    .catch(err => console.error('Error broadcasting orders:', err));
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
