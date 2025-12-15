
import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, Clock, CheckCircle, AlertTriangle, XCircle, TrendingUp, DollarSign, Activity, Zap, ShieldAlert } from 'lucide-react';

// Mock Data
const volumeData = [
  { name: 'Mon', received: 45, processed: 42 },
  { name: 'Tue', received: 52, processed: 48 },
  { name: 'Wed', received: 38, processed: 35 },
  { name: 'Thu', received: 65, processed: 60 },
  { name: 'Fri', received: 48, processed: 45 },
  { name: 'Sat', received: 15, processed: 15 },
  { name: 'Sun', received: 10, processed: 10 },
];

const pieData = [
  { name: 'Auto-Approved', value: 65, color: '#10b981' }, // Emerald-500
  { name: 'Manual Review', value: 25, color: '#f59e0b' }, // Amber-500
  { name: 'Rejected', value: 10, color: '#ef4444' }, // Rose-500
];

const rejectionData = [
  { name: 'Price Check', value: 45 },
  { name: 'Missing PO', value: 30 },
  { name: 'Duplicate', value: 15 },
  { name: 'Fraud Flag', value: 10 },
];

const MetricCard = ({ title, value, subtext, icon: Icon, trend, trendValue, color, iconColor }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
    <div className="flex justify-between items-start relative z-10">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      </div>
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon size={20} className={iconColor} />
      </div>
    </div>
    <div className="mt-4 flex items-center text-xs font-medium relative z-10">
      {trend === 'up' ? (
        <span className="text-emerald-600 flex items-center bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
          <ArrowUpRight size={14} className="mr-1" /> {trendValue}
        </span>
      ) : (
        <span className="text-rose-600 flex items-center bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
          <ArrowDownRight size={14} className="mr-1" /> {trendValue}
        </span>
      )}
      <span className="text-slate-400 ml-2">{subtext}</span>
    </div>
    {/* Decorative background element */}
    <div className="absolute -bottom-4 -right-4 opacity-5 transform group-hover:scale-110 transition-transform duration-500">
        <Icon size={80} />
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  return (
    <div className="p-8 space-y-8 animate-fade-in pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Operational Dashboard</h2>
          <p className="text-slate-500 mt-1">Real-time insights into invoice processing velocity and compliance.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            System Operational
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Total Processed (7d)" 
          value="1,284" 
          subtext="vs last week" 
          icon={Activity} 
          trend="up"
          trendValue="12%"
          color="bg-blue-50"
          iconColor="text-blue-600"
        />
        <MetricCard 
          title="Value Processed" 
          value="$842.5k" 
          subtext="vs last week" 
          icon={DollarSign} 
          trend="up"
          trendValue="8.4%"
          color="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <MetricCard 
          title="Avg. Handling Time" 
          value="4.2 hrs" 
          subtext="vs last week" 
          icon={Clock} 
          trend="down"
          trendValue="15%" // Down is good for time
          color="bg-purple-50"
          iconColor="text-purple-600"
        />
        <MetricCard 
          title="AI Accuracy Score" 
          value="98.1%" 
          subtext="Confidence Level" 
          icon={Zap} 
          trend="up"
          trendValue="0.5%"
          color="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Chart: Throughput */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
              <div>
                  <h3 className="text-lg font-bold text-slate-800">Processing Throughput</h3>
                  <p className="text-xs text-slate-500">Invoices Received vs Processed (Last 7 Days)</p>
              </div>
              <select className="text-xs border-none bg-slate-50 rounded-lg px-2 py-1 text-slate-600 font-medium cursor-pointer outline-none hover:bg-slate-100">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
              </select>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProcessed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickMargin={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  cursor={{stroke: '#e2e8f0', strokeWidth: 1}}
                />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                <Area type="monotone" dataKey="received" stroke="#94a3b8" strokeWidth={2} fillOpacity={1} fill="url(#colorReceived)" name="Received" />
                <Area type="monotone" dataKey="processed" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorProcessed)" name="Processed" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Outcome Distribution</h3>
          <p className="text-xs text-slate-500 mb-6">Automated vs Manual decisions</p>
          <div className="h-64 flex-1">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
             </ResponsiveContainer>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-slate-600">Compliance Rate</span>
                  <span className="font-bold text-slate-800">92.4%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{width: '92.4%'}}></div>
              </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Rejection Analysis */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-1">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <ShieldAlert size={18} className="text-rose-500" /> Rejection Drivers
              </h3>
              <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={rejectionData} margin={{ left: 0, right: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" width={100} tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
                          <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none'}} />
                          <Bar dataKey="value" fill="#f87171" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* Recent System Alerts */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-slate-800">Live System Alerts</h3>
                  <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700">View All Logs</button>
              </div>
              <div className="space-y-4">
                  {[
                      { type: 'warning', msg: 'High value invoice detected (> $5k) for Client C-102', time: '10 mins ago' },
                      { type: 'success', msg: 'Batch PO Sync completed successfully (45 records)', time: '2 hrs ago' },
                      { type: 'error', msg: 'Failed OCR extraction for Supplier "Unknown Pty Ltd"', time: '4 hrs ago' },
                      { type: 'info', msg: 'System maintenance scheduled for Sunday 2am UTC', time: '1 day ago' },
                  ].map((alert, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                          <div className={`mt-0.5 p-1.5 rounded-full shrink-0 ${
                              alert.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                              alert.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                              alert.type === 'error' ? 'bg-rose-100 text-rose-600' :
                              'bg-blue-100 text-blue-600'
                          }`}>
                              {alert.type === 'warning' && <AlertTriangle size={14} />}
                              {alert.type === 'success' && <CheckCircle size={14} />}
                              {alert.type === 'error' && <XCircle size={14} />}
                              {alert.type === 'info' && <Clock size={14} />}
                          </div>
                          <div className="flex-1">
                              <p className="text-sm font-medium text-slate-800">{alert.msg}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{alert.time}</p>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
