// Initialize chart
let investmentChart = null;

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('he-IL', {
        style: 'currency',
        currency: 'ILS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Function to calculate values similar to your Python function
function calculateValues(initialAmount, years, inflationRate, investmentReturn) {
    // Handle invalid inputs
    if (isNaN(initialAmount) || initialAmount <= 0) initialAmount = 1000;
    if (isNaN(years) || years < 1) years = 10;
    if (isNaN(inflationRate)) inflationRate = 2.5;
    if (isNaN(investmentReturn)) investmentReturn = 7.5;
    
    // Ensure years is an integer and within reasonable range
    years = Math.min(Math.max(Math.floor(years), 1), 50);
    
    let timePoints = Array.from({ length: years + 1 }, (_, i) => i);
    
    // Calculate invested money growth
    let invested = timePoints.map(year => 
        initialAmount * Math.pow(1 + investmentReturn / 100, year)
    );
    
    // Calculate uninvested money (inflation adjusted)
    let uninvested = timePoints.map(year => 
        initialAmount / Math.pow(1 + inflationRate / 100, year)
    );
    
    return { timePoints, invested, uninvested };
}

// Function to update the chart
function updateChart(initialAmount, years, inflationRate, investmentReturn) {
    const { timePoints, invested, uninvested } = calculateValues(
        initialAmount, years, inflationRate, investmentReturn
    );
    
    // Create dataset for Chart.js
    const data = {
        labels: timePoints,
        datasets: [
            {
                label: 'Invested Money',
                data: invested,
                borderColor: 'rgba(40, 167, 69, 1)',
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.1
            },
            {
                label: 'Uninvested (Inflation Adjusted)',
                data: uninvested,
                borderColor: 'rgba(255, 153, 0, 1)',
                backgroundColor: 'rgba(255, 153, 0, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.1
            },
            {
                label: 'Initial Amount',
                data: Array(years + 1).fill(initialAmount),
                borderColor: 'rgba(108, 117, 125, 0.8)',
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false
            }
        ]
    };
    
    const config = {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1.5,
            plugins: {
                title: {
                    display: true,
                    text: 'Investment Growth vs. Inflation Impact'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += formatCurrency(context.parsed.y);
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Years'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Amount (₪)'
                    },
                    // Set a reasonable maximum based on inputs
                    suggestedMax: function(context) {
                        const initialAmount = parseFloat(document.getElementById('initialAmount').value);
                        const years = parseInt(document.getElementById('years').value);
                        const investmentReturn = parseFloat(document.getElementById('investmentReturn').value);
                        return initialAmount * Math.pow(1 + investmentReturn / 100, years) * 1.1;
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    };
    
    // Create or update chart
    const ctx = document.getElementById('investmentChart').getContext('2d');
    
    if (investmentChart) {
        investmentChart.data = data;
        investmentChart.update();
    } else {
        investmentChart = new Chart(ctx, config);
    }
    
    // Update the summary
    updateSummary(initialAmount, years, inflationRate, investmentReturn, invested, uninvested);
}

// Function to update the summary section
function updateSummary(initialAmount, years, inflationRate, investmentReturn, invested, uninvested) {
    const finalInvested = invested[years];
    const finalUninvested = uninvested[years];
    const difference = finalInvested - finalUninvested;
    
    const resultDetails = document.getElementById('resultDetails');
    resultDetails.innerHTML = `
        <p><strong>After ${years} years:</strong></p>
        <p>Invested Money: ${formatCurrency(finalInvested)}</p>
        <p>Inflation-Adjusted Uninvested: ${formatCurrency(finalUninvested)}</p>
        <p>Difference: ${formatCurrency(difference)}</p>
        <p>Your money multiplied by: ${(finalInvested / initialAmount).toFixed(2)}x</p>
        <p>Initial investment purchasing power changed by: ${(finalUninvested / initialAmount).toFixed(2)}x</p>
    `;
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Get all input elements
    const initialAmountInput = document.getElementById('initialAmount');
    const yearsInput = document.getElementById('years');
    const yearsValue = document.getElementById('yearsValue');
    const inflationRateInput = document.getElementById('inflationRate');
    const inflationValue = document.getElementById('inflationValue');
    const investmentReturnInput = document.getElementById('investmentReturn');
    const returnValue = document.getElementById('returnValue');
    const calculateButton = document.getElementById('calculateButton');
    
    // Update display values for sliders and recalculate in real-time
    yearsInput.addEventListener('input', () => {
        yearsValue.textContent = yearsInput.value;
        updateFromInputs();
    });
    
    inflationRateInput.addEventListener('input', () => {
        inflationValue.textContent = inflationRateInput.value;
        updateFromInputs();
    });
    
    investmentReturnInput.addEventListener('input', () => {
        returnValue.textContent = investmentReturnInput.value;
        updateFromInputs();
    });
    
    // Initial amount input handler
    initialAmountInput.addEventListener('input', debounce(() => {
        updateFromInputs();
    }, 500));
    
    // Helper function to get all values and update
    function updateFromInputs() {
        const initialAmount = parseFloat(initialAmountInput.value);
        const years = parseInt(yearsInput.value);
        const inflationRate = parseFloat(inflationRateInput.value);
        const investmentReturn = parseFloat(investmentReturnInput.value);
        
        updateChart(initialAmount, years, inflationRate, investmentReturn);
    }
    
    // Debounce function to prevent too many updates
    function debounce(func, wait) {
        let timeout;
        return function() {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, arguments), wait);
        };
    }
    
    // Keep the calculate button for users who prefer it
    calculateButton.addEventListener('click', () => {
        updateFromInputs();
    });
    
    // Initial calculation
    const initialAmount = parseFloat(initialAmountInput.value);
    const years = parseInt(yearsInput.value);
    const inflationRate = parseFloat(inflationRateInput.value);
    const investmentReturn = parseFloat(investmentReturnInput.value);
    
    updateChart(initialAmount, years, inflationRate, investmentReturn);
});
