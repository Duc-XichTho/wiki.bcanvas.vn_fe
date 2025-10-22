export function Color() {
  return {
    cellClassRules: {
      'bold-header': (params) => {
        return params.data.layer?.toString().split('.').length == 1;
      },
      'normal-header': (params) => {
        return params.data.layer?.toString().split('.').length > 1;
      },
      'color-row': (params) => params.data.dp === 'Doanh thu' || params.data.dp === 'Lãi lỗ ròng',
    },
  };
}
