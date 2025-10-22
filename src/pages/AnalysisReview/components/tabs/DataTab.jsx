import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ArrowLeft, Link } from 'lucide-react';
import styles from './DataTab.module.css';
import { Outlet, useParams } from 'react-router-dom';
import { getAllApprovedVersion } from '../../../../apis/approvedVersionTemp.jsx';
import { getTableByid, getTemplateRow } from '../../../../apis/templateSettingService.jsx';
import { Button } from 'antd';
import Loading3DTower from '../../../../components/Loading3DTower.jsx';
const DataTab = () => {
  const { id } = useParams();
  const [dataItems, setDataItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFirstLoading, setIsFirstLoading] = useState(false);
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Unknown';

    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      return `${diffInDays} days ago`;
    }
  };

  const fetchDataApprovedVersionTemplate = async () => {
    try {
      setLoading(true);
      const allData = await getAllApprovedVersion();
      // Filter data where apps includes 'analysis-review'
      const data = allData.filter(item =>
        (Array.isArray(item.apps) && item.apps?.includes('analysis-review'))
      );
      // Check which approved versions actually have data
      const approvedVersionsWithData = [];
      
      for (const item of data) {
        try {
          // Check if this approved version has data by calling getTemplateRow
          const templateTable = await getTableByid(item.id_template);
          let versionList = templateTable.steps;
          let versionId = item.id_version;
          const rowVersion = await getTemplateRow(
            item.id_template, 
            item.id_version == 1 ? null : item.id_version,
            false,
            1,
            100
          );
          
          // Only include if there's actual data
          if (rowVersion && rowVersion.rows && rowVersion.rows.length > 0) {
            approvedVersionsWithData.push(item);
          }
        } catch (error) {
          console.warn(`Error checking data for approved version ${item.id}:`, error);
          // Skip this item if there's an error checking data
        }
      }

      // Transform API data to match our component structure
      const transformedData = approvedVersionsWithData.map(item => ({
        id: item.id,
        name: item.name,
        lastModified: formatTimeAgo(item.updated_at || item.created_at),
        id_version : item.id_version,
        originalData: item // Keep original data for reference
      }));

      setDataItems(transformedData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsFirstLoading(true);
    fetchDataApprovedVersionTemplate();
    setTimeout(() => {
      setIsFirstLoading(false);
    }, 1000);
  }, []);

  const navigate = useNavigate();

  const handleDataItemClick = (itemId) => {
    navigate(`/analysis-review/data/${itemId}`);
  };

  return (
    <div className={styles.layout} style={{ position: 'relative' }}>
      {isFirstLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          backdropFilter: 'blur(10px)',
          zIndex: 1000,
        }}>
          <Loading3DTower />
        </div>
      )}
      <div className={styles.leftPanel}>
        <h3 className={styles.panelHeader}>Data Sources</h3>
        <div className={styles.spaceY2}>
          {loading ? (
            <div className={styles.loadingState}>
              <p>Loading data sources...</p>
            </div>
          ) : dataItems.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No data sources found</p>
            </div>
          ) : (
            dataItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleDataItemClick(item.id)}
                className={`${styles.dataItem} ${id == item.id ? styles.selected : ''}`}
                style={{ position: 'relative' }}
              >
                <div className={styles.dataItemName}>{item.name}</div>
                <div className={styles.dataItemMeta}>
                  {item.type} • {item.lastModified}
                </div>
                {/* Nút back ở góc dưới bên phải */}
                <Button
                  className={styles.backButton}
                  type='link'
                  style={{ position: 'absolute', right: 8, bottom: 8, zIndex: 2 }}
                  title='Xem tài liệu gốc'
                  onClick={e => {
                    e.stopPropagation();
                    window.open(`/data-manager/data/${item.originalData.id_fileNote}/step/${item.id_version}`, '_blank');
                  }}
                >
                  <Link size={18} />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className={styles.mainPanel}>
        {id ?
          <Outlet /> : <div className={styles.emptyState}>
            <FileText className={styles.emptyStateIcon} />
            <p className={styles.emptyStateText}>Select a data source to view details</p>
          </div>
        }

      </div>
    </div>
  );
};

export default DataTab;
