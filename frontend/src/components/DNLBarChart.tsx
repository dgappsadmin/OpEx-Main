import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface DNLBarChartProps {
  data: {
    processedData: number[][];
  } | null;
  title?: string;
  year?: string;
}

// Helper function to get current month dynamically
const getCurrentMonth = () => {
  const now = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[now.getMonth()];
};

// Helper function to get current fiscal year  
const getCurrentFiscalYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  // Fiscal year starts from April, so if current month is Jan-Mar, FY is previous year
  if (now.getMonth() >= 3) {
    return String(year + 1).slice(-2); // e.g., "26" for 2026
  } else {
    return String(year).slice(-2); // e.g., "25" for 2025
  }
};

export default function DNLBarChart({ data, title = "DNL Plant Initiatives", year }: DNLBarChartProps) {
  // Handle null or undefined data
  if (!data) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="text-muted-foreground">No chart data available</div>
      </div>
    );
  }

  // Process the data for Chart.js format - handle both API response and direct data
  let processedData = data?.processedData || [];
  
  // If data is empty, create default structure
  if (!processedData || processedData.length === 0) {
    processedData = [[0,0,0,0,0,0], [0,0,0,0,0,0], [0,0,0,0,0,0], [0,0,0,0,0,0]];
  }

  // Categories matching the backend  
  const categories = ['RMC', 'Spent Acid', 'Environment', 'Total'];
  
  // Colors matching the provided image and backend
  const colors = {
    RMC: '#1F4E79',        // Dark Blue
    'Spent Acid': '#FF6600', // Orange
    Environment: '#70AD47',  // Green
    Total: '#5B9BD5'        // Light Blue
  };

  // Get dynamic fiscal year and month
  const currentFY = getCurrentFiscalYear();
  const currentMonth = getCurrentMonth();

  // Create the 6 time periods as shown in the image
  const timePeriods = [
    `FY'${currentFY} Budgeted Saving`,
    `FY'${currentFY} Non Budgeted Saving`, 
    'Budgeted',
    'Non-budgeted',
    `Savings till ${currentMonth}'${String(new Date().getFullYear()).slice(-2)}`,
    'Total'
  ];

  // Extract values for each category and time period
  const chartDatasets = categories.map((category, categoryIndex) => {
    // Get values for all 6 periods for this category
    const values = [];
    try {
      values.push(processedData[categoryIndex]?.[0] || 0); // FY'XX Budgeted Saving
      values.push(processedData[categoryIndex]?.[1] || 0); // FY'XX Non Budgeted Saving
      values.push(processedData[categoryIndex]?.[2] || 0); // Budgeted
      values.push(processedData[categoryIndex]?.[3] || 0); // Non-budgeted  
      values.push(processedData[categoryIndex]?.[4] || 0); // Savings till current month
      values.push(processedData[categoryIndex]?.[5] || 0); // Total
    } catch (e) {
      console.warn(`Error processing data for category ${category}:`, e);
      // Fill with zeros on error
      for(let i = 0; i < 6; i++) values.push(0);
    }

    return {
      label: category,
      data: values,
      backgroundColor: colors[category as keyof typeof colors],
      borderColor: colors[category as keyof typeof colors],
      borderWidth: 1,
    };
  });

  const chartData = {
    labels: timePeriods,
    datasets: chartDatasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        }
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold' as const,
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const datasetLabel = context.dataset.label || '';
            const value = context.parsed.y;
            // Format in Indian style with lakhs
            return `${datasetLabel}: ${value.toLocaleString('en-IN')} L`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        // Set intervals of 500 up to 3000 as per image
        min: 0,
        max: 3000,
        ticks: {
          stepSize: 500,
          callback: function(value: any) {
            // Format as plain numbers (lakhs are implicit)
            return value.toLocaleString('en-IN');
          }
        },
        title: {
          display: false, // Remove y-axis title as per image
        }
      },
      x: {
        title: {
          display: false, // Remove x-axis title as per image
        },
        ticks: {
          maxRotation: 45,
          minRotation: 0
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  // Create data table below the chart matching the image
  const createDataTable = () => {
    return (
      <div className="mt-6 border border-gray-300 rounded">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="border-r border-gray-300 p-2 text-left font-medium"></th>
              {timePeriods.map((period, index) => (
                <th key={index} className="border-r border-gray-300 p-2 text-center font-medium text-xs">
                  {period}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map((category, categoryIndex) => (
              <tr key={category} className="border-b">
                <td 
                  className="border-r border-gray-300 p-2 text-white font-bold text-center"
                  style={{ backgroundColor: colors[category as keyof typeof colors] }}
                >
                  {category}
                </td>
                {timePeriods.map((_, periodIndex) => (
                  <td key={periodIndex} className="border-r border-gray-300 p-2 text-center">
                    {Math.round(processedData[categoryIndex]?.[periodIndex] || 0)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="h-96 mb-4">
        <Bar data={chartData} options={options} />
      </div>
      {createDataTable()}
    </div>
  );
}