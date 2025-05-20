export class EventListeners {
    constructor(
        sessionState,
        domElements,
        setupPhaseManager,
        brainstormPhaseManager,
        resultsPhaseManager,
        timerManager,
        ideasManager,
        exportManager
    ) {
        this.sessionState = sessionState;
        this.domElements = domElements;
        this.setupPhaseManager = setupPhaseManager;
        this.brainstormPhaseManager = brainstormPhaseManager;
        this.resultsPhaseManager = resultsPhaseManager;
        this.timerManager = timerManager;
        this.ideasManager = ideasManager;
        this.exportManager = exportManager;
    }
    
    initializeApp() {
        // Setup phase
        this.domElements.timeAvailable.addEventListener('change', () => this.setupPhaseManager.handleTimeChange());
        this.domElements.startSessionBtn.addEventListener('click', () => this.setupPhaseManager.startBrainstormSession());
        
        // Add suggestion pill click handlers for setup phase
        document.querySelectorAll('.suggestion-pill').forEach(pill => {
            pill.addEventListener('click', (e) => this.handleSuggestionPillClick(e));
        });

        // Brainstorm phase
        this.domElements.pauseTimerBtn.addEventListener('click', () => this.timerManager.togglePauseTimer());
        this.domElements.continueSessionBtn.addEventListener('click', () => this.brainstormPhaseManager.skipToNextQuestion());
        this.domElements.ideasInput.addEventListener('keydown', (e) => this.ideasManager.handleIdeaSubmit(e));

        // Results phase
        this.domElements.copyResultsBtn.addEventListener('click', () => this.exportManager.copyResultsToClipboard());
        this.domElements.downloadResultsBtn.addEventListener('click', () => this.exportManager.downloadResultsAsCSV());
        this.domElements.newSessionBtn.addEventListener('click', () => this.resultsPhaseManager.startNextRound());
        
        // Add unpin event listeners
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('unpin-btn')) {
                const index = parseInt(e.target.dataset.index);
                this.sessionState.pinnedIdeas.splice(index, 1);
                this.brainstormPhaseManager.uiManager.updatePinnedIdeasDisplay(this.sessionState);
            }
        });
    }
    
    handleSuggestionPillClick(e) {
        const suggestionText = e.target.dataset.value;
        
        // If in setup phase, populate the brainstorm focus
        if (this.domElements.setupPhase.classList.contains('active')) {
            this.domElements.brainstormFocus.value = suggestionText;
        } 
        // If in brainstorm phase, add as an idea
        else if (this.domElements.brainstormPhase.classList.contains('active')) {
            this.ideasManager.addIdea(suggestionText);
        }
    }
}