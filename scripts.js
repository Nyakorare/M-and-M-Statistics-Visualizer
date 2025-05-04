let mmChart = null; // Global variable to store the chart instance
let lastPackOpenTime = 0;
const PACK_COOLDOWN = 5000; // 5 second cooldown
let cooldownInterval = null;

function switchTab(tabName) {
  // Hide all tab contents
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.add('hidden');
  });
  
  // Remove active class from all tab buttons
  document.querySelectorAll('.tab-button').forEach(button => {
    button.classList.remove('active', 'text-purple-600', 'border-purple-600');
    button.classList.add('text-gray-500');
  });
  
  // Show selected tab content
  document.getElementById(`${tabName}-tab`).classList.remove('hidden');
  
  // Activate selected tab button
  const activeButton = document.querySelector(`.tab-button[onclick="switchTab('${tabName}')"]`);
  activeButton.classList.add('active', 'text-purple-600', 'border-purple-600');
  activeButton.classList.remove('text-gray-500');
}

function createBarGraph(data) {
  const ctx = document.getElementById('mmChart').getContext('2d');
  const isDarkMode = document.documentElement.classList.contains('dark');
  const graphType = document.getElementById('graphType').value;
  const dataType = document.getElementById('graphData').value;
  
  const textColor = isDarkMode ? '#e5e7eb' : '#374151';
  const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  
  if (mmChart) {
    mmChart.destroy();
  }

  // Calculate total for percentages
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  
  // Prepare data based on selected type
  let chartData;
  if (dataType === 'percentage') {
    chartData = Object.entries(data).map(([color, count]) => ({
      color,
      value: (count / total * 100).toFixed(1)
    }));
  } else if (dataType === 'cumulative') {
    let cumulative = 0;
    chartData = Object.entries(data).map(([color, count]) => {
      cumulative += count;
      return {
        color,
        value: cumulative
      };
    });
  } else {
    chartData = Object.entries(data).map(([color, count]) => ({
      color,
      value: count
    }));
  }

  const colors = {
    Red: 'rgba(233, 30, 99, 0.7)',
    Green: 'rgba(76, 175, 80, 0.7)',
    Blue: 'rgba(33, 150, 243, 0.7)',
    Yellow: 'rgba(255, 235, 59, 0.7)',
    Orange: 'rgba(255, 152, 0, 0.7)',
    Brown: 'rgba(121, 85, 72, 0.7)'
  };

  const borderColors = {
    Red: 'rgba(233, 30, 99, 1)',
    Green: 'rgba(76, 175, 80, 1)',
    Blue: 'rgba(33, 150, 243, 1)',
    Yellow: 'rgba(255, 235, 59, 1)',
    Orange: 'rgba(255, 152, 0, 1)',
    Brown: 'rgba(121, 85, 72, 1)'
  };

  const config = {
    type: graphType,
    data: {
      labels: chartData.map(item => item.color),
      datasets: [{
        label: dataType === 'percentage' ? 'Percentage (%)' : 
               dataType === 'cumulative' ? 'Cumulative Count' : 'Count',
        data: chartData.map(item => parseFloat(item.value)),
        backgroundColor: chartData.map(item => colors[item.color]),
        borderColor: chartData.map(item => borderColors[item.color]),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: graphType === 'pie' ? {} : {
        y: {
          beginAtZero: true,
          ticks: {
            color: textColor,
            callback: dataType === 'percentage' ? value => value + '%' : undefined
          },
          grid: {
            color: gridColor
          }
        },
        x: {
          ticks: {
            color: textColor
          },
          grid: {
            color: gridColor
          }
        }
      },
      plugins: {
        legend: {
          labels: {
            color: textColor
          }
        },
        tooltip: {
          backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              const value = context.raw;
              const label = context.dataset.label || '';
              return `${label}: ${value}${dataType === 'percentage' ? '%' : ''}`;
            }
          }
        }
      }
    }
  };

  mmChart = new Chart(ctx, config);
}

