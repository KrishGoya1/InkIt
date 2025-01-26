class PrintOptionsManager {
    constructor() {
        this.setupElements();
        this.initializeOptions();
        this.setupEventListeners();
    }

    setupElements() {
        this.optionsContainer = document.getElementById('printOptions');
        this.orderSummary = document.getElementById('orderSummary');
        
        // Populate print options UI with Rupee prices
        this.optionsContainer.querySelector('.options-grid').innerHTML = `
            <div class="option-group">
                <label>Copies</label>
                <div class="copies-control">
                    <button class="decrease">-</button>
                    <span class="copies-count">1</span>
                    <button class="increase">+</button>
                </div>
            </div>

            <div class="option-group">
                <label>Print Color</label>
                <div class="color-options">
                    <button class="option-btn selected" data-color="bw">
                        Black & White
                        <span class="price">₹3/page</span>
                    </button>
                    <button class="option-btn" data-color="color">
                        Color
                        <span class="price">₹10/page</span>
                    </button>
                </div>
            </div>

            <div class="option-group">
                <label>Paper Size</label>
                <div class="size-options">
                    <button class="option-btn selected" data-size="a4">A4</button>
                    <button class="option-btn" data-size="letter">Letter</button>
                </div>
            </div>

            <div class="option-group">
                <label>Layout</label>
                <div class="layout-options">
                    <button class="option-btn selected" data-layout="single">
                        Single-sided
                    </button>
                    <button class="option-btn" data-layout="double">
                        Double-sided
                    </button>
                </div>
            </div>
        `;
    }

    initializeOptions() {
        this.printOptions = {
            copies: 1,
            color: 'bw',
            size: 'a4',
            layout: 'single',
            pages: 0  // Will be updated when files are processed
        };
    }

    setupEventListeners() {
        // Copies control
        const copiesControl = this.optionsContainer.querySelector('.copies-control');
        copiesControl.querySelector('.decrease').addEventListener('click', () => this.updateCopies(-1));
        copiesControl.querySelector('.increase').addEventListener('click', () => this.updateCopies(1));

        // Option buttons
        this.optionsContainer.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleOptionClick(e));
        });

        // Add to cart button
        const addToCartBtn = document.createElement('button');
        addToCartBtn.className = 'primary-btn add-to-cart';
        addToCartBtn.textContent = 'Continue to Payment';
        addToCartBtn.addEventListener('click', () => this.proceedToPayment());
        this.optionsContainer.appendChild(addToCartBtn);
    }

    updateCopies(change) {
        const newValue = this.printOptions.copies + change;
        if (newValue >= 1 && newValue <= 99) {
            this.printOptions.copies = newValue;
            this.optionsContainer.querySelector('.copies-count').textContent = newValue;
            this.updatePricing();
        }
    }

    handleOptionClick(event) {
        const button = event.currentTarget;
        const optionGroup = button.parentElement;
        
        // Remove selection from other buttons in the same group
        optionGroup.querySelectorAll('.option-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Select clicked button
        button.classList.add('selected');

        // Update options object
        for (const [key, value] of Object.entries(button.dataset)) {
            if (this.printOptions.hasOwnProperty(key)) {
                this.printOptions[key] = value;
            }
        }

        this.updatePricing();
    }

    updatePricing() {
        const basePrice = this.printOptions.color === 'bw' ? 3 : 10; // Price in Rupees
        const pagesPrice = basePrice * this.printOptions.pages;
        const totalPrice = pagesPrice * this.printOptions.copies;

        // Update order summary with Rupee symbol
        this.orderSummary.innerHTML = `
            <h3>Order Summary</h3>
            <div class="price-breakdown">
                <p>Base price per page: ₹${basePrice.toFixed(2)}</p>
                <p>Number of pages: ${this.printOptions.pages}</p>
                <p>Number of copies: ${this.printOptions.copies}</p>
                <p class="total">Total: ₹${totalPrice.toFixed(2)}</p>
            </div>
        `;
        this.orderSummary.classList.remove('hidden');
    }

    proceedToPayment() {
        // Save options to sessionStorage for payment processing
        sessionStorage.setItem('printOptions', JSON.stringify(this.printOptions));
        
        // Show payment modal or redirect to payment page
        const paymentModal = document.getElementById('paymentModal');
        if (paymentModal) {
            paymentModal.classList.remove('hidden');
        }
    }

    // Method to be called from upload.js when files are processed
    setPageCount(count) {
        this.printOptions.pages = count;
        
        // Update the UI to show page count
        const pageCountElement = document.createElement('div');
        pageCountElement.className = 'page-count-info';
        pageCountElement.innerHTML = `
            <p>Total Pages: ${count}</p>
        `;
        
        // Replace existing page count info if it exists
        const existingPageCount = this.optionsContainer.querySelector('.page-count-info');
        if (existingPageCount) {
            existingPageCount.remove();
        }
        
        // Insert before the options grid
        this.optionsContainer.insertBefore(
            pageCountElement, 
            this.optionsContainer.querySelector('.options-grid')
        );
        
        this.updatePricing();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.printOptionsManager = new PrintOptionsManager();
}); 