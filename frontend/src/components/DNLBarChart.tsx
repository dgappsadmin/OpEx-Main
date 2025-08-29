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
  };
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

  // Process the data for Chart.js format - handle both API response and direct data
  let processedData = data?.processedData || [];
  
  // If data is empty, create default structure
  if (!processedData || processedData.length === 0) {
    processedData = [[0,0,0,0,0,0], [0,0,0,0,0,0], [0,0,0,0,0,0], [0,0,0,0,0,0]];
  }
  
  // Extract values for each category based on backend structure
  // Backend array structure: [FY'XX Budgeted, FY'XX Non Budgeted, Budgeted, Non-budgeted, Savings till month, Total]
  const budgetedData = categories.map((_, index) => processedData[index]?.[2] || 0); // Budgeted values (column 2)
  const nonBudgetedData = categories.map((_, index) => processedData[index]?.[3] || 0); // Non-budgeted values (column 3)
  const totalData = categories.map((_, index) => processedData[index]?.[5] || 0); // Total values (column 5)

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
            return `${datasetLabel}: ${value.toLocaleString()} Rs. Lacs`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Savings (Rs. Lacs)'
        },
        ticks: {
          callback: function(value: any) {
            return value.toLocaleString();
          }
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