function generateInsights(data, stats) {
  const insights = [];
  const total = stats.total;
  
  // Calculate percentages
  const percentages = {};
  Object.entries(data).forEach(([color, count]) => {
    percentages[color] = (count / total * 100).toFixed(1);
  });
  
  // Find most and least common colors
  const sortedColors = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const mostCommon = sortedColors[0];
  const leastCommon = sortedColors[sortedColors.length - 1];
  
  // Generate insights
  insights.push(`<div class="insight-item p-3 md:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-3 md:mb-4">
    <h3 class="font-semibold text-black dark:text-white mb-1 md:mb-2 text-sm md:text-base">Distribution Overview</h3>
    <p class="text-black dark:text-white text-sm md:text-base">You have a total of ${total} M&Ms, with ${mostCommon[0]} being the most common (${percentages[mostCommon[0]]}%) and ${leastCommon[0]} being the least common (${percentages[leastCommon[0]]}%).</p>
  </div>`);
  
  // Add insights about distribution
  if (stats.stdDev > 10) {
    insights.push(`<div class="insight-item p-3 md:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-3 md:mb-4">
      <h3 class="font-semibold text-black dark:text-white mb-1 md:mb-2 text-sm md:text-base">Distribution Analysis</h3>
      <p class="text-black dark:text-white text-sm md:text-base">The high standard deviation (${stats.stdDev.toFixed(2)}) suggests that the M&Ms are not evenly distributed across colors.</p>
    </div>`);
  } else {
    insights.push(`<div class="insight-item p-3 md:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-3 md:mb-4">
      <h3 class="font-semibold text-black dark:text-white mb-1 md:mb-2 text-sm md:text-base">Distribution Analysis</h3>
      <p class="text-black dark:text-white text-sm md:text-base">The relatively low standard deviation (${stats.stdDev.toFixed(2)}) indicates a fairly even distribution of M&Ms across colors.</p>
    </div>`);
  }
  
  // Add insights about specific colors
  const colorInsights = [];
  Object.entries(percentages).forEach(([color, percentage]) => {
    if (parseFloat(percentage) > 20) {
      colorInsights.push(`<div class="flex items-center mb-2">
        <span class="mm-icon ${color.toLowerCase()} mr-2"></span>
        <span class="text-black dark:text-white text-sm md:text-base">${color} M&Ms make up ${percentage}% of your total, which is significantly higher than the expected average of 16.67%.</span>
      </div>`);
    } else if (parseFloat(percentage) < 10) {
      colorInsights.push(`<div class="flex items-center mb-2">
        <span class="mm-icon ${color.toLowerCase()} mr-2"></span>
        <span class="text-black dark:text-white text-sm md:text-base">${color} M&Ms make up only ${percentage}% of your total, which is significantly lower than the expected average of 16.67%.</span>
      </div>`);
    }
  });
  
  if (colorInsights.length > 0) {
    insights.push(`<div class="insight-item p-3 md:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-3 md:mb-4">
      <h3 class="font-semibold text-black dark:text-white mb-1 md:mb-2 text-sm md:text-base">Color Analysis</h3>
      ${colorInsights.join('')}
    </div>`);
  }
  
  document.getElementById('insights').innerHTML = insights.join('');
}

