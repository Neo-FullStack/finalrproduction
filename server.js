const express = require('express');
const http = require('http');
const path = require('path'); // Import the 'path' module
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const orders = [];

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
  ws.send(JSON.stringify(orders));

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

function handlePlaceOrder(orderDetails) {
    const newOrder = {
      ...orderDetails,
      id: generateOrderId(),
      status: 'Pending',
    };
    orders.unshift(newOrder);
  
    broadcastOrders();
  }
  
  function handleMarkOrderCompleted(orderId) {
    const order = findOrderById(orderId);
    if (order) {
      order.status = 'Completed';
      broadcastOrders();
    }
  }
  
  function handleMarkOrderBusy(orderId) {
    const order = findOrderById(orderId);
    if (order) {
      order.status = 'Busy';
      broadcastOrders();
    }
  }
  
  function handleDeleteOrder(orderId) {
    const orderIndex = findOrderIndexById(orderId);
    if (orderIndex !== -1) {
      orders.splice(orderIndex, 1);
      broadcastOrders();
    }
  }
  
  function findOrderById(orderId) {
    return orders.find(order => order.id === orderId);
  }
  
  function findOrderIndexById(orderId) {
    return orders.findIndex(order => order.id === orderId);
  }
  
  function generateOrderId() {
    return Math.random().toString(36).substring(7);
  }
  
  function broadcastOrders() {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(orders));
      }
    });
  }
  
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });