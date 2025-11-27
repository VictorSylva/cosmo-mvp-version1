// Free CSV Export Service for Completed Retrievals
export const exportRetrievalsToCSV = (retrievals) => {
  if (!retrievals || retrievals.length === 0) {
    alert('No retrievals to export');
    return;
  }

  // Define CSV headers
  const headers = [
    'Retrieval ID',
    'Customer Email',
    'Product Name',
    'Product ID',
    'Prepaid Price (₦)',
    'Partner Store',
    'Confirmed At',
    'Created At',
    'Status',
    'Payment Status'
  ];

  // Convert retrievals to CSV rows
  const csvRows = retrievals.map(retrieval => [
    retrieval.id,
    retrieval.customerEmail || 'N/A',
    retrieval.productName || 'Unknown Product',
    retrieval.productId || 'unknown',
    retrieval.prepaidPrice || 0,
    retrieval.storeName || 'Unknown Store',
    retrieval.confirmedAt ? new Date(retrieval.confirmedAt).toLocaleString('en-NG') : 'N/A',
    retrieval.createdAt ? new Date(retrieval.createdAt).toLocaleString('en-NG') : 'N/A',
    retrieval.status || 'confirmed',
    retrieval.paymentStatus || 'pending'
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Create and download the CSV file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `completed-retrievals-${new Date().toISOString().split('T')[0]}.csv`;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  window.URL.revokeObjectURL(url);
  
  console.log(`Exported ${retrievals.length} retrieval records to CSV`);
};

// Export specific date range
export const exportRetrievalsByDateRange = (retrievals, startDate, endDate) => {
  if (!startDate || !endDate) {
    alert('Please select both start and end dates');
    return;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const filteredRetrievals = retrievals.filter(retrieval => {
    const confirmedDate = retrieval.confirmedAt ? new Date(retrieval.confirmedAt) : null;
    if (!confirmedDate) return false;
    
    return confirmedDate >= start && confirmedDate <= end;
  });

  if (filteredRetrievals.length === 0) {
    alert(`No retrievals found between ${startDate} and ${endDate}`);
    return;
  }

  exportRetrievalsToCSV(filteredRetrievals);
};

// Export by partner store
export const exportRetrievalsByStore = (retrievals, storeId) => {
  if (!storeId) {
    alert('Please select a partner store');
    return;
  }

  const filteredRetrievals = retrievals.filter(retrieval => 
    retrieval.confirmedByPartner === storeId
  );

  if (filteredRetrievals.length === 0) {
    alert('No retrievals found for the selected store');
    return;
  }

  exportRetrievalsToCSV(filteredRetrievals);
};

// Export summary statistics
export const exportRetrievalSummary = (retrievals) => {
  if (!retrievals || retrievals.length === 0) {
    alert('No retrievals to summarize');
    return;
  }

  // Calculate summary statistics
  const totalRetrievals = retrievals.length;
  const totalValue = retrievals.reduce((sum, r) => sum + (r.prepaidPrice || 0), 0);
  const uniqueCustomers = new Set(retrievals.map(r => r.customerEmail)).size;
  const uniqueStores = new Set(retrievals.map(r => r.confirmedByPartner)).size;
  
  // Group by date
  const byDate = {};
  retrievals.forEach(retrieval => {
    const date = retrieval.confirmedAt ? 
      new Date(retrieval.confirmedAt).toISOString().split('T')[0] : 
      'Unknown';
    if (!byDate[date]) byDate[date] = { count: 0, value: 0 };
    byDate[date].count++;
    byDate[date].value += retrieval.prepaidPrice || 0;
  });

  // Create summary CSV
  const summaryHeaders = [
    'Summary Type',
    'Value',
    'Details'
  ];

  const summaryRows = [
    ['Total Retrievals', totalRetrievals, ''],
    ['Total Value (₦)', totalValue.toFixed(2), ''],
    ['Unique Customers', uniqueCustomers, ''],
    ['Unique Partner Stores', uniqueStores, ''],
    ['', '', ''],
    ['Date', 'Retrievals Count', 'Total Value (₦)'],
    ...Object.entries(byDate).map(([date, data]) => [
      date,
      data.count,
      data.value.toFixed(2)
    ])
  ];

  const csvContent = [
    summaryHeaders.join(','),
    ...summaryRows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Download summary CSV
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `retrieval-summary-${new Date().toISOString().split('T')[0]}.csv`;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  window.URL.revokeObjectURL(url);
  
  console.log('Exported retrieval summary to CSV');
};
