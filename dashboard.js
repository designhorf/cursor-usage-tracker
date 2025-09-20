// dashboard.js - Complete dashboard with time range selector
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Dashboard loaded');
    await loadDashboard();
    
    // Add event listeners for buttons
    setupEventListeners();
});

let currentTimeRange = 'period'; // Default to current billing period

async function loadDashboard() {
    const loadingDiv = document.getElementById('loading');
    const contentDiv = document.getElementById('dashboard-content');
    const errorDiv = document.getElementById('error-content');

    try {
        // Get stored data
        const result = await chrome.storage.local.get(['cursorData', 'lastUpdated']);
        
        if (result.cursorData && result.cursorData.extracted) {
            loadingDiv.style.display = 'none';
            contentDiv.style.display = 'block';
            displayDashboard(result.cursorData, result.lastUpdated);
        } else {
            loadingDiv.style.display = 'none';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
        loadingDiv.style.display = 'none';
        errorDiv.style.display = 'block';
    }
}

function displayDashboard(data, lastUpdated) {
    const processedData = processRawData(data, currentTimeRange);
    const billingData = calculateBillingPeriod(processedData);
    const subscriptionData = calculateSubscriptionMetrics(processedData, billingData);

    document.getElementById('dashboard-content').innerHTML = `
        <div class="grid-layout">
            <div class="card">
                <h3><svg class="card-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg> Quick Overview</h3>
                <div class="stat-row">
                    <span class="stat-label">Last Updated</span>
                    <span class="stat-value">${formatDate(lastUpdated)}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Data Source</span>
                    <span class="stat-value">Cursor Dashboard</span>
                </div>
                <button class="btn" id="refresh-data-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 4px; vertical-align: middle;">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>Refresh Data</button>
            </div>

            <div class="card">
                <h3><svg class="card-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg> Time Range Selector</h3>
                <div class="time-range-buttons">
                    <button class="time-btn ${currentTimeRange === 'period' ? 'active' : ''}" data-range="period">Current Period</button>
                    <button class="time-btn ${currentTimeRange === 30 || currentTimeRange === '30' ? 'active' : ''}" data-range="30">30 Days</button>
                    <button class="time-btn ${currentTimeRange === 60 || currentTimeRange === '60' ? 'active' : ''}" data-range="60">60 Days</button>
                    <button class="time-btn ${currentTimeRange === 90 || currentTimeRange === '90' ? 'active' : ''}" data-range="90">90 Days</button>
                </div>
                <div class="time-range-display">
                    <span class="time-range-text">${getTimeRangeDisplay(currentTimeRange, billingData)}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Showing Data For</span>
                    <span class="stat-value">${getTimeRangeLabel(currentTimeRange)}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Events in Range</span>
                    <span class="stat-value">${processedData.usageEvents.length}</span>
                </div>
            </div>
        </div>

        <div class="card">
            <h3><svg class="card-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg> Billing Period</h3>
            <div class="stat-row">
                <span class="stat-label">Current Period</span>
                <span class="stat-value">${billingData.periodStartFormatted} - ${billingData.periodEndFormatted}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Days Elapsed</span>
                <span class="stat-value">${billingData.daysElapsed} of ${billingData.totalDays}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Days Remaining</span>
                <span class="stat-value" style="color: ${billingData.daysRemaining <= 7 ? '#e53e3e' : '#38a169'}">${billingData.daysRemaining} days</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Next Billing Date</span>
                <span class="stat-value">${billingData.nextBillingFormatted}</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill billing-progress" style="width: ${billingData.progressPercentage}%"></div>
            </div>
            <div style="text-align: center; font-size: 14px; color: #666; margin-top: 8px;">
                ${billingData.progressPercentage}% through ${billingData.periodMonthYear}
            </div>
        </div>

        ${processedData.plan ? `
        <div class="card">
            <h3>💳 Subscription & Usage</h3>
            <div class="two-column">
                <div class="metric-highlight">
                    <div class="value">$${subscriptionData.subscriptionPrice}</div>
                    <div class="label">${processedData.plan}</div>
                </div>
                <div class="metric-highlight">
                    <div class="value">$${processedData.totalCost.toFixed(2)}</div>
                    <div class="label">Used (${currentTimeRange === 'period' ? 'Current Period' : currentTimeRange + 'd'})</div>
                </div>
            </div>
            
            <div class="stat-row">
                <span class="stat-label">Remaining Budget</span>
                <span class="stat-value" style="color: ${subscriptionData.remainingBudget < 2 ? '#e53e3e' : '#38a169'}">$${subscriptionData.remainingBudget.toFixed(2)}</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${subscriptionData.usagePercentage}%; background: ${subscriptionData.usagePercentage > 80 ? 'linear-gradient(90deg, #f56565, #e53e3e)' : 'linear-gradient(90deg, #48bb78, #38a169)'}"></div>
            </div>
            <div style="text-align: center; font-size: 14px; color: #666; margin-top: 8px;">
                ${subscriptionData.usagePercentage}% of subscription used
            </div>
            
            ${processedData.onDemandUsage ? `
            <div class="stat-row">
                <span class="stat-label">On-Demand Usage</span>
                <span class="stat-value" style="color: ${processedData.onDemandUsage === 'Off' ? '#e53e3e' : '#38a169'}">${processedData.onDemandUsage}</span>
            </div>
            ` : ''}
        </div>
        ` : ''}

        <div class="grid-layout">
            ${processedData.costs.length > 0 ? `
            <div class="card">
                <h3><svg class="card-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg> Cost Analysis</h3>
                <div class="two-column">
                    <div class="metric-highlight">
                        <div class="value">$${subscriptionData.pricePerToken.toFixed(6)}</div>
                        <div class="label">Price/Token</div>
                    </div>
                    <div class="metric-highlight">
                        <div class="value">$${billingData.avgCostPerDay.toFixed(3)}</div>
                        <div class="label">Avg/Day</div>
                    </div>
                </div>
                
                <div class="stat-row">
                    <span class="stat-label">Total Requests</span>
                    <span class="stat-value">${processedData.costs.length}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Avg Cost/Request</span>
                    <span class="stat-value">$${(processedData.totalCost / processedData.costs.length).toFixed(4)}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Most Expensive Request</span>
                    <span class="stat-value">$${Math.max(...processedData.costs).toFixed(3)}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Projected Monthly Cost</span>
                    <span class="stat-value" style="color: ${billingData.projectedMonthlyCost > subscriptionData.subscriptionPrice ? '#e53e3e' : '#38a169'}">$${billingData.projectedMonthlyCost.toFixed(2)}</span>
                </div>
                ${billingData.projectedMonthlyCost > subscriptionData.subscriptionPrice ? `
                    <div class="warning">
                        ⚠️ Projected cost exceeds subscription by $${(billingData.projectedMonthlyCost - subscriptionData.subscriptionPrice).toFixed(2)}
                    </div>
                ` : ''}
            </div>
            ` : ''}

            ${processedData.tokens.length > 0 ? `
            <div class="card">
                <h3><svg class="card-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg> Token Metrics</h3>
                <div class="two-column">
                    <div class="metric-highlight">
                        <div class="value">${(processedData.totalTokens / 1000000).toFixed(2)}M</div>
                        <div class="label">Total Tokens</div>
                    </div>
                    <div class="metric-highlight">
                        <div class="value">${(billingData.avgTokensPerDay / 1000).toFixed(0)}K</div>
                        <div class="label">Avg/Day</div>
                    </div>
                </div>
                
                <div class="stat-row">
                    <span class="stat-label">Token Events</span>
                    <span class="stat-value">${processedData.tokens.length}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Avg Tokens/Request</span>
                    <span class="stat-value">${Math.round(processedData.totalTokens / processedData.tokens.length).toLocaleString()}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Largest Request</span>
                    <span class="stat-value">${Math.max(...processedData.tokens).toLocaleString()} tokens</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Token Efficiency</span>
                    <span class="stat-value">${subscriptionData.tokensPerDollar.toLocaleString()} tokens/$</span>
                </div>
            </div>
            ` : ''}
        </div>

        ${processedData.usageEvents.length > 0 ? `
        <div class="card">
            <h3><svg class="card-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
            </svg> Activity Summary (${currentTimeRange === 'period' ? 'Current Period' : 'Last ' + currentTimeRange + ' Days'})</h3>
            <div class="grid-layout">
                <div>
                    <div class="stat-row">
                        <span class="stat-label">Total Events</span>
                        <span class="stat-value">${processedData.usageEvents.length}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Today's Events</span>
                        <span class="stat-value">${processedData.todayEvents}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Avg Events/Day</span>
                        <span class="stat-value">${billingData.avgEventsPerDay.toFixed(1)}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Error Rate</span>
                        <span class="stat-value" style="color: ${(processedData.errorEvents / processedData.usageEvents.length * 100) > 5 ? '#e53e3e' : '#38a169'}">${((processedData.errorEvents / processedData.usageEvents.length) * 100).toFixed(1)}%</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Date Range</span>
                        <span class="stat-value">${processedData.dateRange}</span>
                    </div>
                </div>
                <div class="activity-scroll">
                    ${processedData.usageEvents.slice(0, 12).map(event => `
                        <div class="activity-item">
                            <strong>${event.tokens}</strong> tokens - <em>${event.cost}</em>
                            <br><span style="color: #666; font-size: 12px;">${event.date} • ${event.model}</span>
                        </div>
                    `).join('')}
                    ${processedData.usageEvents.length > 12 ? `<div style="text-align: center; color: #666; padding: 12px; font-size: 14px;">...and ${processedData.usageEvents.length - 12} more events</div>` : ''}
                </div>
            </div>
        </div>
        ` : ''}

        <div class="success">
            ✓ Dashboard loaded with ${processedData.costs.length} cost entries and ${processedData.tokens.length} token entries from the last ${currentTimeRange === 'period' ? 'billing period' : currentTimeRange + ' days'}!
        </div>
    `;
    
    // Re-setup event listeners for dynamically created buttons
    setupEventListeners();
}

function changeTimeRange(days) {
    console.log('Changing time range to:', days);
    currentTimeRange = days;
    // Get the stored data and refresh display without reloading from storage
    chrome.storage.local.get(['cursorData', 'lastUpdated']).then(result => {
        if (result.cursorData && result.cursorData.extracted) {
            console.log('Refreshing dashboard with new time range:', currentTimeRange);
            displayDashboard(result.cursorData, result.lastUpdated);
        }
    });
}

function getTimeRangeLabel(range) {
    switch(range) {
        case 'period': return 'Current Billing Period';
        default: return `Last ${range} Days`;
    }
}

function getTimeRangeDisplay(range, billingData) {
    switch(range) {
        case 'period': 
            return `${billingData.periodStartFormatted} - ${billingData.periodEndFormatted}`;
        default: 
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - range);
            return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    }
}

