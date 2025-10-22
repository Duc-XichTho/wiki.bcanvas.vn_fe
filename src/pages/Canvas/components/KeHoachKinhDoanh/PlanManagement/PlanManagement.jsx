import React from 'react';
import PlanningModal from '../Plan/PlanningModal.jsx';
import ViewPlan from '../ViewPlan/ViewPlan.jsx';

const PlanManagement = ({ selectedPlan, onBack, currentStep, setCurrentStep, onPlanUpdate }) => {

    const steps = [
        {
            title: 'Bước 1',
            description: 'Lập kế hoạch chi tiết',
            component: PlanningModal
        },
        {
            title: 'Bước 2',
            description: 'Kết quả kế hoạch (Cấp SKU)', 
            component: ViewPlan
        }
    ];

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        } else {
            onBack(); // Quay lại sidebar
        }
    };

    const handleChangeStep = (step) => {
        setCurrentStep(step);
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Custom Steps */}
            <div style={{ 
                padding: '20px 0', 
                borderBottom: '1px solid #e8e8e8',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    {steps.map((step, index) => (
                        <React.Fragment key={index}>
                            <div 
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    cursor: 'pointer',
                                    padding: '10px 20px',
                            
                                }}
                                onClick={() => handleChangeStep(index)}
                            >
                                <div style={{ 
                                    fontWeight: 'bold', 
                                    fontSize: '16px',
                                    color: currentStep === index ? '#1890ff' : '#666',
                                }}>
                                    {step.title}
                                </div>
                                <div style={{ 
                                    fontSize: '14px',
                                    color: currentStep === index ? '#1890ff' : '#999',
                                    marginTop: '4px'
                                }}>
                                    {step.description}
                                </div>
                            </div>
                            {index < steps.length - 1 && (
                                <div style={{ 
                                    fontSize: '40px', 
                                    color: '#262626',
                                    fontWeight: 'bold'
                                }}>
                                    →
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'auto' }}>
                {steps[currentStep] && React.createElement(steps[currentStep].component, {
                    key: selectedPlan?.id, // Force re-render khi plan thay đổi
                    plan: selectedPlan, // Truyền plan prop
                    onNext: handleNext,
                    onBack: handleBack,
                    isInternalStep: true,
                    onPlanUpdate: onPlanUpdate // Truyền callback xuống
                })}
            </div>
        </div>
    );
};

export default PlanManagement;
