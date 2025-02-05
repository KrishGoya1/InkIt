document.addEventListener('DOMContentLoaded', () => {
    // Initialize all components
    const init = () => {
        // Check if required elements exist
        const requiredElements = [
            'uploadBtn',
            'paymentModal'
        ];

        const missingElements = requiredElements.filter(id => !document.getElementById(id));
        
        if (missingElements.length > 0) {
            console.error('Missing required elements:', missingElements);
            window.toastManager.show('Failed to initialize application', 'error');
            return;
        }

        // Initialize components
        try {
            window.toastManager = new ToastManager();
            window.printUploader = new PrintUploader();
            window.paymentHandler = new PaymentHandler();

            // Connect components
            connectComponents();
        } catch (error) {
            console.error('Initialization failed:', error);
            window.toastManager.show('Failed to initialize application', 'error');
        }
    };

    const connectComponents = () => {
        // Connect upload completion to payment
        if (window.printUploader && window.paymentHandler) {
            window.printUploader.onUploadComplete = (files) => {
                const paymentFab = document.getElementById('proceedToPayment');
                if (files.length > 0) {
                    paymentFab.classList.remove('hidden');
                    // Update total amount
                    const total = window.printUploader.calculateTotalPrice();
                    paymentFab.querySelector('.total-amount').textContent = `₹${total}`;
                } else {
                    paymentFab.classList.add('hidden');
                }
            };
        }
    };

    if (typeof pdfjsLib !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
        console.error('PDF worker not initialized');
    }

    // Initialize the app
    init();
}); 