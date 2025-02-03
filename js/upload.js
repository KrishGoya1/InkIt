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
        // Create modal container if it doesn't exist
        if (!this.uploadModal) {
            this.uploadModal = document.createElement('div');
            this.uploadModal.id = 'uploadProgressModal';
            document.body.appendChild(this.uploadModal);
        }

        this.uploadModal.innerHTML = `
            <div class="upload-progress">
                <div class="progress-icon">📄</div>
                <h3>Uploading ${fileCount} document${fileCount > 1 ? 's' : ''}</h3>
                <div class="progress">
                    <div class="progress-bar"></div>
                </div>
                <p class="file-count">0/${fileCount} files</p>
                <div class="price-preview">
                    Estimated Total: <span id="totalPrice">₹0</span>
                </div>
                <button class="cancel-btn">Cancel</button>
            </div>
        `;
        
        // Ensure modal is visible before accessing elements
        requestAnimationFrame(() => {
            this.progressBar = this.uploadModal.querySelector('.progress-bar');
            this.fileCountDisplay = this.uploadModal.querySelector('.file-count');
            this.totalPriceDisplay = this.uploadModal.querySelector('#totalPrice');
            
            if (!this.progressBar || !this.fileCountDisplay) {
                throw new Error('Progress elements not found in DOM');
            }
            
            this.uploadModal.classList.remove('hidden');
        });

        // Setup cancel button
        this.uploadModal.querySelector('.cancel-btn')
            .addEventListener('click', () => this.cancelUpload());
    }

    async processFiles(newFiles) {
        const progressBar = this.uploadModal.querySelector('.progress-bar');
        const fileCountDisplay = this.uploadModal.querySelector('.file-count');
        
        try {
            let processedPages = 0;
            // Process each file with actual content handling
            for (let i = 0; i < newFiles.length; i++) {
                const file = newFiles[i];
                // Real processing with page count
                if (file.type === 'application/pdf') {
                    const pdf = await pdfjsLib.getDocument(await file.arrayBuffer()).promise;
                    file.pageCount = pdf.numPages;
                    processedPages += pdf.numPages;
                    await pdf.destroy();
                } else {
                    file.pageCount = 1;
                    processedPages += 1; // 1 page per image/doc
                }
                
                // Update progress
                const progress = ((i + 1) / newFiles.length) * 100;
                progressBar.style.width = `${progress}%`;
                fileCountDisplay.textContent = `${i + 1}/${newFiles.length} files`;
            }

            // Replace flat rate with first file's settings
            const initialType = this.currentFiles[0]?.printType || 'bw';
            const pricePerPage = initialType === 'bw' ? 3 : 10;
            const totalPrice = processedPages * pricePerPage; // Temporary until UI selection
            
            // Update UI before closing
            this.updatePriceDisplay(totalPrice);
            this.uploadModal.classList.add('hidden');
            
            await this.generatePreviews();
            this.showPrintOptions();
        } catch (error) {
            console.error('Upload failed:', error);
            this.showError(`Failed to process files: ${error.message}`);
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
                <span class="file-pages">${file.pageCount} ${file.pageCount === 1 ? 'page' : 'pages'}</span>
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
                <span class="price-value">₹${this.calculatePrice(file.pageCount, 1, 'bw')}</span>
            </div>
        `;

        preview.appendChild(previewSection);
        preview.appendChild(settingsContainer);
        settingsContainer.appendChild(controls);
        
        this.setupPreviewControls(preview, file);
        
        file.printType = 'bw'; // Default value
        
        return preview;
    }

    calculatePrice(pages, copies, type) {
        const pricePerPage = type === 'bw' ? 3 : 10;
        return pages * copies * pricePerPage;
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
        // Copies control
        const copiesControl = preview.querySelector('.copies-control');
        const copiesCount = copiesControl.querySelector('.copies-count');
        
        copiesControl.querySelector('.decrease').addEventListener('click', () => {
            const current = parseInt(copiesCount.textContent);
            if (current > 1) {
                copiesCount.textContent = current - 1;
                this.updateFileOptions(file, 'copies', current - 1);
            }
        });

        copiesControl.querySelector('.increase').addEventListener('click', () => {
            const current = parseInt(copiesCount.textContent);
            if (current < 99) {
                copiesCount.textContent = current + 1;
                this.updateFileOptions(file, 'copies', current + 1);
            }
        });

        // Print type toggle
        const typeBtn = preview.querySelector('.toggle-btn.selected');
        if (!typeBtn) return;
        const type = typeBtn.dataset.value;
        
        preview.querySelectorAll('.toggle-group .toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const group = btn.closest('.toggle-group');
                group.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                
                // Update price
                const priceValue = preview.querySelector('.price-value');
                const copies = parseInt(copiesCount.textContent);
                priceValue.textContent = `₹${
                    this.calculatePrice(file.pageCount, copies, type)
                }`;
                
                this.updateFileOptions(file, 'printType', type);
            });
        });

        // Remove file button
        preview.querySelector('.remove-file').addEventListener('click', () => {
            this.removeFile(file);
            this.updateTotalPrice();
        });
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
            total += this.calculatePrice(file.pageCount, copies, type);
        });
        return total;
    }

    removeFile(fileToRemove) {
        this.currentFiles = this.currentFiles.filter(file => file !== fileToRemove);
        this.generatePreviews();
        const previewImg = document.querySelector(`[data-file-id="${fileToRemove.id}"] img`);
        if (previewImg) URL.revokeObjectURL(previewImg.src);
    }

    showPrintOptions() {
        if (!this.printOptions) {
            this.printOptions = document.getElementById('printOptions');
            if (!this.printOptions) {
                this.showError('Print options panel not found');
                return;
            }
        }
        
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
        window.toastManager.show(`Upload Error: ${message}`, 'error');
    }

    updatePriceDisplay(total) {
        const priceDisplay = document.querySelector('#totalPrice');
        if (!priceDisplay) return;
        
        priceDisplay.textContent = `₹${total}`;
        // Update payment button
        const paymentBtn = document.querySelector('#proceedToPayment .total-amount');
        if (paymentBtn) paymentBtn.textContent = `₹${total}`;
    }
} 