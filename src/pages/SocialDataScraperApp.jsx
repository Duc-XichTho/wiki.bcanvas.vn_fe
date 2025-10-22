import React, { useState, useEffect } from 'react';
import { Search, Calendar, Filter, ExternalLink, Monitor, Smartphone, X, Settings, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BackCanvas } from '../icon/svg/IconSvg.jsx';
import { createScrapedFbPost, getAllScrapedFbPosts } from '../apis/scrapedFbPostsService';

// PostCard component moved outside to prevent re-creation on every render
const PostCard = ({ post, onPhotoClick, forceDesktop }) => {
  // Parse user info if available
  let userInfo = null;
  try {
    if (post.user_info) {
      userInfo = typeof post.user_info === 'string' ? JSON.parse(post.user_info) : post.user_info;
    }
  } catch (error) {
    console.warn('Error parsing user info:', error);
  }

  // Parse media if available
  let media = null;
  try {
    if (post.media) {
      media = typeof post.media === 'string' ? JSON.parse(post.media) : post.media;
    }
  } catch (error) {
    console.warn('Error parsing media:', error);
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN');
    } catch (error) {
      return dateString;
    }
  };

  // Text expansion state
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const maxTextLength = 200; // Characters to show before "Xem thêm"
  const shouldShowExpandButton = post.text && post.text.length > maxTextLength;
  const displayText = isTextExpanded ? post.text : (post.text ? post.text.substring(0, maxTextLength) + (post.text.length > maxTextLength ? '...' : '') : 'No content available');

  return (
    <div style={{
      backgroundColor: 'var(--card-bg)',
      border: '1px solid var(--card-border)',
      borderRadius: '8px',
      padding: '14px',
      height: '365px',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto'
    }}>
      {/* <h3 style={{
        fontWeight: '500',
        color: 'var(--text-primary)',
        fontSize: '14px',
        margin: '0 0 8px 0',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {post.text ? post.text.substring(0, 50) + (post.text.length > 50 ? '...' : '') : 'No title'}
      </h3> */}
      
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
        {post.page_name || userInfo?.name || 'Unknown'} • {formatDate(post.created_time)}
      </div>
      
              <div style={{
          padding: '8px',
          backgroundColor: 'var(--bg-tertiary)',
          borderRadius: '4px',
          fontSize: '14px',
          color: 'var(--text-primary)',
          flex: 1,
          marginBottom: '12px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{
            flex: 1,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflowY: isTextExpanded ? 'auto' : 'hidden',
            maxHeight: isTextExpanded ? '150px' : 'none'
          }}>
            {displayText}
          </div>
        {shouldShowExpandButton && (
          <button
            onClick={() => setIsTextExpanded(!isTextExpanded)}
            style={{
              alignSelf: 'flex-start',
              padding: '4px 8px',
              color: 'var(--accent-primary)',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500'
            }}
          >
            {isTextExpanded ? 'Thu gọn' : 'Xem thêm'}
          </button>
        )}
      </div>
      
      {/* Media Display */}
      {media && media.length > 0 ? (
        <div style={{
          marginBottom: '12px',
          display: 'flex',
          gap: '8px',
          overflow: 'hidden'
        }}>
          {media
            .filter((item) => {
              // Filter out items without valid image URLs
              const hasValidImage = !!(item.thumbnail || item.photo_image?.uri || item.image?.uri);
              return hasValidImage;
            })
            .slice(0, 3)
            .map((item, index) => {
              // Handle different data structures for single vs multiple images
              const imageUrl = item.thumbnail || item.photo_image?.uri || item.image?.uri;
              console.log(`Media item ${index}:`, { 
                item, 
                imageUrl,
                hasThumbnail: !!item.thumbnail,
                hasPhotoImage: !!item.photo_image?.uri,
                hasImage: !!item.image?.uri
              });
              
              return (
              <div key={index} style={{
                width: forceDesktop ? '20%' : '10%',
                borderRadius: '4px',
                overflow: 'hidden',
                backgroundColor: 'var(--bg-tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                aspectRatio: '1'
              }}>
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Post media"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      cursor: 'pointer'
                    }}
                    onClick={() => onPhotoClick(imageUrl)}
                    onError={(e) => {
                      console.log('Image failed to load:', imageUrl);
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div style={{
                  display: imageUrl ? 'none' : 'flex',
                  width: '100%',
                  height: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  fontSize: '12px'
                }}>
                  📷
                </div>
              </div>
                          );
            })}
          {(() => {
            // Calculate valid images count for overflow indicator
            const validImages = media.filter(item => !!(item.thumbnail || item.photo_image?.uri || item.image?.uri));
            const remainingCount = validImages.length - 3;
            
            return validImages.length > 3 && (
              <div style={{
                width: forceDesktop ? '20%' : '10%',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                aspectRatio: '1'
              }}>
                +{remainingCount}
              </div>
            );
          })()}
        </div>
      ) : (
        <div style={{
          marginBottom: '12px',
          width: forceDesktop ? '20%' : '10%',
          borderRadius: '4px',
          backgroundColor: 'var(--bg-tertiary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)',
          fontSize: '12px',
          aspectRatio: '1'
        }}>
          📷 No media
        </div>
      )}
      
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
        color: 'var(--text-secondary)',
        marginTop: 'auto'
      }}>
        <div>
          <span>Like {post.likes?.toLocaleString() || 0}</span>
          <span style={{ marginLeft: '12px' }}>Share {post.shares || 0}</span>
          <span style={{ marginLeft: '12px' }}>Comment {post.comments || 0}</span>
        </div>
        <button
          onClick={() => window.open(post.post_url || post.facebook_url, '_blank')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            color: 'var(--accent-primary)',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          <ExternalLink style={{ width: '12px', height: '12px' }} />
          Xem
        </button>
      </div>
    </div>
  );
};

