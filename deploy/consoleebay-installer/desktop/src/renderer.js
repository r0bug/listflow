// Renderer process for the dashboard
const API_BASE = 'http://localhost:3001/api'; // Will be dynamic based on selected server
let currentServer = null;
let refreshInterval = null;
let socket = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
    await initializeApp();
    setupEventListeners();
    startAutoRefresh();
    connectWebSocket();
});

async function initializeApp() {
    // Get current server configuration
    currentServer = await window.api.getCurrentServer();
    if (currentServer) {
        document.getElementById('serverName').textContent = currentServer.name;
        updateServerStatus(true);
    }
    
    // Load initial data
    await refreshDashboard();
    
    // Initialize charts
    initializeCharts();
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.dataset.view;
            switchView(view);
        });
    });
    
    // Listen for menu actions from main process
    window.api.onMenuAction((action) => {
        handleMenuAction(action);
    });
    
    window.api.onNavigate((view) => {
        switchView(view);
    });
    
    window.api.onWorkflowAction((action) => {
        handleWorkflowAction(action);
    });
    
    window.api.onServerChanged((server) => {
        currentServer = server;
        document.getElementById('serverName').textContent = server.name;
        refreshDashboard();
    });
}

function switchView(viewName) {
    // Hide all views
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    // Show selected view
    const view = document.getElementById(`${viewName}-view`);
    if (view) {
        view.classList.add('active');
    }
    
    // Highlight nav item
    const navItem = document.querySelector(`.nav-item[data-view="${viewName}"]`);
    if (navItem) {
        navItem.classList.add('active');
    }
    
    // Load view-specific data
    loadViewData(viewName);
}

async function loadViewData(viewName) {
    switch(viewName) {
        case 'dashboard':
            await refreshDashboard();
            break;
        case 'queue':
            await loadQueueData();
            break;
        case 'users':
            await loadActiveUsers();
            break;
        case 'accounts':
            await loadEbayAccounts();
            break;
        case 'photo-upload':
            await launchPhotoUpload();
            break;
        case 'processing':
            await launchProcessing();
            break;
    }
}

async function refreshDashboard() {
    try {
        const baseUrl = currentServer ? currentServer.url : API_BASE;
        
        // Fetch workflow statistics
        const statsResponse = await fetch(`${baseUrl}/workflow/stats`);
        const stats = await statsResponse.json();
        
        if (stats.success) {
            updateStatistics(stats.data);
        }
        
        // Fetch queue data
        const queueResponse = await fetch(`${baseUrl}/workflow/stage/all`);
        const queueData = await queueResponse.json();
        
        if (queueData.success) {
            updateWorkflowStages(queueData.data);
        }
        
        // Fetch active users
        const usersResponse = await fetch(`${baseUrl}/users/active`);
        const usersData = await usersResponse.json();
        
        if (usersData.success) {
            updateActiveUsers(usersData.data);
        }
        
        // Update last refresh time
        const now = new Date();
        document.getElementById('lastUpdate').textContent = 
            now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        
        updateServerStatus(true);
    } catch (error) {
        console.error('Error refreshing dashboard:', error);
        updateServerStatus(false);
    }
}

function updateStatistics(stats) {
    // Update stat cards
    document.getElementById('unprocessedPhotos').textContent = 
        stats.byStage?.PHOTO_UPLOAD || 0;
    
    document.getElementById('processedToday').textContent = 
        stats.todayProcessed || 0;
    
    const totalInQueue = Object.values(stats.byStage || {})
        .reduce((sum, count) => sum + count, 0);
    document.getElementById('queueCount').textContent = totalInQueue;
    
    // Update queue trend
    const pendingCount = totalInQueue - (stats.byStage?.PUBLISHED || 0);
    document.getElementById('queueTrend').textContent = `${pendingCount}`;
}

function updateWorkflowStages(data) {
    const stages = {
        PHOTO_UPLOAD: { element: 'stagePhotoUpload', progress: 'progressPhotoUpload' },
        AI_PROCESSING: { element: 'stageAIProcessing', progress: 'progressAIProcessing' },
        REVIEW_EDIT: { element: 'stageReviewEdit', progress: 'progressReviewEdit' },
        PRICING: { element: 'stagePricing', progress: 'progressPricing' },
        FINAL_REVIEW: { element: 'stagePublishing', progress: 'progressPublishing' }
    };
    
    let total = 0;
    const counts = {};
    
    // Count items by stage
    data.forEach(item => {
        counts[item.stage] = (counts[item.stage] || 0) + 1;
        total++;
    });
    
    // Update stage cards
    Object.keys(stages).forEach(stage => {
        const count = counts[stage] || 0;
        const percentage = total > 0 ? (count / total * 100) : 0;
        
        document.getElementById(stages[stage].element).textContent = count;
        document.getElementById(stages[stage].progress).style.width = `${percentage}%`;
    });
}

function updateActiveUsers(users) {
    const onlineCount = users.filter(u => u.isOnline).length;
    document.getElementById('activeUsers').textContent = onlineCount;
    
    // Count unique locations
    const locations = new Set(users.map(u => u.locationId).filter(Boolean));
    document.getElementById('userLocations').textContent = `${locations.size}`;
}