function setupEventListeners() {
    // Refresh data button
    const refreshBtn = document.getElementById('refresh-data-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', extractFromCursor);
    }
    
    // Extract data button (from error state)
    const extractBtn = document.getElementById('extract-data-btn');
    if (extractBtn) {
        extractBtn.addEventListener('click', extractFromCursor);
    }
    
    // Close dashboard button
    const closeBtn = document.getElementById('close-dashboard-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => window.close());
    }
    
    // Time range buttons - use event delegation since they're dynamically created
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('time-btn')) {
            const range = e.target.getAttribute('data-range');
            if (range) {
                // Convert string numbers to actual numbers
                const rangeValue = range === 'period' ? 'period' : parseInt(range);
                changeTimeRange(rangeValue);
            }
        }
    });
}

async function extractFromCursor() {
    try {
        const tabs = await chrome.tabs.query({ url: '*://cursor.com/*' });
        if (tabs.length > 0) {
            const tab = tabs[0];
            
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: extractCursorDataFromPage
            });

            if (results[0].result) {
                await chrome.storage.local.set({
                    cursorData: results[0].result,
                    lastUpdated: new Date().toISOString()
                });
                
                await loadDashboard();
            }
        } else {
            alert('Please open cursor.com in a tab first');
        }
    } catch (error) {
        console.error('Error extracting data:', error);
        alert('Error extracting data. Please try again.');
    }
}

