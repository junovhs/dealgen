export class UIManager {
    constructor(domElements) {
        this.domElements = domElements;
    }
    
    // Phase transitions
    switchToSetupPhase() {
        this.domElements.resultsPhase.classList.remove('active');
        this.domElements.brainstormPhase.classList.remove('active');
        this.domElements.setupPhase.classList.add('active');
    }
    
    switchToBrainstormPhase() {
        this.domElements.setupPhase.classList.remove('active');
        this.domElements.resultsPhase.classList.remove('active');
        this.domElements.brainstormPhase.classList.add('active');
    }
    
    switchToResultsPhase() {
        this.domElements.setupPhase.classList.remove('active');
        this.domElements.brainstormPhase.classList.remove('active');
        this.domElements.resultsPhase.classList.add('active');
    }
    
    // UI updates
    updateSessionProgressBanner(sessionState) {
        this.domElements.sessionProgressBanner.classList.remove('hidden');
        this.domElements.currentRoundSpan.textContent = sessionState.round;
        
        // Display based on round
        if (sessionState.round === 1) {
            this.domElements.aiProgressComment.textContent = `Starting your brainstorming session about "${sessionState.focus}"`;
        } else {
            this.domElements.aiProgressComment.textContent = `Refining ideas about "${sessionState.focus}" based on previous round`;
        }
    }
    
    updatePinnedIdeasDisplay(sessionState) {
        if (sessionState.pinnedIdeas.length > 0) {
            this.domElements.pinnedIdeasContainer.classList.remove('hidden');
            this.domElements.pinnedIdeasList.innerHTML = '';
            sessionState.pinnedIdeas.forEach((pinnedIdea, index) => {
                const pinnedItemEl = document.createElement('div');
                pinnedItemEl.className = 'pinned-idea';
                pinnedItemEl.innerHTML = `
                    <span>${pinnedIdea}</span>
                    <button class="unpin-btn" data-index="${index}">❌</button>
                `;
                this.domElements.pinnedIdeasList.appendChild(pinnedItemEl);
            });
        } else {
            this.domElements.pinnedIdeasContainer.classList.add('hidden');
        }
    }
    
    showTypingAnimation() {
        this.domElements.aiPromptElement.innerHTML = `
            <div class="ai-typing">
                <div class="ai-typing-dot"></div>
                <div class="ai-typing-dot"></div>
                <div class="ai-typing-dot"></div>
            </div>
        `;
        this.domElements.aiPromptElement.classList.remove('active');
    }
    
    flashTimerEnd() {
        // Flash the background red
        const timerContainer = document.querySelector('.timer-container');
        timerContainer.style.transition = 'background-color 0.3s';
        timerContainer.style.backgroundColor = 'rgba(244, 67, 54, 0.2)';
        
        // Restore after flashing
        setTimeout(() => {
            timerContainer.style.backgroundColor = 'var(--background-color)';
        }, 500);
        
        // Flash again
        setTimeout(() => {
            timerContainer.style.backgroundColor = 'rgba(244, 67, 54, 0.2)';
        }, 1000);
        
        // Finally restore
        setTimeout(() => {
            timerContainer.style.backgroundColor = 'var(--background-color)';
        }, 1500);
    }
    
    prepareSetupForNextRound(sessionState) {
        // Update UI for next round
        this.domElements.iterationNotice.classList.remove('hidden');
        this.domElements.setupRoundNumber.textContent = sessionState.round;
        
        // Re-enable start button
        this.domElements.startSessionBtn.disabled = false;
    }

    // Logo animation controls
    startLogoAnimation() {
        if (this.domElements.logo) {
            this.domElements.logo.classList.add('logo-animating');
        }
    }

    stopLogoAnimation() {
        if (this.domElements.logo) {
            this.domElements.logo.classList.remove('logo-animating');
        }
    }
}