
export const MAPPING_GROUP_TYPE = {
    'group': 'Brand',
    'group1': 'Dòng sản phẩm',
    'group2': 'SKU',
    'group3': 'Nhóm SKU',
};
export const GROUP_SETTING = [
    {
        table: 'Kmf',
        label: 'Khoản mục phí',
        setting_type: [
            {
                type: 'kh_kmf',
                listCol: [
                    { field: 'name', headerName: 'Tên nhóm' },
                    {
                        field: 'phan_loai',
                        headerName: 'Phân loại',
                        options: [
                            { label: 'Doanh thu', value: 'Doanh thu' },
                            { label: 'Chi phí', value: 'Chi phí' }
                        ]
                    },
                    { field: 'stt', headerName: 'Số thứ tự' , width : 100},
                ]
            },
        ],
    },
    {
        table: 'Kmns',
        label: 'Khoản mục thu chi',
        setting_type: [
            {
                type: 'kmns',
                listCol: [
                    { field: 'name', headerName: 'Tên nhóm' },
                    { field: 'stt', headerName: 'Số thứ tự' , width : 100},
                ]
            },
        ],
    },
    {
        table: 'Unit',
        label: 'Danh mục đơn vị',
        setting_type: [
            {
                type: 'unit',
                listCol: [
                    { field: 'name', headerName: 'Tên nhóm' },
                    { field: 'stt', headerName: 'Số thứ tự' , width : 100},

                ]
            },
            // {
            //     type: 'kh_unit',
            //     listCol: [
            //         { field: 'name', headerName: 'Tên nhóm' },
            //     ]
            // },
        ],
    },
    {
        table: 'Product',
        label: 'Danh mục sản phẩm',
        setting_type: [
            {
                type: 'product',
                listCol: [
                    { field: 'name', headerName: 'Tên nhóm' },
                    {
                        field: 'groupType',
                        headerName: 'Phân loại',
                        options: Object.entries(MAPPING_GROUP_TYPE).map(([value, label]) => ({ label, value }))
                    },
                ]
            },
        ],
    },
    {
        table: 'Kenh',
        label: 'Danh mục kênh',
        setting_type: [
            {
                type: 'kenh',
                listCol: [
                    { field: 'name', headerName: 'Tên nhóm' },
                ]
            },
        ],
    },
    {
        table: 'Project',
        label: 'Danh mục vụ việc',
        setting_type: [
            {
                type: 'project',
                listCol: [
                    { field: 'name', headerName: 'Tên nhóm' },
                ]
            },
        ],
    },
]
