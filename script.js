// Function to handle login form submission
function handleLogin(event) {
  event.preventDefault();

  var username = document.getElementById('username').value;
  var password = document.getElementById('password').value;
  const SERVER_BASE_URL = 'http://138.197.169.145:3000';

  // Perform login validation
  if (username === 'admin' && password === 'admin') {
    // Successful login
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('serverListPage').style.display = 'block';
    fetchServers(); // Fetch the list of servers from the API
  } else {
    // Invalid credentials
    alert('Invalid username or password');
  }
}

// Function to fetch servers from the API
function fetchServers() {
  fetch('${SERVER_BASE_URL}/servers', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + localStorage.getItem('token')
    }
  })
  .then(response => response.json())
  .then(data => {
    populateServerTable(data);
  })
  .catch(error => {
    console.error('Error:', error);
  });
}

// Function to populate the server table with data
function populateServerTable(servers) {
  var tableBody = document.querySelector('#serverTable tbody');
  tableBody.innerHTML = '';

  servers.forEach(server => {
    var row = document.createElement('tr');
    row.innerHTML = `
      <td>${server.serverName}</td>
      <td><img src="${server.serverFlag}" alt="Flag"></td>
      <td>${server.serverIP}</td>
      <td>
        <button onclick="editServer('${server._id}')">Edit</button>
        <button onclick="deleteServer('${server._id}')">Delete</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

// Function to open the add server dialog
function openAddServerDialog() {
  document.getElementById('addServerDialog').style.display = 'block';
}

// Function to close the add server dialog
function closeAddServerDialog() {
  document.getElementById('addServerDialog').style.display = 'none';
}

// Function to add a new server
// Function to add a new server
function addServer() {
    var serverName = document.getElementById('serverName').value;
    var serverFlagImage = document.getElementById('serverFlagImage').files[0];
    var serverIP = document.getElementById('serverIP').value;
    var serverURL = document.getElementById('serverURL').value;
  
    var formData = new FormData();
    formData.append('serverName', serverName);
    formData.append('serverFlagImage', serverFlagImage);
    formData.append('serverIP', serverIP);
    formData.append('url', serverURL);
  
    fetch('${SERVER_BASE_URL}/servers', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      },
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      // Server added successfully
      closeAddServerDialog();
      fetchServers(); // Refresh the server list
    })
    .catch(error => {
      console.error('Error:', error);
    });
  }

// Function to edit a server
function editServer(serverId) {
    // Fetch the server details from the API
    fetch(`${SERVER_BASE_URL}/servers/${serverId}`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      }
    })
    .then(response => response.json())
    .then(server => {
      // Populate the edit form with the server details
      document.getElementById('editServerName').value = server.serverName;
      document.getElementById('editServerFlag').value = server.serverFlag;
      document.getElementById('editServerIP').value = server.serverIP;
      document.getElementById('editServerURL').value = server.url;
  
      // Open the edit server dialog
      document.getElementById('editServerDialog').style.display = 'block';
  
      // Event listener for edit form submission
      document.getElementById('editServerForm').onsubmit = function(event) {
        event.preventDefault();
  
        var serverName = document.getElementById('editServerName').value;
        var serverFlag = document.getElementById('editServerFlag').value;
        var serverIP = document.getElementById('editServerIP').value;
        var serverURL = document.getElementById('editServerURL').value;
  
        // Send the updated server details to the API
        fetch(`${SERVER_BASE_URL}/servers/${serverId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token')
          },
          body: JSON.stringify({
            serverName: serverName,
            serverFlag: serverFlag,
            serverIP: serverIP,
            url: serverURL
          })
        })
        .then(response => response.json())
        .then(data => {
          // Server updated successfully
          closeEditServerDialog();
          fetchServers(); // Refresh the server list
        })
        .catch(error => {
          console.error('Error:', error);
        });
      };
    })
    .catch(error => {
      console.error('Error:', error);
    });
  }
  
  // Function to close the edit server dialog
  function closeEditServerDialog() {
    document.getElementById('editServerDialog').style.display = 'none';
  }

// Function to delete a server
function deleteServer(serverId) {
  fetch(`${SERVER_BASE_URL}/servers/${serverId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': 'Bearer ' + localStorage.getItem('token')
    }
  })
  .then(response => response.json())
  .then(data => {
    // Server deleted successfully
    fetchServers(); // Refresh the server list
  })
  .catch(error => {
    console.error('Error:', error);
  });
}

// Event listener for login form submission
document.getElementById('loginForm').addEventListener('submit', handleLogin);