function updateServerStatus(isOnline) {
    const statusDot = document.getElementById('serverStatus');
    statusDot.className = `status-dot ${isOnline ? 'online' : 'offline'}`;
}

async function loadQueueData() {
    try {
        const baseUrl = currentServer ? currentServer.url : API_BASE;
        const filter = document.getElementById('queueFilter').value;
        const endpoint = filter === 'all' ? 
            `${baseUrl}/workflow/stage/all` : 
            `${baseUrl}/workflow/stage/${filter}`;
        
        const response = await fetch(endpoint);
        const data = await response.json();
        
        if (data.success) {
            populateQueueTable(data.data);
        }
    } catch (error) {
        console.error('Error loading queue:', error);
    }
}

function populateQueueTable(items) {
    const tbody = document.getElementById('queueTableBody');
    tbody.innerHTML = '';
    
    items.forEach(item => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${item.id.substring(0, 8)}</td>
            <td>${item.sku || '-'}</td>
            <td>${item.title || 'Untitled'}</td>
            <td><span class="stage-badge stage-${item.stage.toLowerCase()}">${item.stage}</span></td>
            <td>${item.location?.name || '-'}</td>
            <td>${item.ebayAccount?.accountName || '-'}</td>
            <td>${new Date(item.createdAt).toLocaleDateString()}</td>
            <td>
                <button class="btn-small" onclick="processItem('${item.id}')">Process</button>
                <button class="btn-small" onclick="viewItem('${item.id}')">View</button>
            </td>
        `;
    });
}

// Chart initialization
function initializeCharts() {
    // Processing trend chart
    const trendCtx = document.getElementById('trendChart').getContext('2d');
    new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Items Processed',
                data: [12, 19, 15, 25, 22, 30, 28],
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    
    // Location distribution chart
    const locationCtx = document.getElementById('locationChart').getContext('2d');
    new Chart(locationCtx, {
        type: 'doughnut',
        data: {
            labels: ['New York', 'Los Angeles', 'Chicago', 'Houston'],
            datasets: [{
                data: [30, 25, 20, 25],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 206, 86, 0.8)',
                    'rgba(75, 192, 192, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// WebSocket connection for real-time updates
function connectWebSocket() {
    const wsUrl = currentServer ? 
        currentServer.url.replace('http', 'ws') : 
        'ws://localhost:3001';
    
    socket = io(wsUrl);
    
    socket.on('connect', () => {
        console.log('WebSocket connected');
        updateServerStatus(true);
    });
    
    socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
        updateServerStatus(false);
    });
    
    socket.on('item-updated', (data) => {
        // Real-time item updates
        if (document.querySelector('#queue-view.active')) {
            loadQueueData();
        }
        refreshDashboard();
    });
    
    socket.on('user-activity', (data) => {
        // Update active users in real-time
        updateActiveUsers(data.users);
    });
    
    socket.on('stats-update', (data) => {
        // Update statistics in real-time
        updateStatistics(data);
    });
}

// Auto-refresh functionality
function startAutoRefresh() {
    const interval = 30000; // 30 seconds
    refreshInterval = setInterval(() => {
        if (document.querySelector('#dashboard-view.active')) {
            refreshDashboard();
        }
    }, interval);
}

// Action handlers
async function launchStage(stage) {
    console.log(`Launching ${stage}`);
    // This would open the appropriate interface for the stage
    // Could be a new window, embedded view, or external application
    
    switch(stage) {
        case 'photo-upload':
            // Open photo upload interface
            window.open(`${currentServer.url}/photo-upload`, '_blank');
            break;
        case 'processing':
            // Launch processing interface
            switchView('processing');
            break;
        case 'review':
            // Launch review interface
            window.api.launchStage('review-edit');
            break;
        case 'pricing':
            // Launch pricing interface
            window.api.launchStage('pricing');
            break;
    }
}

async function processItem(itemId) {
    try {
        const baseUrl = currentServer ? currentServer.url : API_BASE;
        const response = await fetch(`${baseUrl}/workflow/item/${itemId}/advance`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': 'current-user-id' // Would come from auth
            }
        });
        
        const result = await response.json();
        if (result.success) {
            loadQueueData();
            refreshDashboard();
        }
    } catch (error) {
        console.error('Error processing item:', error);
    }
}

function viewItem(itemId) {
    // Open item detail view
    console.log(`Viewing item ${itemId}`);
}

function filterQueue() {
    loadQueueData();
}

function refreshQueue() {
    loadQueueData();
}

// Handle menu actions
function handleMenuAction(action) {
    switch(action) {
        case 'new-item':
            createNewItem();
            break;
        case 'refresh':
            refreshDashboard();
            break;
        case 'add-server':
            showAddServerDialog();
            break;
        case 'server-status':
            showServerStatus();
            break;
        case 'show-shortcuts':
            showKeyboardShortcuts();
            break;
    }
}

// Handle workflow actions
function handleWorkflowAction(action) {
    switch(action) {
        case 'process-next':
            processNextItem();
            break;
        case 'skip':
            skipCurrentItem();
            break;
    }
}

// Cleanup on window close
window.addEventListener('beforeunload', () => {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    if (socket) {
        socket.disconnect();
    }
});