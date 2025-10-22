 export function filter() {
    return {
        filter: 'agMultiColumnFilter',
        floatingFilter: true,
        filterParams: {
            filters: [
                {
                    filter: 'agTextColumnFilter',
                },
                {
                    filter: 'agSetColumnFilter',
                },
            ],
        },
    };
}