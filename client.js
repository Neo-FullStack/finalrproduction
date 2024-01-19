const ws = new WebSocket('ws://localhost:3000'); // Adjust the URL based on your server location

ws.onopen = () => {
  console.log('WebSocket connection opened.');
};

ws.onmessage = (event) => {
  console.log('Received message:', event.data);
  const orders = JSON.parse(event.data);
  updateOrders(orders);
};

ws.onclose = () => {
  console.log('WebSocket connection closed.');
  // Handle the closed connection (e.g., attempt to reconnect)
};

function sendMessage(message) {
  ws.send(JSON.stringify(message));
}

function updateOrders(orders) {
  const orderHistoryTable = document.getElementById('orderHistory').getElementsByTagName('tbody')[0];
  orderHistoryTable.innerHTML = ''; // Clear previous orders

  orders.forEach((order) => {
    const newRow = orderHistoryTable.insertRow(0);

    const cells = [
      order.date,
      order.accountManager,
      order.materialCut,
      order.specialCut,
      order.labelType,
      order.coreSize,
      order.width,
      order.length,
      order.labelsPerRoll,
      order.rollsQuantity,
      order.comment,
      getStatusButton(order),
      getActionButtons(order.id),

    ];

    cells.forEach((value, index) => {
      const cell = newRow.insertCell(index);
      cell.innerHTML = value;
    });
  });
}

function getStatusButton(order) {
    const statusButton = document.createElement('button');
    statusButton.innerText = order.status || 'Pending';
    statusButton.disabled = true; // Disable the button, status is not editable by the client
    statusButton.style.backgroundColor = getStatusColor(order.status);
    return statusButton.outerHTML;
  }
  
  function getStatusColor(status) {
    switch (status) {
      case 'Completed':
        return '#4CAF50'; // Green
      case 'Busy':
        return '#ff8c00'; // dark orange
      default:
        return ''; // No color for 'Pending'
    }
  }
  
  function getActionButtons(orderId) {
    return `<button onclick="markOrderCompleted('${orderId}')">Completed</button>` +
           `<button onclick="markOrderBusy('${orderId}')">Busy</button>` +
           `<button onclick="deleteOrder('${orderId}')">Delete</button>`;
  }
  
  function markOrderCompleted(orderId) {
    const message = {
      type: 'markOrderCompleted',
      data: orderId,
    };
    sendMessage(message);
  }
  
  function markOrderBusy(orderId) {
    const message = {
      type: 'markOrderBusy',
      data: orderId,
    };
    sendMessage(message);
  }
  
  function deleteOrder(orderId) {
    const message = {
      type: 'deleteOrder',
      data: orderId,
    };
    sendMessage(message);
  }
function markOrderBusy(orderId) {
  const message = {
    type: 'markOrderBusy',
    data: orderId,
  };
  sendMessage(message);
}

function saveOrderHistory() {
  const orderHistoryTable = document.getElementById('orderHistory');
  const orderHistoryHtml = orderHistoryTable.outerHTML;

  const blob = new Blob([orderHistoryHtml], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'order_history.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}


function placeOrder() {
  const accountManager = document.getElementById('accountManager').value;
  const materialCut = document.getElementById('materialCut').value;
  const specialCut = document.getElementById('specialCut').value;
  const labelType = document.getElementById('labelType').value;
  const coreSize = document.getElementById('coreSize').value;
  const width = document.getElementById('width').value;
  const length = document.getElementById('length').value;
  const labelsPerRoll = document.getElementById('labelsPerRoll').value;
  const rollsQuantity = document.getElementById('rollsQuantity').value;
  const comment = document.getElementById('comment').value;

  const currentDate = new Date();
  const formattedDate = currentDate.toISOString().slice(0, 10);

  const orderDetails = {
    id: new Date().getTime().toString(),
    date: formattedDate,
    accountManager,
    materialCut,
    specialCut,
    labelType,
    coreSize,
    width,
    length,
    labelsPerRoll,
    rollsQuantity,
    comment,
    status: 'Pending',
  };

  const message = {
    type: 'placeOrder',
    data: orderDetails,
  };

  sendMessage(message);
}