// Enhanced data processing with time range filtering
function processRawData(data, timeRangeDays) {
    const processed = {
        plan: data.plan,
        onDemandUsage: data.onDemandUsage,
        hasSubscriptionAccess: data.hasSubscriptionAccess,
        costs: [],
        tokens: [],
        usageEvents: [],
        totalCost: 0,
        totalTokens: 0,
        todayEvents: 0,
        errorEvents: 0,
        eventsByDate: {},
        dateRange: ''
    };

    // Calculate cutoff date for time range filtering
    const now = new Date();
    let cutoffDate;
    
    if (timeRangeDays === 'period') {
        // Calculate billing period start date (15th of current or previous month)
        const currentDay = now.getDate();
        if (currentDay >= 15) {
            cutoffDate = new Date(now.getFullYear(), now.getMonth(), 15);
        } else {
            cutoffDate = new Date(now.getFullYear(), now.getMonth() - 1, 15);
        }
    } else {
        cutoffDate = new Date(now.getTime() - (timeRangeDays * 24 * 60 * 60 * 1000));
    }

    // Process dollar amounts
    if (data.dollarAmounts) {
        processed.costs = data.dollarAmounts.map(amount => 
            parseFloat(amount.replace('$', '').replace(',', ''))
        ).filter(amount => amount > 0);
        processed.totalCost = processed.costs.reduce((sum, cost) => sum + cost, 0);
    }

    let earliestDate = new Date();
    let latestDate = new Date(0);

    // Process table data with time filtering
    if (data.tableData && data.tableData.length > 0) {
        const table = data.tableData[0];
        
        for (let i = 1; i < table.length; i++) {
            const row = table[i];
            if (row.length >= 5) {
                const date = row[0];
                const model = row[1];
                const kind = row[2];
                const tokens = row[3];
                const cost = row[4];

                // Parse date for filtering
                const eventDate = parseEventDate(date);
                
                // Skip events outside time range
                if (eventDate < cutoffDate) continue;

                // Track date range
                if (eventDate < earliestDate) earliestDate = eventDate;
                if (eventDate > latestDate) latestDate = eventDate;

                const dateMatch = date.match(/(\w+ \d+)/);
                if (dateMatch) {
                    const dayKey = dateMatch[1];
                    if (!processed.eventsByDate[dayKey]) {
                        processed.eventsByDate[dayKey] = { events: 0, cost: 0, tokens: 0 };
                    }
                    processed.eventsByDate[dayKey].events++;
                }

                if (tokens && tokens.includes('K')) {
                    const tokenValue = parseFloat(tokens.replace('K', '')) * 1000;
                    processed.tokens.push(tokenValue);
                    processed.totalTokens += tokenValue;
                    
                    if (dateMatch) {
                        processed.eventsByDate[dateMatch[1]].tokens += tokenValue;
                    }
                }

                if (cost && cost.includes('$')) {
                    const costValue = parseFloat(cost.match(/\$(\d+\.\d+)/)?.[1] || 0);
                    if (dateMatch && costValue > 0) {
                        processed.eventsByDate[dateMatch[1]].cost += costValue;
                    }
                }

                // Check if event is today
                const today = new Date();
                if (eventDate.toDateString() === today.toDateString()) {
                    processed.todayEvents++;
                }

                if (kind && kind.includes('Errored')) {
                    processed.errorEvents++;
                }

                processed.usageEvents.push({
                    date: date,
                    model: model,
                    kind: kind,
                    tokens: tokens,
                    cost: cost,
                    eventDate: eventDate
                });
            }
        }
    }

    // Set date range string
    if (processed.usageEvents.length > 0) {
        processed.dateRange = `${formatDateShort(earliestDate)} - ${formatDateShort(latestDate)}`;
    } else {
        processed.dateRange = 'No data in range';
    }

    return processed;
}

