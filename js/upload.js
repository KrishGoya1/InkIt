// Handle file upload functionality
class PrintUploader {
    constructor() {
        this.setupElements();
        this.setupEventListeners();
        this.currentFiles = [];
    }

    setupElements() {
        this.uploadBtn = document.getElementById('uploadBtn');
        this.uploadModal = document.getElementById('uploadModal');
        this.printOptions = document.getElementById('printOptions');
        
        // Create documents container
        this.documentsContainer = document.createElement('div');
        this.documentsContainer.className = 'documents-container';
        this.uploadBtn.parentElement.appendChild(this.documentsContainer);
        
        // Create preview section
        this.previewSection = document.createElement('div');
        this.previewSection.className = 'preview-section hidden';
        this.previewSection.innerHTML = `
            <div class="preview-header">
                <h3>Uploaded Documents</h3>
            </div>
            <div class="preview-container"></div>
            <button class="add-more-btn">+ Add More Files</button>
        `;
        this.documentsContainer.appendChild(this.previewSection);
        
        // Create hidden file input
        this.fileInput = document.createElement('input');
        this.fileInput.type = 'file';
        this.fileInput.multiple = true;
        this.fileInput.accept = '.pdf,.doc,.docx,.png,.jpg';
        this.fileInput.style.display = 'none';
        document.body.appendChild(this.fileInput);
    }

    setupEventListeners() {
        this.uploadBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Add more files button
        this.previewSection.querySelector('.add-more-btn')
            .addEventListener('click', () => this.fileInput.click());
    }

    async handleFileSelect(event) {
        const newFiles = Array.from(event.target.files);
        if (!newFiles.length) return;

        // Add new files to current files
        this.currentFiles = [...this.currentFiles, ...newFiles];
        
        this.showUploadProgress(newFiles.length);
        await this.processFiles(newFiles);
    }

    showUploadProgress(fileCount) {
        this.uploadModal.innerHTML = `
            <div class="upload-progress">
                <div class="progress-icon">📄</div>
                <h3>Uploading ${fileCount} document${fileCount > 1 ? 's' : ''}</h3>
                <div class="progress">
                    <div class="progress-bar"></div>
                </div>
                <p class="file-count">0/${fileCount} files</p>
                <button class="cancel-btn">Cancel</button>
            </div>
        `;
        this.uploadModal.classList.remove('hidden');

        // Setup cancel button
        this.uploadModal.querySelector('.cancel-btn')
            .addEventListener('click', () => this.cancelUpload());
    }

    async processFiles(newFiles) {
        const progressBar = this.uploadModal.querySelector('.progress-bar');
        const fileCountDisplay = this.uploadModal.querySelector('.file-count');
        
        try {
            // Process each file
            for (let i = 0; i < newFiles.length; i++) {
                await new Promise(resolve => setTimeout(resolve, 500));
                progressBar.style.width = `${((i + 1) / newFiles.length) * 100}%`;
                fileCountDisplay.textContent = `${i + 1}/${newFiles.length} files`;
            }

            this.uploadModal.classList.add('hidden');
            await this.generatePreviews();
            this.showPrintOptions();
        } catch (error) {
            console.error('Upload failed:', error);
            this.showError('Failed to process files. Please try again.');
        }
    }

    async generatePreviews() {
        const previewContainer = this.previewSection.querySelector('.preview-container');
        this.previewSection.classList.remove('hidden');
        
        let totalPages = 0;

        // Clear existing previews
        previewContainer.innerHTML = '';

        for (const file of this.currentFiles) {
            const preview = this.createFilePreview(file);
            previewContainer.appendChild(preview);
            totalPages += 1;
        }

        // Update page count in print options
        if (window.printOptionsManager) {
            window.printOptionsManager.setPageCount(totalPages);
        }
    }

