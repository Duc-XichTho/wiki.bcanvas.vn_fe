import React from "react";
import css from "./LayoutUserClass.module.css";
import { Table } from "antd";
import Create from "./CRUD/Create";

const LayoutUserClass = () => {
  const [showCreate, setShowCreate] = React.useState(false);

  return (
    <>
      <button onClick={() => setShowCreate(true)}>Create</button>
      {showCreate && <Create onClose={() => setShowCreate(false)} />}
    </>
  );
};

export default LayoutUserClass;
