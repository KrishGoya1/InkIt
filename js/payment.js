class PaymentHandler {
    constructor() {
        this.modal = document.getElementById('paymentModal');
        this.setupPaymentModal();
        this.setupEventListeners();
    }

    setupPaymentModal() {
        this.modal.innerHTML = `
            <div class="payment-container">
                <div class="payment-header">
                    <h3>Complete Payment</h3>
                    <button class="close-btn">&times;</button>
                </div>
                
                <div class="payment-body">
                    <div class="payment-summary">
                        <h4>Order Details</h4>
                        <div class="summary-details"></div>
                    </div>

                    <div class="payment-methods">
                        <h4>Select Payment Method</h4>
                        <div class="method-options">
                            <button class="method-btn selected" data-method="upi">
                                <span class="method-icon">📱</span>
                                <span class="method-name">UPI Payment</span>
                            </button>
                            <button class="method-btn" data-method="cash">
                                <span class="method-icon">💵</span>
                                <span class="method-name">Pay at Counter</span>
                            </button>
                        </div>
                    </div>

                    <div class="payment-upi active">
                        <div class="qr-placeholder">
                            <!-- QR code will be generated here -->
                        </div>
                        <p class="payment-instructions">
                            Scan QR code with any UPI app to pay
                        </p>
                    </div>

                    <div class="payment-cash hidden">
                        <div class="token-info">
                            <h4>Your Print Token</h4>
                            <div class="token-number">
                                <!-- Token will be generated here -->
                            </div>
                            <p>Show this token at the counter to complete your payment and collect prints</p>
                        </div>
                    </div>
                </div>

                <div class="payment-footer">
                    <button class="secondary-btn" id="cancelPayment">Cancel</button>
                    <button class="primary-btn" id="confirmPayment">Confirm Payment</button>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Close button
        this.modal.querySelector('.close-btn')
            .addEventListener('click', () => this.closeModal());

        // Cancel button
        this.modal.querySelector('#cancelPayment')
            .addEventListener('click', () => this.closeModal());

        // Payment method selection
        this.modal.querySelectorAll('.method-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchPaymentMethod(e));
        });

        // Confirm payment
        this.modal.querySelector('#confirmPayment')
            .addEventListener('click', () => this.processPayment());
    }

    showPayment(orderDetails) {
        // Update summary with order details and Rupee pricing
        const summaryDiv = this.modal.querySelector('.summary-details');
        const basePrice = orderDetails.color === 'bw' ? 3 : 10;
        const total = basePrice * orderDetails.pages * orderDetails.copies;
        
        summaryDiv.innerHTML = `
            <p>Number of Pages: ${orderDetails.pages}</p>
            <p>Copies: ${orderDetails.copies}</p>
            <p>Print Type: ${orderDetails.color === 'bw' ? 'Black & White' : 'Color'}</p>
            <p>Layout: ${orderDetails.layout === 'single' ? 'Single-sided' : 'Double-sided'}</p>
            <p class="total-amount">Total Amount: ₹${total.toFixed(2)}</p>
        `;

        // Generate QR code for UPI payment with Rupee amount
        this.generateQRCode(orderDetails);
        
        // Generate token for cash payment
        this.generateToken();

        this.modal.classList.remove('hidden');
    }

    switchPaymentMethod(event) {
        const selectedMethod = event.currentTarget.dataset.method;
        
        // Update button states
        this.modal.querySelectorAll('.method-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        event.currentTarget.classList.add('selected');

        // Show/hide relevant payment sections
        if (selectedMethod === 'upi') {
            this.modal.querySelector('.payment-upi').classList.remove('hidden');
            this.modal.querySelector('.payment-cash').classList.add('hidden');
        } else {
            this.modal.querySelector('.payment-upi').classList.add('hidden');
            this.modal.querySelector('.payment-cash').classList.remove('hidden');
        }
    }

    generateQRCode(orderDetails) {
        const basePrice = orderDetails.color === 'bw' ? 3 : 10;
        const total = basePrice * orderDetails.pages * orderDetails.copies;
        
        // Placeholder for QR code generation
        const qrPlaceholder = this.modal.querySelector('.qr-placeholder');
        qrPlaceholder.innerHTML = `
            <div class="qr-code">
                <p>QR Code Placeholder</p>
                <p>Amount: ₹${total.toFixed(2)}</p>
            </div>
        `;
    }

    generateToken() {
        const tokenNumber = Math.random().toString(36).substr(2, 6).toUpperCase();
        this.modal.querySelector('.token-number').textContent = tokenNumber;
    }

    calculateTotal(orderDetails) {
        const basePrice = orderDetails.color === 'bw' ? 3 : 10;
        return (basePrice * orderDetails.pages * orderDetails.copies).toFixed(2);
    }

    async processPayment() {
        const selectedMethod = this.modal.querySelector('.method-btn.selected').dataset.method;
        
        try {
            // Simulate payment processing
            this.showLoadingState();
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            if (selectedMethod === 'upi') {
                this.handleUPIPayment();
            } else {
                this.handleCashPayment();
            }
        } catch (error) {
            console.error('Payment failed:', error);
            this.showError('Payment failed. Please try again.');
        }
    }

    showLoadingState() {
        const confirmBtn = this.modal.querySelector('#confirmPayment');
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Processing...';
    }

    handleUPIPayment() {
        // Handle successful UPI payment
        this.showSuccess('Payment successful! Your prints will be ready shortly.');
    }

    handleCashPayment() {
        // Handle cash payment token generation
        const token = this.modal.querySelector('.token-number').textContent;
        this.showSuccess(`Please pay at counter with token: ${token}`);
    }

    showSuccess(message) {
        alert(message); // Replace with better UI feedback
        this.closeModal();
    }

    showError(message) {
        alert(message); // Replace with better UI feedback
        const confirmBtn = this.modal.querySelector('#confirmPayment');
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Confirm Payment';
    }

    closeModal() {
        this.modal.classList.add('hidden');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.paymentHandler = new PaymentHandler();
}); 