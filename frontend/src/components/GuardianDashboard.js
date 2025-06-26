import React, { useState, memo } from 'react';
import {
  Shield,
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Settings,
  Key,
  UserPlus
} from 'lucide-react';
import { Card, Alert, Input, Modal, LoadingSpinner, StableButton } from './UI';

const GuardianDashboard = memo(({ 
    walletAddress, 
    currentGuardians = [], 
    threshold = 2,
    onAddGuardian,
    onRemoveGuardian,
    onSetThreshold,
    onInitiateRecovery,
    onApproveRecovery,
    recoveryRequests = [],
    isOwner = false,
    isGuardian = false,
    loading = false
}) => {    // Separate loading states for modals
    const [addGuardianLoading, setAddGuardianLoading] = useState(false);
    const [recoveryLoading, setRecoveryLoading] = useState(false);
    const [showAddGuardian, setShowAddGuardian] = useState(false);
    const [showRecoveryForm, setShowRecoveryForm] = useState(false);
    const [newGuardianAddress, setNewGuardianAddress] = useState('');
    const [newGuardianName, setNewGuardianName] = useState('');
    const [newOwnerAddress, setNewOwnerAddress] = useState('');
    const [activeTab, setActiveTab] = useState('guardians');
    const [recoveryError, setRecoveryError] = useState('');
    const [recoverySuccess, setRecoverySuccess] = useState(false);
    const [addGuardianError, setAddGuardianError] = useState('');
    const [addGuardianSuccess, setAddGuardianSuccess] = useState(false);

    // Reset modal/input state on close
    const handleCloseAddGuardian = () => {
        setShowAddGuardian(false);
        setNewGuardianAddress('');
        setNewGuardianName('');
        setAddGuardianLoading(false);
        setAddGuardianError('');
        setAddGuardianSuccess(false);
    };

    const handleCloseRecovery = () => {
        setShowRecoveryForm(false);
        setNewOwnerAddress('');
        setRecoveryLoading(false);
        setRecoveryError('');
        setRecoverySuccess(false);
    };

    const handleAddGuardian = async () => {
        if (!newGuardianAddress) return;
        setAddGuardianLoading(true);
        setAddGuardianError('');
        setAddGuardianSuccess(false);
        
        try {
            await onAddGuardian(newGuardianAddress, newGuardianName || undefined);
            // Wait a moment to allow blockchain to update
            await new Promise(res => setTimeout(res, 700));
            setAddGuardianSuccess(true);
            setTimeout(handleCloseAddGuardian, 2000);
        } catch (error) {
            console.error('Failed to add guardian:', error);
            setAddGuardianError(error.message || 'Failed to add guardian. Please try again.');
            setAddGuardianLoading(false);
        }
    };

    const handleRemoveGuardian = async (guardianAddress) => {
        if (window.confirm('Are you sure you want to remove this guardian?')) {
            try {
                await onRemoveGuardian(guardianAddress);
                await new Promise(res => setTimeout(res, 700));
            } catch (error) {
                console.error('Failed to remove guardian:', error);
            }
        }
    };

    const handleInitiateRecovery = async () => {
        if (!newOwnerAddress) return;
        setRecoveryLoading(true);
        setRecoveryError('');
        setRecoverySuccess(false);
        
        try {
            await onInitiateRecovery(newOwnerAddress);
            // Wait a moment to allow blockchain to update
            await new Promise(res => setTimeout(res, 700));
            setRecoverySuccess(true);
            setTimeout(() => {
                handleCloseRecovery();
                setActiveTab('recovery');
            }, 2000);
        } catch (error) {
            console.error('Failed to initiate recovery:', error);
            setRecoveryError(error.message || 'Failed to initiate recovery. Please try again.');
            setRecoveryLoading(false);
        }
    };

    const pendingRecoveries = recoveryRequests.filter(req => req.status === 'pending');
    
    // Show loading skeleton during initial data fetch
    const isInitialLoading = loading && currentGuardians.length === 0 && threshold === 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card className="p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Shield className="w-8 h-8 text-blue-600" />
                        <div>                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Guardian Dashboard</h2>
                            {isInitialLoading ? (
                                <div className="w-48 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1"></div>
                            ) : (
                                <p className="text-gray-600 dark:text-gray-300">
                                    Social recovery system • {threshold} of {currentGuardians.length} required
                                </p>
                            )}
                        </div>
                    </div>
                    {isOwner && !isInitialLoading && (
                        <div className="flex space-x-2">
                            <StableButton
                                onClick={() => setShowAddGuardian(true)}
                                disabled={loading || addGuardianLoading}
                                variant="primary"
                                className="flex items-center space-x-2"
                            >
                                <UserPlus className="w-4 h-4" />
                                <span>Add Guardian</span>
                            </StableButton>
                        </div>
                    )}
                    {isInitialLoading && (
                        <div className="w-32 h-10 bg-gray-200 rounded animate-pulse"></div>
                    )}
                </div>
            </Card>            {/* Status Alert */}
            {!isInitialLoading && pendingRecoveries.length > 0 && (
                <Alert type="warning">
                    <AlertCircle className="w-5 h-5" />
                    <span>
                        {pendingRecoveries.length} recovery request(s) pending approval
                    </span>
                </Alert>
            )}

            {/* Loading skeleton for status alert */}
            {isInitialLoading && (
                <div className="w-full h-16 bg-gray-100 rounded-lg animate-pulse"></div>
            )}

            {/* Tabs */}
            {!isInitialLoading && (
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                    {[
                        { id: 'guardians', label: 'Guardians', icon: Users },
                        { id: 'recovery', label: 'Recovery', icon: Key },
                        { id: 'settings', label: 'Settings', icon: Settings }                ].map(tab => (
                        <StableButton
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            variant={activeTab === tab.id ? 'primary' : 'secondary'}
                            size="md"
                            className="flex-1 flex items-center justify-center space-x-2"
                            aria-pressed={activeTab === tab.id}
                            tabIndex={0}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span className="font-medium">{tab.label}</span>
                        </StableButton>
                    ))}
                </div>
            )}

            {/* Loading skeleton for tabs */}
            {isInitialLoading && (
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                    <div className="flex-1 h-12 bg-gray-200 rounded animate-pulse"></div>
                    <div className="flex-1 h-12 bg-gray-200 rounded animate-pulse"></div>
                    <div className="flex-1 h-12 bg-gray-200 rounded animate-pulse"></div>
                </div>
            )}            {/* Tab Content */}
            <div>
                {isInitialLoading ? (
                    <LoadingSkeleton />
                ) : (
                    <>
                        {activeTab === 'guardians' && (
                            <GuardiansList 
                                guardians={currentGuardians}
                                threshold={threshold}
                                onRemove={isOwner ? handleRemoveGuardian : null}
                                loading={loading}
                            />
                        )}                {activeTab === 'recovery' && (
                            <RecoveryRequests
                                requests={recoveryRequests}
                                onApprove={isGuardian ? onApproveRecovery : null}
                                onInitiate={isGuardian ? () => setShowRecoveryForm(true) : null}
                                loading={loading}
                                currentGuardians={currentGuardians}
                                walletAddress={walletAddress}
                                isOwner={isOwner}
                                isGuardian={isGuardian}
                            />
                        )}
                        {activeTab === 'settings' && (
                            <GuardianSettings
                                threshold={threshold}
                                maxGuardians={currentGuardians.length}
                                onSetThreshold={isOwner ? onSetThreshold : null}
                                loading={loading}
                            />
                        )}
                    </>
                )}
            </div>

            {/* Add Guardian Modal */}
            <Modal isOpen={showAddGuardian} onClose={handleCloseAddGuardian}>
                <div className="p-6">                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Add New Guardian
                    </h3>
                    <div className="space-y-4">
                        {!addGuardianSuccess && !addGuardianError && (
                            <>
                                <Input
                                    label="Guardian Address"
                                    placeholder="0x..."
                                    value={newGuardianAddress}
                                    onChange={(e) => setNewGuardianAddress(e.target.value)}
                                />
                                <Input
                                    label="Guardian Name (Optional)"
                                    placeholder="e.g., Alice (Sister), Bob (Best Friend)"
                                    value={newGuardianName}
                                    onChange={(e) => setNewGuardianName(e.target.value)}
                                />
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                    <p className="text-sm text-blue-800">
                                        <strong>Important:</strong> Only add trusted individuals as guardians. 
                                        They will be able to help recover your wallet if you lose access.
                                    </p>
                                </div>
                            </>
                        )}
                        
                        {addGuardianSuccess && (
                            <Alert type="success">
                                <CheckCircle className="w-5 h-5" />
                                <span>
                                    Guardian added successfully! Check the Guardians list.
                                </span>
                            </Alert>
                        )}
                        
                        {addGuardianError && (
                            <Alert type="error">
                                <AlertCircle className="w-5 h-5" />
                                <span>{addGuardianError}</span>
                            </Alert>
                        )}
                        
                        <div className="flex space-x-3 pt-4">
                            {!addGuardianSuccess && (
                                <StableButton
                                    onClick={handleAddGuardian}
                                    disabled={!newGuardianAddress || addGuardianLoading}
                                    className="flex-1"
                                >
                                    {addGuardianLoading ? <LoadingSpinner size="sm" /> : 'Add Guardian'}
                                </StableButton>
                            )}
                            <StableButton
                                variant="secondary"
                                onClick={handleCloseAddGuardian}
                                className={addGuardianSuccess ? "w-full" : "flex-1"}
                                disabled={addGuardianLoading}
                            >
                                {addGuardianSuccess ? 'Close' : 'Cancel'}
                            </StableButton>
                        </div>
                    </div>
                </div>
            </Modal>{/* Initiate Recovery Modal */}
            <Modal isOpen={showRecoveryForm} onClose={handleCloseRecovery}>
                <div className="p-6">                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Initiate Account Recovery
                    </h3>
                    <div className="space-y-4">
                        {!recoverySuccess && !recoveryError && (
                            <>
                                <Alert type="warning">
                                    <AlertCircle className="w-5 h-5" />
                                    <span>
                                        This will start the recovery process. {threshold} guardians must approve.
                                    </span>
                                </Alert>
                                <Input
                                    label="New Owner Address"
                                    placeholder="0x..."
                                    value={newOwnerAddress}
                                    onChange={(e) => setNewOwnerAddress(e.target.value)}
                                />
                            </>
                        )}
                        
                        {recoverySuccess && (
                            <Alert type="success">
                                <CheckCircle className="w-5 h-5" />
                                <span>
                                    Recovery initiated successfully! Check the Recovery tab for status.
                                </span>
                            </Alert>
                        )}
                        
                        {recoveryError && (
                            <Alert type="error">
                                <AlertCircle className="w-5 h-5" />
                                <span>{recoveryError}</span>
                            </Alert>
                        )}
                        
                        <div className="flex space-x-3 pt-4">
                            {!recoverySuccess && (
                                <StableButton
                                    onClick={handleInitiateRecovery}
                                    disabled={!newOwnerAddress || recoveryLoading}
                                    className="flex-1"
                                >
                                    {recoveryLoading ? <LoadingSpinner size="sm" /> : 'Initiate Recovery'}
                                </StableButton>
                            )}
                            <StableButton
                                variant="secondary"
                                onClick={handleCloseRecovery}
                                className={recoverySuccess ? "w-full" : "flex-1"}
                                disabled={recoveryLoading}
                            >
                                {recoverySuccess ? 'View Recovery Status' : 'Cancel'}
                            </StableButton>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
});

