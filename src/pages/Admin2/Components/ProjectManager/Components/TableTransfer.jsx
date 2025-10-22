import React from "react";
import { Table, Transfer } from "antd";

const TableTransfer = (props) => {
  const { leftColumns, rightColumns, ...restProps } = props;
  return (
    <Transfer
      style={{
        width: "100%",
      }}
      {...restProps}
    >
      {({
        direction,
        filteredItems,
        onItemSelect,
        onItemSelectAll,
        selectedKeys: listSelectedKeys,
        disabled: listDisabled,
      }) => {
        const columns = direction === "left" ? leftColumns : rightColumns;
        const rowSelection = {
          getCheckboxProps: () => ({
            disabled: listDisabled,
          }),
          onChange(selectedRowKeys) {
            onItemSelectAll(selectedRowKeys, "replace");
          },
          selectedRowKeys: listSelectedKeys,
          selections: [
            Table.SELECTION_ALL,
            Table.SELECTION_INVERT,
            Table.SELECTION_NONE,
          ],
        };
        return (
          <Table
            rowSelection={rowSelection}
            columns={columns}
            dataSource={filteredItems}
            pagination={{
              pageSize: 8,
            }}
            style={{
              pointerEvents: listDisabled ? "none" : undefined,
            }}
            onRow={({ key, disabled: itemDisabled }) => ({
              onClick: () => {
                if (itemDisabled || listDisabled) {
                  return;
                }
                onItemSelect(key, !listSelectedKeys.includes(key));
              },
            })}
          />
        );
      }}
    </Transfer>
  );
};

export default TableTransfer;