    createFilePreview(file) {
        const preview = document.createElement('div');
        preview.className = 'file-preview';
        
        // Left side - Preview content with file info header
        const previewSection = document.createElement('div');
        previewSection.className = 'preview-section';
        
        const header = document.createElement('div');
        header.className = 'preview-header';
        header.innerHTML = `
            <div class="file-info">
                <p class="file-name">${file.name}</p>
                <span class="file-size">${this.formatFileSize(file.size)}</span>
            </div>
            <button class="remove-file" title="Remove file">×</button>
        `;
        
        const previewContent = document.createElement('div');
        previewContent.className = 'preview-content';
        
        // Handle different file types for preview
        if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.onload = () => URL.revokeObjectURL(img.src);
            previewContent.appendChild(img);
        } else if (file.type === 'application/pdf') {
            previewContent.innerHTML = `
                <div class="pdf-preview">
                    <span class="file-icon">📄</span>
                    <span>PDF Document</span>
                </div>
            `;
        }
        
        previewSection.appendChild(header);
        previewSection.appendChild(previewContent);
        
        // Right side - Settings with pricing
        const settingsContainer = document.createElement('div');
        settingsContainer.className = 'preview-settings';
        
        const controls = document.createElement('div');
        controls.className = 'preview-controls';
        controls.innerHTML = `
            <div class="control-group">
                <label>Copies</label>
                <div class="copies-control">
                    <button type="button" class="decrease">-</button>
                    <span class="copies-count">1</span>
                    <button type="button" class="increase">+</button>
                </div>
            </div>
            
            <div class="control-group">
                <label>Print Type</label>
                <div class="toggle-group">
                    <button type="button" class="toggle-btn selected" data-value="bw" data-price="3">
                        B&W
                        <span class="price-tag">₹3/pg</span>
                    </button>
                    <button type="button" class="toggle-btn" data-value="color" data-price="10">
                        Color
                        <span class="price-tag">₹10/pg</span>
                    </button>
                </div>
            </div>
            
            <div class="control-group">
                <label>Layout</label>
                <div class="toggle-group">
                    <button type="button" class="toggle-btn selected" data-value="single">1-Sided</button>
                    <button type="button" class="toggle-btn" data-value="double">2-Sided</button>
                </div>
            </div>

            <div class="price-summary">
                <span class="price-label">Subtotal:</span>
                <span class="price-value">₹${this.calculatePrice(1, 'bw')}</span>
            </div>
        `;

        preview.appendChild(previewSection);
        preview.appendChild(settingsContainer);
        settingsContainer.appendChild(controls);
        
        this.setupPreviewControls(preview, file);
        
        return preview;
    }

    calculatePrice(copies, type) {
        const pricePerPage = type === 'bw' ? 3 : 10;
        return copies * pricePerPage;
    }

    getFileIcon(type) {
        const icons = {
            'application/pdf': '📄',
            'image': '🖼️',
            'application/msword': '📝',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝'
        };
        return icons[type] || icons[type.split('/')[0]] || '📄';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    setupPreviewControls(preview, file) {
        // Implementation of setupPreviewControls method
    }

    updateFileOptions(file, option, value) {
        if (!file.printOptions) {
            file.printOptions = {
                copies: 1,
                color: 'bw',
                orientation: 'portrait'
            };
        }
        file.printOptions[option] = value;
        this.updateTotalPrice();
    }

    updateTotalPrice() {
        const total = this.calculateTotalPrice();
        const paymentFab = document.getElementById('proceedToPayment');
        if (paymentFab) {
            paymentFab.querySelector('.total-amount').textContent = `₹${total}`;
        }
    }

    calculateTotalPrice() {
        let total = 0;
        this.currentFiles.forEach(file => {
            const preview = document.querySelector(`[data-file-id="${file.id}"]`);
            const copies = parseInt(preview.querySelector('.copies-count').textContent);
            const type = preview.querySelector('.toggle-btn.selected').dataset.value;
            const pricePerPage = type === 'bw' ? 3 : 10;
            total += copies * pricePerPage;
        });
        return total;
    }

    removeFile(fileToRemove) {
        this.currentFiles = this.currentFiles.filter(file => file !== fileToRemove);
        this.generatePreviews();
    }

    showPrintOptions() {
        this.printOptions.classList.remove('hidden');
        // Remove the extra "Continue to Payment" button if it exists
        const addToCartBtns = document.querySelectorAll('.add-to-cart');
        if (addToCartBtns.length > 1) {
            addToCartBtns[1].remove();
        }
    }

    cancelUpload() {
        this.uploadModal.classList.add('hidden');
    }

    showError(message) {
        alert(message); // Replace with better UI feedback
    }
} 