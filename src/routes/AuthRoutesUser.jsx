import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { getCurrentUserLogin } from '../apis/userService';
import NotAuthorized from '../pages/HTTPStatus/NotAuthorized';
import Loading3DTower from '../components/Loading3DTower';
import '../index.css';
import { getSettingByType, getSchemaTools } from '../apis/settingService.jsx';
import { getUserClassByEmail } from '../apis/userClassService.jsx';
import { getAllPath } from '../apis/adminPathService';

export default function AuthRoutesUser() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [allowedAppIds, setAllowedAppIds] = useState([]);
  const [tools, setTools] = useState([]);
  const [currentSchema, setCurrentSchema] = useState(null);
  const [schemaTools, setSchemaTools] = useState([]);
  const [availableSchemas, setAvailableSchemas] = useState([]);
  const [trialApps, setTrialApps] = useState([]);
  const location = useLocation();

  // 1. Lấy dashboard setting (fallback)
  useEffect(() => {
    const fetchDashboardSetting = async () => {
      try {
        const existing = await getSettingByType('DASHBOARD_SETTING');
        if (existing.setting) {
          setTools(existing.setting);
        }
      } catch (error) {
        console.error('Lỗi khi lấy/tạo DASHBOARD_SETTING:', error);
      }
    };
    fetchDashboardSetting();
  }, []);

  // 2.2. Lấy danh sách Trial Apps (dùng thử)
  useEffect(() => {
    const loadTrialApps = async () => {
      try {
        const response = await getSettingByType('DASHBOARD_TRIAL_APPS');
        if (response && Array.isArray(response.setting)) {
          setTrialApps(response.setting);
        } else if (response && response.setting) {
          setTrialApps([]);
        }
      } catch (error) {
        // Nếu chưa có setting, bỏ qua
        setTrialApps([]);
      }
    };
    loadTrialApps();
  }, []);

  // 2. Lấy stepAccess cho user
  useEffect(() => {
    const fetchUserClass = async () => {
      try {
        const userClasses = await getUserClassByEmail();
        const allStepAccess = userClasses
            .filter(cls => Array.isArray(cls.stepAccess))
            .flatMap(cls => cls.stepAccess);
        setAllowedAppIds([...new Set(allStepAccess)]);
      } catch (error) {
        setAllowedAppIds([]);
      }
    };
    fetchUserClass();
  }, []);

  // 2.5. Lấy danh sách available schemas
  useEffect(() => {
    const fetchAvailableSchemas = async () => {
      try {
        const response = await getAllPath();
        if (response && response.data) {
          const activeSchemas = response.data.filter(schema => 
            schema.status === "true" && schema.show === true
          );
          setAvailableSchemas(activeSchemas);
        }
      } catch (error) {
        console.error('Lỗi khi lấy available schemas:', error);
        setAvailableSchemas([]);
      }
    };
    fetchAvailableSchemas();
  }, []);

  // 3. Lấy thông tin user
  useEffect(() => {
    const fetchCurrentUserLogin = async () => {
      setIsLoading(true);
      try {
        const { data } = await getCurrentUserLogin();
        if (data) {
          setCurrentUser(data);
          
          // Xác định schema hiện tại của user
          let userSchema = data.schema;
          
          // Kiểm tra localStorage cho schema được chọn (nếu là super admin)
          if (data.isSuperAdmin) {
            const selectedSchemaId = localStorage.getItem('selectedSchemaId');
            if (selectedSchemaId) {
              // Nếu có schema được chọn, sử dụng nó
              userSchema = selectedSchemaId;
            }
          }
          
          // Kiểm tra nếu user đang ở schema khác (không phải master/default)
          if (userSchema && userSchema !== 'master' && userSchema !== 'default') {
            setCurrentSchema(userSchema);
          } else {
            setCurrentSchema('master'); // Schema gốc
          }
          
          /*
           * XỬ LÝ SCHEMA ID:
           * - userSchema có thể là: 'master', 'default', hoặc ID số (1, 2, 3...)
           * - Nếu là ID số: cần resolve thành path để gọi getSchemaTools()
           * - Nếu là 'master'/'default': sử dụng tools từ DASHBOARD_SETTING
           */
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      } finally {
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      }
    };
    fetchCurrentUserLogin();
  }, []);

  // 4. Lấy tools được cấu hình cho schema hiện tại
  useEffect(() => {
    const fetchSchemaTools = async () => {
      if (!currentSchema || currentSchema === 'master' || currentSchema === 'default') {
        // Schema gốc: sử dụng tools từ dashboard setting
        setSchemaTools([]);
        return;
      }

      try {
        // Nếu currentSchema là ID (số), cần lấy path từ available schemas
        let schemaPath = currentSchema;
        
        // Kiểm tra nếu currentSchema là ID (số)
        if (!isNaN(currentSchema)) {
          const schema = availableSchemas.find(s => s.id.toString() === currentSchema.toString());
          if (schema) {
            schemaPath = schema.path;
            } else {
            setSchemaTools([]);
            return;
          }
        }

        const schemaToolsResponse = await getSchemaTools(schemaPath);
        
        if (schemaToolsResponse && schemaToolsResponse.setting && schemaToolsResponse.setting.length > 0) {
          setSchemaTools(schemaToolsResponse.setting);
         } else {
          setSchemaTools([]);
          }
      } catch (error) {
        console.error('Lỗi khi lấy tools cho schema:', error);
        setSchemaTools([]);
      }
    };

    if (availableSchemas.length > 0) {
      fetchSchemaTools();
    }
  }, [currentSchema, availableSchemas]);

  // 5. Xác định các tool được hiển thị dựa trên schema và role
  const getVisibleTools = () => {
    const isTrialExpired = (trial) => {
      if (!trial?.endDate) return false;
      return new Date() > new Date(trial.endDate);
    };
    const activeTrialIds = trialApps
      .filter(t => t.isActive !== false && !isTrialExpired(t))
      .map(t => t.id);

    // Nếu có schema tools được cấu hình, sử dụng chúng
    if (schemaTools.length > 0) {
      if (currentUser?.isSuperAdmin || currentUser?.isAdmin) {
        // Super Admin & Admin: truy cập tất cả apps trong schema
        const base = schemaTools.filter(tool => tool.id !== 'data-factory');
        const trialOnly = activeTrialIds
          .filter(id => !base.some(t => t.id === id))
          .map(id => ({ id }));
        return [...base, ...trialOnly];
      } else {
        // User thường: chỉ truy cập apps được cấu hình trong stepAccess
        const base = schemaTools.filter(tool =>
          allowedAppIds.includes(tool.id) && tool.id !== 'data-factory'
        );
        // Cộng thêm các app đang trial (không cần trong stepAccess)
        const trialOnly = activeTrialIds
          .filter(id => !base.some(t => t.id === id))
          .map(id => ({ id }));
        return [...base, ...trialOnly];
      }
    } else {
      // Fallback: sử dụng tools từ dashboard setting (schema gốc)
      if (currentUser?.isSuperAdmin || currentUser?.isAdmin) {
        const base = tools.filter(tool => tool.id !== 'data-factory');
        const trialOnly = activeTrialIds
          .filter(id => !base.some(t => t.id === id))
          .map(id => ({ id }));
        return [...base, ...trialOnly];
      } else {
        const base = allowedAppIds.length > 0
          ? tools.filter(tool =>
              allowedAppIds.includes(tool.id) && tool.id !== 'data-factory'
          )
          : [];
        const trialOnly = activeTrialIds
          .filter(id => !base.some(t => t.id === id))
          .map(id => ({ id }));
        return [...base, ...trialOnly];
      }
    }
  };

  /*
   * LOGIC HOẠT ĐỘNG CỦA SCHEMA-BASED ACCESS CONTROL:
   * 
   * 1. SCHEMA GỐC (master/default):
   *    - Sử dụng tools từ DASHBOARD_SETTING
   *    - Super Admin & Admin: truy cập tất cả apps
   *    - User thường: chỉ truy cập apps trong stepAccess
   * 
   * 2. SCHEMA KHÁC (dev, test, staging, etc.):
   *    - Gọi getSchemaTools(schema.path) để lấy tools được cấu hình
   *    - Nếu có cấu hình: sử dụng tools từ schema
   *    - Nếu không có cấu hình: fallback về logic cũ
   * 
   * 3. QUYỀN TRUY CẬP:
   *    - Super Admin: Có thể chọn schema và truy cập tất cả apps trong schema đó
   *    - Admin: Truy cập tất cả apps trong schema hiện tại
   *    - User thường: Chỉ truy cập apps được cấu hình trong stepAccess của schema hiện tại
   * 
   * 4. FALLBACK MECHANISM:
   *    - Nếu không thể lấy tools từ schema → sử dụng DASHBOARD_SETTING
   *    - Nếu không có stepAccess → không có app nào được hiển thị
   */

  const visibleTools = getVisibleTools();

  // 6. Xử lý loading
  if (isLoading) {
    return (
        <div
            style={{
              width: '100vw',
              height: '100vh',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
        >
          <Loading3DTower />
        </div>
    );
  }

  // 7. Không có email -> Không hợp lệ
  if (!currentUser?.email) {
    return <NotAuthorized />;
  }

  const firstSegment = location.pathname.split('/')[1];

  const toolIds = visibleTools.map(tool => tool.id);
  const hasAccess = toolIds.includes(firstSegment);
  if (!hasAccess) {
    return <NotAuthorized />;
  }

  return <Outlet />;
}