// Guardian List Component
const GuardiansList = memo(({ guardians, threshold, onRemove, loading }) => {
    if (guardians.length === 0) {
        return (            <Card className="p-8 text-center">
                <Users className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Guardians Added</h3>
                <p className="text-gray-600 dark:text-gray-300">
                    Add trusted friends or family members as guardians to enable social recovery.
                </p>
            </Card>
        );
    }

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-4">                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Active Guardians ({guardians.length})
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                    {threshold} of {guardians.length} required for recovery
                </div>
            </div>
            
            <div className="space-y-3">
                {guardians.map((guardian, index) => (
                    <div
                        key={guardian.address || index}                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {guardian.name || `Guardian ${index + 1}`}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-300 font-mono">
                                    {guardian.address || guardian}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                                Active
                            </span>
                            {onRemove && (
                                <StableButton
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onRemove(guardian.address || guardian)}
                                    disabled={loading}
                                    className="text-red-600 hover:text-red-700 focus:ring-red-500 focus:outline-none"
                                    aria-label="Remove Guardian"
                                >
                                    <X className="w-4 h-4" />
                                </StableButton>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
});

// Recovery Requests Component
const RecoveryRequests = memo(({ requests, onApprove, onInitiate, loading, currentGuardians = [], walletAddress, isOwner = false, isGuardian = false }) => {
    const pendingRequests = requests.filter(req => req.status === 'pending');
    const completedRequests = requests.filter(req => req.status !== 'pending');

    return (
        <div className="space-y-6">
            {/* Initiate Recovery Button */}
            {onInitiate && (
                <Card className="p-6">
                    <div className="text-center">
                        <Key className="w-12 h-12 text-orange-500 mx-auto mb-4" />                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            Account Recovery
                        </h3>                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                            As a guardian, you can initiate recovery if the wallet owner has lost access.
                        </p>
                        <StableButton onClick={onInitiate} disabled={loading}>
                            Initiate Recovery
                        </StableButton>
                    </div>
                </Card>
            )}
              {/* Not Authorized Warning */}
            {!onInitiate && currentGuardians.length > 0 && (
                <Card className="p-6">
                    <Alert type="warning">
                        <AlertCircle className="w-5 h-5" />
                        <div>
                            <p className="font-medium">Only guardians can initiate recovery</p>
                            <p className="text-sm mt-1">
                                {isOwner ? 
                                    "As the wallet owner, you cannot initiate recovery yourself. Only your trusted guardians can help you recover access." :
                                    "You are not registered as a guardian for this wallet."
                                }
                            </p>
                            {!isOwner && (
                                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                                    <p>Registered guardians ({currentGuardians.length}):</p>
                                    <ul className="list-disc list-inside mt-1">
                                        {currentGuardians.slice(0, 3).map((guardian, index) => (
                                            <li key={index} className="font-mono">
                                                {guardian.name || `Guardian ${index + 1}`}: {guardian.address || guardian}
                                            </li>
                                        ))}
                                        {currentGuardians.length > 3 && (
                                            <li>... and {currentGuardians.length - 3} more</li>
                                        )}
                                    </ul>
                                </div>
                            )}
                            {isOwner && (
                                <div className="mt-2 text-xs text-blue-600">
                                    <p>💡 <strong>Tip:</strong> Contact one of your guardians to initiate recovery for you.</p>
                                </div>
                            )}
                        </div>
                    </Alert>
                </Card>
            )}{/* Pending Requests */}
            {pendingRequests.length > 0 && (
                <div>                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <Clock className="w-5 h-5 mr-2 text-yellow-500" />
                        Active Recovery Request
                    </h3>
                    <div className="space-y-4">
                        {pendingRequests.map((request, index) => (
                            <RecoveryRequestCard
                                key={request.id || index}
                                request={request}
                                onApprove={onApprove}
                                loading={loading}
                                isGuardian={isGuardian}
                                isOwner={isOwner}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Completed Requests */}
            {completedRequests.length > 0 && (
                <div>                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Recovery History
                    </h3>
                    <div className="space-y-4">
                        {completedRequests.map((request, index) => (
                            <RecoveryRequestCard
                                key={request.id || index}
                                request={request}
                                loading={loading}
                                readonly
                            />
                        ))}
                    </div>
                </div>
            )}            {requests.length === 0 && (                <Card className="p-8 text-center">
                    <Clock className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Recovery Requests</h3>
                    <p className="text-gray-600 dark:text-gray-300">
                        {isGuardian ? 
                            "No active recovery requests. Use the button above to initiate recovery if the wallet owner needs help." :
                            isOwner ?
                            "No active recovery requests. Contact your guardians if you need to recover access to your wallet." :
                            "Recovery requests initiated by guardians will appear here."
                        }
                    </p>
                </Card>
            )}
        </div>
    );
});

// Recovery Request Card Component
const RecoveryRequestCard = memo(({ request, onApprove, loading, readonly = false, isGuardian = false, isOwner = false }) => {    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
            case 'approved': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
            case 'rejected': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
            case 'executed': return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
            default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending': return <Clock className="w-4 h-4" />;
            case 'approved': return <CheckCircle className="w-4 h-4" />;
            case 'executed': return <CheckCircle className="w-4 h-4" />;
            default: return <AlertCircle className="w-4 h-4" />;
        }
    };

    return (
        <Card className="p-6">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            {getStatusIcon(request.status)}
                            <span className="ml-1 capitalize">{request.status}</span>
                        </span>                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Request #{request.id}
                        </span>
                    </div>
                      <div className="space-y-2">
                        <div>                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">New Owner:</span>
                            <span className="ml-2 text-sm text-gray-900 dark:text-white font-mono">
                                {request.newOwner}
                            </span>
                        </div>
                        <div>                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress:</span>
                            <span className="ml-2 text-sm text-gray-900 dark:text-white">
                                {request.approvalCount} of {request.requiredApprovals} guardians approved
                            </span>
                            {request.status === 'pending' && (
                                <div className="mt-1">
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                            style={{ width: `${(request.approvalCount / request.requiredApprovals) * 100}%` }}
                                        ></div>
                                    </div>                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {request.requiredApprovals - request.approvalCount} more approval{request.requiredApprovals - request.approvalCount !== 1 ? 's' : ''} needed
                                    </p>
                                </div>
                            )}
                        </div>
                        <div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
                            <span className="ml-2 text-sm text-gray-900">
                                {request.status === 'pending' ? 'Waiting for guardian approvals' : 
                                 request.status === 'approved' ? 'Ready to execute' :
                                 request.status === 'executed' ? 'Recovery completed' : 
                                 request.status}
                            </span>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-gray-700">Created:</span>
                            <span className="ml-2 text-sm text-gray-900">
                                {new Date(request.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>                {!readonly && onApprove && request.status === 'pending' && isGuardian && request.approvalCount < request.requiredApprovals && (
                    <div className="ml-4">
                        <StableButton
                            onClick={() => onApprove(request.newOwner)}
                            disabled={loading}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            aria-label="Approve Recovery Request"
                        >
                            {loading ? <LoadingSpinner size="sm" /> : 'Approve Recovery'}
                        </StableButton>
                    </div>
                )}
                
                {!readonly && request.status === 'pending' && isOwner && (
                    <div className="ml-4 text-right">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">A recovery is in progress for your wallet</div>
                        <div className="text-xs text-blue-600 font-medium">Waiting for guardians</div>
                    </div>
                )}
                
                {!readonly && request.status === 'pending' && request.approvalCount >= request.requiredApprovals && (
                    <div className="ml-4 text-right">
                        <div className="text-xs text-green-600 font-medium mb-1">✓ Ready to execute</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Recovery will auto-execute</div>
                    </div>
                )}
            </div>
        </Card>
    );
});

// Guardian Settings Component
const GuardianSettings = memo(({ threshold, maxGuardians, onSetThreshold, loading }) => {
    const [newThreshold, setNewThreshold] = useState(threshold);

    const handleUpdateThreshold = async () => {
        if (newThreshold !== threshold && onSetThreshold) {
            try {
                await onSetThreshold(newThreshold);
            } catch (error) {
                console.error('Failed to update threshold:', error);
            }
        }
    };

    return (
        <Card className="p-6">            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recovery Settings
            </h3>
            
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Guardian Threshold
                    </label>
                    <div className="flex items-center space-x-4">
                        <select
                            value={newThreshold}
                            onChange={(e) => setNewThreshold(parseInt(e.target.value))}
                            disabled={!onSetThreshold || loading}
                            className="block w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                            {Array.from({ length: maxGuardians }, (_, i) => i + 1).map(num => (
                                <option key={num} value={num}>{num}</option>
                            ))}
                        </select>                        <span className="text-sm text-gray-600 dark:text-gray-300">
                            of {maxGuardians} guardians required for recovery
                        </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Higher thresholds provide more security but require more guardian coordination.
                    </p>
                </div>

                {onSetThreshold && newThreshold !== threshold && (
                    <StableButton
                        onClick={handleUpdateThreshold}
                        disabled={loading}
                    >
                        {loading ? <LoadingSpinner size="sm" /> : 'Update Threshold'}
                    </StableButton>
                )}

                <div className="border-t pt-6">                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                        Security Recommendations
                    </h4>
                    <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-start space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>Use a threshold of at least 50% of your guardians</span>
                        </div>
                        <div className="flex items-start space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>Add guardians you trust and can contact easily</span>
                        </div>
                        <div className="flex items-start space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>Inform guardians about their responsibility</span>
                        </div>
                        <div className="flex items-start space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>Keep guardian list updated as relationships change</span>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
});

// Loading Skeleton Component
const LoadingSkeleton = memo(() => {
    return (
        <Card className="p-6">
            <div className="space-y-4">
                {/* Header skeleton */}
                <div className="flex items-center justify-between">
                    <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
                
                {/* Content skeleton */}
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                                <div className="space-y-2">
                                    <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                                    <div className="w-32 h-3 bg-gray-200 rounded animate-pulse"></div>
                                </div>
                            </div>
                            <div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
});

export default GuardianDashboard;
