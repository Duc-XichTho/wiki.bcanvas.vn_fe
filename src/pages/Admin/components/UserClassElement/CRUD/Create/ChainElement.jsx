import { useState, useEffect } from "react";
import { Checkbox, Switch, Skeleton, message } from "antd";
import { CaretRightOutlined, CaretDownOutlined } from "@ant-design/icons";
import css from "./ChainElement.module.css";
import { getAllChainTemplateStepSubStep } from '../../../../../../apis/chainService.jsx';
import { API_RESPONSE_CODE } from '../../../../../../CONST.js';
import { FileSearch, FilePen, FilePlus2, FileMinus2, FileCheck2 } from 'lucide-react';

const ChainElement = ({
  checkedChainAndChild,
  setCheckedChainAndChild,
}) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [dataChain, setDataChain] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState({});

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const showNotification = (type, content) => {
    messageApi.open({
      type,
      content,
    });
  };

  const fetchAllChainTemplateStepSubStep = async () => {
    try {
      setShowSkeleton(true);
      const response = await getAllChainTemplateStepSubStep();
      await delay(2000);
      switch (response.code) {
        case API_RESPONSE_CODE.SUCCESS:
          setDataChain(response.result);
          break;
        case API_RESPONSE_CODE.NOT_FOUND:
          showNotification("warning", response.message);
          setDataChain([]);
          break;
        default:
          showNotification("error", "Có lỗi xảy ra khi lấy dữ liệu Chain");
          setDataChain([]);
          break;
      }
    } catch (error) {
      console.log("Error:", error);
      showNotification("error", "Có lỗi xảy ra từ Server");
    } finally {
      setShowSkeleton(false);
    }
  }

  useEffect(() => {
    fetchAllChainTemplateStepSubStep();
  }, []);

  const initialPermissions = {
    create: false,
    read: false,
    update: false,
    delete: false,
    confirm: false,
    approve1: false,
    approve2: false,
  };

  const handleCheckboxChange = (level, id, permission, checked) => {
    const newCheckedState = { ...checkedChainAndChild };

    const findNode = (array, nodeId) =>
      array.find((item) => item.id === nodeId);
    const findOrCreateNode = (array, nodeId) => {
      let node = findNode(array, nodeId);
      if (!node) {
        node = { id: nodeId, permissions: { ...initialPermissions } };
        array.push(node);
      }
      return node;
    };

    const currentNode = findOrCreateNode(newCheckedState[level], id);
    currentNode.permissions[permission] = checked;

    let targetChain = null;
    let targetTemplate = null;
    let targetStep = null;
    let targetSubStep = null;

    if (level === "chain") {
      targetChain = dataChain.find((itemChain) => itemChain.id === id);
    } else if (level === "template") {
      dataChain.forEach((chain) => {
        const template = chain.templates.find((itemTemplate) => itemTemplate.id === id);
        if (template) {
          targetChain = chain;
          targetTemplate = template;
        }
      });
    } else if (level === "step") {
      dataChain.forEach((chain) => {
        for (const template of chain.templates) {
          const step = template.steps.find((itemStep) => itemStep.id === id);
          if (step) {
            targetChain = chain;
            targetTemplate = template;
            targetStep = step;
          }
        }
      });
    } else if (level === "subStep") {
      dataChain.forEach((chain) => {
        for (const template of chain.templates) {
          for (const step of template.steps) {
            const subStep = step.subSteps.find((itemSubStep) => itemSubStep.id === id);
            if (subStep) {
              targetChain = chain;
              targetTemplate = template;
              targetStep = step;
              targetSubStep = subStep;
            }
          }
        }
      });
    }

    const areAllChildrenChecked = (nodes, nodeArray, permission) => {
      return nodes.every((node) => {
        const nodeState = findNode(nodeArray, node.id);
        return nodeState?.permissions[permission] === true;
      });
    };

    if (checked) {
      if (level === "chain") {
        targetChain.templates.forEach((template) => {
          const templateNode = findOrCreateNode(newCheckedState.template, template.id);
          templateNode.permissions[permission] = true;

          template.steps.forEach((step) => {
            const stepNode = findOrCreateNode(newCheckedState.step, step.id);
            stepNode.permissions[permission] = true;

            step.subSteps.forEach((subStep) => {
              const subStepNode = findOrCreateNode(newCheckedState.subStep, subStep.id);
              subStepNode.permissions[permission] = true;
            });
          });
        });
      } else if (level === "template") {
        targetTemplate.steps.forEach((step) => {
          const stepNode = findOrCreateNode(newCheckedState.step, step.id);
          stepNode.permissions[permission] = true;

          step.subSteps.forEach((subStep) => {
            const subStepNode = findOrCreateNode(newCheckedState.subStep, subStep.id);
            subStepNode.permissions[permission] = true;
          });
        });

        if (areAllChildrenChecked(targetChain.templates, newCheckedState.template, permission)) {
          const chainNode = findOrCreateNode(newCheckedState.chain, targetChain.id);
          chainNode.permissions[permission] = true;
        }
      } else if (level === "step") {
        targetStep.subSteps.forEach((subStep) => {
          const subStepNode = findOrCreateNode(newCheckedState.subStep, subStep.id);
          subStepNode.permissions[permission] = true;
        });

        if (areAllChildrenChecked(targetTemplate.steps, newCheckedState.step, permission)) {
          const templateNode = findOrCreateNode(newCheckedState.template, targetTemplate.id);
          templateNode.permissions[permission] = true;

          if (areAllChildrenChecked(targetChain.templates, newCheckedState.template, permission)) {
            const chainNode = findOrCreateNode(newCheckedState.chain, targetChain.id);
            chainNode.permissions[permission] = true;
          }
        }
      } else if (level === "subStep") {
        if (areAllChildrenChecked(targetStep.subSteps, newCheckedState.subStep, permission)) {
          const stepNode = findOrCreateNode(newCheckedState.step, targetStep.id);
          stepNode.permissions[permission] = true;

          if (areAllChildrenChecked(targetTemplate.steps, newCheckedState.step, permission)) {
            const templateNode = findOrCreateNode(newCheckedState.template, targetTemplate.id);
            templateNode.permissions[permission] = true;

            if (areAllChildrenChecked(targetChain.templates, newCheckedState.template, permission)) {
              const chainNode = findOrCreateNode(newCheckedState.chain, targetChain.id);
              chainNode.permissions[permission] = true;
            }
          }
        }
      }
    }
    else {
      if (level === "chain") {
        targetChain.templates.forEach((template) => {
          const templateNode = findOrCreateNode(newCheckedState.template, template.id);
          templateNode.permissions[permission] = false;

          template.steps.forEach((step) => {
            const stepNode = findOrCreateNode(newCheckedState.step, step.id);
            stepNode.permissions[permission] = false;

            step.subSteps.forEach((subStep) => {
              const subStepNode = findOrCreateNode(newCheckedState.subStep, subStep.id);
              subStepNode.permissions[permission] = false;
            });
          });
        });
      } else if (level === "template") {
        targetTemplate.steps.forEach((step) => {
          const stepNode = findOrCreateNode(newCheckedState.step, step.id);
          stepNode.permissions[permission] = false;

          step.subSteps.forEach((subStep) => {
            const subStepNode = findOrCreateNode(newCheckedState.subStep, subStep.id);
            subStepNode.permissions[permission] = false;
          });
        });

        const chainNode = findOrCreateNode(newCheckedState.chain, targetChain.id);
        chainNode.permissions[permission] = false;
      } else if (level === "step") {
        targetStep.subSteps.forEach((subStep) => {
          const subStepNode = findOrCreateNode(newCheckedState.subStep, subStep.id);
          subStepNode.permissions[permission] = false;
        });

        const templateNode = findOrCreateNode(newCheckedState.template, targetTemplate.id);
        templateNode.permissions[permission] = false;

        const chainNode = findOrCreateNode(newCheckedState.chain, targetChain.id);
        chainNode.permissions[permission] = false;
      } else if (level === "subStep") {

        const stepNode = findOrCreateNode(newCheckedState.step, targetStep.id);
        stepNode.permissions[permission] = false;

        const templateNode = findOrCreateNode(newCheckedState.template, targetTemplate.id);
        templateNode.permissions[permission] = false;

        const chainNode = findOrCreateNode(newCheckedState.chain, targetChain.id);
        chainNode.permissions[permission] = false;
      }
    }

    setCheckedChainAndChild(newCheckedState);
  };

  const handlePermissionSwitch = (checked, permissionsToUpdate) => {
    const newCheckedState = { ...checkedChainAndChild };

    const updateAllNodes = (level, nodes) => {
      nodes.forEach((node) => {
        let checkedNode = newCheckedState[level].find(
          (item) => item.id === node.id
        );
        if (!checkedNode) {
          checkedNode = { id: node.id, permissions: { ...initialPermissions } };
          newCheckedState[level].push(checkedNode);
        }

        permissionsToUpdate.forEach((permission) => {
          checkedNode.permissions[permission] = checked;
        });

        if (level === "chain" && node.templates) {
          updateAllNodes("template", node.templates);
        } else if (level === "template" && node.steps) {
          updateAllNodes("step", node.steps);
        } else if (level === "step" && node.subSteps) {
          updateAllNodes("subStep", node.subSteps);
        }
      });
    };

    updateAllNodes("chain", dataChain);
    setCheckedChainAndChild(newCheckedState);
  };

  const handleMasterSwitch = (checked) => {
    handlePermissionSwitch(checked, Object.keys(initialPermissions));
  };

  const handleCRUDSwitch = (checked) => {
    handlePermissionSwitch(checked, ["create", "read", "update", "delete"]);
  };

  const handleConfirmSwitch = (checked) => {
    handlePermissionSwitch(checked, ["confirm"]);
  };

  const handleApprove1Switch = (checked) => {
    handlePermissionSwitch(checked, ["approve1"]);
  };

  const handleApprove2Switch = (checked) => {
    handlePermissionSwitch(checked, ["approve2"]);
  };

  const handleReadSwitch = (checked) => {
    handlePermissionSwitch(checked, ["read"]);
  };

  const handleCreateSwitch = (checked) => {
    handlePermissionSwitch(checked, ["create"]);
  };

  const handleUpdateSwitch = (checked) => {
    handlePermissionSwitch(checked, ["update"]);
  };

  const handleNodeSwitch = (level, nodeId, checked) => {
    const newCheckedState = { ...checkedChainAndChild };

    const findNode = (array, id) => array.find((item) => item.id === id);

    const findTargetNode = (dataChain, level, nodeId) => {
      let targetChain = null, targetTemplate = null, targetStep = null, targetSubStep = null;

      for (const chain of dataChain) {
        if (level === "chain" && chain.id === nodeId) {
          targetChain = chain;
          break;
        }

        for (const template of chain.templates || []) {
          if (level === "template" && template.id === nodeId) {
            targetChain = chain;
            targetTemplate = template;
            break;
          }

          for (const step of template.steps || []) {
            if (level === "step" && step.id === nodeId) {
              targetChain = chain;
              targetTemplate = template;
              targetStep = step;
              break;
            }

            for (const subStep of step.subSteps || []) {
              if (level === "subStep" && subStep.id === nodeId) {
                targetChain = chain;
                targetTemplate = template;
                targetStep = step;
                targetSubStep = subStep;
                break;
              }
            }
          }
        }
      }

      return { targetChain, targetTemplate, targetStep, targetSubStep };
    };

    const updatePermissions = (node, checked) => {
      node.permissions.create = checked;
      node.permissions.read = checked;
      node.permissions.update = checked;
      node.permissions.delete = checked;
    };

    const findOrCreateNode = (array, id) => {
      let node = findNode(array, id);
      if (!node) {
        node = { id: id, permissions: { ...initialPermissions } };
        array.push(node);
      }
      return node;
    };

    const updateChildNodes = (nodes, nodeLevel) => {
      nodes.forEach((node) => {
        const childNode = findOrCreateNode(newCheckedState[nodeLevel], node.id);
        updatePermissions(childNode, checked);

        if (nodeLevel === "chain" && node.templates) updateChildNodes(node.templates, "template");
        else if (nodeLevel === "template" && node.steps) updateChildNodes(node.steps, "step");
        else if (nodeLevel === "step" && node.subSteps) updateChildNodes(node.subSteps, "subStep");
      });
    };

    const areAllChildrenChecked = (nodes, nodeArray) =>
      nodes.every((node) => {
        const nodeState = findNode(nodeArray, node.id);
        return nodeState?.permissions.create &&
          nodeState?.permissions.read &&
          nodeState?.permissions.update &&
          nodeState?.permissions.delete;
      });

    const { targetChain, targetTemplate, targetStep, targetSubStep } = findTargetNode(dataChain, level, nodeId);
    const currentNode = findOrCreateNode(newCheckedState[level], nodeId);
    updatePermissions(currentNode, checked);

    if (level === "chain" && targetChain) {
      updateChildNodes([targetChain], "chain");
    } else if (level === "template" && targetTemplate) {
      updateChildNodes([targetTemplate], "template");
      const chainNode = findOrCreateNode(newCheckedState.chain, targetChain.id);
      updatePermissions(chainNode, areAllChildrenChecked(targetChain.templates, newCheckedState.template));
    } else if (level === "step" && targetStep) {
      updateChildNodes([targetStep], "step");
      const templateNode = findOrCreateNode(newCheckedState.template, targetTemplate.id);
      updatePermissions(templateNode, areAllChildrenChecked(targetTemplate.steps, newCheckedState.step));

      const chainNode = findOrCreateNode(newCheckedState.chain, targetChain.id);
      updatePermissions(chainNode, areAllChildrenChecked(targetChain.templates, newCheckedState.template));
    } else if (level === "subStep" && targetSubStep) {
      const stepNode = findOrCreateNode(newCheckedState.step, targetStep.id);
      updatePermissions(stepNode, areAllChildrenChecked(targetStep.subSteps, newCheckedState.subStep));

      const templateNode = findOrCreateNode(newCheckedState.template, targetTemplate.id);
      updatePermissions(templateNode, areAllChildrenChecked(targetTemplate.steps, newCheckedState.step));

      const chainNode = findOrCreateNode(newCheckedState.chain, targetChain.id);
      updatePermissions(chainNode, areAllChildrenChecked(targetChain.templates, newCheckedState.template));
    }

    setCheckedChainAndChild(newCheckedState);
  };

  const renderCheckboxGroup = (level, id) => {
    const findNode = (array, nodeId) => array.find((item) => item.id === nodeId);

    const node = findNode(checkedChainAndChild[level], id);
    const permissions = node?.permissions || {};

    const checkboxConfig = [
      { key: "read", label: <FileSearch size={20} /> },
      { key: "create", label: <FilePlus2 size={20} /> },
      { key: "update", label: <FilePen size={20} /> },
      { key: "delete", label: <FileMinus2 size={20} /> },
      { key: "confirm", label: <FileCheck2 size={20} /> },
      { key: "approve1", label: <img src="/Approve1.svg" alt="" width={25} height={25} /> },
      { key: "approve2", label: <img src="/Approve2.svg" alt="" width={25} height={25} /> },
    ];

    return (
      <div className={css.checkboxGroup}>
        <div className={css.switchHorizontal}>
          <span>
            <FileSearch size={20} />
            <FilePlus2 size={20} />
            <FilePen size={20} />
            <FileMinus2 size={20} />
          </span>
          <Switch
            checkedChildren="✔"
            unCheckedChildren="OFF"
            checked={
              permissions.create &&
              permissions.read &&
              permissions.update &&
              permissions.delete
            }
            onChange={(checked) => handleNodeSwitch(level, id, checked)}

          />
        </div>
        {checkboxConfig.map(({ key, label }) => (
          <Checkbox
            key={key}
            onChange={(e) => handleCheckboxChange(level, id, key, e.target.checked)}
            checked={permissions[key]}
          >
            {label}
          </Checkbox>
        ))}
      </div>
    );
  };

  const toggleNode = (nodeId) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  const renderTreeNode = (node, level, depth = 0) => {
    const nodeId = node.id;
    const isExpanded = expandedNodes[nodeId];
    const hasChildren =
      level !== "subStep" &&
      node[
        level === "chain"
          ? "templates"
          : level === "template"
            ? "steps"
            : "subSteps"
      ]?.length > 0;

    return (
      <div
        key={nodeId}
        className={css.treeNode}
        style={{ marginLeft: `${depth * 8}px` }}
      >
        <div className={css.nodeHeader}>
          {hasChildren && (
            <span className={css.expandIcon} onClick={() => toggleNode(nodeId)}>
              {isExpanded ? <CaretDownOutlined /> : <CaretRightOutlined />}
            </span>
          )}
          <span className={css.nodeName}>{node.name}</span>
          {renderCheckboxGroup(level, nodeId)}
        </div>

        {hasChildren && isExpanded && (
          <div className={css.nodeChildren}>
            {level === "chain" &&
              node.templates.map((template) =>
                renderTreeNode(template, "template", depth + 1)
              )}
            {level === "template" &&
              node.steps.map((step) => renderTreeNode(step, "step", depth + 1))}
            {level === "step" &&
              node.subSteps.map((subStep) =>
                renderTreeNode(subStep, "subStep", depth + 1)
              )}
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    const initialState = {
      chain: [],
      template: [],
      step: [],
      subStep: [],
    };

    dataChain.forEach((chain) => {
      initialState.chain.push({
        id: chain.id,
        permissions: { ...initialPermissions },
      });

      chain.templates.forEach((template) => {
        initialState.template.push({
          id: template.id,
          permissions: { ...initialPermissions },
        });

        template.steps.forEach((step) => {
          initialState.step.push({
            id: step.id,
            permissions: { ...initialPermissions },
          });

          step.subSteps.forEach((subStep) => {
            initialState.subStep.push({
              id: subStep.id,
              permissions: { ...initialPermissions },
            });
          });
        });
      });
    });

    setCheckedChainAndChild(initialState);
  }, [dataChain]);

  const chuThichRender = [
    { icon: <FileSearch />, label: "Xem" },
    { icon: <FilePlus2 />, label: "Tạo" },
    { icon: <FilePen />, label: "Sửa" },
    { icon: <FileMinus2 />, label: "Xóa" },
    { icon: <FileCheck2 />, label: "Xác nhận" },
    { icon: <img src="/Approve1.svg" alt="" width={20} height={20} />, label: "Duyệt 1" },
    { icon: <img src="/Approve2.svg" alt="" width={20} height={20} />, label: "Duyệt 2" },
  ]

  const switchRender = [
    { icon: <FileSearch />, label: "XEM", onChange: handleReadSwitch },
    { icon: <FilePlus2 />, label: "TẠO", onChange: handleCreateSwitch },
    { icon: <FilePen />, label: "SỬA", onChange: handleUpdateSwitch },
    { icon: <><FileSearch /><FilePlus2 /><FilePen /><FileMinus2 /></>, label: "CRUD", onChange: handleCRUDSwitch },
    { icon: <FileCheck2 />, label: "Confirm", onChange: handleConfirmSwitch },
    { icon: <img src="/Approve1.svg" alt="" width={25} height={25} />, label: "Approve 1", onChange: handleApprove1Switch },
    { icon: <img src="/Approve2.svg" alt="" width={25} height={25} />, label: "Approve 2", onChange: handleApprove2Switch },
    { icon: <span>Master</span>, label: "Master", onChange: handleMasterSwitch, checkedChildren: "🔓", unCheckedChildren: "OFF" },
  ]

  return (
    <>
      {contextHolder}
      {showSkeleton
        ? (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexDirection: "column" }}>
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton.Button key={index} size="small" block active shape="round" />
            ))}
            <div style={{ width: "100%", display: "flex", justifyContent: "spaceBetween", gap: "10px" }}>
              <div style={{ flex: 1 }}>
                <Skeleton.Button size="small" block active shape="round" />
              </div>
              <div style={{ width: "maxContent", display: "flex", alignItems: "center" }}>
                <span>Đang lấy dữ liệu Chain</span>
              </div>
              <div style={{ flex: 1 }}>
                <Skeleton.Button size="small" block active shape="round" />
              </div>
            </div>
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton.Button key={index} size="small" block active shape="round" />
            ))}
          </div>
        )
        : (
          <div className={css.permissionTree}>
            <div className={css.treeNode}>

              <div className={css.nodeHeaderMain}>
                <div>Chú thích:</div>
                <div>
                  {chuThichRender.map(({ icon, label }, index) => (
                    <div key={index} style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                      <span>{icon}</span>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={css.nodeHeaderMain}>
                <div>Công tắc toàn cục:</div>
                <div>
                  {switchRender.map(({ icon, onChange, checkedChildren = "✔", unCheckedChildren = "OFF" }, index) => (
                    <div key={index} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <span>{icon}</span>
                      <Switch
                        checkedChildren={checkedChildren}
                        unCheckedChildren={unCheckedChildren}
                        onChange={onChange}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className={css.nodeHeaderMain}>
                <div><b>Danh sách Chain</b></div>
              </div>
            </div>
            {dataChain.map((chain) => renderTreeNode(chain, "chain"))}
          </div>
        )
      }
    </>
  );
};

export default ChainElement;
