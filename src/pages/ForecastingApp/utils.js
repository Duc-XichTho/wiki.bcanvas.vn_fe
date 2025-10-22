// Generate forecast dates for the next 9 days
export const generateForecastDates = () => {
  const dates = [];
  const today = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  for (let i = 1; i <= 9; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    dates.push({
      id: i,
      date: date.toLocaleDateString('en-GB'),
      dayOfWeek: dayNames[date.getDay()],
      promotion1: { type: '', target: '', impact: '' },
      promotion2: { type: '', target: '', impact: '' },
      branding: { type: '', expense: '', target: '' }
    });
  }
  return dates;
};

// Generate table data for results
export const generateTableData = () => {
  const data = [];
  const today = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    const baseValue = 2000 + Math.random() * 1000;
    const forecast = Math.round(baseValue);
    const actual = i === 0 ? null : Math.round(baseValue * (0.95 + Math.random() * 0.1));
    const confidence = i <= 9 ? `${(85 + Math.random() * 10).toFixed(1)}%` : (actual ? `${(90 + Math.random() * 8).toFixed(1)}%` : '-');
    const isForecastPeriod = i <= 9;
    
    data.push({
      key: i,
      date: date.toLocaleDateString('en-GB'),
      day: dayNames[date.getDay()],
      forecast: forecast.toLocaleString(),
      actual: actual ? actual.toLocaleString() : '-',
      confidence: confidence,
      accuracy: actual ? `${(Math.min(forecast, actual) / Math.max(forecast, actual) * 100).toFixed(1)}%` : '-',
      note: Math.random() > 0.9 ? (Math.random() > 0.5 ? 'Flash sale' : 'Holiday') : '',
      isForecastPeriod: isForecastPeriod
    });
  }
  return data;
};

// Sample data
export const chartData = [
  { month: 'Jan', forecast: 12500, actual: 11800 },
  { month: 'Feb', forecast: 13200, actual: 13400 },
  { month: 'Mar', forecast: 14100, actual: 13900 },
  { month: 'Apr', forecast: 15300, actual: 15800 },
  { month: 'May', forecast: 16200, actual: 15900 },
  { month: 'Jun', forecast: 17100, actual: 17500 }
];

export const stores = [
  { id: 'store-1', name: 'HÀ Nội Store', tag: 'North' },
  { id: 'store-2', name: 'TP.HCM Store', tag: 'South' },
  { id: 'store-3', name: 'ĐÀ Nẵng Store', tag: 'Central' },
  { id: 'store-4', name: 'Cần Thơ Store', tag: 'South' },
  { id: 'store-5', name: 'Hải Phòng Store', tag: 'North' }
];

export const tags = ['North', 'South', 'Central'];

export const campaigns = {
  promotions: [
    'Flash Sale',
    'Discount 10%',
    'Discount 20%',
    'Buy 1 Get 1',
    'Free Shipping',
    'Bundle Deal',
    'Clearance',
    'New Product Launch'
  ],
  branding: [
    'TV Advertisement',
    'Social Media Campaign', 
    'Billboard Campaign',
    'Radio Advertisement',
    'Influencer Marketing',
    'Email Marketing',
    'Content Marketing',
    'Event Sponsorship'
  ]
}; 