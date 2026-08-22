// ============================================
// FILE: src/pages/SupplyChain.jsx
// PURPOSE: Medical Supply Chain Tracker
// Shows inventory, stock levels, and reorder alerts
// ============================================

// Import icons
import { Package, AlertCircle, CheckCircle, TrendingUp, Search, Plus } from 'lucide-react';

function SupplyChain() {
  // Dummy inventory data (will be replaced with API data later)
  const inventory = [
    { id: 1, name: 'Paracetamol 500mg', category: 'Medicine', quantity: 450, threshold: 100, status: 'In Stock' },
    { id: 2, name: 'Insulin Injection', category: 'Medicine', quantity: 80, threshold: 100, status: 'Low Stock' },
    { id: 3, name: 'Oxygen Cylinder', category: 'Equipment', quantity: 25, threshold: 30, status: 'Low Stock' },
    { id: 4, name: 'PPE Kit', category: 'Equipment', quantity: 500, threshold: 200, status: 'In Stock' },
    { id: 5, name: 'Amoxicillin 250mg', category: 'Medicine', quantity: 120, threshold: 150, status: 'Low Stock' },
    { id: 6, name: 'Ventilator', category: 'Equipment', quantity: 8, threshold: 5, status: 'In Stock' },
    { id: 7, name: 'IV Fluid Saline', category: 'Medicine', quantity: 300, threshold: 100, status: 'In Stock' },
    { id: 8, name: 'N95 Mask', category: 'Equipment', quantity: 35, threshold: 50, status: 'Low Stock' },
  ];

  // Count items that need reordering
  const lowStockItems = inventory.filter(item => item.quantity <= item.threshold);
  const totalItems = inventory.length;
  const totalStock = inventory.reduce((sum, item) => sum + item.quantity, 0);

  // Function to get status color
  const getStatusColor = (status) => {
    if (status === 'In Stock') return 'text-green-600 bg-green-50 border-green-200';
    if (status === 'Low Stock') return 'text-red-600 bg-red-50 border-red-200';
    return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🏥 Medical Supply Chain</h1>
          <p className="text-gray-500 text-sm">Track inventory, manage stock, and prevent shortages</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors">
          <Plus size={18} />
          Add New Item
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Total Items</p>
              <p className="text-2xl font-bold text-gray-800">{totalItems}</p>
            </div>
            <Package className="text-blue-500" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Total Stock</p>
              <p className="text-2xl font-bold text-gray-800">{totalStock}</p>
            </div>
            <TrendingUp className="text-green-500" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">In Stock</p>
              <p className="text-2xl font-bold text-gray-800">{totalItems - lowStockItems.length}</p>
            </div>
            <CheckCircle className="text-green-500" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm">Low Stock Alert</p>
              <p className="text-2xl font-bold text-red-600">{lowStockItems.length}</p>
            </div>
            <AlertCircle className="text-red-500" size={24} />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search inventory..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Low Stock Alert Banner */}
      {lowStockItems.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-500 mt-0.5" size={20} />
            <div>
              <h3 className="font-bold text-red-700">⚠️ Low Stock Alert</h3>
              <p className="text-sm text-red-600">
                {lowStockItems.length} item(s) need immediate reorder:
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {lowStockItems.map(item => (
                  <span key={item.id} className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">
                    {item.name} ({item.quantity} left)
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Threshold</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {inventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-800">{item.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{item.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-semibold ${item.quantity <= item.threshold ? 'text-red-600' : 'text-gray-800'}`}>
                      {item.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{item.threshold}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      Reorder
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Stats Footer */}
      <div className="text-xs text-gray-400 text-center">
        Last updated: Today at {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}

export default SupplyChain;