function parseEventDate(dateString) {
    // Parse dates like "Sep 20, 07:11 AM" or "Sep 19, 08:42 PM"
    const currentYear = new Date().getFullYear();
    
    // Handle different date formats
    const match = dateString.match(/(\w+)\s+(\d+),?\s+(\d+):(\d+)\s+(AM|PM)/);
    if (match) {
        const [, month, day, hour, minute, ampm] = match;
        
        const monthMap = {
            'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
            'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        };
        
        let hour24 = parseInt(hour);
        if (ampm === 'PM' && hour24 !== 12) hour24 += 12;
        if (ampm === 'AM' && hour24 === 12) hour24 = 0;
        
        return new Date(currentYear, monthMap[month], parseInt(day), hour24, parseInt(minute));
    }
    
    return new Date(); // Fallback to current date
}

function formatDateShort(date) {
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
    });
}

function calculateBillingPeriod(processedData) {
    const today = new Date();
    const currentDay = today.getDate();
    
    let periodStart, periodEnd;
    
    if (currentDay >= 15) {
        periodStart = new Date(today.getFullYear(), today.getMonth(), 15);
        periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 14);
    } else {
        periodStart = new Date(today.getFullYear(), today.getMonth() - 1, 15);
        periodEnd = new Date(today.getFullYear(), today.getMonth(), 14);
    }
    
    const totalDays = Math.ceil((periodEnd - periodStart) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.ceil((today - periodStart) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, totalDays - daysElapsed);
    const progressPercentage = Math.round((daysElapsed / totalDays) * 100);
    
    const avgCostPerDay = processedData.totalCost / Math.max(1, currentTimeRange === 'period' ? 30 : currentTimeRange);
    const avgTokensPerDay = processedData.totalTokens / Math.max(1, currentTimeRange === 'period' ? 30 : currentTimeRange);
    const avgEventsPerDay = processedData.usageEvents.length / Math.max(1, currentTimeRange === 'period' ? 30 : currentTimeRange);
    
    const projectedMonthlyCost = avgCostPerDay * 30;
    const projectedMonthlyTokens = avgTokensPerDay * 30;
    
    return {
        periodStart: periodStart.toLocaleDateString(),
        periodEnd: periodEnd.toLocaleDateString(),
        periodStartFormatted: formatDateWithMonth(periodStart),
        periodEndFormatted: formatDateWithMonth(periodEnd),
        nextBillingFormatted: formatDateWithMonth(new Date(periodEnd.getTime() + 24 * 60 * 60 * 1000)),
        periodMonthYear: periodStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        totalDays: totalDays,
        daysElapsed: daysElapsed,
        daysRemaining: daysRemaining,
        progressPercentage: progressPercentage,
        avgCostPerDay: avgCostPerDay,
        avgTokensPerDay: avgTokensPerDay,
        avgEventsPerDay: avgEventsPerDay,
        projectedMonthlyCost: projectedMonthlyCost,
        projectedMonthlyTokens: projectedMonthlyTokens
    };
}