function calculateStats() {
  // Reset modal state if it's open
  const modal = document.getElementById("modal");
  if (!modal.classList.contains('hidden')) {
    closeModal();
    setTimeout(() => {
      // Reopen after a brief delay to ensure clean state
      calculateStats();
    }, 350);
    return;
  }

  const form = document.getElementById("mmForm");
  const data = {};
  const counts = [];

  // Collect form data and update simulations
  for (const element of form.elements) {
    if (element.name) {
      const val = parseInt(element.value) || 0;
      if (val < 0) {
        alert(`Please enter a valid number for ${element.name}`);
        return;
      }
      data[element.name] = val;
      counts.push(val);
      
      // Update simulation animation
      const simulation = element.nextElementSibling;
      if (simulation) {
        simulation.style.animationDuration = `${Math.max(1, 5 - val/10)}s`;
      }
    }
  }

  // Calculate statistics
  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) {
    alert("Please enter at least some M&Ms to calculate statistics!");
    return;
  }

  const mean = total / counts.length;
  const sortedCounts = [...counts].sort((a, b) => a - b);
  const median = sortedCounts.length % 2 === 0 
    ? (sortedCounts[sortedCounts.length/2 - 1] + sortedCounts[sortedCounts.length/2]) / 2 
    : sortedCounts[Math.floor(sortedCounts.length/2)];

  const freqMap = {};
  for (const val of counts) {
    freqMap[val] = (freqMap[val] || 0) + 1;
  }

  const maxFreq = Math.max(...Object.values(freqMap));
  const mode = Object.keys(freqMap).filter(k => freqMap[k] === maxFreq).join(', ');
  const variance = counts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / counts.length;
  const stdDev = Math.sqrt(variance);

  // Display Results in Modal
  const output = document.getElementById("output");
  output.innerHTML = `
    <div class="stat-item flex justify-between py-2 border-b border-gray-100">
      <span class="stat-label font-medium">Total Count:</span>
      <span class="stat-value font-bold text-purple-600">${total}</span>
    </div>
    <div class="stat-item flex justify-between py-2 border-b border-gray-100">
      <span class="stat-label font-medium">Mean:</span>
      <span class="stat-value font-bold text-purple-600">${mean.toFixed(2)}</span>
    </div>
    <div class="stat-item flex justify-between py-2 border-b border-gray-100">
      <span class="stat-label font-medium">Median:</span>
      <span class="stat-value font-bold text-purple-600">${median.toFixed(2)}</span>
    </div>
    <div class="stat-item flex justify-between py-2 border-b border-gray-100">
      <span class="stat-label font-medium">Mode:</span>
      <span class="stat-value font-bold text-purple-600">${mode}</span>
    </div>
    <div class="stat-item flex justify-between py-2 border-b border-gray-100">
      <span class="stat-label font-medium">Variance:</span>
      <span class="stat-value font-bold text-purple-600">${variance.toFixed(2)}</span>
    </div>
    <div class="stat-item flex justify-between py-2">
      <span class="stat-label font-medium">Standard Deviation:</span>
      <span class="stat-value font-bold text-purple-600">${stdDev.toFixed(2)}</span>
    </div>
  `;

  // Create bar graph
  createBarGraph(data);
  
  // Generate insights
  generateInsights(data, { total, stdDev });

  // Show modal with animation
  modal.classList.remove("hidden");
  const modalContent = modal.querySelector('.animate__zoomIn');
  modalContent.classList.remove('animate__zoomOut');
  modalContent.classList.add('animate__animated', 'animate__zoomIn');
  
  // Switch to stats tab by default
  switchTab('stats');
}

function closeModal() {
  const modal = document.getElementById("modal");
  const modalContent = modal.querySelector('.animate__zoomIn');
  
  // Remove zoomIn class and add zoomOut
  modalContent.classList.remove('animate__zoomIn');
  modalContent.classList.add('animate__zoomOut');
  
  // Wait for animation to complete before hiding modal
  setTimeout(() => {
    modal.classList.add('hidden');
    // Reset animation classes for next time
    modalContent.classList.remove('animate__zoomOut');
    modalContent.classList.add('animate__zoomIn');
  }, 300); // Match this with the animation duration in CSS
}

function showConfirmModal() {
  const modal = document.getElementById('confirmModal');
  const modalContent = modal.querySelector('.animate__zoomIn');
  
  // Reset any existing animations
  modalContent.classList.remove('animate__zoomOut');
  
  // Show modal and add animation
  modal.classList.remove('hidden');
  modalContent.classList.add('animate__animated', 'animate__zoomIn');
}

