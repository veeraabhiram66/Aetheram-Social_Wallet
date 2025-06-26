mport React, { useState } from 'react';
import Modal from './Modal';

const GuardianRecovery = ({ 
    showAddGuardian, 
    setShowAddGuardian, 
    onAddGuardian, 
    recoveryRequests, 
    onInitiateRecovery, 
    setActiveTab 
}) => {
    const [newGuardianAddress, setNewGuardianAddress] = useState('');
    const [newGuardianName, setNewGuardianName] = useState('');
    const [addGuardianLoading, setAddGuardianLoading] = useState(false);
    const [addGuardianError, setAddGuardianError] = useState('');
    const [addGuardianSuccess, setAddGuardianSuccess] = useState(false);
    const [showRecoveryForm, setShowRecoveryForm] = useState(false);
    const [newOwnerAddress, setNewOwnerAddress] = useState('');
    const [recoveryLoading, setRecoveryLoading] = useState(false);
    const [recoveryError, setRecoveryError] = useState('');
    const [recoverySuccess, setRecoverySuccess] = useState(false);

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
            setAddGuardianSuccess(true);
            // On success, close the modal and reset state after a short delay
            setTimeout(handleCloseAddGuardian, 2000);
        } catch (error) {
            console.error('Failed to add guardian:', error);
            setAddGuardianError(error.message || 'Failed to add guardian. Please try again.');
            // On error, stop the loading indicator so the user can try again
            setAddGuardianLoading(false);
        }
    };

    const handleRemoveGuardian = async (guardianAddress) => {
        // Implementation for removing a guardian
    };

    const handleInitiateRecovery = async () => {
        if (!newOwnerAddress) return;
        setRecoveryLoading(true);
        setRecoveryError('');
        setRecoverySuccess(false);
        
        try {
            await onInitiateRecovery(newOwnerAddress);
            setRecoverySuccess(true);
            // On success, close the modal and reset state after a short delay
            setTimeout(() => {
                handleCloseRecovery();
                // Switch to recovery tab to show the pending request
                setActiveTab('recovery');
            }, 2000);
        } catch (error) {
            console.error('Failed to initiate recovery:', error);
            setRecoveryError(error.message || 'Failed to initiate recovery. Please try again.');
            // On error, stop the loading indicator so the user can try again
            setRecoveryLoading(false);
        }
    };

    const pendingRecoveries = recoveryRequests.filter(req => req.status === 'pending');

    return (
        <div>
            {/* Guardian and Recovery UI Components */}

            {/* Add Guardian Modal */}
            <Modal isOpen={showAddGuardian} onClose={handleCloseAddGuardian}>
                <div className="p-6">
                    {/* Modal content for adding guardian */}
                </div>
            </Modal>

            {/* Recovery Modal */}
            <Modal isOpen={showRecoveryForm} onClose={handleCloseRecovery}>
                <div className="p-6">
                    {/* Modal content for recovery */}
                </div>
            </Modal>
        </div>
    );
};

export default GuardianRecovery;