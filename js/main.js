document.addEventListener('DOMContentLoaded', () => {
    // Initialize all components
    const init = () => {
        // Check if required elements exist
        const requiredElements = [
            'uploadBtn',
            'printOptions',
            'paymentModal'
        ];

        const missingElements = requiredElements.filter(id => !document.getElementById(id));
        
        if (missingElements.length > 0) {
            console.error('Missing required elements:', missingElements);
            return;
        }

        // Initialize components
        try {
            window.printUploader = new PrintUploader();
            window.printOptionsManager = new PrintOptionsManager();
            window.paymentHandler = new PaymentHandler();

            // Connect components
            connectComponents();
        } catch (error) {
            console.error('Initialization failed:', error);
        }
    };

    const connectComponents = () => {
        // Connect upload completion to print options
        if (window.printUploader && window.printOptionsManager) {
            window.printUploader.onUploadComplete = (files) => {
                // Simulate page count (in real app, would be calculated from files)
                const pageCount = files.reduce((total, file) => total + 1, 0);
                window.printOptionsManager.setPageCount(pageCount);
            };
        }

        // Connect print options to payment
        if (window.printOptionsManager && window.paymentHandler) {
            window.printOptionsManager.onProceedToPayment = (options) => {
                window.paymentHandler.showPayment(options);
            };
        }
    };

    init();
}); 