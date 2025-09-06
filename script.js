// Anime Connections Game - Mobile Optimized JavaScript

class AnimeConnectionsGame {
    constructor() {
        this.allData = [];
        this.currentAnswers = [];
        this.selectedItems = [];
        this.mistakes = 0;
        this.maxMistakes = 4;
        this.solvedCategoriesCount = 0;
        this.gameCategories = [];
        this.categoryColors = ['#f9c54d', '#a5d74e', '#59b4d9', '#b583e8'];
        this.gameEnded = false; // Track if game has ended
        
        // DOM elements
        this.gridContainer = null;
        this.mistakesContainer = null;
        this.submitButton = null;
        this.deselectButton = null;
        this.shuffleButton = null;
        this.solvedContainer = null;
        this.messageBox = null;
        this.newGameButton = null;
        this.retryButton = null;
        this.hintButton = null;
        
        this.init();
    }

    async init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupDOM());
        } else {
            this.setupDOM();
        }
    }

    async setupDOM() {
        // Get DOM elements
        this.gridContainer = document.getElementById('grid-container');
        this.mistakesContainer = document.getElementById('mistakes-container');
        this.submitButton = document.getElementById('submit-button');
        this.deselectButton = document.getElementById('deselect-button');
        this.shuffleButton = document.getElementById('shuffle-button');
        this.solvedContainer = document.getElementById('solved-container');
        this.messageBox = document.getElementById('message-box');
        this.newGameButton = document.getElementById('new-game-button');
        this.retryButton = document.getElementById('retry-button');
        this.hintButton = document.getElementById('hint-button');

        // Load game data
        await this.loadGameData();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Start the game
        this.setupGame();
    }

    async loadGameData() {
        try {
            const response = await fetch('./gameData.json');
            this.allData = await response.json();
        } catch (error) {
            console.error('Error loading game data:', error);
            // Fallback: try to get data from script tag (if still present)
            const scriptTag = document.getElementById('game-data');
            if (scriptTag) {
                this.allData = JSON.parse(scriptTag.textContent);
            } else {
                this.showMessage('Error loading game data. Please refresh the page.', 'alert-danger');
            }
        }
    }

    setupEventListeners() {
        this.submitButton.addEventListener('click', () => this.checkSelection());
        this.deselectButton.addEventListener('click', () => this.deselectAll());
        this.shuffleButton.addEventListener('click', () => this.shuffleGrid());
        this.newGameButton.addEventListener('click', () => this.setupGame());
        this.retryButton.addEventListener('click', () => this.retryGame());
        this.hintButton.addEventListener('click', () => this.giveHint());

        // Add keyboard support for accessibility
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Add touch event optimization
        this.gridContainer.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent default touch behavior
        }, { passive: false });
        
        // Prevent zoom on double tap for iOS
        document.addEventListener('touchend', (e) => {
            if (e.target.classList.contains('grid-item')) {
                e.preventDefault();
            }
        });
    }

    handleKeyboard(e) {
        switch(e.key) {
            case 'Enter':
                if (this.selectedItems.length === 4) {
                    this.checkSelection();
                }
                break;
            case 'Escape':
                this.deselectAll();
                break;
            case ' ':
                e.preventDefault();
                this.shuffleGrid();
                break;
        }
    }

    setupGame(isRetry = false) {
        // Reset game state
        this.selectedItems = [];
        this.mistakes = 0;
        this.solvedCategoriesCount = 0;
        this.gameEnded = false; // Reset game ended state
        this.gridContainer.innerHTML = '';
        this.solvedContainer.innerHTML = '';
        this.messageBox.textContent = '';
        this.messageBox.className = '';
        this.submitButton.disabled = false;
        this.shuffleButton.disabled = false; // Re-enable shuffle button
        this.deselectButton.disabled = false; // Re-enable deselect button
        this.retryButton.style.display = 'none'; // Hide retry button
        this.hintButton.disabled = false; // Re-enable hint button
        
        if (!isRetry) {
            // Shuffle all data and pick 4 categories
            const shuffledData = [...this.allData].sort(() => 0.5 - Math.random());
            this.gameCategories = shuffledData.slice(0, 4);
    
            // Get all answers from the chosen categories and shuffle them
            this.currentAnswers = this.gameCategories.flatMap(cat => cat.answers);
            this.currentAnswers.sort(() => 0.5 - Math.random());
        }

        // Create grid items
        this.currentAnswers.forEach((answer, index) => {
            const item = this.createGridItem(answer, index);
            this.gridContainer.appendChild(item);
        });

        this.setupMistakeDots();
        this.showMessage('Find groups of four that share something in common!', 'alert-info');
    }

    createGridItem(answer, index) {
        const item = document.createElement('div');
        item.classList.add('grid-item');
        item.textContent = answer;
        item.dataset.answer = answer;
        item.setAttribute('tabindex', '0');
        item.setAttribute('role', 'button');
        item.setAttribute('aria-label', `Select ${answer}`);
        
        // Add both click and touch events
        item.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleItemClick(item);
        });
        
        // Touch events for better mobile responsiveness
        item.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleItemClick(item);
        });
        
        // Keyboard support
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.handleItemClick(item);
            }
        });
        
        return item;
    }

    setupMistakeDots() {
        this.mistakesContainer.innerHTML = '';
        for (let i = 0; i < this.maxMistakes; i++) {
            const dot = document.createElement('div');
            dot.classList.add('mistake-dot');
            dot.setAttribute('aria-label', `Mistake ${i + 1}`);
            this.mistakesContainer.appendChild(dot);
        }
    }

    handleItemClick(item) {
        if (item.classList.contains('solved')) return;
        if (this.gameEnded) return; // Prevent interaction after game ends

        const answer = item.dataset.answer;
        
        // Add haptic feedback for mobile devices
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
        
        if (this.selectedItems.includes(answer)) {
            // Deselect
            this.selectedItems = this.selectedItems.filter(i => i !== answer);
            item.classList.remove('selected');
            item.setAttribute('aria-pressed', 'false');
        } else {
            // Select
            if (this.selectedItems.length < 4) {
                this.selectedItems.push(answer);
                item.classList.add('selected');
                item.setAttribute('aria-pressed', 'true');
            } else {
                this.showMessage('You can only select 4 items!', 'alert-warning');
            }
        }
        
        // Update submit button state
        this.submitButton.disabled = this.selectedItems.length !== 4;
    }

    checkSelection() {
        if (this.gameEnded) return; // Prevent submission after game ends
        if (this.selectedItems.length !== 4) {
            this.showMessage('Select exactly 4 items!', 'alert-warning');
            return;
        }

        let correctCategory = null;
        for (const category of this.gameCategories) {
            const isMatch = this.selectedItems.every(item => category.answers.includes(item)) &&
                            category.answers.every(ans => this.selectedItems.includes(ans));
            if (isMatch) {
                correctCategory = category;
                break;
            }
        }

        if (correctCategory) {
            this.handleCorrectGuess(correctCategory);
        } else {
            this.handleIncorrectGuess();
        }
    }
    
    handleCorrectGuess(category) {
        // Add celebration effect
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
        
        this.showMessage('Correct! 🎉', 'alert-success');
        
        // Create solved row and prepend it to the solved container
        const solvedRow = document.createElement('div');
        solvedRow.classList.add('solved-row');
        solvedRow.style.backgroundColor = this.categoryColors[this.solvedCategoriesCount];
        solvedRow.innerHTML = `<strong>${category.category}</strong> ${category.answers.join(', ')}`;
        solvedRow.setAttribute('role', 'status');
        solvedRow.setAttribute('aria-live', 'polite');
        this.solvedContainer.prepend(solvedRow);

        // Animate removal of solved items
        const nodesToRemove = [];
        this.gridContainer.childNodes.forEach(node => {
            if (this.selectedItems.includes(node.dataset.answer)) {
                node.style.transition = 'all 0.3s ease-out';
                node.style.transform = 'scale(0)';
                node.style.opacity = '0';
                nodesToRemove.push(node);
            }
        });

        // Remove nodes after animation
        setTimeout(() => {
            nodesToRemove.forEach(node => {
                if (node.parentNode) {
                    this.gridContainer.removeChild(node);
                }
            });
        }, 300);

        this.solvedCategoriesCount++;
        this.deselectAll();

        if (this.solvedCategoriesCount === 4) {
            this.endGame(true);
        }
    }

    giveHint() {
        if (this.gameEnded) return;

        // Get the first item from each of the four categories for the hint
        const hintAnswers = this.gameCategories.map(category => category.answers[1]);

        // Highlight the hinted items on the grid
        this.gridContainer.childNodes.forEach(item => {
            if (hintAnswers.includes(item.dataset.answer)) {
                // Add a temporary class for a flashing effect
                item.classList.add('hinted');
                setTimeout(() => {
                    item.classList.remove('hinted');
                }, 1500); // Remove class after 1.5 seconds
            }
        });

        this.showMessage(`These items each belong to a different group.`, 'alert-info');
    }

    retryGame() {
        this.setupGame(true); // true indicates a retry
    }

    handleIncorrectGuess() {
        this.mistakes++;
        this.updateMistakeDots();
        
        // Add error vibration
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }
        
        this.showMessage(`Incorrect. ${this.maxMistakes - this.mistakes} attempts remaining.`, 'alert-danger');
        
        if (this.mistakes >= this.maxMistakes) {
            this.endGame(false);
        } else {
            // Auto-deselect after incorrect guess for better UX
            setTimeout(() => {
                this.deselectAll();
            }, 1500);
        }
    }

    updateMistakeDots() {
        const dots = this.mistakesContainer.querySelectorAll('.mistake-dot');
        for (let i = 0; i < this.mistakes; i++) {
            if (dots[i]) {
                dots[i].classList.add('used');
            }
        }
    }

    deselectAll() {
        if (this.gameEnded) return; // Prevent deselection after game ends
        this.selectedItems = [];
        document.querySelectorAll('.grid-item.selected').forEach(item => {
            item.classList.remove('selected');
            item.setAttribute('aria-pressed', 'false');
        });
        this.submitButton.disabled = true;
    }

    shuffleGrid() {
        if (this.gameEnded) return; // Prevent shuffling after game ends
        const items = Array.from(this.gridContainer.children);
        
        // Add animation for shuffle
        items.forEach(item => {
            item.style.transition = 'all 0.3s ease-in-out';
            item.style.transform = 'scale(0.9)';
        });
        
        setTimeout(() => {
            items.sort(() => Math.random() - 0.5);
            items.forEach(item => {
                this.gridContainer.appendChild(item);
                item.style.transform = 'scale(1)';
            });
        }, 150);
        
        this.showMessage('Grid shuffled!', 'alert-info');
    }

    showMessage(text, type) {
        this.messageBox.textContent = text;
        this.messageBox.className = `alert ${type}`;
        this.messageBox.setAttribute('role', 'status');
        this.messageBox.setAttribute('aria-live', 'polite');
        
        setTimeout(() => {
            if (this.messageBox.textContent === text) {
                this.messageBox.textContent = '';
                this.messageBox.className = '';
            }
        }, 3000);
    }

    endGame(isWin) {
        this.gameEnded = true; // Set game ended flag
        // Disable buttons
        this.submitButton.disabled = true;
        this.shuffleButton.disabled = true;
        this.deselectButton.disabled = true;
        this.hintButton.disabled = true;

        if (isWin) {
            this.showMessage('Congratulations! You solved the puzzle!', 'alert-success');
        } else {
            this.showMessage('You have run out of mistakes. You can retry or start a new game', 'alert-danger');
            this.retryButton.style.display = 'block'; // Show retry button
        }
    }
}

// Initialize the game when the script loads
new AnimeConnectionsGame();
