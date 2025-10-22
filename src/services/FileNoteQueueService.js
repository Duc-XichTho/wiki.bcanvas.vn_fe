class FileNoteQueueService {
    constructor() {
        this.queue = [];
        this.isProcessing = false;
        this.currentRunning = null;
        this.runningFileNotes = new Set(); // chỉ chứa các filenote đang chạy thực sự
        this.callbacks = {
            onStart: null,
            onComplete: null,
            onError: null,
            onQueueUpdate: null,
            onAllCompleteForFileNote: null
        };
    }

    // Thêm vào queue
    addToQueue(fileNoteId, stepId, onStart, onComplete, onError) {
        const queueItem = {
            id: `${fileNoteId}_${stepId}_${Date.now()}`,
            fileNoteId: String(fileNoteId),
            stepId,
            onStart,
            onComplete,
            onError,
            timestamp: Date.now()
        };

        // Kiểm tra xem đã có trong queue chưa
        const existingIndex = this.queue.findIndex(item => 
            item.fileNoteId == queueItem.fileNoteId && item.stepId == stepId
        );

        if (existingIndex !== -1) {
            console.log(`Item đã có trong queue: ${fileNoteId}_${stepId}`);
            return;
        }

        this.queue.push(queueItem);
        // Đánh dấu filenote này đang có job (để Sidebar hiển thị spinner ngay cả khi đang chờ)
        this.runningFileNotes.add(String(fileNoteId));
        console.log(`✅ Đã thêm vào queue: ${fileNoteId}_${stepId}`, this.queue.length);
        
        // Thông báo queue đã cập nhật
        if (this.callbacks.onQueueUpdate) {
            this.callbacks.onQueueUpdate(this.getQueueStatus());
        }

        // Bắt đầu xử lý nếu chưa đang chạy
        if (!this.isProcessing) {
            this.processQueue();
        }
    }

    // Xử lý queue
    async processQueue() {
        if (this.isProcessing || this.queue.length === 0) {
            return;
        }

        this.isProcessing = true;
        console.log(`🚀 Bắt đầu xử lý queue, còn ${this.queue.length} items`);

        while (this.queue.length > 0) {
            const item = this.queue.shift();
            this.currentRunning = item;
            
            console.log(`🔄 Đang xử lý: ${item.fileNoteId}_${item.stepId}`);

            try {
                // Thông báo bắt đầu
                // Đưa vào danh sách đang chạy thực sự
                this.runningFileNotes.add(String(item.fileNoteId));
                if (item.onStart) {
                    item.onStart(item.fileNoteId, item.stepId);
                }
                if (this.callbacks.onStart) {
                    this.callbacks.onStart(item.fileNoteId, item.stepId);
                }

                // Thông báo queue đã cập nhật
                if (this.callbacks.onQueueUpdate) {
                    this.callbacks.onQueueUpdate(this.getQueueStatus());
                }

                // Gọi executeStep từ PipelineSteps
                if (this.executeStep) {
                    await this.executeStep(item.fileNoteId, item.stepId);
                }

                // Thông báo hoàn thành
                if (item.onComplete) {
                    item.onComplete(item.fileNoteId, item.stepId);
                }
                if (this.callbacks.onComplete) {
                    this.callbacks.onComplete(item.fileNoteId, item.stepId);
                }

                console.log(`✅ Hoàn thành: ${item.fileNoteId}_${item.stepId}`);

                // Nếu không còn item nào thuộc cùng fileNote trong queue, thông báo hoàn thành toàn bộ cho fileNote này
                const hasMoreForThisFile = this.queue.some(q => q.fileNoteId == item.fileNoteId);
                if (!hasMoreForThisFile && this.callbacks.onAllCompleteForFileNote) {
                    this.callbacks.onAllCompleteForFileNote(item.fileNoteId);
                }

            } catch (error) {
                console.error(`❌ Lỗi khi xử lý: ${item.fileNoteId}_${item.stepId}`, error);
                
                // Thông báo lỗi
                if (item.onError) {
                    item.onError(item.fileNoteId, item.stepId, error);
                }
                if (this.callbacks.onError) {
                    this.callbacks.onError(item.fileNoteId, item.stepId, error);
                }
            }
            
            // Dù hoàn thành hay lỗi, chỉ loại khỏi danh sách đang chạy nếu không còn job nào của cùng fileNote trong queue
            const stillHasForThisFile = this.queue.some(q => q.fileNoteId == item.fileNoteId);
            if (!stillHasForThisFile) {
                this.runningFileNotes.delete(String(item.fileNoteId));
            }

            // Thông báo queue đã cập nhật
            if (this.callbacks.onQueueUpdate) {
                this.callbacks.onQueueUpdate(this.getQueueStatus());
            }
        }

        this.currentRunning = null;
        this.isProcessing = false;
        console.log(`🏁 Hoàn thành xử lý queue`);
        // Thông báo trạng thái mới (để UI clear spinner)
        if (this.callbacks.onQueueUpdate) {
            this.callbacks.onQueueUpdate(this.getQueueStatus());
        }
    }

    // Đăng ký executeStep function
    setExecuteStep(executeStepFn) {
        this.executeStep = executeStepFn;
    }

    // Đăng ký callbacks
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    // Lấy trạng thái queue
    getQueueStatus() {
        return {
            queue: [...this.queue],
            isProcessing: this.isProcessing,
            currentRunning: this.currentRunning,
            queueLength: this.queue.length
        };
    }

    // Lấy danh sách fileNoteId đang chạy thực sự
    getRunningFileNotes() {
        return new Set(this.runningFileNotes);
    }

    // Xóa khỏi queue
    removeFromQueue(fileNoteId, stepId) {
        const initialLength = this.queue.length;
        this.queue = this.queue.filter(item => 
            !(item.fileNoteId == String(fileNoteId) && item.stepId == stepId)
        );
        
        if (this.queue.length !== initialLength) {
            console.log(`🗑️ Đã xóa khỏi queue: ${fileNoteId}_${stepId}`);
            if (this.callbacks.onQueueUpdate) {
                this.callbacks.onQueueUpdate(this.getQueueStatus());
            }
        }
    }

    // Xóa tất cả items của một fileNote
    removeFileNoteFromQueue(fileNoteId) {
        const initialLength = this.queue.length;
        this.queue = this.queue.filter(item => item.fileNoteId !== String(fileNoteId));
        
        if (this.queue.length !== initialLength) {
            console.log(`🗑️ Đã xóa tất cả items của fileNote: ${fileNoteId}`);
            if (this.callbacks.onQueueUpdate) {
                this.callbacks.onQueueUpdate(this.getQueueStatus());
            }
        }
    }

    // Dừng queue
    stopQueue() {
        this.queue = [];
        this.isProcessing = false;
        this.currentRunning = null;
        console.log(`⏹️ Đã dừng queue`);
        
        if (this.callbacks.onQueueUpdate) {
            this.callbacks.onQueueUpdate(this.getQueueStatus());
        }
    }
}

// Export singleton instance
const fileNoteQueueService = new FileNoteQueueService();
export default fileNoteQueueService;
