import { BrainstormPhaseManager } from './BrainstormPhaseManager.js';
import { IdeasManager } from './IdeasManager.js';
import { TimerManager } from '../utils/TimerManager.js';

export class SetupPhaseManager {
    constructor(sessionState, domElements, aiService, uiManager) {
        this.sessionState = sessionState;
        this.domElements = domElements;
        this.aiService = aiService;
        this.uiManager = uiManager;
    }
    
    handleTimeChange() {
        if (this.domElements.timeAvailable.value === 'custom') {
            this.domElements.customTimeContainer.classList.remove('hidden');
            this.domElements.customTime.focus();
        } else {
            this.domElements.customTimeContainer.classList.add('hidden');
        }
    }
    
    async startBrainstormSession() {
        // Validate inputs
        if (!this.domElements.contextSituation.value.trim() || 
            !this.domElements.contextGoal.value.trim() || 
            !this.domElements.contextChallenges.value.trim()) {
            alert('Please fill in all the context fields');
            return;
        }
        if (this.domElements.timeAvailable.value === '') {
            alert('Please select how much time you have available');
            return;
        }

        // Get selected time
        this.sessionState.totalTime = this.domElements.timeAvailable.value === 'custom' 
            ? parseInt(this.domElements.customTime.value) 
            : parseInt(this.domElements.timeAvailable.value);

        if (!this.sessionState.totalTime || this.sessionState.totalTime < 5) {
            alert('Please enter a valid time (at least 5 minutes)');
            return;
        }

        // Store context information
        this.sessionState.contextSituation = this.domElements.contextSituation.value.trim();
        this.sessionState.contextGoal = this.domElements.contextGoal.value.trim();
        this.sessionState.contextChallenges = this.domElements.contextChallenges.value.trim();
        this.sessionState.questionsPerRound = parseInt(this.domElements.questionsPerRound.value);
        
        // Combine contexts into focus for compatibility with existing code
        this.sessionState.focus = `${this.sessionState.contextGoal} (Context: ${this.sessionState.contextSituation.substring(0, 50)}${this.sessionState.contextSituation.length > 50 ? '...' : ''})`;

        // Show loading indicator only after validation
        this.uiManager.startLogoAnimation(); // Start logo animation
        this.domElements.aiLoading.classList.remove('hidden');
        this.domElements.startSessionBtn.disabled = true;

        try {
            // Generate AI questions
            await this.aiService.generateAiQuestions();

            // Hide loading indicator and stop animation
            this.domElements.aiLoading.classList.add('hidden');
            this.uiManager.stopLogoAnimation(); // Stop logo animation
        } catch (error) {
            console.error("Error generating AI questions:", error);
            this.domElements.aiLoading.classList.add('hidden');
            this.domElements.startSessionBtn.disabled = false; // Re-enable button
            this.uiManager.stopLogoAnimation(); // Stop logo animation
            alert('Failed to generate AI questions. Please try again.');
            return; // Stop further execution
        }

        // Update session progress banner for current round
        this.uiManager.updateSessionProgressBanner(this.sessionState);
        
        // Switch to brainstorm phase
        this.uiManager.switchToBrainstormPhase();

        // Calculate time per question (with some buffer)
        const questionCount = this.sessionState.questions.length;
        this.sessionState.timePerQuestion = Math.floor((this.sessionState.totalTime - 5) / questionCount) * 60; // in seconds

        // Start with the first question
        this.sessionState.currentQuestionIndex = 0;
        
        // Display pinned ideas if any
        this.uiManager.updatePinnedIdeasDisplay(this.sessionState);
        
        // Trigger the first question setup in brainstorm phase
        const brainstormPhaseManager = new BrainstormPhaseManager(
            this.sessionState, 
            this.domElements, 
            this.aiService, 
            new TimerManager(this.sessionState, this.domElements, this.uiManager),
            new IdeasManager(this.sessionState, this.domElements, this.uiManager),
            this.uiManager
        );
        
        brainstormPhaseManager.startQuestionTimer();
    }
}