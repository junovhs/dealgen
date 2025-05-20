export class TimerManager {
    constructor(sessionState, domElements, uiManager) {
        this.sessionState = sessionState;
        this.domElements = domElements;
        this.uiManager = uiManager;
    }
    
    startTimer() {
        clearInterval(this.sessionState.timerInterval);
        this.sessionState.isPaused = false;
        this.updateTimerDisplay();
        this.updateProgressBar();
        this.sessionState.timerInterval = setInterval(() => this.updateTimer(), 1000);
        
        // Update pause button state
        this.updatePauseButtonState();
    }
    
    updateTimer() {
        if (!this.sessionState.isPaused) {
            this.sessionState.timeRemaining--;
            this.updateTimerDisplay();
            this.updateProgressBar();
            
            if (this.sessionState.timeRemaining <= 0) {
                clearInterval(this.sessionState.timerInterval);
                // Flash the screen red but don't auto-advance
                this.uiManager.flashTimerEnd();
                // Change the timer text to indicate time is up
                this.domElements.timerElement.textContent = "TIME'S UP!";
                this.domElements.timerElement.style.color = "var(--error-color)";
            }
        }
    }
    
    updateTimerDisplay() {
        const minutes = Math.floor(this.sessionState.timeRemaining / 60);
        const seconds = this.sessionState.timeRemaining % 60;
        this.domElements.timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        this.domElements.timerElement.style.color = "var(--primary-color)";
    }
    
    updateProgressBar() {
        const totalTime = this.sessionState.timePerQuestion;
        const percentage = (this.sessionState.timeRemaining / totalTime) * 100;
        this.domElements.progressBar.style.width = `${percentage}%`;
    }
    
    togglePauseTimer() {
        this.sessionState.isPaused = !this.sessionState.isPaused;
        this.updatePauseButtonState();
    }
    
    updatePauseButtonState() {
        this.domElements.pauseTimerBtn.innerHTML = this.sessionState.isPaused 
            ? '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>' 
            : '<svg viewBox="0 0 24 24" width="24" height="24"><rect x="6" y="4" width="4" height="16" fill="currentColor"/><rect x="14" y="4" width="4" height="16" fill="currentColor"/></svg>';
    }
    
    stopTimer() {
        clearInterval(this.sessionState.timerInterval);
    }
}