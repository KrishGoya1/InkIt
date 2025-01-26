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
                <button class="add-more-btn">+ Add More</button>
            </div>
            <div class="preview-container"></div>
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
            const preview = document.createElement('div');
            preview.className = 'file-preview';

            // Add remove button
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-file';
            removeBtn.innerHTML = '×';
            removeBtn.onclick = () => this.removeFile(file);
            preview.appendChild(removeBtn);

            if (file.type === 'application/pdf') {
                try {
                    const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
                    totalPages += pdf.numPages;
                    
                    // Get first page as preview
                    const page = await pdf.getPage(1);
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    const viewport = page.getViewport({ scale: 0.5 });
                    
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    
                    await page.render({
                        canvasContext: context,
                        viewport: viewport
                    }).promise;

                    preview.appendChild(canvas);
                    
                    // Add page count for PDFs
                    const pageCount = document.createElement('span');
                    pageCount.className = 'page-count';
                    pageCount.textContent = `${pdf.numPages} pages`;
                    preview.appendChild(pageCount);
                } catch (error) {
                    console.error('PDF preview failed:', error);
                }
            } else if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                img.onload = () => URL.revokeObjectURL(img.src);
                preview.appendChild(img);
                totalPages += 1;
            }

            const fileInfo = document.createElement('div');
            fileInfo.className = 'file-info';
            fileInfo.innerHTML = `
                <p class="file-name">${file.name}</p>
                <p class="file-size">${this.formatFileSize(file.size)}</p>
            `;
            preview.appendChild(fileInfo);

            previewContainer.appendChild(preview);
        }

        // Update page count in print options
        if (window.printOptionsManager) {
            window.printOptionsManager.setPageCount(totalPages);
        }
    }

    removeFile(fileToRemove) {
        this.currentFiles = this.currentFiles.filter(file => file !== fileToRemove);
        this.generatePreviews();
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PrintUploader();
}); 