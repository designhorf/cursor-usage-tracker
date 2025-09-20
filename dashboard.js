// dashboard.js - Complete dashboard with time range selector
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Dashboard loaded');
    await loadDashboard();
});

let currentTimeRange = 30; // Default to 30 days

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
                <h3>📊 Quick Overview</h3>
                <div class="stat-row">
                    <span class="stat-label">Last Updated</span>
                    <span class="stat-value">${formatDate(lastUpdated)}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Data Source</span>
                    <span class="stat-value">Cursor Dashboard</span>
                </div>
                <button class="btn" onclick="extractFromCursor()">🔄 Refresh Data</button>
            </div>

            <div class="card">
                <h3>⏰ Time Range Selector</h3>
                <div class="time-range-buttons">
                    <button class="time-btn ${currentTimeRange === 30 ? 'active' : ''}" onclick="changeTimeRange(30)">30 Days</button>
                    <button class="time-btn ${currentTimeRange === 60 ? 'active' : ''}" onclick="changeTimeRange(60)">60 Days</button>
                    <button class="time-btn ${currentTimeRange === 90 ? 'active' : ''}" onclick="changeTimeRange(90)">90 Days</button>
                    <button class="time-btn ${currentTimeRange === 'all' ? 'active' : ''}" onclick="changeTimeRange('all')">All Time</button>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Showing Data For</span>
                    <span class="stat-value">${currentTimeRange === 'all' ? 'All Time' : `Last ${currentTimeRange} Days`}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Events in Range</span>
                    <span class="stat-value">${processedData.usageEvents.length}</span>
                </div>
            </div>
        </div>

        <div class="card">
            <h3>📅 Billing Period</h3>
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
                    <div class="label">Used (${currentTimeRange === 'all' ? 'All Time' : currentTimeRange + 'd'})</div>
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
                <h3>💰 Cost Analysis</h3>
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
                <h3>🔢 Token Metrics</h3>
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
            <h3>📈 Activity Summary (${currentTimeRange === 'all' ? 'All Time' : 'Last ' + currentTimeRange + ' Days'})</h3>
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
            ✅ Dashboard loaded with ${processedData.costs.length} cost entries and ${processedData.tokens.length} token entries from the last ${currentTimeRange === 'all' ? 'all time' : currentTimeRange + ' days'}!
        </div>
    `;
}

function changeTimeRange(days) {
    currentTimeRange = days;
    loadDashboard(); // Reload with new time range
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
    const cutoffDate = timeRangeDays === 'all' ? new Date(0) : new Date(now.getTime() - (timeRangeDays * 24 * 60 * 60 * 1000));

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
    
    const avgCostPerDay = processedData.totalCost / Math.max(1, currentTimeRange === 'all' ? 30 : currentTimeRange);
    const avgTokensPerDay = processedData.totalTokens / Math.max(1, currentTimeRange === 'all' ? 30 : currentTimeRange);
    const avgEventsPerDay = processedData.usageEvents.length / Math.max(1, currentTimeRange === 'all' ? 30 : currentTimeRange);
    
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
