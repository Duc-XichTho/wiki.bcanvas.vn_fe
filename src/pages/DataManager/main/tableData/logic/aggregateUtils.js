export const processAggregate = (data, config) => {
  if (!Array.isArray(data) || data.length === 0) return [];
  if (!config || !Array.isArray(config.groupBy)) return data;

  const groupBy = config.groupBy;
  const aggregations = Array.isArray(config.aggregations) ? config.aggregations : [];

  const grouped = new Map();
  for (const row of data) {
    const key = groupBy.map(col => row[col]).join('|');
    if (!grouped.has(key)) {
      const base = {};
      groupBy.forEach(col => { base[col] = row[col]; });
      grouped.set(key, { base, rows: [] });
    }
    grouped.get(key).rows.push(row);
  }

  const results = [];
  for (const { base, rows } of grouped.values()) {
    const out = { ...base };
    for (const agg of aggregations) {
      if (!agg || !agg.column || !agg.function) continue;
      const col = agg.column;
      const func = String(agg.function).toLowerCase();
      const name = agg.alias || `${func}_${col}`;
      const values = rows.map(r => Number(r[col])).filter(v => !Number.isNaN(v));
      let val = null;
      switch (func) {
        case 'sum':
          val = values.reduce((a, b) => a + b, 0);
          break;
        case 'count':
          val = rows.length;
          break;
        case 'avg':
        case 'average':
          val = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
          break;
        case 'min':
          val = values.length ? Math.min(...values) : null;
          break;
        case 'max':
          val = values.length ? Math.max(...values) : null;
          break;
        case 'distinct_count':
          val = new Set(rows.map(r => r[col])).size;
          break;
        default:
          val = null;
      }
      out[name] = val;
    }
    results.push(out);
  }

  return results;
};