function closeConfirmModal() {
  const modal = document.getElementById('confirmModal');
  const modalContent = modal.querySelector('.animate__zoomIn');
  
  // Remove zoomIn and add zoomOut animation
  modalContent.classList.remove('animate__zoomIn');
  modalContent.classList.add('animate__zoomOut');
  
  // Hide modal after animation completes
  setTimeout(() => {
    modal.classList.add('hidden');
    modalContent.classList.remove('animate__zoomOut');
  }, 300);
}

function confirmOpenPack() {
  const confirmModal = document.getElementById('confirmModal');
  const modalContent = confirmModal.querySelector('.animate__zoomIn');
  
  // Remove zoomIn and add zoomOut animation
  modalContent.classList.remove('animate__zoomIn');
  modalContent.classList.add('animate__zoomOut');
  
  // Hide modal after animation completes
  setTimeout(() => {
    confirmModal.classList.add('hidden');
    modalContent.classList.remove('animate__zoomOut');
    // Now open the new pack after the modal is fully closed
    openRandomPack();
  }, 300);
}

function hasExistingValues() {
  const form = document.getElementById('mmForm');
  for (const element of form.elements) {
    if (element.name && element.value && parseInt(element.value) > 0) {
      return true;
    }
  }
  return false;
}

function updateCooldownTimer() {
  const now = Date.now();
  const timeLeft = Math.ceil((PACK_COOLDOWN - (now - lastPackOpenTime)) / 1000);
  
  if (timeLeft > 0) {
    document.getElementById('cooldownTimer').classList.remove('hidden');
    document.getElementById('cooldownSeconds').textContent = timeLeft;
    document.getElementById('openPackBtn').disabled = true;
  } else {
    document.getElementById('cooldownTimer').classList.add('hidden');
    document.getElementById('openPackBtn').disabled = false;
    clearInterval(cooldownInterval);
    cooldownInterval = null;
  }
}

