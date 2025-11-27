import React, { useState } from 'react';
import { 
  exportRetrievalsToCSV, 
  exportRetrievalsByDateRange, 
  exportRetrievalsByStore,
  exportRetrievalSummary 
} from '../services/exportService';

const RetrievalExportManager = ({ retrievals, stores }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [exportType, setExportType] = useState('all');

  const handleExportAll = () => {
    exportRetrievalsToCSV(retrievals);
  };

  const handleExportByDate = () => {
    exportRetrievalsByDateRange(retrievals, startDate, endDate);
  };

  const handleExportByStore = () => {
    exportRetrievalsByStore(retrievals, selectedStore);
  };

  const handleExportSummary = () => {
    exportRetrievalSummary(retrievals);
  };

  const getStoreName = (storeId) => {
    if (!stores || !storeId) return 'Unknown Store';
    const store = stores.find(s => s.id === storeId);
    return store ? store.storeName || store.name || store.email : 'Unknown Store';
  };

  // Get unique stores from retrievals
  const uniqueStores = [...new Set(retrievals.map(r => r.confirmedByPartner))]
    .filter(Boolean)
    .map(storeId => ({
      id: storeId,
      name: getStoreName(storeId)
    }));

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Export Completed Retrievals</h2>
        <div className="text-sm text-gray-600">
          Total: {retrievals.length} retrievals
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Quick Export</h3>
          <button
            onClick={handleExportAll}
            disabled={retrievals.length === 0}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export All ({retrievals.length})
          </button>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">Summary Report</h3>
          <button
            onClick={handleExportSummary}
            disabled={retrievals.length === 0}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export Summary
          </button>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-semibold text-purple-800 mb-2">Date Range</h3>
          <button
            onClick={handleExportByDate}
            disabled={!startDate || !endDate}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export by Date
          </button>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg">
          <h3 className="font-semibold text-orange-800 mb-2">Store Specific</h3>
          <button
            onClick={handleExportByStore}
            disabled={!selectedStore}
            className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export by Store
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Date Range Selection */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-3">Select Date Range</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Store Selection */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-3">Select Partner Store</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Partner Store
            </label>
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Choose a store...</option>
              {uniqueStores.map(store => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h3 className="font-semibold text-blue-800 mb-2">Export Information</h3>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>All exports are completely free and processed locally in your browser</li>
          <li>CSV files can be opened in Excel, Google Sheets, or any spreadsheet application</li>
          <li>Files are automatically named with the current date</li>
          <li>No data is sent to external servers - everything stays private</li>
          <li>You can filter exports by date range or specific partner stores</li>
        </ul>
      </div>

      {retrievals.length === 0 && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-800 text-center">
            No completed retrievals found. Complete some retrievals first to enable exports.
          </p>
        </div>
      )}
    </div>
  );
};

export default RetrievalExportManager;