function formatDateWithMonth(date) {
    return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric',
        year: 'numeric'
    });
}

function calculateSubscriptionMetrics(processedData, billingData) {
    const subscriptionPrices = {
        'Pro Plan': 20,
        'Business Plan': 40,
        'Free Plan': 0,
        'Pro+ Plan': 60,
        'Ultra Plan': 200
    };
    
    const subscriptionPrice = subscriptionPrices[processedData.plan] || 20;
    const remainingBudget = subscriptionPrice - processedData.totalCost;
    const usagePercentage = Math.round((processedData.totalCost / subscriptionPrice) * 100);
    
    const pricePerToken = processedData.totalTokens > 0 ? processedData.totalCost / processedData.totalTokens : 0;
    const tokensPerDollar = processedData.totalCost > 0 ? Math.round(processedData.totalTokens / processedData.totalCost) : 0;
    
    return {
        subscriptionPrice: subscriptionPrice,
        remainingBudget: remainingBudget,
        usagePercentage: Math.min(100, usagePercentage),
        pricePerToken: pricePerToken,
        tokensPerDollar: tokensPerDollar
    };
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
}

function extractCursorDataFromPage() {
    const data = {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        extracted: false
    };

    try {
        const bodyText = document.body.innerText;
        
        if (bodyText.includes('Pro Plan')) {
            data.plan = 'Pro Plan';
        } else if (bodyText.includes('Business Plan')) {
            data.plan = 'Business Plan';
        } else if (bodyText.includes('Free Plan')) {
            data.plan = 'Free Plan';
        }

        if (bodyText.includes('On-Demand Usage is Off')) {
            data.onDemandUsage = 'Off';
        } else if (bodyText.includes('On-Demand Usage is On')) {
            data.onDemandUsage = 'On';
        }

        if (bodyText.includes('Manage Subscription')) {
            data.hasSubscriptionAccess = true;
        }

        const dollarMatches = bodyText.match(/\$[\d,]+\.?\d*/g);
        if (dollarMatches) {
            data.dollarAmounts = dollarMatches;
        }

        const tables = document.querySelectorAll('table');
        data.tableData = [];
        tables.forEach(table => {
            const rows = Array.from(table.querySelectorAll('tr')).map(row => 
                Array.from(row.cells).map(cell => cell.textContent.trim())
            );
            if (rows.length > 0) {
                data.tableData.push(rows);
            }
        });

        const usageElements = document.querySelectorAll('[class*="usage"], [class*="billing"], [class*="token"], [class*="request"]');
        data.usageElements = [];
        usageElements.forEach(el => {
            const text = el.textContent.trim();
            if (text && (text.includes('$') || text.includes('token') || text.includes('request') || /\d+/.test(text))) {
                data.usageElements.push({
                    text: text,
                    className: el.className,
                    tagName: el.tagName
                });
            }
        });

        const progressElements = document.querySelectorAll('[role="progressbar"], [class*="progress"], [class*="percentage"]');
        data.progressData = [];
        progressElements.forEach(el => {
            const value = el.getAttribute('aria-valuenow') || el.getAttribute('value');
            const max = el.getAttribute('aria-valuemax') || el.getAttribute('max');
            if (value && max) {
                data.progressData.push({
                    value: parseInt(value),
                    max: parseInt(max),
                    percentage: Math.round((parseInt(value) / parseInt(max)) * 100)
                });
            }
        });

        data.extracted = true;
        return data;

    } catch (error) {
        console.error('Error extracting data:', error);
        data.error = error.message;
        return data;
    }
}
