import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

import invoiceService from '@/services/api/invoiceService';
import clientService from '@/services/api/clientService';
import Button from '@/components/atoms/Button';
import Select from '@/components/atoms/Select';
import Input from '@/components/atoms/Input';
import ApperIcon from '@/components/ApperIcon';
import Loading from '@/components/ui/Loading';
import ErrorView from '@/components/ui/ErrorView';
import Empty from '@/components/ui/Empty';

const AgingReport = () => {
  const navigate = useNavigate();
  const [agingData, setAgingData] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    clientId: '',
    search: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [agingResponse, clientsResponse] = await Promise.all([
        invoiceService.getAgingReport(),
        clientService.getAll()
      ]);
      
      setAgingData(agingResponse);
      setClients(clientsResponse);
    } catch (error) {
      console.error('Error loading aging report:', error);
      setError(error.message);
      toast.error('Failed to load aging report');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const getFilteredClientBreakdown = () => {
    if (!agingData?.clientBreakdown) return [];
    
    let filteredClients = Object.entries(agingData.clientBreakdown)
      .map(([clientId, data]) => {
        const client = clients.find(c => c.Id === parseInt(clientId));
        return {
          clientId: parseInt(clientId),
          clientName: client?.name || 'Unknown Client',
          ...data
        };
      })
      .filter(item => item.total > 0);

    // Apply filters
    if (filters.clientId) {
      filteredClients = filteredClients.filter(item => 
        item.clientId === parseInt(filters.clientId)
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredClients = filteredClients.filter(item =>
        item.clientName.toLowerCase().includes(searchLower)
      );
    }

    return filteredClients.sort((a, b) => b.total - a.total);
  };

  const exportReport = () => {
    // Mock export functionality
    toast.success('Aging report exported successfully');
  };

  if (loading) return <Loading />;
  if (error) return <ErrorView message={error} onRetry={loadData} />;
  if (!agingData) return <Empty message="No aging data available" />;

  const filteredBreakdown = getFilteredClientBreakdown();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Invoice Aging Report
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Outstanding receivables by aging period
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={exportReport}>
            <ApperIcon name="Download" size={16} className="mr-2" />
            Export Report
          </Button>
          
          <Button variant="outline" onClick={() => navigate('/invoices')}>
            <ApperIcon name="ArrowLeft" size={16} className="mr-2" />
            Back to Invoices
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="metric-card">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Current (0-30 days)
          </h3>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(agingData.totals.current)}
          </p>
          <p className="text-sm text-slate-500">
            {agingData.agingBuckets.current.length} invoices
          </p>
        </div>

        <div className="metric-card">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
            31-60 days
          </h3>
          <p className="text-2xl font-bold text-amber-600">
            {formatCurrency(agingData.totals.thirtyToSixty)}
          </p>
          <p className="text-sm text-slate-500">
            {agingData.agingBuckets.thirtyToSixty.length} invoices
          </p>
        </div>

        <div className="metric-card">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
            61-90 days
          </h3>
          <p className="text-2xl font-bold text-orange-600">
            {formatCurrency(agingData.totals.sixtyToNinety)}
          </p>
          <p className="text-sm text-slate-500">
            {agingData.agingBuckets.sixtyToNinety.length} invoices
          </p>
        </div>

        <div className="metric-card">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
            90+ days
          </h3>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(agingData.totals.overNinety)}
          </p>
          <p className="text-sm text-slate-500">
            {agingData.agingBuckets.overNinety.length} invoices
          </p>
        </div>

        <div className="metric-card bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
          <h3 className="text-sm font-medium text-primary-600 dark:text-primary-400">
            Total Receivables
          </h3>
          <p className="text-2xl font-bold text-primary-700 dark:text-primary-300">
            {formatCurrency(agingData.totals.total)}
          </p>
          <p className="text-sm text-primary-600 dark:text-primary-400">
            {Object.values(agingData.agingBuckets).flat().length} invoices
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Search Client
            </label>
            <Input
              placeholder="Search by client name..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Filter by Client
            </label>
            <Select
              value={filters.clientId}
              onChange={(value) => handleFilterChange('clientId', value)}
              options={[
                { value: '', label: 'All Clients' },
                ...clients.map(client => ({
                  value: client.Id.toString(),
                  label: client.name
                }))
              ]}
            />
          </div>

          <div className="flex items-end">
            <Button 
              variant="outline" 
              onClick={() => setFilters({ clientId: '', search: '' })}
            >
              <ApperIcon name="RotateCcw" size={16} className="mr-2" />
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Client Breakdown Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Aging Breakdown by Client
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Outstanding amounts grouped by client and aging period
          </p>
        </div>

        {filteredBreakdown.length === 0 ? (
          <Empty message="No clients match the current filters" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Current (0-30)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    31-60 days
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    61-90 days
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    90+ days
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {filteredBreakdown.map((client) => (
                  <tr key={client.clientId} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {client.clientName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={client.current > 0 ? 'text-green-600 font-medium' : 'text-slate-400'}>
                        {formatCurrency(client.current)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={client.thirtyToSixty > 0 ? 'text-amber-600 font-medium' : 'text-slate-400'}>
                        {formatCurrency(client.thirtyToSixty)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={client.sixtyToNinety > 0 ? 'text-orange-600 font-medium' : 'text-slate-400'}>
                        {formatCurrency(client.sixtyToNinety)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={client.overNinety > 0 ? 'text-red-600 font-medium' : 'text-slate-400'}>
                        {formatCurrency(client.overNinety)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-slate-900 dark:text-white font-semibold">
                        {formatCurrency(client.total)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-700 border-t border-slate-300 dark:border-slate-600">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-900 dark:text-white">
                    Total
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-green-600">
                    {formatCurrency(filteredBreakdown.reduce((sum, client) => sum + client.current, 0))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-amber-600">
                    {formatCurrency(filteredBreakdown.reduce((sum, client) => sum + client.thirtyToSixty, 0))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-orange-600">
                    {formatCurrency(filteredBreakdown.reduce((sum, client) => sum + client.sixtyToNinety, 0))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-red-600">
                    {formatCurrency(filteredBreakdown.reduce((sum, client) => sum + client.overNinety, 0))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-primary-700 dark:text-primary-300">
                    {formatCurrency(filteredBreakdown.reduce((sum, client) => sum + client.total, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <div className="text-sm text-slate-500 dark:text-slate-400 text-center">
        Report generated on {format(new Date(agingData.generatedAt), 'PPP')}
      </div>
    </div>
  );
};

export default AgingReport;