function openRandomPack() {
  const now = Date.now();
  if (now - lastPackOpenTime < PACK_COOLDOWN) {
    return; // Ignore if still in cooldown
  }

  // Reset any existing modal state
  const modal = document.getElementById("modal");
  if (!modal.classList.contains('hidden')) {
    closeModal();
  }

  const colors = ['Red', 'Green', 'Blue', 'Yellow', 'Orange', 'Brown'];
  const totalMms = 50;
  let remaining = totalMms;
  const counts = {};
  
  // Generate random counts for first 5 colors
  for (let i = 0; i < colors.length - 1; i++) {
    // Ensure we leave enough for remaining colors
    const max = remaining - (colors.length - i - 1);
    const min = 1;
    const count = Math.floor(Math.random() * (max - min + 1)) + min;
    counts[colors[i]] = count;
    remaining -= count;
  }
  
  // Last color gets whatever is remaining
  counts[colors[colors.length - 1]] = remaining;
  
  // Update the form inputs
  const form = document.getElementById("mmForm");
  for (const element of form.elements) {
    if (element.name) {
      element.value = counts[element.name];
      
      // Trigger input event to update simulations
      const event = new Event('input', { bubbles: true });
      element.dispatchEvent(event);
    }
  }
  
  // Add animation effect
  const button = document.getElementById('openPackBtn');
  button.classList.add('animate__animated', 'animate__rubberBand');
  setTimeout(() => {
    button.classList.remove('animate__animated', 'animate__rubberBand');
  }, 1000);
  
  // Show a brief notification
  const notification = document.createElement('div');
  notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate__animated animate__fadeInDown';
  notification.textContent = '🎉 Opened a new pack of 50 M&Ms!';
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('animate__fadeOutUp');
    setTimeout(() => {
      notification.remove();
    }, 500);
  }, 2000);

  // Update last open time and start cooldown timer
  lastPackOpenTime = now;
  document.getElementById('openPackBtn').disabled = true;
  document.getElementById('cooldownTimer').classList.remove('hidden');
  
  // Start cooldown timer if not already running
  if (!cooldownInterval) {
    cooldownInterval = setInterval(updateCooldownTimer, 1000);
  }

  // Ensure modal is closed after updating inputs
  setTimeout(() => {
    if (!modal.classList.contains('hidden')) {
      closeModal();
    }
  }, 100);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Add input event listeners for real-time simulation updates
  const inputs = document.querySelectorAll('input[type="number"]');
  inputs.forEach(input => {
    input.addEventListener('input', (e) => {
      const val = parseInt(e.target.value) || 0;
      const simulation = e.target.nextElementSibling;
      if (simulation && val >= 0) {
        simulation.style.animationDuration = `${Math.max(1, 5 - val/10)}s`;
        
        // Add animation to M&M icon
        const icon = e.target.parentElement.previousElementSibling.querySelector('.mm-icon');
        icon.classList.add('animate__animated', 'animate__rubberBand');
        setTimeout(() => {
          icon.classList.remove('animate__animated', 'animate__rubberBand');
        }, 1000);
      }
    });
    
    // Add focus/blur effects
    input.addEventListener('focus', (e) => {
      e.target.classList.add('ring-2', 'ring-offset-2');
      const simulation = e.target.nextElementSibling;
      simulation.classList.add('animate-mms');
    });
    
    input.addEventListener('blur', (e) => {
      e.target.classList.remove('ring-2', 'ring-offset-2');
      const simulation = e.target.nextElementSibling;
      simulation.classList.remove('animate-mms');
    });

    // Add keyboard event listener for Enter key
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        calculateStats();
      }
    });
  });

  // Add event listeners for confirmation modal buttons
  document.getElementById('cancelConfirm').addEventListener('click', closeConfirmModal);
  document.getElementById('confirmOpen').addEventListener('click', confirmOpenPack);

  // Add event listeners for closing modals
  document.getElementById("modal").addEventListener('click', (e) => {
    if (e.target === document.getElementById("modal") || e.target.closest('.close-modal')) {
      closeModal();
    }
  });

  document.getElementById("confirmModal").addEventListener('click', (e) => {
    if (e.target === document.getElementById("confirmModal") || e.target.closest('.close-confirm')) {
      closeConfirmModal();
    }
  });

  // Add event listener for Escape key
  document.addEventListener('keydown', (e) => {
    const modal = document.getElementById("modal");
    const confirmModal = document.getElementById('confirmModal');
    
    if (e.key === 'Escape') {
      if (!modal.classList.contains('hidden')) {
        closeModal();
      } else if (!confirmModal.classList.contains('hidden')) {
        closeConfirmModal();
      }
    }
  });

  // Dark mode functionality
  const darkModeToggle = document.getElementById('darkModeToggle');
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
  
  // Check for saved user preference or use system preference
  const currentTheme = localStorage.getItem('theme') || 
    (prefersDarkScheme.matches ? 'dark' : 'light');
  
  if (currentTheme === 'dark') {
    document.documentElement.classList.add('dark');
  }
  
  darkModeToggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
  });

  // Add event listeners for graph controls
  document.getElementById('graphType').addEventListener('change', () => {
    const form = document.getElementById('mmForm');
    const data = {};
    for (const element of form.elements) {
      if (element.name) {
        data[element.name] = parseInt(element.value) || 0;
      }
    }
    createBarGraph(data);
  });

  document.getElementById('graphData').addEventListener('change', () => {
    const form = document.getElementById('mmForm');
    const data = {};
    for (const element of form.elements) {
      if (element.name) {
        data[element.name] = parseInt(element.value) || 0;
      }
    }
    createBarGraph(data);
  });
});