const SocialDataScraperApp = () => {
  const navigate = useNavigate();
  const [selectedPages, setSelectedPages] = useState(['meta-vietnam', 'shopee-vietnam']);
  const [timeFilter, setTimeFilter] = useState('today');
  const [interactionFilter, setInteractionFilter] = useState('all');
  const [showPageDropdown, setShowPageDropdown] = useState(false);
  const [pageSearchQuery, setPageSearchQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [forceDesktop, setForceDesktop] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  
  // Import modal states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJsonData, setImportJsonData] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');

  // Data fetching states
  const [scrapedData, setScrapedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Mobile filter toggle
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Page filter state
  const [selectedPageFilter, setSelectedPageFilter] = useState('all');


  // Sample pages data
  const pages = [
    { id: 'meta-vietnam', name: 'Meta Vietnam', type: 'page' },
    { id: 'shopee-vietnam', name: 'Shopee Vietnam', type: 'page' },
    { id: 'grab-vietnam', name: 'Grab Vietnam', type: 'page' },
    { id: 'tiki-vietnam', name: 'Tiki Vietnam', type: 'page' },
    { id: 'sendo-vietnam', name: 'Sendo Vietnam', type: 'group' },
    { id: 'lazada-vietnam', name: 'Lazada Vietnam', type: 'page' }
  ];

  // Debug initial state
  console.log('Initial state:', {
    selectedPages,
    searchQuery,
    interactionFilter,
    pages: pages.map(p => ({ id: p.id, name: p.name }))
  });

  const timeFilterOptions = [
    { value: 'today', label: 'Hôm nay' },
    { value: 'last-24h', label: '24 giờ qua' },
    { value: 'yesterday', label: 'Hôm qua' },
    { value: 'this-week', label: 'Tuần này' },
    { value: 'last-week', label: 'Tuần trước' },
    { value: 'this-month', label: 'Tháng này' }
  ];

  const handlePageToggle = (pageId) => {
    setSelectedPages(prev =>
      prev.includes(pageId)
        ? prev.filter(id => id !== pageId)
        : [...prev, pageId]
    );
  };

  // Function to fetch scraped data
  const fetchScrapedData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const data = await getAllScrapedFbPosts();
      console.log('API Response:', data);
      console.log('Data type:', typeof data);
      console.log('Data length:', Array.isArray(data) ? data.length : 'Not an array');
      setScrapedData(data || []);
    } catch (error) {
      console.error('Error fetching scraped data:', error);
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchScrapedData();
  }, []);

  const handleImportJson = async () => {
    if (!importJsonData.trim()) {
      setImportError('Vui lòng nhập dữ liệu JSON');
      return;
    }

    setImportLoading(true);
    setImportError('');

    try {
      // Parse JSON data
      const jsonData = JSON.parse(importJsonData);
      
      if (!Array.isArray(jsonData)) {
        throw new Error('Dữ liệu JSON phải là một mảng');
      }

      // Process each item in the JSON array
      const importPromises = jsonData.map(async (item) => {
        // Map the JSON structure to scraped_fbposts table schema
        const mappedData = {
          post_id: item.postId || '',
          page_name: item.pageName || '',
          facebook_url: item.facebookUrl || '',
          post_url: item.url || '',
          top_level_url: item.topLevelUrl || '',
          created_time: item.time || null,
          timestamp: item.timestamp || null,
          text: item.text || '',
          likes: item.likes || 0,
          comments: item.comments || 0,
          shares: item.shares || 0,
          top_reactions_count: item.topReactionsCount || 0,
          user_info: item.user ? JSON.stringify(item.user) : null,
          media: item.media ? JSON.stringify(item.media) : null,
          hashtags: item.textReferences ? JSON.stringify(item.textReferences) : null,
          feedback_id: item.feedbackId || '',
          raw_json: JSON.stringify(item), // Store the complete original JSON
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
          user_create: null,
          user_update: null,
          user_delete: null,
          show: true
        };

        return await createScrapedFbPost(mappedData);
      });

      await Promise.all(importPromises);
      
      // Close modal and reset form
      setShowImportModal(false);
      setImportJsonData('');
      alert('Import thành công!');
      
      // Refresh the data after successful import
      await fetchScrapedData();
      
    } catch (error) {
      console.error('Import error:', error);
      setImportError(error.message || 'Có lỗi xảy ra khi import dữ liệu');
    } finally {
      setImportLoading(false);
    }
  };

     const handleCloseImportModal = () => {
     setShowImportModal(false);
     setImportJsonData('');
     setImportError('');
   };

   const closePhotoModal = () => {
     setShowPhotoModal(false);
     setSelectedPhoto(null);
   };

  const filteredPages = pages.filter(page =>
    page.name.toLowerCase().includes(pageSearchQuery.toLowerCase())
  );

        // Memoize filtered data to prevent unnecessary re-computations
   const filteredData = React.useMemo(() => {
     return scrapedData.filter(item => {
       // Parse user info for filtering
       let userInfo = null;
       try {
         if (item.user_info) {
           userInfo = typeof item.user_info === 'string' ? JSON.parse(item.user_info) : item.user_info;
         }
       } catch (error) {
         console.warn('Error parsing user info for filtering:', error);
       }

       // Search filter
       const matchesSearch = searchQuery === '' || 
         (item.text && item.text.toLowerCase().includes(searchQuery.toLowerCase())) ||
         (item.page_name && item.page_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
         (userInfo?.name && userInfo.name.toLowerCase().includes(searchQuery.toLowerCase()));

       // Time filter
       const matchesTime = (() => {
         if (timeFilter === 'today') return true; // For now, show all data for 'today'
         
         if (!item.created_time) return true; // If no date, include it
         
         try {
           const postDate = new Date(item.created_time);
           const now = new Date();
           const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
           const yesterday = new Date(today);
           yesterday.setDate(yesterday.getDate() - 1);
           const thisWeekStart = new Date(today);
           thisWeekStart.setDate(today.getDate() - today.getDay());
           const lastWeekStart = new Date(thisWeekStart);
           lastWeekStart.setDate(thisWeekStart.getDate() - 7);
           const lastWeekEnd = new Date(thisWeekStart);
           lastWeekEnd.setTime(lastWeekEnd.getTime() - 1);
           const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
           
           switch (timeFilter) {
             case 'last-24h':
               const last24h = new Date(now);
               last24h.setHours(last24h.getHours() - 24);
               return postDate >= last24h;
             case 'yesterday':
               const yesterdayEnd = new Date(today);
               yesterdayEnd.setTime(yesterdayEnd.getTime() - 1);
               return postDate >= yesterday && postDate <= yesterdayEnd;
             case 'this-week':
               return postDate >= thisWeekStart;
             case 'last-week':
               return postDate >= lastWeekStart && postDate <= lastWeekEnd;
             case 'this-month':
               return postDate >= thisMonthStart;
             default:
               return true;
           }
         } catch (error) {
           console.warn('Error parsing date for filtering:', error);
           return true; // Include items with invalid dates
         }
       })();

       // Page filter
       const matchesPage = selectedPageFilter === 'all' || item.page_name === selectedPageFilter;

       // Interaction filter
       const matchesInteraction = interactionFilter === 'all' || 
         (interactionFilter === 'high' && (item.likes > 100));
       
       return matchesSearch && matchesTime && matchesPage && matchesInteraction;
     });
   }, [scrapedData, searchQuery, timeFilter, interactionFilter, selectedPageFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageData = filteredData.slice(startIndex, endIndex);

     // Get unique page names from scraped data
   const uniquePages = React.useMemo(() => {
     const pageNames = scrapedData
       .map(item => item.page_name)
       .filter(name => name && name.trim() !== '')
       .filter((name, index, array) => array.indexOf(name) === index)
       .sort();
     return pageNames;
   }, [scrapedData]);

   // Reset to first page when filters change
   React.useEffect(() => {
     setCurrentPage(1);
   }, [searchQuery, timeFilter, interactionFilter, selectedPageFilter]);

  // Handle photo modal
  const handlePhotoClick = React.useCallback((photoUrl) => {
    setSelectedPhoto(photoUrl);
    setShowPhotoModal(true);
  }, []);

  // Handle resource updates
  const handleUpdateResource = (updatedResource) => {
    setResources(prev => 
      prev.map(resource => 
        resource.id === updatedResource.id ? updatedResource : resource
      )
    );
  };

  // Handle resource deletion
  const handleDeleteResource = (resourceId) => {
    setResources(prev => 
      prev.filter(resource => resource.id !== resourceId)
    );
  };

  // Handle resource creation
  const handleCreateResource = (newResource) => {
    setResources(prev => [...prev, newResource]);
  };

  const FilterPanel = React.useMemo(() => (
    <div style={{
      backgroundColor: 'var(--card-bg)',
      border: '1px solid var(--card-border)',
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      minHeight: '300px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <h3 style={{
        fontSize: '16px',
        fontWeight: '600',
        color: 'var(--text-primary)',
        margin: '0 0 16px 0',
        borderBottom: '1px solid var(--border-primary)',
        paddingBottom: '8px'
      }}>
        Bộ lọc
      </h3>
      
      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '500',
          color: 'var(--text-primary)',
          marginBottom: '8px'
        }}>Tìm kiếm</label>
        <input
          type="text"
          placeholder="Tìm kiếm nội dung..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid var(--input-border)',
            borderRadius: '4px',
            fontSize: '14px',
            backgroundColor: 'var(--input-bg)',
            color: 'var(--text-primary)',
            outline: 'none'
          }}
        />
      </div>

      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '500',
          color: 'var(--text-primary)',
          marginBottom: '8px'
        }}>Thời gian</label>
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: '14px',
            border: '1px solid var(--input-border)',
            borderRadius: '4px',
            backgroundColor: 'var(--input-bg)',
            color: 'var(--text-primary)',
            outline: 'none'
          }}
        >
          {timeFilterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '500',
          color: 'var(--text-primary)',
          marginBottom: '8px'
        }}>Trang</label>
        <select
          value={selectedPageFilter}
          onChange={(e) => setSelectedPageFilter(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: '14px',
            border: '1px solid var(--input-border)',
            borderRadius: '4px',
            backgroundColor: 'var(--input-bg)',
            color: 'var(--text-primary)',
            outline: 'none'
          }}
        >
          <option value="all">Tất cả trang</option>
          {uniquePages.map((pageName) => (
            <option key={pageName} value={pageName}>
              {pageName}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '500',
          color: 'var(--text-primary)',
          marginBottom: '8px'
        }}>Loại nội dung</label>
        <select
          value={interactionFilter}
          onChange={(e) => setInteractionFilter(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: '14px',
            border: '1px solid var(--input-border)',
            borderRadius: '4px',
            backgroundColor: 'var(--input-bg)',
            color: 'var(--text-primary)',
            outline: 'none'
          }}
        >
          <option value="all">Tất cả</option>
          <option value="high">Nhiều tương tác</option>
        </select>
      </div>
      
      <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-primary)' }}>
        <div style={{
          fontSize: '12px',
          color: 'var(--text-secondary)',
          textAlign: 'center'
        }}>
          Hiển thị {currentPageData.length} / {filteredData.length} bài đăng (Trang {currentPage}/{totalPages})
        </div>
      </div>
    </div>
  ), [filteredData.length, currentPageData.length, currentPage, totalPages, searchQuery, timeFilter, interactionFilter, selectedPageFilter, uniquePages]);

  // Import Modal Component
  const ImportModal = () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'var(--card-bg)',
        borderRadius: '8px',
        padding: '24px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '500',
            color: 'var(--text-primary)',
            margin: 0
          }}>
            Import JSON Data
          </h2>
          <button
            onClick={handleCloseImportModal}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              fontSize: '20px'
            }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: 'var(--text-primary)',
            marginBottom: '8px'
          }}>
            JSON Data (Array format)
          </label>
          <textarea
            value={importJsonData}
            onChange={(e) => setImportJsonData(e.target.value)}
            placeholder={`[
  {
    "postId": "813244967697043",
    "pageName": "Foodnbeveragevietnam",
    "facebookUrl": "https://www.facebook.com/Foodnbeveragevietnam",
    "url": "https://www.facebook.com/Foodnbeveragevietnam/posts/pfbid029uBvmjfye9B9G1WyNKNu689NbXVYTuTvDDoqvpSNFTzDuhY59fMKdsF1u2ehA8Lml",
    "topLevelUrl": "https://www.facebook.com/100070346405486/posts/813244967697043",
    "time": "2025-08-06T07:22:37.000Z",
    "timestamp": 1754464957,
    "text": "Post content here...",
    "likes": 35,
    "comments": 1,
    "shares": 18,
    "topReactionsCount": 3,
    "user": {
      "id": "100070346405486",
      "name": "F&B Việt Nam",
      "profileUrl": "https://www.facebook.com/Foodnbeveragevietnam",
      "profilePic": "https://scontent.fmnl32-1.fna.fbcdn.net/v/t39.30808-1/500010830_752632743758266_2133078995118400435_n.jpg"
    },
    "textReferences": [
      {
        "url": "https://www.facebook.com/hashtag/kinhnghiemfnb",
        "mobileUrl": "https://m.facebook.com/hashtag/kinhnghiemfnb",
        "id": "3051102551591052"
      }
    ],
    "media": [
      {
        "thumbnail": "https://scontent.fmnl32-1.fna.fbcdn.net/v/t39.30808-6/528875199_813243727697167_7012123865195558465_n.jpg",
        "photo_image": {
          "uri": "https://scontent.fmnl32-1.fna.fbcdn.net/v/t39.30808-6/528875199_813243727697167_7012123865195558465_n.jpg",
          "height": 526,
          "width": 526
        }
      }
    ],
    "feedbackId": "ZmVlZGJhY2s6ODEzMjQ0OTY3Njk3MDQz"
  }
]`}
            style={{
              width: '100%',
              minHeight: '200px',
              padding: '12px',
              border: '1px solid var(--input-border)',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: 'var(--input-bg)',
              color: 'var(--text-primary)',
              outline: 'none',
              fontFamily: 'monospace',
              resize: 'vertical'
            }}
          />
        </div>

        {importError && (
          <div style={{
            padding: '8px 12px',
            backgroundColor: 'var(--error-bg)',
            color: 'var(--error-text)',
            borderRadius: '4px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {importError}
          </div>
        )}

        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={handleCloseImportModal}
            style={{
              padding: '8px 16px',
              border: '1px solid var(--input-border)',
              borderRadius: '4px',
              backgroundColor: 'transparent',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleImportJson}
            disabled={importLoading}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: importLoading ? 'var(--text-tertiary)' : 'var(--accent-primary)',
              color: 'white',
              cursor: importLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {importLoading ? 'Importing...' : 'Import'}
            {importLoading && <div style={{ width: '16px', height: '16px', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />}
          </button>
        </div>
      </div>
    </div>
     );

       // Photo Modal Component
    const PhotoModal = () => (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }} onClick={closePhotoModal}>
        <div style={{
          backgroundColor: 'var(--card-bg)',
          borderRadius: '8px',
          maxWidth: '800px',
          maxHeight: '80vh',
          overflow: 'hidden',
          position: 'relative'
        }}>
         <button
           onClick={closePhotoModal}
           style={{
             position: 'absolute',
             top: '16px',
             right: '16px',
             color: 'var(--text-secondary)',
             backgroundColor: 'var(--card-bg)',
             borderRadius: '50%',
             padding: '8px',
             border: 'none',
             cursor: 'pointer',
             zIndex: 10,
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center'
           }}
         >
           <X style={{ width: '16px', height: '16px' }} />
         </button>
         <div style={{ padding: '24px' }}>
           <div style={{
      
             backgroundColor: 'var(--bg-tertiary)',
             borderRadius: '8px',
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center',
             color: 'var(--text-secondary)',
             fontSize: '16px'
           }}>
             {selectedPhoto ? (
               <img
                 src={selectedPhoto}
                 alt="Full size image"
                 style={{
                   width: '100%',
                   height: '100%',
                   objectFit: 'contain',
                   borderRadius: '8px'
                 }}
                 onError={(e) => {
                   e.target.style.display = 'none';
                   e.target.nextSibling.style.display = 'flex';
                 }}
               />
             ) : null}
             <div style={{
               display: selectedPhoto ? 'none' : 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               width: '100%',
               height: '100%'
             }}>
               📷 Ảnh không khả dụng
             </div>
           </div>
         </div>
       </div>
     </div>
   );

  // Pagination Component
  const PaginationComponent = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '8px',
        marginTop: '24px',
        padding: '16px'
      }}>
        <button
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
          style={{
            padding: '8px 12px',
            border: '1px solid var(--input-border)',
            borderRadius: '4px',
            backgroundColor: currentPage === 1 ? 'var(--bg-tertiary)' : 'var(--card-bg)',
            color: currentPage === 1 ? 'var(--text-tertiary)' : 'var(--text-primary)',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
        >
          ««
        </button>
        
        <button
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          style={{
            padding: '8px 12px',
            border: '1px solid var(--input-border)',
            borderRadius: '4px',
            backgroundColor: currentPage === 1 ? 'var(--bg-tertiary)' : 'var(--card-bg)',
            color: currentPage === 1 ? 'var(--text-tertiary)' : 'var(--text-primary)',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
        >
          «
        </button>

        {pageNumbers.map(pageNum => (
          <button
            key={pageNum}
            onClick={() => setCurrentPage(pageNum)}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--input-border)',
              borderRadius: '4px',
              backgroundColor: currentPage === pageNum ? 'var(--accent-primary)' : 'var(--card-bg)',
              color: currentPage === pageNum ? 'white' : 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: currentPage === pageNum ? '500' : 'normal'
            }}
          >
            {pageNum}
          </button>
        ))}

        <button
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          style={{
            padding: '8px 12px',
            border: '1px solid var(--input-border)',
            borderRadius: '4px',
            backgroundColor: currentPage === totalPages ? 'var(--bg-tertiary)' : 'var(--card-bg)',
            color: currentPage === totalPages ? 'var(--text-tertiary)' : 'var(--text-primary)',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
        >
          »
        </button>
        
        <button
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
          style={{
            padding: '8px 12px',
            border: '1px solid var(--input-border)',
            borderRadius: '4px',
            backgroundColor: currentPage === totalPages ? 'var(--bg-tertiary)' : 'var(--card-bg)',
            color: currentPage === totalPages ? 'var(--text-tertiary)' : 'var(--text-primary)',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
        >
          »»
        </button>
      </div>
    );
  };

   return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid var(--border-primary)',
        backgroundColor: 'var(--card-bg)',
        padding: '16px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1280px',
          margin: '0 auto'
        }}>
                     <div style={{
             display: 'flex',
             alignItems: 'center',
             gap: '12px'
           }}>
             <button
               onClick={() => navigate('/dashboard')}
               style={{
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
                 width: '32px',
                 height: '32px',
                 padding: 0,
                 backgroundColor: 'var(--card-bg)',
                 border: '1px solid var(--input-border)',
                 borderRadius: '4px',
                 cursor: 'pointer',
                 color: 'var(--text-primary)'
               }}
               title="Back to Dashboard"
             >
               <BackCanvas style={{ width: '16px', height: '16px' }} />
             </button>
             
             <h1 style={{
               fontSize: '18px',
               fontWeight: '500',
               color: 'var(--text-primary)',
               margin: 0
             }}>Social Data Scraper</h1>
            
                         <button
               onClick={() => setShowImportModal(true)}
               style={{
                 display: 'flex',
                 alignItems: 'center',
                 gap: '6px',
                 padding: '6px 12px',
                 backgroundColor: 'var(--accent-primary)',
                 color: 'white',
                 border: 'none',
                 borderRadius: '4px',
                 cursor: 'pointer',
                 fontSize: '12px',
                 fontWeight: '500'
               }}
             >
               <Upload style={{ width: '14px', height: '14px' }} />
               Import JSON
             </button>

             {!forceDesktop && (
               <button
                 onClick={() => setShowMobileFilters(!showMobileFilters)}
                 style={{
                   display: 'flex',
                   alignItems: 'center',
                   gap: '6px',
                   padding: '6px 12px',
                   backgroundColor: showMobileFilters ? 'var(--accent-primary)' : 'var(--card-bg)',
                   color: showMobileFilters ? 'white' : 'var(--text-primary)',
                   border: '1px solid var(--input-border)',
                   borderRadius: '4px',
                   cursor: 'pointer',
                   fontSize: '12px',
                   fontWeight: '500'
                 }}
               >
                 <Filter style={{ width: '14px', height: '14px' }} />
                 {showMobileFilters ? 'Ẩn Bộ lọc' : 'Hiện Bộ lọc'}
               </button>
             )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'var(--bg-tertiary)',
              borderRadius: '4px',
              padding: '4px'
            }}>
              <button
                onClick={() => setForceDesktop(true)}
                style={{
                  padding: '4px',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: forceDesktop ? 'var(--card-bg)' : 'transparent',
                  color: forceDesktop ? 'var(--text-primary)' : 'var(--text-tertiary)'
                }}
              >
                <Monitor style={{ width: '16px', height: '16px' }} />
              </button>
              <button
                onClick={() => setForceDesktop(false)}
                style={{
                  padding: '4px',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: !forceDesktop ? 'var(--card-bg)' : 'transparent',
                  color: !forceDesktop ? 'var(--text-primary)' : 'var(--text-tertiary)'
                }}
              >
                <Smartphone style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              color: 'var(--text-secondary)'
            }}>
              <Calendar style={{ width: '16px', height: '16px' }} />
              <span>{filteredData.length} bài đăng</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ 
        display: forceDesktop ? 'flex' : 'block',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Main Content Container */}
        <div style={{ 
          maxWidth: '1600px', 
          margin: '0 auto', 
          padding: '24px 16px',
          flex: 1
        }}>
          <div style={{
            display: forceDesktop ? 'grid' : 'block',
            gridTemplateColumns: '280px 1fr',
            gap: '24px',
            alignItems: 'start'
          }}>
            {/* Left Panel - Filters */}
            {forceDesktop && (
              <div style={{ 
                position: 'sticky', 
                top: '24px',
                height: 'fit-content'
              }}>
                {FilterPanel}
              </div>
            )}

            {/* Center Panel - Content */}
            <div>
            {/* Mobile Filter Panel */}
            {!forceDesktop && showMobileFilters && (
              <div style={{ marginBottom: '24px' }}>
                {FilterPanel}
              </div>
            )}

            {loading && (
               <div style={{
                 textAlign: 'center',
                 color: 'var(--text-tertiary)',
                 padding: '48px 0'
               }}>
                 <div style={{ width: '32px', height: '32px', border: '2px solid var(--accent-primary)', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                 <p>Đang tải dữ liệu...</p>
               </div>
             )}
             
             {error && (
               <div style={{
                 textAlign: 'center',
                 color: 'var(--error-text)',
                 padding: '48px 0'
               }}>
                 <p>{error}</p>
                 <button
                   onClick={fetchScrapedData}
                   style={{
                     marginTop: '16px',
                     padding: '8px 16px',
                     backgroundColor: 'var(--accent-primary)',
                     color: 'white',
                     border: 'none',
                     borderRadius: '4px',
                     cursor: 'pointer'
                   }}
                 >
                   Thử lại
                 </button>
               </div>
             )}
             
                                                      {!loading && !error && (
                <>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: forceDesktop ? 'repeat(3, 1fr)' : '1fr',
                    gap: '16px'
                  }}>
                    {console.log('Rendering currentPageData:', currentPageData)}
                    {console.log('currentPageData length:', currentPageData.length)}
                    {console.log('filteredData length:', filteredData.length)}
                    {console.log('scrapedData length:', scrapedData.length)}
                    {currentPageData.map((post) => (
                      <PostCard key={post.post_id} post={post} onPhotoClick={handlePhotoClick} forceDesktop={forceDesktop} />
                    ))}
                    {filteredData.length === 0 && (
                      <div style={{
                        textAlign: 'center',
                        color: 'var(--text-tertiary)',
                        padding: '48px 0'
                      }}>
                        <Filter style={{ width: '32px', height: '32px', margin: '0 auto 16px' }} />
                        <p>Không tìm thấy bài đăng nào</p>
                        <p style={{ fontSize: '12px', marginTop: '8px' }}>
                          Debug: scrapedData={scrapedData.length}, selectedPages={selectedPages.length}, searchQuery="{searchQuery}"
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Pagination */}
                  <PaginationComponent />
                </>
              )}
            </div>
          </div>
        </div>

      </div>

             {/* Import Modal */}
       {showImportModal && <ImportModal />}
       
       {/* Photo Modal */}
       {showPhotoModal && selectedPhoto && <PhotoModal />}
     </div>
   );
};

export default SocialDataScraperApp; 