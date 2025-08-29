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

export default function DNLBarChart({ data, title = "DNL Plant Initiatives", year }: DNLBarChartProps) {
  // Categories matching the backend
  const categories = ['RMC', 'Spent Acid', 'Environment', 'Total'];
  
  // Colors matching the provided image and backend
  const colors = {
    RMC: '#1F4E79',        // Dark Blue
    'Spent Acid': '#FF6600', // Orange
    Environment: '#70AD47',  // Green
    Total: '#5B9BD5'        // Light Blue
  };

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
  
  // Extract values for each category based on backend structure
  // Backend array structure: [FY'XX Budgeted, FY'XX Non Budgeted, Budgeted, Non-budgeted, Savings till month, Total]
  const budgetedData = categories.map((_, index) => {
    try {
      return processedData[index]?.[2] || 0; // Budgeted values (column 2)
    } catch (e) {
      console.warn(`Error processing budgeted data for category ${index}:`, e);
      return 0;
    }
  });
  
  const nonBudgetedData = categories.map((_, index) => {
    try {
      return processedData[index]?.[3] || 0; // Non-budgeted values (column 3)
    } catch (e) {
      console.warn(`Error processing non-budgeted data for category ${index}:`, e);
      return 0;
    }
  });
  
  const totalData = categories.map((_, index) => {
    try {
      return processedData[index]?.[5] || 0; // Total values (column 5)
    } catch (e) {
      console.warn(`Error processing total data for category ${index}:`, e);
      return 0;
    }
  });

  const chartData = {
    labels: categories,
    datasets: [
      {
        label: `FY'${year ? year.slice(-2) : '25'} Budgeted Saving`,
        data: budgetedData,
        backgroundColor: categories.map(cat => colors[cat as keyof typeof colors]),
        borderColor: categories.map(cat => colors[cat as keyof typeof colors]),
        borderWidth: 1,
      },
      {
        label: `FY'${year ? year.slice(-2) : '25'} Non Budgeted Saving`,
        data: nonBudgetedData,
        backgroundColor: categories.map(cat => {
          const baseColor = colors[cat as keyof typeof colors];
          // Make non-budgeted bars slightly transparent
          return baseColor + '80'; // Add 50% opacity
        }),
        borderColor: categories.map(cat => colors[cat as keyof typeof colors]),
        borderWidth: 1,
      }
    ],
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
            // Format in Indian rupee style with proper intervals
            return `${datasetLabel}: ₹${value.toLocaleString('en-IN')} Lacs`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        // Set intervals of 500 up to 3000
        min: 0,
        max: 3000,
        ticks: {
          stepSize: 500,
          callback: function(value: any) {
            // Format as Indian rupee
            return '₹' + value.toLocaleString('en-IN');
          }
        },
        title: {
          display: true,
          text: 'Savings (₹ Lacs)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Categories'
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  return (
    <div className="w-full h-96">
      <Bar data={chartData} options={options} />
    </div>
  );
}